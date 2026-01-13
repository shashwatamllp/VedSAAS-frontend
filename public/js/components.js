/**
 * VedSAAS Component Loader
 * Dynamically loads shared components (Navbar, Footer) to ensure consistency across pages.
 */

document.addEventListener('DOMContentLoaded', () => {
    loadNavbar();
});

async function loadNavbar() {
    try {
        // 1. Determine the path to components relative to current page
        // Since we are running on a server (localhost), absolute paths work best.
        // But for file:// protocol support (if strict static), we might need relative handling.
        // For now, we assume server environment as per serve_frontend.py
        const componentPath = '/components/navbar.html';

        // 2. Fetch the navbar HTML
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error('Failed to load navbar');
        const html = await response.text();

        // 3. Inject it
        // We look for a dedicated placeholder, or inject at the start of body
        const placeholder = document.getElementById('navbar-placeholder');

        if (placeholder) {
            placeholder.innerHTML = html;
        } else {
            // Fallback: Prepend to body
            document.body.insertAdjacentHTML('afterbegin', html);
        }

        // 4. Initialize Navbar Logic (Theme Toggle, Install Button, etc.)
        initNavbarLogic();
        initNavbarEvents(); // New helper for UI events

    } catch (error) {
        console.error('VedSAAS Component Loader Error:', error);
    }
}

function initNavbarEvents() {
    // -- Theme Toggle --
    const btn = document.getElementById('theme-btn');
    const body = document.body;

    // Set initial theme based on localStorage
    if (localStorage.getItem('theme') === 'light') {
        body.classList.add('light-mode');
        if (btn) {
            const icon = btn.querySelector('i');
            if (icon) icon.classList.replace('fa-moon', 'fa-sun');
        }
    }

    if (btn) {
        btn.addEventListener('click', () => {
            body.classList.toggle('light-mode');
            const isLight = body.classList.contains('light-mode');

            // Update Icon
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-moon', !isLight);
                icon.classList.toggle('fa-sun', isLight);
            }

            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
    }

    // -- Resources Dropdown Menu --
    const resourcesBtn = document.getElementById('resources-btn');
    const resourcesMenu = document.getElementById('resources-menu');

    if (resourcesBtn && resourcesMenu) {
        resourcesBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            resourcesMenu.style.display = resourcesMenu.style.display === 'none' ? 'block' : 'none';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            resourcesMenu.style.display = 'none';
        });

        // Prevent dropdown from closing when clicking inside it
        resourcesMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Add hover effects to dropdown menu items
        resourcesMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('mouseenter', function () {
                this.style.background = 'rgba(0,240,255,0.1)';
            });
            link.addEventListener('mouseleave', function () {
                this.style.background = 'transparent';
            });
        });
    }

    // Add hover effects to navbar links
    document.querySelectorAll('nav a[href^="#"]').forEach(link => {
        link.addEventListener('mouseenter', function () {
            this.style.color = 'var(--accent-cyan)';
        });
        link.addEventListener('mouseleave', function () {
            this.style.color = 'var(--text-primary)';
        });
    });
}

function initNavbarLogic() {
    // PWA Install Prompt handling if button exists in the loaded navbar
    const installBtn = document.getElementById('install-btn');
    if (installBtn && window.deferredPrompt) {
        installBtn.style.display = 'block';
        installBtn.addEventListener('click', async () => {
            if (!window.deferredPrompt) return;
            window.deferredPrompt.prompt();
            const { outcome } = await window.deferredPrompt.userChoice;
            console.log(`User response to install prompt: ${outcome}`);
            window.deferredPrompt = null;
            installBtn.style.display = 'none';
        });
    }
}

// Global PWA prompt listener (needs to run before DOMContentLoaded sometimes)
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    // If navbar is already loaded, update button
    const installBtn = document.getElementById('install-btn');
    if (installBtn) installBtn.style.display = 'block';
});
