from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.db import queries

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/summary")
async def dashboard_summary(user=Depends(get_current_user)):
    profile = queries.get_profile(user["id"])
    plan = profile.get("plan", "free") if profile else "free"
    urls, url_total = queries.list_urls(user["id"], page=1, per_page=100)
    qr_codes, qr_total = queries.list_qr_codes(user["id"], page=1, per_page=5)
    total_clicks = sum(u.get("click_count", 0) for u in urls)
    return {
        "plan": plan,
        "total_urls": url_total,
        "total_qr_codes": qr_total,
        "total_clicks": total_clicks,
        "recent_urls": urls[:5],
        "recent_qr_codes": qr_codes[:5],
    }

