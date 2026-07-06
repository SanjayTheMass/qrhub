from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.core.config import settings
from app.db import queries
from app.models.schemas import URLCreate, URLUpdate, MessageResponse
from app.utils.url_utils import generate_short_code, validate_url, is_valid_custom_slug

router = APIRouter(prefix="/api/urls", tags=["urls"])


def _attach_short_url(url: dict) -> dict:
    url["short_url"] = f"{settings.BASE_URL}/{url['short_code']}"
    return url


@router.get("")
async def list_urls(page: int = 1, per_page: int = 20, user=Depends(get_current_user)):
    urls, total = queries.list_urls(user["id"], page, per_page)
    return {"data": [_attach_short_url(u) for u in urls], "total": total, "page": page, "per_page": per_page}


@router.post("")
async def create_url(data: URLCreate, user=Depends(get_current_user)):
    profile = queries.get_profile(user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    plan = profile.get("plan", "free")
    limit = queries.PLAN_LIMITS[plan]["urls"]
    if limit != -1 and queries.count_user_urls(user["id"]) >= limit:
        raise HTTPException(status_code=403, detail=f"Free plan limit of {limit} URLs reached. Upgrade to Pro.")
    if not validate_url(data.original_url):
        raise HTTPException(status_code=400, detail="Invalid URL. Must start with http:// or https://")
    if data.custom_slug:
        if plan == "free":
            raise HTTPException(status_code=403, detail="Custom slugs require Pro plan.")
        if not is_valid_custom_slug(data.custom_slug):
            raise HTTPException(status_code=400, detail="Invalid slug. Use 4-30 alphanumeric chars and hyphens.")
        if queries.short_code_exists(data.custom_slug):
            raise HTTPException(status_code=409, detail="This custom slug is already taken.")
        short_code = data.custom_slug
    else:
        short_code = generate_short_code()
        while queries.short_code_exists(short_code):
            short_code = generate_short_code()
    if data.expires_at and plan == "free":
        raise HTTPException(status_code=403, detail="URL expiry requires Pro plan.")
    url_data = {
        "short_code": short_code,
        "original_url": data.original_url,
        "title": data.title,
        "expires_at": data.expires_at.isoformat() if data.expires_at else None,
    }
    return _attach_short_url(queries.create_url(user["id"], url_data))


@router.put("/{url_id}")
async def update_url(url_id: str, data: URLUpdate, user=Depends(get_current_user)):
    if data.original_url and not validate_url(data.original_url):
        raise HTTPException(status_code=400, detail="Invalid URL format")
    updated = queries.update_url(url_id, user["id"], data.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="URL not found")
    return _attach_short_url(updated)


@router.delete("/{url_id}", response_model=MessageResponse)
async def delete_url(url_id: str, user=Depends(get_current_user)):
    if not queries.delete_url(url_id, user["id"]):
        raise HTTPException(status_code=404, detail="URL not found")
    return {"message": "URL deleted", "success": True}


@router.get("/{url_id}/analytics")
async def get_url_analytics(url_id: str, days: int = 30, user=Depends(get_current_user)):
    profile = queries.get_profile(user["id"])
    plan = profile.get("plan", "free") if profile else "free"
    days = min(days, queries.PLAN_LIMITS[plan]["analytics_days"])
    return {
        "url_id": url_id,
        "days": days,
        "clicks_by_day": queries.get_clicks_by_day(url_id, days),
        "device_breakdown": queries.get_device_breakdown(url_id, days),
        "country_breakdown": queries.get_country_breakdown(url_id, days),
    }

