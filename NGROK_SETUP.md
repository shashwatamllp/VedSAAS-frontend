# VedSAAS Frontend - Ngrok Setup Guide

## 🎯 Current Setup
- **Frontend**: Deployed on Vercel (api.vedsaas.com)
- **Backend**: Running on PC via Docker (port 8010)
- **Connection**: Via Ngrok tunnel

## 📝 Step-by-Step Setup

### Step 1: Install Ngrok (if not installed)
```bash
# Download from https://ngrok.com/download
# Or via chocolatey
choco install ngrok
```

### Step 2: Start Ngrok Tunnel
```bash
# In a new terminal
ngrok http 8010
```

You'll get output like:
```
Forwarding  https://abc123xyz.ngrok-free.app -> http://localhost:8010
```

**Copy the HTTPS URL** (e.g., `https://abc123xyz.ngrok-free.app`)

### Step 3: Update Frontend Meta Tag

Open `index.html` and find line 6:
```html
<meta name="ved-api-base" content="https://api.vedsaas.com"/>
```

**Change to your Ngrok URL:**
```html
<meta name="ved-api-base" content="https://abc123xyz.ngrok-free.app"/>
```

### Step 4: Push to GitHub
```bash
git add index.html
git commit -m "Update API URL to Ngrok tunnel"
git push origin main
```

### Step 5: Vercel Auto-Deploy
Vercel will automatically deploy the updated frontend.

## ✅ Verification

1. Open your frontend: `https://api.vedsaas.com`
2. Open browser console (F12)
3. Check: Should show "Online" instead of "Offline"
4. Send a test message

## 🔄 When Ngrok URL Changes

Ngrok free tier gives a new URL every time you restart. When URL changes:

1. Update line 6 in `index.html` with new Ngrok URL
2. Push to GitHub
3. Wait for Vercel to redeploy (~30 seconds)

## 💡 Pro Tip: Ngrok Persistent URL

Get a free Ngrok account for persistent URLs:
```bash
ngrok config add-authtoken YOUR_TOKEN
ngrok http 8010 --domain=your-static-domain.ngrok-free.app
```

Then you won't need to update frontend every time!

---

**Current Configuration:**
- Meta tag: `https://api.vedsaas.com` (UPDATE THIS!)
- CSP: Allows `https://*.ngrok-free.app`
- Backend: Docker on port 8010
