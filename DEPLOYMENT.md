# VedSAAS Frontend - Production Deployment Guide (Fortress Architecture)

## 🎯 Architecture: Unified Origin
This frontend is designed to be served by the **Junction Gateway (Equation Server)**.
- **Hosting**: Self-Hosted Nginx / Junction.
- **Routing**: All API traffic uses relative `/api` paths.
- **Security**: "Fortress Mode" - No direct access to Backend.

> 🛑 **DO NOT DEPLOY TO VERCEL OR NETLIFY**.
> This application relies on the internal "Junction" gateway for security and routing.

## 📝 Configuration Rules

### 1. Relative Paths Only
Ensure `index.html` and `chat/index.html` use:
```javascript
const API_BASE = '/api'; // Allowed
// const API_BASE = 'http://localhost:8010'; // 🛑 BANNED
```

### 2. CSP (Content Security Policy)
We use a strict CSP that allows 'self'.
```html
connect-src 'self' https://api.vedsaas.com;
```

## 🚀 Deployment Process (The "Clean Build" Strategy)

We do not upload the root directory (to avoid `node_modules` garbage).

### Step 1: Create Build Pack
Run this PowerShell command locally:
```powershell
# Create clean folder
New-Item -ItemType Directory -Force -Path build_ready
# Copy Core Files
Copy-Item index.html, sw.js, manifest.json, pwa-init.js, login.html, register.html, verify.html, profile.html, favicon.ico build_ready/
# Copy Directories
Copy-Item -Recurse public build_ready/
Copy-Item -Recurse chat build_ready/
Copy-Item -Recurse subdomains build_ready/
```

### Step 2: Upload to Server
Upload the **contents** of `build_ready` to the server:

```powershell
cd build_ready
scp -r . aiuser@163.223.145.140:/var/www/vedsaas-app/
```

### Step 3: Notify
Tell the Backend Team: *"Frontend Files Updated in /var/www/vedsaas-app"*.
Nginx will serve these files at `https://app.vedsaas.com`.

---
**Status**: Ready for Fortress Deployment �

