/**
 * VedSAAS Component Loader
 * Dynamically loads shared components (Navbar, Footer) to ensure consistency across pages.
 */

document.addEventListener('DOMContentLoaded', () => {
    loadNavbar();
    loadFooter();
});

function getComponentPath(filename) {
    // Check if we are in a subdomain or subdirectory
    const path = window.location.pathname;
    const depth = (path.match(/\//g) || []).length;

    // Default to absolute path for server environments
    // But facilitate relative paths for local file:// testing if needed in future
    // For now, we stick to absolute paths as they are reliable on servers (localhost/production)
    return `/components/${filename}`;
}

async function loadNavbar() {
    try {
        const componentPath = getComponentPath('navbar.html');
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error('Failed to load navbar');
        const html = await response.text();

        const placeholder = document.getElementById('navbar-placeholder');
        if (placeholder) {
            placeholder.innerHTML = html;
        } else {
            document.body.insertAdjacentHTML('afterbegin', html);
        }

        initNavbarLogic();
        initNavbarEvents();
        highlightActiveLink();

    } catch (error) {
        console.error('VedSAAS Navbar Loader Error:', error);
    }
}

async function loadFooter() {
    try {
        const componentPath = getComponentPath('footer.html');
        const response = await fetch(componentPath);
        if (!response.ok) throw new Error('Failed to load footer');
        const html = await response.text();

        const placeholder = document.getElementById('footer-placeholder');
        if (placeholder) {
            placeholder.innerHTML = html;
        } else {
            // Check if there is a specific script tag at the end to insert before, or just append
            document.body.insertAdjacentHTML('beforeend', html);
        }

    } catch (error) {
        console.error('VedSAAS Footer Loader Error:', error);
    }
}

function highlightActiveLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('nav a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Simple match: if current path ends with the href, or exactly matches
        if (currentPath === href || (href !== '/' && currentPath.includes(href))) {
            link.style.color = 'var(--accent-cyan)';
            link.classList.add('active');
        }
    });
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
            // Only change color if not active
            if (!this.classList.contains('active')) {
                this.style.color = 'var(--accent-cyan)';
            }
        });
        link.addEventListener('mouseleave', function () {
            if (!this.classList.contains('active')) {
                this.style.color = 'var(--text-primary)';
            }
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
