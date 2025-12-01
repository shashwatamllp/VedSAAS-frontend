# 🚀 VedSAAS Frontend - Quick Start

## Current Setup
- **Frontend**: Deployed on Vercel/GitHub Pages
- **Backend**: Running on PC via Docker (port 8010)

## ⚡ Connect Frontend to Backend

Since your backend is on PC and frontend is public, you need **Ngrok tunnel**:

### Step 1: Start Ngrok
```bash
ngrok http 8010
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

### Step 2: Update Frontend

Edit `index.html` line 6:
```html
<!-- BEFORE -->
<meta name="ved-api-base" content="/api"/>

<!-- AFTER (use your Ngrok URL) -->
<meta name="ved-api-base" content="https://abc123.ngrok-free.app"/>
```

### Step 3: Update CSP (line 19)

Add `https://*.ngrok-free.app` to `connect-src`:
```html
connect-src 'self' https://vedsaas.com https://*.vedsaas.com https://api.vedsaas.com https://*.ngrok-free.app http://127.0.0.1:8010 http://localhost:8010;
```

### Step 4: Push to GitHub
```bash
git add index.html
git commit -m "Connect to Ngrok backend"
git push origin main
```

Vercel will auto-deploy in ~30 seconds!

## ✅ Verify
Open your frontend URL and check browser console - should show "Online" ✅

---

**Pro Tip**: Get Ngrok auth token for persistent URLs so you don't need to update every time!
