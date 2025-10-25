/**
 * Settings Page Module
 * Handles user authentication state and displays user information
 */

(function() {
  'use strict';

  const $ = (id) => document.getElementById(id);

  /**
   * Check if user is logged in
   * @returns {boolean}
   */
  function isLoggedIn() {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('ved_token');
      return !!token;
    } catch {
      return false;
    }
  }

  /**
   * Get user token
   * @returns {string|null}
   */
  function getToken() {
    try {
      return localStorage.getItem('token') || localStorage.getItem('ved_token');
    } catch {
      return null;
    }
  }

  /**
   * Get API base URL
   * @returns {string}
   */
  function getApiBase() {
    if (window.API_BASE) return window.API_BASE;
    
    const metaBase = document.querySelector('meta[name="ved-api-base"]')?.content || '';
    if (metaBase) return metaBase.replace(/\/$/, '');
    
    const h = (location.hostname || '').toLowerCase();
    const origin = location.origin || '';
    
    if (h.endsWith('vedsaas.com')) {
      return h === 'api.vedsaas.com' ? origin : 'https://api.vedsaas.com';
    }
    if (/:(8010|8011|8012)\b/.test(origin)) return origin;
    
    return 'http://127.0.0.1:8010';
  }

  /**
   * Fetch user details from API
   * @returns {Promise<Object>}
   */
  async function fetchUserDetails() {
    const token = getToken();
    if (!token) throw new Error('No token found');

    const apiBase = getApiBase();
    const endpoints = ['/api/user', '/api/me', '/api/auth/user'];

    for (const endpoint of endpoints) {
      try {
        const resp = await fetch(`${apiBase}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          mode: 'cors',
          cache: 'no-store',
          credentials: 'omit'
        });

        if (resp.ok) {
          const data = await resp.json();
          return data.user || data;
        }
      } catch (e) {
        console.warn(`Failed to fetch from ${endpoint}:`, e);
      }
    }

    throw new Error('Failed to fetch user details');
  }

  /**
   * Render logged-out state
   * @param {HTMLElement} container
   */
  function renderLoggedOut(container) {
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <p style="margin-bottom: 16px; color: var(--text-secondary, #ddd);">
          You are not logged in. Please log in or create an account to access user settings.
        </p>
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
          <a href="login.html" class="btn" style="text-decoration: none;">Login</a>
          <a href="register.html" class="btn btn-secondary" style="text-decoration: none;">Create Account</a>
        </div>
      </div>
    `;
  }

  /**
   * Render logged-in state with user info
   * @param {HTMLElement} container
   * @param {Object} user - user data
   */
  function renderLoggedIn(container, user) {
    if (!container) return;

    const name = user.name || user.username || 'User';
    const email = user.email || 'Not provided';
    const plan = user.plan || user.subscription || 'Free';

    container.innerHTML = `
      <div style="padding: 16px;">
        <div style="margin-bottom: 16px;">
          <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">${escapeHtml(name)}</div>
          <div style="color: var(--text-muted, #bbb); font-size: 14px;">${escapeHtml(email)}</div>
        </div>
        <div style="padding: 12px; background: var(--bg-surface, #1f2a44); border-radius: 8px; margin-bottom: 12px;">
          <div style="font-size: 13px; color: var(--text-muted, #bbb); margin-bottom: 4px;">Plan</div>
          <div style="font-weight: 600;">${escapeHtml(plan)}</div>
        </div>
        <button id="logout-btn" class="btn danger" style="width: 100%;">Logout</button>
      </div>
    `;

    // Setup logout button
    const logoutBtn = $('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('ved_token');
        } catch {}
        window.location.href = 'login.html';
      });
    }
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Initialize user section on settings page
   * @param {string|HTMLElement} containerSelector
   */
  async function initUserSection(containerSelector) {
    const container = typeof containerSelector === 'string'
      ? document.querySelector(containerSelector)
      : containerSelector;

    if (!container) {
      console.warn('User section container not found');
      return;
    }

    // Show loading state
    container.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted, #bbb);">Loading...</div>';

    if (!isLoggedIn()) {
      renderLoggedOut(container);
      return;
    }

    try {
      const user = await fetchUserDetails();
      renderLoggedIn(container, user);
    } catch (e) {
      console.error('Failed to fetch user details:', e);
      // If fetching fails, still show logged-in UI with minimal info
      renderLoggedIn(container, {
        name: localStorage.getItem('pendingName') || 'User',
        email: localStorage.getItem('pendingIdentifier') || 'Not available',
        plan: 'Free'
      });
    }
  }

  // Export functions to window for use by other scripts
  window.VedSettings = {
    isLoggedIn,
    getToken,
    fetchUserDetails,
    initUserSection,
    renderLoggedOut,
    renderLoggedIn
  };

  // Auto-initialize on settings page if user-section element exists
  document.addEventListener('DOMContentLoaded', () => {
    const userSection = document.querySelector('[data-user-section]');
    if (userSection) {
      initUserSection(userSection);
    }
  });
})();
