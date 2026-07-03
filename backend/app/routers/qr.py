from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.core.config import settings
from app.db import queries
from app.models.schemas import QRCodeCreate, QRCodeUpdate, MessageResponse
from app.utils.qr_generator import generate_qr_png

router = APIRouter(prefix="/api/qr", tags=["qr"])


def _with_short_url(qr: dict) -> dict:
    url_data = qr.get("urls") or {}
    short_code = url_data.get("short_code") if isinstance(url_data, dict) else None
    qr["short_url"] = f"{settings.BASE_URL}/{short_code}" if short_code else ""
    return qr


@router.get("")
async def list_qr_codes(page: int = 1, per_page: int = 20, user=Depends(get_current_user)):
    qr_codes, total = queries.list_qr_codes(user["id"], page, per_page)
    return {"data": [_with_short_url(q) for q in qr_codes], "total": total, "page": page, "per_page": per_page}


@router.post("")
async def create_qr_code(data: QRCodeCreate, user=Depends(get_current_user)):
    profile = queries.get_profile(user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    plan = profile.get("plan", "free")
    limit = queries.PLAN_LIMITS[plan]["qr_codes"]
    if limit != -1 and queries.count_user_qr_codes(user["id"]) >= limit:
        raise HTTPException(status_code=403, detail=f"Free plan limit of {limit} QR codes reached. Upgrade to Pro.")
    if data.logo_url and plan == "free":
        raise HTTPException(status_code=403, detail="Logo QR codes require Pro plan.")

    url_row = queries.get_url_by_id(data.url_id, user["id"])
    if not url_row:
        raise HTTPException(status_code=404, detail="URL not found or does not belong to you")

    short_url = f"{settings.BASE_URL}/{url_row['short_code']}"
    png_bytes = generate_qr_png(
        data=short_url,
        foreground_color=data.foreground_color,
        background_color=data.background_color,
        logo_url=data.logo_url,
    )

    # Insert row first to obtain the generated UUID
    created = queries.create_qr_code(user["id"], {
        "url_id": data.url_id,
        "name": data.name,
        "foreground_color": data.foreground_color,
        "background_color": data.background_color,
        "logo_url": data.logo_url,
    })

    image_url = queries.upload_qr_image(created["id"], png_bytes)
    updated = queries.update_qr_code(created["id"], user["id"], {"qr_image_url": image_url})
    result = updated or created
    result["short_url"] = short_url
    return result


@router.put("/{qr_id}")
async def update_qr_code(qr_id: str, data: QRCodeUpdate, user=Depends(get_current_user)):
    updated = queries.update_qr_code(qr_id, user["id"], data.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="QR code not found")
    return _with_short_url(updated)


@router.post("/{qr_id}/regenerate")
async def regenerate_qr(qr_id: str, user=Depends(get_current_user)):
    """Re-render the QR PNG after colour changes."""
    qr = queries.get_qr_code(qr_id, user["id"])
    if not qr:
        raise HTTPException(status_code=404, detail="QR code not found")
    url_data = qr.get("urls", {})
    short_code = url_data.get("short_code") if isinstance(url_data, dict) else None
    if not short_code:
        raise HTTPException(status_code=400, detail="Associated URL not found")

    short_url = f"{settings.BASE_URL}/{short_code}"
    png_bytes = generate_qr_png(
        data=short_url,
        foreground_color=qr.get("foreground_color", "#000000"),
        background_color=qr.get("background_color", "#FFFFFF"),
        logo_url=qr.get("logo_url"),
    )
    image_url = queries.upload_qr_image(qr_id, png_bytes)
    updated = queries.update_qr_code(qr_id, user["id"], {"qr_image_url": image_url})
    result = updated or qr
    result["short_url"] = short_url
    return result


@router.delete("/{qr_id}", response_model=MessageResponse)
async def delete_qr_code(qr_id: str, user=Depends(get_current_user)):
    if not queries.get_qr_code(qr_id, user["id"]):
        raise HTTPException(status_code=404, detail="QR code not found")
    queries.delete_qr_image(qr_id)
    queries.delete_qr_code(qr_id, user["id"])
    return {"message": "QR code deleted", "success": True}

