import hmac
import hashlib

import razorpay

from app.core.config import settings

client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

PLANS: dict[str, dict] = {
    "pro_monthly": {
        "amount": 49900,          # ₹499 in paise
        "currency": "INR",
        "description": "QrHub Pro — Monthly",
        "billing_period": "monthly",
    },
    "pro_yearly": {
        "amount": 399900,         # ₹3999 in paise
        "currency": "INR",
        "description": "QrHub Pro — Yearly",
        "billing_period": "yearly",
    },
}


def create_order(plan: str, user_id: str) -> dict:
    if plan not in PLANS:
        raise ValueError(f"Unknown plan: {plan}")
    p = PLANS[plan]
    return client.order.create(
        {
            "amount": p["amount"],
            "currency": p["currency"],
            "receipt": f"rcpt_{user_id[:8]}",
            "notes": {"user_id": user_id, "plan": plan},
            "payment_capture": 1,
        }
    )


def verify_payment_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Verify Razorpay payment signature (called after checkout success)."""
    msg = f"{order_id}|{payment_id}"
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        msg.encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_webhook_signature(body: bytes, signature: str) -> bool:
    """Verify Razorpay webhook X-Razorpay-Signature header."""
    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

