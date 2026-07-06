import hashlib
from datetime import datetime, timezone

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.db import queries
from app.routers import analytics, auth, payments, qr, urls

app = FastAPI(
    title="QrHub API",
    description="Dynamic QR Code Generator & URL Shortener",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(urls.router)
app.include_router(qr.router)
app.include_router(analytics.router)
app.include_router(payments.router)

# ── Reserved path prefixes that should NOT be treated as short codes
_RESERVED = frozenset({"docs", "redoc", "openapi.json", "health", "favicon.ico", "api"})


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "version": "1.0.0"}


# ── Background click tracker ──────────────────────────────────────
async def _track_click(url_id: str, qr_id: str | None, request: Request) -> None:
    try:
        from user_agents import parse as ua_parse

        ua_str = request.headers.get("user-agent", "")
        ua = ua_parse(ua_str)
        if ua.is_mobile:
            device = "mobile"
        elif ua.is_tablet:
            device = "tablet"
        elif ua.is_pc:
            device = "desktop"
        else:
            device = "unknown"

        client_ip = (request.client.host if request.client else "") or ""
        ip_hash = hashlib.sha256(client_ip.encode()).hexdigest()[:16]

        queries.create_click_event(
            {
                "url_id": url_id,
                "qr_id": qr_id,
                "device_type": device,
                "browser": ua.browser.family,
                "os": ua.os.family,
                "referrer": request.headers.get("referer"),
                "ip_hash": ip_hash,
            }
        )
        queries.increment_url_clicks(url_id)
        if qr_id:
            queries.increment_qr_scans(qr_id)
    except Exception:
        pass


# ── Short URL redirect ────────────────────────────────────────────
@app.get("/{short_code}", include_in_schema=False)
async def redirect_short_url(
    short_code: str, request: Request, background_tasks: BackgroundTasks
):
    if short_code.split("/")[0] in _RESERVED:
        raise HTTPException(status_code=404, detail="Not found")

    url = queries.get_url_by_short_code(short_code)
    if not url:
        raise HTTPException(status_code=404, detail="Short URL not found")

    if url.get("expires_at"):
        expires = datetime.fromisoformat(url["expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(status_code=410, detail="This URL has expired!!!")

    background_tasks.add_task(_track_click, url["id"], None, request)
    return RedirectResponse(url=url["original_url"], status_code=301)

