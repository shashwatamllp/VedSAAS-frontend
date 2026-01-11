# VedSAAS Frontend

> India's First AI Platform in 22+ Languages - Complete Frontend Application

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Made in India](https://img.shields.io/badge/Made%20in-Bharat%20🇮🇳-orange.svg)](https://github.com/shashwatamllp)

## 🌟 Overview

VedSAAS is a cutting-edge AI platform designed specifically for Indian languages and cultural context. This repository contains the complete frontend application with 24+ pages, premium UI/UX, and a comprehensive design system.

## ✨ Features

- 🎨 **Premium Design System** - VedSAAS 4.0 "Vedic-Futurism" aesthetic
- 🌓 **Dark/Light Mode** - Seamless theme switching
- 🗣️ **22+ Indian Languages** - Full multilingual support
- 📱 **Responsive Design** - Works on all devices
- ⚡ **Fast & Optimized** - Lightweight and performant
- 🔒 **Secure** - Built with security best practices

## 📦 What's Included

### Main Pages
- **Landing Page** (`index.html`) - Hero, Features, Pricing, Testimonials, FAQ
- **Chat Interface** (`chat/`) - AI conversation interface
- **Authentication** - Login, Register, Verify, Profile, Settings

### Admin Dashboard (7 Pages)
- Dashboard Overview
- User Management
- System Health Monitoring
- Training Dashboard
- Analytics
- Configuration
- Security & Audit

### Subdomain Pages (8 Pages)
- **Documentation** (`docs.html`) - Complete API docs
- **API Reference** (`api.html`) - Endpoint documentation
- **System Status** (`status.html`) - Real-time status monitoring
- **Help Center** (`help.html`) - FAQ and support
- **Careers** (`careers.html`) - Job listings
- **Developer Console** (`console.html`) - Code playground
- **Wiki** (`wiki.html`) - Knowledge base
- **Contact** (`contact.html`) - Support contacts
  - `support.html` - General support
  - `investor.html` - Investor relations
  - `ai-team.html` - AI team contact

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/shashwatamllp/VedSAAS-frontend.git
cd VedSAAS-frontend
```

2. **Run local server**
```bash
python serve_frontend.py
```

3. **Open browser**
```
http://localhost:3000
```

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Production
vercel --prod
```

## 📁 Project Structure

```
VedSAAS-frontend/
├── index.html              # Landing page
├── login.html              # Login page
├── register.html           # Registration
├── verify.html             # Email verification
├── profile.html            # User profile
├── settings.html           # User settings
├── userpage.html           # User dashboard
├── chat/                   # Chat interface
│   └── index.html
├── admin/                  # Admin dashboard
│   ├── dashboard.html
│   ├── users.html
│   ├── health.html
│   ├── training.html
│   ├── analytics.html
│   ├── config.html
│   └── security.html
├── subdomains/             # Subdomain pages
│   ├── docs/
│   │   └── docs.html
│   ├── api/
│   │   └── api.html
│   ├── status/
│   │   └── status.html
│   ├── help/
│   │   └── help.html
│   ├── careers/
│   │   └── careers.html
│   ├── console/
│   │   └── console.html
│   ├── wiki/
│   │   └── wiki.html
│   └── contact/
│       ├── contact.html
│       ├── support.html
│       ├── investor.html
│       └── ai-team.html
├── public/
│   ├── css/
│   │   └── civilization.css
│   └── image/
│       └── logopic.png
└── serve_frontend.py       # Local dev server
```

## 🎨 Design System

### Colors
- **Dark Mode**: `#030304` (Void) + `#00f0ff` (Cyan)
- **Light Mode**: `#ffffff` (Paper) + `#0066cc` (Ink Blue)
- **Accent**: Cyan (`#00f0ff`) and Purple (`#7000ff`)

### Typography
- **UI Font**: Inter
- **Mono Font**: JetBrains Mono

### Components
- Glassmorphism cards
- Gradient accents
- Smooth animations
- Interactive hover states

## 🌐 Deployment Options

### 1. Vercel (Recommended)
```bash
vercel --prod
```

### 2. Netlify
```bash
netlify deploy --prod
```

### 3. GitHub Pages
- Enable in Settings → Pages
- Source: `main` branch

### 4. Traditional Hosting
- Upload to `public_html`
- Set permissions: Files 644, Folders 755

## 📧 Contact

- **General Support**: support@vedsaas.com
- **AI Team**: vedsaasai@shashwatam.com
- **Investor Relations**: investor@vedsaas.com

## 🛠️ Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom design system
- **JavaScript** - Vanilla JS
- **Font Awesome** - Icons
- **Google Fonts** - Typography

## 📊 Statistics

- **Total Pages**: 24+
- **Lines of Code**: 5,000+
- **File Size**: ~35KB (minified CSS)
- **Load Time**: < 1s
- **Lighthouse Score**: 95+

## 🔒 Security

- End-to-end encryption ready
- Secure authentication flow
- XSS protection
- CSRF tokens (backend integration)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built by **Shashwatam Eco-Chic Creations LLP**
- Made in Bharat 🇮🇳
- Powered by Sabhyata v4.0

## 🔗 Links

- **Website**: [vedsaas.com](https://vedsaas.com)
- **Documentation**: [docs.vedsaas.com](https://docs.vedsaas.com)
- **API**: [api.vedsaas.com](https://api.vedsaas.com)
- **Status**: [status.vedsaas.com](https://status.vedsaas.com)

---

**Made with ❤️ in India**
