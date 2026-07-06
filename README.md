# Rentabout

A micro SaaS application for **Dynamic QR Code Generation** and **URL Shortening**, built with React + FastAPI + Supabase.

## Features
- 🔗 URL Shortening with custom slugs (Pro)
- 📱 Dynamic QR Codes — change destination without regenerating
- 📊 Click Analytics (device, browser, referrer)
- 💳 Subscription payments via Razorpay
- 🆓 Free tier (20 URLs, 5 QR codes)

## Quick Start

### Backend
```powershell
cd backend
cp .env.example .env   # fill in your values
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```powershell
cd frontend
cp .env.example .env.local  # fill in your values
npm install
npm run dev
```

## Docs
- 📖 [Integration Guide](docs/INTEGRATION_GUIDE.md) — Supabase + Render + GitHub Pages setup
- 🤖 [AGENTS.md](AGENTS.md) — AI coding agent guide

## License
MIT

