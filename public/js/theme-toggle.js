/**
 * Theme Toggle Module
 * Handles theme switching between dark and light modes
 * Persists choice in localStorage under key: vedsaas_theme
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'vedsaas_theme';
  const LIGHT_CLASS = 'light-theme';

  /**
   * Apply theme to document
   * @param {string} theme - 'light' or 'dark'
   */
  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add(LIGHT_CLASS);
    } else {
      root.classList.remove(LIGHT_CLASS);
    }
  }

  /**
   * Get current theme from localStorage or default to dark
   * @returns {string} 'light' or 'dark'
   */
  function getCurrentTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'dark';
    } catch {
      return 'dark';
    }
  }

  /**
   * Save theme to localStorage
   * @param {string} theme - 'light' or 'dark'
   */
  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Failed to save theme preference:', e);
    }
  }

  /**
   * Toggle between light and dark themes
   * @returns {string} new theme value
   */
  function toggleTheme() {
    const currentTheme = getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    saveTheme(newTheme);
    return newTheme;
  }

  /**
   * Initialize theme on page load
   */
  function initTheme() {
    const theme = getCurrentTheme();
    applyTheme(theme);
  }

  /**
   * Setup theme toggle button
   * @param {string|HTMLElement} buttonSelector - CSS selector or element
   */
  function setupToggleButton(buttonSelector) {
    const button = typeof buttonSelector === 'string' 
      ? document.querySelector(buttonSelector)
      : buttonSelector;
    
    if (!button) return;

    // Update button text/icon based on current theme
    function updateButtonUI() {
      const theme = getCurrentTheme();
      const icon = button.querySelector('i') || button;
      if (icon.classList && icon.classList.contains('fa-moon')) {
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
      } else {
        button.textContent = theme === 'light' ? '🌙' : '☀️';
        button.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
      }
    }

    updateButtonUI();

    button.addEventListener('click', () => {
      toggleTheme();
      updateButtonUI();
    });
  }

  // Apply theme immediately on load (before DOMContentLoaded)
  initTheme();

  // Export functions to window for use by other scripts
  window.VedTheme = {
    toggle: toggleTheme,
    apply: applyTheme,
    current: getCurrentTheme,
    save: saveTheme,
    setupButton: setupToggleButton
  };

  // Auto-setup buttons with data-theme-toggle attribute
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      setupToggleButton(button);
    });
  });
})();
