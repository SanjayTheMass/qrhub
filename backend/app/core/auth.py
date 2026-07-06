from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return {"id": user_id, "email": payload.get("email", "")}
    except JWTError as exc:
        # Surface the real reason so wrong-secret / expired / bad-audience
        # are trivially distinguishable in the browser + Render logs.
        raise HTTPException(
            status_code=401,
            detail=f"JWT verification failed: {exc}",
        ) from exc

