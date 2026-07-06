import time
from threading import Lock

import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.core.config import settings

security = HTTPBearer()

# Supabase publishes its signing keys here after the JWT Signing Keys migration.
_JWKS_URL = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"

# JWKS cache (TTL in seconds). Keys can rotate, so we don't cache forever.
_JWKS_TTL = 3600
_jwks_cache: dict = {"fetched_at": 0.0, "keys_by_kid": {}}
_jwks_lock = Lock()


def _fetch_jwks(force: bool = False) -> dict:
    """Return a dict mapping kid → JWK. Cached for _JWKS_TTL seconds."""
    now = time.time()
    with _jwks_lock:
        fresh = (now - _jwks_cache["fetched_at"]) < _JWKS_TTL
        if not force and fresh and _jwks_cache["keys_by_kid"]:
            return _jwks_cache["keys_by_kid"]
        try:
            with httpx.Client(timeout=5.0) as client:
                r = client.get(_JWKS_URL)
                r.raise_for_status()
                data = r.json()
            keys_by_kid = {k["kid"]: k for k in data.get("keys", []) if "kid" in k}
            _jwks_cache["keys_by_kid"] = keys_by_kid
            _jwks_cache["fetched_at"] = now
            return keys_by_kid
        except Exception as exc:
            # If we already had keys cached, keep serving them.
            if _jwks_cache["keys_by_kid"]:
                return _jwks_cache["keys_by_kid"]
            raise JWTError(f"Failed to fetch JWKS from {_JWKS_URL}: {exc}") from exc


def _decode_token(token: str) -> dict:
    """Decode a Supabase JWT using either the legacy HS256 secret or JWKS."""
    header = jwt.get_unverified_header(token)
    alg = header.get("alg", "HS256")
    kid = header.get("kid")

    if alg == "HS256":
        # Legacy shared-secret path — still works on projects that haven't
        # fully rotated away from the JWT secret.
        return jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )

    # Asymmetric key path (RS256 / ES256) — verify against Supabase JWKS.
    keys = _fetch_jwks()
    key = keys.get(kid)
    if key is None:
        # Key might have just been rotated — force-refresh once.
        keys = _fetch_jwks(force=True)
        key = keys.get(kid)
    if key is None:
        raise JWTError(f"No matching JWK found for kid={kid!r}")

    return jwt.decode(
        token,
        key,
        algorithms=[alg],
        audience="authenticated",
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = credentials.credentials
    try:
        payload = _decode_token(token)
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

