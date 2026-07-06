# AGENTS.md — QrHub (Dynamic QR Code Generator & URL Shortener Micro SaaS)

## Project Overview
QrHub is a micro SaaS with two core features:
1. **URL Shortening** — generates short codes (`/ab3Xk9`) that redirect to original URLs
2. **Dynamic QR Codes** — QR images that encode the short URL; changing `urls.original_url` changes redirect destination **without regenerating the QR image**

## Stack
| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | React 18 + Vite + TailwindCSS | GitHub Pages (`/qrhub/` base path) |
| Backend | FastAPI (Python 3.13) + Uvicorn | Render.com (Docker) |
| Database | Supabase (PostgreSQL 15) | Supabase free tier |
| Auth | Supabase Auth (JWT) | Supabase |
| Storage | Supabase Storage (`qr-images` bucket) | Supabase free tier |
| Payments | Razorpay (India) | Pay-per-transaction |

## Repository Layout
```
QrHub/
├── backend/               # FastAPI application
│   ├── app/
│   │   ├── main.py        # App entry point + redirect endpoint + CORS
│   │   ├── core/          # config.py, auth.py, razorpay_client.py
│   │   ├── db/            # supabase.py (client), queries.py (all DB ops)
│   │   ├── models/        # schemas.py (Pydantic request/response models)
│   │   ├── routers/       # auth.py, urls.py, qr.py, analytics.py, payments.py
│   │   └── utils/         # qr_generator.py, url_utils.py
│   ├── tests/
│   ├── Dockerfile
│   ├── render.yaml
│   └── requirements.txt
├── frontend/              # React SPA
│   ├── src/
│   │   ├── api/           # client.js (axios+auth), urls.js, qr.js, analytics.js, payments.js
│   │   ├── contexts/      # AuthContext.jsx (Supabase session)
│   │   ├── components/    # UI components
│   │   ├── pages/         # Landing, Login, Dashboard, URLs, QRCodes, Analytics, Pricing
│   │   ├── hooks/         # useAuth, useURLs, useQRCodes
│   │   └── lib/           # supabase.js (client singleton)
│   ├── public/404.html    # GitHub Pages SPA routing fallback
│   └── package.json
├── supabase/
│   ├── schema.sql         # Tables, indexes, triggers — RUN FIRST
│   ├── rls_policies.sql   # Row Level Security — RUN SECOND
│   └── functions.sql      # RPC functions (increment_clicks etc.) — RUN THIRD
├── .github/workflows/
│   ├── deploy-frontend.yml  # Triggers on push to main → GitHub Pages
│   └── deploy-backend.yml   # Triggers Render redeploy hook
└── docs/INTEGRATION_GUIDE.md  # Step-by-step setup for Supabase + Render + GitHub Pages
```

## Critical Architecture Decisions

### Dynamic QR Code Trick
- QR image encodes `https://{BACKEND_URL}/{short_code}` (the FastAPI redirect endpoint)
- Updating `urls.original_url` in DB changes the redirect WITHOUT regenerating the QR PNG
- QR PNG is stored once in Supabase Storage (`qr-images/{user_id}/{qr_id}.png`)
- `GET /{short_code}` on FastAPI always looks up current `original_url` at redirect time

### Authentication Flow
1. Supabase Auth issues JWTs (`access_token`) on login
2. Frontend attaches JWT as `Authorization: Bearer {token}` via axios interceptor in `src/api/client.js`
3. FastAPI's `get_current_user` dependency verifies JWT using `SUPABASE_JWT_SECRET`
4. Backend uses **service_role key** (bypasses RLS) for all DB operations
5. Frontend uses **anon key** only for auth — never for direct DB access

### Plan Limits (enforced server-side in `app/db/queries.py`)
- Free: 20 URLs, 5 QR codes, 7-day analytics, no custom slugs, no expiry
- Pro: Unlimited everything, 1-year analytics, custom slugs, URL expiry

## Environment Variables

### Backend (`backend/.env`)
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # NEVER expose to frontend
SUPABASE_JWT_SECRET=your-jwt-secret
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxxx
RAZORPAY_WEBHOOK_SECRET=xxxx
FRONTEND_URL=https://yourusername.github.io/qrhub
BASE_URL=https://your-app.onrender.com
```

### Frontend (`frontend/.env.local`)
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...      # Safe to expose
VITE_API_BASE_URL=https://your-app.onrender.com
VITE_RAZORPAY_KEY_ID=rzp_test_xxx  # Use rzp_live_ in production
```

## Razorpay Integration Rules
- **Always create orders server-side**: `POST /api/payments/create-order`
- **Always verify signature server-side**: `POST /api/payments/verify` using HMAC-SHA256
- **Webhook is authoritative**: `POST /api/payments/webhook` is the final confirmation source
- Amounts are in **paise**: ₹499 = `49900`, ₹3999 = `399900`
- Plans: `pro_monthly` (₹499) and `pro_yearly` (₹3999) — defined in `app/core/razorpay_client.py`
- Razorpay Checkout JS SDK loaded from frontend via `window.Razorpay`

## Key Code Patterns

### All FastAPI routes require auth dependency
```python
@router.post("/api/urls")
async def create_url(data: URLCreate, user=Depends(get_current_user)):
    profile = queries.get_profile(user["id"])
    # check plan limits before proceeding
```

### All DB calls go through `app/db/queries.py` — never inline in routers
```python
# queries.py pattern
def create_url(user_id: str, data: dict) -> dict:
    result = supabase.table("urls").insert({**data, "user_id": user_id}).execute()
    return result.data[0]
```

### Frontend API calls always use the axios client with auto-auth
```js
// src/api/urls.js
import api from './client'
export const createURL = (data) => api.post('/api/urls', data)
export const listURLs = (page = 1) => api.get('/api/urls', { params: { page } })
```

### Click tracking is always done in a BackgroundTask (never blocking the redirect)
```python
background_tasks.add_task(track_click, url["id"], None, request)
return RedirectResponse(url=url["original_url"], status_code=301)
```

## Local Dev Commands

### Backend
```powershell
cd backend
..\\.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# Swagger UI: http://localhost:8000/docs
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
# App: http://localhost:5173/qrhub/
```

## Deployment Notes
- **GitHub Pages**: `vite.config.js` must have `base: '/qrhub/'` — this matches the repo name
- **Render**: Free tier sleeps after 15min inactivity — add a cron ping at cron-job.org to hit `/health` every 14 min
- **Supabase Storage**: Create bucket `qr-images` with **Public** access before first QR creation
- **Webhook URL**: Register `https://your-app.onrender.com/api/payments/webhook` in Razorpay Dashboard → Webhooks

## Files to Check First When Debugging
- `backend/app/main.py` — CORS origins, router mounts, redirect logic
- `backend/app/db/queries.py` — All DB operations and plan limit constants
- `backend/app/core/auth.py` — JWT verification (wrong JWT secret = all 401s)
- `frontend/src/api/client.js` — Axios base URL and auth interceptor
- `frontend/src/contexts/AuthContext.jsx` — Supabase session management
- `supabase/schema.sql` — Source of truth for all table structures
