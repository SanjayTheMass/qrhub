# Integration Guide — QrHub

Complete step-by-step setup for Supabase, Render (backend) and GitHub Pages (frontend).

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.13+ | Backend runtime (`.venv` already created) |
| Node.js | 20+ | Frontend build |
| Git | any | Version control |
| GitHub account | — | Hosting repo + GitHub Pages |
| Supabase account | — | Database + Auth + Storage (free) |
| Render account | — | Backend hosting (free) |
| Razorpay account | — | Payments (India) |

---

## 1. Supabase Setup

### 1a. Create a project
1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a region close to your users (e.g. `ap-south-1` for India)
3. Set a strong **database password** (save it somewhere safe)
4. Wait ~2 min for the project to provision

### 1b. Run the SQL files (in order)

Go to **SQL Editor** in the Supabase dashboard and run each file:

```
1. supabase/schema.sql       ← creates all tables, indexes, triggers
2. supabase/rls_policies.sql ← enables Row Level Security
3. supabase/functions.sql    ← creates RPC helper functions
```

> **Tip:** paste each file content and click **Run**. Check the output — no red errors means success.

### 1c. Create the QR images storage bucket

1. Go to **Storage** → **New bucket**
2. Name: `qr-images`
3. Toggle **Public bucket** → ON (QR images must be publicly accessible)
4. Click **Create bucket**

### 1d. Get your API keys

Go to **Project Settings** → **API**:

| Key | Where used | Variable name |
|-----|-----------|---------------|
| Project URL | Backend + Frontend | `SUPABASE_URL` / `VITE_SUPABASE_URL` |
| `anon` public key | Frontend only | `VITE_SUPABASE_ANON_KEY` |
| `service_role` secret | Backend only ⚠️ | `SUPABASE_SERVICE_ROLE_KEY` |

Go to **Project Settings** → **API** → **JWT Settings**:

| Key | Variable name |
|-----|--------------|
| JWT Secret | `SUPABASE_JWT_SECRET` |

> ⚠️ **Never expose `service_role` key to the frontend.** It bypasses all Row Level Security.

### 1e. Enable Email auth

Go to **Authentication** → **Providers** → **Email** → ensure it is **enabled**.  
For production: disable **Confirm email** during testing, re-enable later.

---

## 2. Backend — Local Development

```powershell
# From project root
cd backend

# Copy environment template
copy .env.example .env
# Fill in .env with values from step 1d above

# Activate the virtual environment (already created at project root)
..\.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the dev server
uvicorn app.main:app --reload --port 8000
```

Test it:
- Swagger UI: http://localhost:8000/docs
- Health check: http://localhost:8000/health

---

## 3. Backend — Deploy to Render

### 3a. Push code to GitHub

```powershell
# From project root
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/qrhub.git
git push -u origin main
```

### 3b. Create Render service

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub account → select the **qrhub** repo
3. Settings:
   - **Name:** `qrhub-api`
   - **Root Directory:** `backend`
   - **Runtime:** `Docker`
   - **Dockerfile Path:** `./Dockerfile`
   - **Plan:** Free

### 3c. Add environment variables on Render

In the Render service → **Environment** tab, add:

```
SUPABASE_URL              = https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJ...service_role...
SUPABASE_JWT_SECRET       = your-jwt-secret
RAZORPAY_KEY_ID           = rzp_test_xxx
RAZORPAY_KEY_SECRET       = xxx
RAZORPAY_WEBHOOK_SECRET   = xxx
FRONTEND_URL              = https://YOUR_GITHUB_USERNAME.github.io/qrhub
BASE_URL                  = https://qrhub-api.onrender.com   ← your Render URL
```

### 3d. Get the Deploy Hook URL

Render Service → **Settings** → **Deploy Hook** → copy the URL.  
Add it as a GitHub secret: `RENDER_DEPLOY_HOOK_URL`

### 3e. Keep the free tier awake

Render free tier sleeps after 15 min of inactivity.

