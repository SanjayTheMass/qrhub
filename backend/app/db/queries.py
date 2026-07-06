"""
All database operations for QrHub.
All queries use the service-role Supabase client (bypasses RLS).
NEVER put raw DB calls in routers — always go through this module.
"""
from __future__ import annotations

from typing import Optional

from app.db.supabase import supabase

# ── Plan limits ──────────────────────────────────────────────────
PLAN_LIMITS: dict[str, dict] = {
    "free": {"urls": 20, "qr_codes": 5, "analytics_days": 7},
    "pro":  {"urls": -1, "qr_codes": -1, "analytics_days": 365},  # -1 = unlimited
}


# ════════════════════════════════════════════════════════════════
# PROFILES
# ════════════════════════════════════════════════════════════════

def get_profile(user_id: str) -> Optional[dict]:
    res = supabase.table("profiles").select("*").eq("id", user_id).maybe_single().execute()
    return res.data


def update_profile(user_id: str, data: dict) -> Optional[dict]:
    res = supabase.table("profiles").update(data).eq("id", user_id).execute()
    return res.data[0] if res.data else None


def set_plan(user_id: str, plan: str) -> Optional[dict]:
    res = supabase.table("profiles").update({"plan": plan}).eq("id", user_id).execute()
    return res.data[0] if res.data else None


# ════════════════════════════════════════════════════════════════
# URLS
# ════════════════════════════════════════════════════════════════

def get_url_by_short_code(short_code: str) -> Optional[dict]:
    res = (
        supabase.table("urls")
        .select("*")
        .eq("short_code", short_code)
        .eq("is_active", True)
        .maybe_single()
        .execute()
    )
    return res.data


def list_urls(user_id: str, page: int = 1, per_page: int = 20) -> tuple[list[dict], int]:
    offset = (page - 1) * per_page
    res = (
        supabase.table("urls")
        .select("*", count="exact")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .range(offset, offset + per_page - 1)
        .execute()
    )
    return res.data, res.count or 0


def create_url(user_id: str, data: dict) -> dict:
    res = supabase.table("urls").insert({**data, "user_id": user_id}).execute()
    return res.data[0]


def update_url(url_id: str, user_id: str, data: dict) -> Optional[dict]:
    res = (
        supabase.table("urls")
        .update(data)
        .eq("id", url_id)
        .eq("user_id", user_id)
        .execute()
    )
    return res.data[0] if res.data else None


def delete_url(url_id: str, user_id: str) -> bool:
    res = supabase.table("urls").delete().eq("id", url_id).eq("user_id", user_id).execute()
    return bool(res.data)


def count_user_urls(user_id: str) -> int:
    res = supabase.table("urls").select("id", count="exact").eq("user_id", user_id).execute()
    return res.count or 0


def get_url_by_id(url_id: str, user_id: str) -> Optional[dict]:
    res = (
        supabase.table("urls")
        .select("*")
        .eq("id", url_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    return res.data


def short_code_exists(short_code: str) -> bool:
    res = supabase.table("urls").select("id").eq("short_code", short_code).execute()
    return bool(res.data)


def increment_url_clicks(url_id: str) -> None:
    supabase.rpc("increment_url_clicks", {"p_url_id": url_id}).execute()


# ════════════════════════════════════════════════════════════════
# QR CODES
# ════════════════════════════════════════════════════════════════

def list_qr_codes(user_id: str, page: int = 1, per_page: int = 20) -> tuple[list[dict], int]:
    offset = (page - 1) * per_page
    res = (
        supabase.table("qr_codes")
        .select("*, urls(id, short_code, original_url, click_count)", count="exact")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .range(offset, offset + per_page - 1)
        .execute()
    )
    return res.data, res.count or 0


def get_qr_code(qr_id: str, user_id: str) -> Optional[dict]:
    res = (
        supabase.table("qr_codes")
        .select("*, urls(short_code)")
        .eq("id", qr_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    return res.data


def create_qr_code(user_id: str, data: dict) -> dict:
    res = supabase.table("qr_codes").insert({**data, "user_id": user_id}).execute()
    return res.data[0]


def update_qr_code(qr_id: str, user_id: str, data: dict) -> Optional[dict]:
    res = (
        supabase.table("qr_codes")
        .update(data)
        .eq("id", qr_id)
        .eq("user_id", user_id)
        .execute()
    )
    return res.data[0] if res.data else None


def delete_qr_code(qr_id: str, user_id: str) -> bool:
    res = (
        supabase.table("qr_codes").delete().eq("id", qr_id).eq("user_id", user_id).execute()
    )
    return bool(res.data)


def count_user_qr_codes(user_id: str) -> int:
    res = supabase.table("qr_codes").select("id", count="exact").eq("user_id", user_id).execute()
    return res.count or 0


def increment_qr_scans(qr_id: str) -> None:
    supabase.rpc("increment_qr_scans", {"p_qr_id": qr_id}).execute()


# ════════════════════════════════════════════════════════════════
# ANALYTICS / CLICK EVENTS
# ════════════════════════════════════════════════════════════════

def create_click_event(data: dict) -> None:
    supabase.table("click_events").insert(data).execute()


def get_clicks_by_day(url_id: str, days: int = 30) -> list[dict]:
    res = supabase.rpc("get_clicks_by_day", {"p_url_id": url_id, "p_days": days}).execute()
    return res.data or []


def get_device_breakdown(url_id: str, days: int = 30) -> list[dict]:
    res = supabase.rpc("get_device_breakdown", {"p_url_id": url_id, "p_days": days}).execute()
    return res.data or []


def get_country_breakdown(url_id: str, days: int = 30) -> list[dict]:
    res = supabase.rpc("get_country_breakdown", {"p_url_id": url_id, "p_days": days}).execute()
    return res.data or []


# ════════════════════════════════════════════════════════════════
# SUBSCRIPTIONS
# ════════════════════════════════════════════════════════════════

def get_subscription(user_id: str) -> Optional[dict]:
    res = (
        supabase.table("subscriptions")
        .select("*")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    return res.data


def upsert_subscription(user_id: str, data: dict) -> dict:
    res = supabase.table("subscriptions").upsert({**data, "user_id": user_id}).execute()
    return res.data[0] if res.data else {}


# ════════════════════════════════════════════════════════════════
# SUPABASE STORAGE (QR images)
# ════════════════════════════════════════════════════════════════

def upload_qr_image(qr_id: str, image_bytes: bytes) -> str:
    """Upload PNG bytes to Supabase Storage and return the public URL."""
    file_path = f"{qr_id}.png"
    supabase.storage.from_("qr-images").upload(
        file_path,
        image_bytes,
        {"content-type": "image/png", "upsert": "true"},
    )
    url_response = supabase.storage.from_("qr-images").get_public_url(file_path)
    return url_response


def delete_qr_image(qr_id: str) -> None:
    supabase.storage.from_("qr-images").remove([f"{qr_id}.png"])

