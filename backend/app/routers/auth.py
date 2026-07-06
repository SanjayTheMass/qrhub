from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.db import queries
from app.models.schemas import ProfileResponse, ProfileUpdate, MessageResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(user=Depends(get_current_user)):
    profile = queries.get_profile(user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/profile", response_model=ProfileResponse)
async def update_profile(data: ProfileUpdate, user=Depends(get_current_user)):
    updated = queries.update_profile(user["id"], data.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Profile not found")
    return updated

