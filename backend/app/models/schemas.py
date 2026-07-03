from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


# ════════════════════════════════════════════════════════════════
# PROFILE
# ════════════════════════════════════════════════════════════════

class ProfileResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    plan: str
    created_at: datetime


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None


# ════════════════════════════════════════════════════════════════
# URLs
# ════════════════════════════════════════════════════════════════

class URLCreate(BaseModel):
    original_url: str
    title: Optional[str] = None
    custom_slug: Optional[str] = None   # Pro only
    expires_at: Optional[datetime] = None  # Pro only

    @field_validator("original_url")
    @classmethod
    def must_have_scheme(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class URLUpdate(BaseModel):
    original_url: Optional[str] = None
    title: Optional[str] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None

    @field_validator("original_url")
    @classmethod
    def must_have_scheme(cls, v: Optional[str]) -> Optional[str]:
        if v and not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class URLResponse(BaseModel):
    id: str
    user_id: str
    short_code: str
    original_url: str
    title: Optional[str] = None
    is_active: bool
    click_count: int
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime] = None
    short_url: str   # computed field: BASE_URL + "/" + short_code


# ════════════════════════════════════════════════════════════════
# QR CODES
# ════════════════════════════════════════════════════════════════

class QRCodeCreate(BaseModel):
    url_id: str
    name: str
    foreground_color: str = "#000000"
    background_color: str = "#FFFFFF"
    logo_url: Optional[str] = None   # Pro only


class QRCodeUpdate(BaseModel):
    name: Optional[str] = None
    foreground_color: Optional[str] = None
    background_color: Optional[str] = None
    logo_url: Optional[str] = None


class QRCodeResponse(BaseModel):
    id: str
    user_id: str
    url_id: str
    name: str
    foreground_color: str
    background_color: str
    logo_url: Optional[str] = None
    qr_image_url: Optional[str] = None
    scan_count: int
    created_at: datetime
    updated_at: datetime
    short_url: str   # the URL encoded in the QR


# ════════════════════════════════════════════════════════════════
# ANALYTICS
# ════════════════════════════════════════════════════════════════

class ClicksByDay(BaseModel):
    click_date: str
    click_count: int


class AnalyticsResponse(BaseModel):
    url_id: str
    days: int
    clicks_by_day: list[dict]
    device_breakdown: list[dict]
    country_breakdown: list[dict]
    total_clicks: int


# ════════════════════════════════════════════════════════════════
# PAYMENTS
# ════════════════════════════════════════════════════════════════

class CreateOrderRequest(BaseModel):
    plan: str   # "pro_monthly" | "pro_yearly"


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan: str


class SubscriptionResponse(BaseModel):
    plan: str
    status: str
    billing_period: Optional[str] = None
    amount: Optional[int] = None
    paid_at: Optional[datetime] = None
    valid_until: Optional[datetime] = None


# ════════════════════════════════════════════════════════════════
# GENERIC
# ════════════════════════════════════════════════════════════════

class MessageResponse(BaseModel):
    message: str
    success: bool = True