1. Go to [cron-job.org](https://cron-job.org) (free)
2. Create a cron job: `GET https://qrhub-api.onrender.com/health`
3. Schedule: every **14 minutes**

---

## 4. Frontend — Local Development

```powershell
cd frontend

# Copy environment template
copy .env.example .env.local
# Fill in values:
#   VITE_SUPABASE_URL      = https://xxxx.supabase.co
#   VITE_SUPABASE_ANON_KEY = eyJ...anon...
#   VITE_API_BASE_URL      = http://localhost:8000   (local backend)
#   VITE_RAZORPAY_KEY_ID   = rzp_test_xxx

npm install
npm run dev
# App: http://localhost:5173/qrhub/
```

> The `base: '/qrhub/'` in `vite.config.js` **must match your GitHub repo name** exactly.

---

## 5. Frontend — Deploy to GitHub Pages

### 5a. Add GitHub Secrets

In your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret name | Value |
|-------------|-------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | anon key from Supabase |
| `VITE_API_BASE_URL` | `https://qrhub-api.onrender.com` |
| `VITE_RAZORPAY_KEY_ID` | `rzp_test_xxx` (use `rzp_live_xxx` in production) |
| `RENDER_DEPLOY_HOOK_URL` | URL from Render step 3d |

### 5b. Enable GitHub Pages

1. GitHub repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `gh-pages` / `/ (root)`
4. Click **Save**

### 5c. Trigger first deploy

```powershell
git push origin main
```

The `deploy-frontend.yml` workflow runs automatically on every push to `main` that touches `frontend/`.

Your site will be live at:  
`https://YOUR_GITHUB_USERNAME.github.io/qrhub/`

---

## 6. Razorpay Setup

### 6a. Create account & get test keys

1. Go to [razorpay.com](https://razorpay.com) → Sign up
2. Dashboard → **Settings** → **API Keys** → **Generate Test Key**
3. Copy `Key ID` (`rzp_test_xxx`) and `Key Secret`

### 6b. Register the webhook

1. Razorpay Dashboard → **Settings** → **Webhooks** → **Add New Webhook**
2. **Webhook URL:** `https://qrhub-api.onrender.com/api/payments/webhook`
3. **Secret:** choose a strong random string — save as `RAZORPAY_WEBHOOK_SECRET`
4. **Active events:** check `payment.captured`
5. Click **Save**

### 6c. Test a payment end-to-end

Use Razorpay test cards:

| Card number | Result |
|-------------|--------|
| `4111 1111 1111 1111` | Payment success |
| `5267 3181 8797 5449` | Payment success (Mastercard) |
| Any future expiry, CVV `123` | — |

1. Go to your deployed site → `/pricing`
2. Click **Upgrade to Pro** → pay with test card
3. Check your FastAPI logs on Render — you should see the webhook hit
4. Your profile plan should update to `pro`

### 6d. Go live

When ready for real payments:
1. Complete Razorpay KYC
2. Switch `VITE_RAZORPAY_KEY_ID` secret to `rzp_live_xxx`
3. Update `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` on Render
4. Re-deploy both services

---

## 7. Full Architecture Verification Checklist

```
[ ] supabase/schema.sql ran without errors
[ ] supabase/rls_policies.sql ran without errors
[ ] supabase/functions.sql ran without errors
[ ] Storage bucket 'qr-images' created with Public access
[ ] backend/.env has all 8 variables filled in
[ ] GET http://localhost:8000/health → {"status":"ok"}
[ ] Swagger UI at http://localhost:8000/docs shows all routes
[ ] frontend/.env.local has all 4 variables filled in
[ ] npm run dev shows app at http://localhost:5173/qrhub/
[ ] Sign up creates a profile row in Supabase → profiles table
[ ] Create URL → short code appears, redirect works
[ ] Create QR code → PNG appears in Supabase Storage bucket
[ ] Razorpay test payment → plan updated to 'pro' in profiles table
[ ] GitHub Actions workflow deploys frontend to gh-pages branch
[ ] Render deploy hook triggers on backend push
[ ] Cron job pings /health every 14 min
```

---

## 8. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| All API calls return `401` | Wrong `SUPABASE_JWT_SECRET` | Copy JWT secret again from Supabase → Project Settings → API → JWT Settings |
| QR image not appearing | Storage bucket is private | Set `qr-images` bucket to **Public** in Supabase Storage |
| `CORS` errors in browser | `FRONTEND_URL` mismatch | Update `FRONTEND_URL` in Render env vars to match exact GitHub Pages URL |
| Redirect goes to 404 | `BASE_URL` wrong | Set `BASE_URL` to your Render service URL (not localhost) |
| Razorpay webhook 400 | Wrong `RAZORPAY_WEBHOOK_SECRET` | Re-copy secret from Razorpay Dashboard → Webhooks |
| Free tier Render sleep | Normal behaviour | Set up cron-job.org ping every 14 min |
| GitHub Pages shows blank | Wrong `base` in vite.config.js | Ensure `base: '/qrhub/'` matches repo name exactly (case-sensitive) |
| `profile not found` on first login | `handle_new_user` trigger not set | Re-run `supabase/schema.sql` — the trigger auto-creates profiles |

---

## 9. Environment Variables — Quick Reference

### backend/.env
```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=...
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
FRONTEND_URL=https://YOUR_USERNAME.github.io/qrhub
BASE_URL=https://qrhub-api.onrender.com
```

### frontend/.env.local
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_BASE_URL=https://qrhub-api.onrender.com
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```
