// PWA Initialization Script
(function () {
    'use strict';

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers not supported');
        return;
    }

    // Register service worker
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('✅ Service Worker registered:', registration.scope);

                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            showUpdateNotification();
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('❌ Service Worker registration failed:', error);
            });
    });

    // Install prompt handling
    let deferredPrompt;
    const installBtn = document.getElementById('install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing
        e.preventDefault();
        // Store the event for later use
        deferredPrompt = e;
        // Show install button
        if (installBtn) {
            installBtn.style.display = 'inline-block';
        }
    });

    // Install button click handler
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;

            // Show install prompt
            deferredPrompt.prompt();

            // Wait for user response
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response: ${outcome}`);

            if (outcome === 'accepted') {
                console.log('✅ App installed');
                // Track installation
                trackEvent('pwa_install', 'success');
            }

            // Clear the prompt
            deferredPrompt = null;
            installBtn.style.display = 'none';
        });
    }

    // Track when app is installed
    window.addEventListener('appinstalled', () => {
        console.log('✅ VedSAAS PWA installed');
        trackEvent('pwa_install', 'completed');
        deferredPrompt = null;
    });

    // Show update notification
    function showUpdateNotification() {
        const notification = document.createElement('div');
        notification.id = 'update-notification';
        notification.innerHTML = `
      <div style="position:fixed;bottom:20px;right:20px;background:linear-gradient(135deg,#00f0ff,#7000ff);color:#000;padding:16px 24px;border-radius:12px;box-shadow:0 10px 40px rgba(0,240,255,0.3);z-index:10000;font-weight:600;display:flex;align-items:center;gap:12px">
        <span>🎉 New version available!</span>
        <button onclick="updateApp()" style="background:#fff;color:#000;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-weight:700">Update</button>
        <button onclick="this.parentElement.remove()" style="background:transparent;color:#000;border:none;padding:8px;cursor:pointer;font-size:1.2rem">×</button>
      </div>
    `;
        document.body.appendChild(notification);
    }

    // Update app function
    window.updateApp = function () {
        navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg && reg.waiting) {
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
        });
        window.location.reload();
    };

    // Track events (placeholder)
    function trackEvent(category, action) {
        console.log(`📊 Event: ${category} - ${action}`);
        // Add analytics tracking here (Google Analytics, etc.)
    }

    // Check if running as PWA
    function isPWA() {
        return window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
    }

    if (isPWA()) {
        console.log('🚀 Running as PWA');
        document.body.classList.add('pwa-mode');
    }

})();
