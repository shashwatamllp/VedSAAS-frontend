# VedSAAS Frontend - Production Deployment Guide

## 🎯 Overview
This is a **static HTML/CSS/JavaScript** frontend. No build step required!

## 📝 Configuration

### Step 1: Update API URL in `index.html`

Open `index.html` and find line **299**:

```javascript
const FALLBACK = 'http://127.0.0.1:8000';
```

**Change to your production backend URL:**
```javascript
const FALLBACK = 'http://localhost:8010';  // Local
// OR
const FALLBACK = 'https://your-backend.com';  // Production
```

### Step 2: Update CSP (Content Security Policy)

In `index.html` line **19**, update `connect-src`:

```html
connect-src 'self' https://your-backend.com http://localhost:8010;
```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended - Free)

1. **Push to GitHub:**
   ```bash
   cd VedSAAS-frontend
   git add .
   git commit -m "Production config"
   git push origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import GitHub repository
   - Framework Preset: **Other**
   - Build Command: Leave empty
   - Output Directory: `.` (root)
   - Deploy!

3. **Set Environment Variable** (if using dynamic API URL):
   - Vercel Dashboard → Settings → Environment Variables
   - Add: `API_URL` = `https://your-backend.com`

### Option 2: Netlify

1. **Drag & Drop:**
   - Go to [netlify.com](https://netlify.com)
   - Drag the entire `VedSAAS-frontend` folder
   - Done!

2. **Or via CLI:**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=.
   ```

### Option 3: GitHub Pages

1. **Enable GitHub Pages:**
   - Repository Settings → Pages
   - Source: `main` branch, `/` (root)
   - Save

2. **Access at:**
   ```
   https://shashwatamllp.github.io/VedSAAS-frontend
   ```

### Option 4: Self-Hosted (Nginx)

```nginx
server {
    listen 80;
    server_name frontend.yourdomain.com;
    
    root /var/www/vedsaas-frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## ✅ Pre-Deployment Checklist

- [ ] Update `API_BASE` fallback URL in `index.html` (line 299)
- [ ] Update CSP `connect-src` in `index.html` (line 19)
- [ ] Test locally: `python -m http.server 3000`
- [ ] Verify backend is accessible from frontend
- [ ] Push to GitHub
- [ ] Deploy to Vercel/Netlify

## 🔗 Connect Frontend to Backend

**Local Testing:**
```
Frontend: http://localhost:3000
Backend:  http://localhost:8010
```

**Production:**
```
Frontend: https://vedsaas-frontend.vercel.app
Backend:  https://your-backend.com (or Ngrok tunnel)
```

## 🧪 Test Deployment

After deployment, open browser console and check:
```javascript
console.log(API_BASE);  // Should show your backend URL
```

Test health check:
```
http://localhost:3000
```
Click "New Chat" and send a message. Check Network tab for API calls.

---

**Ready to Deploy!** 🚀
