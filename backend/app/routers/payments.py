from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.auth import get_current_user
from app.core.config import settings
from app.core.razorpay_client import (
    PLANS,
    create_order,
    verify_payment_signature,
    verify_webhook_signature,
)
from app.db import queries
from app.models.schemas import (
    CreateOrderRequest,
    CreateOrderResponse,
    MessageResponse,
    VerifyPaymentRequest,
)

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.get("/plans")
async def get_plans():
    return {"plans": PLANS}


@router.get("/status")
async def subscription_status(user=Depends(get_current_user)):
    profile = queries.get_profile(user["id"])
    subscription = queries.get_subscription(user["id"])
    return {
        "plan": profile.get("plan", "free") if profile else "free",
        "subscription": subscription,
    }


@router.post("/create-order", response_model=CreateOrderResponse)
async def create_payment_order(data: CreateOrderRequest, user=Depends(get_current_user)):
    if data.plan not in PLANS:
        raise HTTPException(status_code=400, detail=f"Invalid plan '{data.plan}'")
    try:
        order = create_order(data.plan, user["id"])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to create order: {exc}") from exc
    return CreateOrderResponse(
        order_id=order["id"],
        amount=order["amount"],
        currency=order["currency"],
        key_id=settings.RAZORPAY_KEY_ID,
    )


@router.post("/verify", response_model=MessageResponse)
async def verify_payment(data: VerifyPaymentRequest, user=Depends(get_current_user)):
    if not verify_payment_signature(
        data.razorpay_order_id, data.razorpay_payment_id, data.razorpay_signature
    ):
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    plan_meta = PLANS.get(data.plan, {})
    billing = plan_meta.get("billing_period", "monthly")
    valid_until = datetime.now(timezone.utc) + (
        timedelta(days=365) if billing == "yearly" else timedelta(days=31)
    )

    queries.set_plan(user["id"], "pro")
    queries.upsert_subscription(
        user["id"],
        {
            "razorpay_order_id": data.razorpay_order_id,
            "razorpay_payment_id": data.razorpay_payment_id,
            "plan": data.plan,
            "billing_period": billing,
            "status": "paid",
            "amount": plan_meta.get("amount"),
            "currency": "INR",
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "valid_until": valid_until.isoformat(),
        },
    )
    return {"message": "Payment verified. Welcome to Pro!", "success": True}


@router.post("/webhook")
async def razorpay_webhook(request: Request):
    """Authoritative payment confirmation from Razorpay."""
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    if not verify_webhook_signature(body, signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event = await request.json()
    if event.get("event") == "payment.captured":
        payment = event["payload"]["payment"]["entity"]
        notes = payment.get("notes", {})
        user_id = notes.get("user_id")
        plan = notes.get("plan", "pro_monthly")
        if user_id:
            queries.set_plan(user_id, "pro")
            queries.upsert_subscription(
                user_id,
                {
                    "razorpay_payment_id": payment["id"],
                    "plan": plan,
                    "status": "paid",
                    "amount": payment.get("amount"),
                    "paid_at": datetime.now(timezone.utc).isoformat(),
                },
            )
    return {"status": "ok"}

