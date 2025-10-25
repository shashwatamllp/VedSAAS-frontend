/**
 * Language Selector Module
 * Handles language selection for chat messages
 * Persists choice in localStorage under key: vedsaas_chat_lang
 */

(function() {
  'use strict';

  const STORAGE_KEY = 'vedsaas_chat_lang';
  const DEFAULT_LANG = 'auto';

  /**
   * Get current language from localStorage
   * @returns {string} language code (e.g., 'auto', 'en', 'hi')
   */
  function getCurrentLanguage() {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    } catch {
      return DEFAULT_LANG;
    }
  }

  /**
   * Save language to localStorage
   * @param {string} lang - language code
   */
  function saveLanguage(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Failed to save language preference:', e);
    }
  }

  /**
   * Prepend language marker to message if not auto
   * @param {string} message - original message
   * @returns {string} message with language marker if applicable
   */
  function addLanguageMarker(message) {
    const lang = getCurrentLanguage();
    if (lang && lang !== 'auto' && lang !== DEFAULT_LANG) {
      return `[lang:${lang}] ${message}`;
    }
    return message;
  }

  /**
   * Setup language dropdown
   * @param {string|HTMLElement} selectSelector - CSS selector or element
   */
  function setupLanguageDropdown(selectSelector) {
    const select = typeof selectSelector === 'string' 
      ? document.querySelector(selectSelector)
      : selectSelector;
    
    if (!select) return;

    // Set current value
    const currentLang = getCurrentLanguage();
    if (select.value !== undefined) {
      select.value = currentLang;
    }

    // Listen for changes
    select.addEventListener('change', (e) => {
      const newLang = e.target.value;
      saveLanguage(newLang);
    });
  }

  /**
   * Update dropdown display with current language
   * @param {string|HTMLElement} displaySelector - CSS selector or element for display
   */
  function updateLanguageDisplay(displaySelector) {
    const display = typeof displaySelector === 'string' 
      ? document.querySelector(displaySelector)
      : displaySelector;
    
    if (!display) return;

    const lang = getCurrentLanguage();
    const langNames = {
      'auto': 'Auto',
      'en': 'English',
      'hi': 'हिन्दी',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'ja': '日本語',
      'zh': '中文'
    };
    
    display.textContent = langNames[lang] || lang.toUpperCase();
  }

  // Export functions to window for use by other scripts
  window.VedLang = {
    current: getCurrentLanguage,
    save: saveLanguage,
    addMarker: addLanguageMarker,
    setupDropdown: setupLanguageDropdown,
    updateDisplay: updateLanguageDisplay
  };

  // Auto-setup dropdowns with data-lang-select attribute
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-lang-select]').forEach(select => {
      setupLanguageDropdown(select);
    });

    document.querySelectorAll('[data-lang-display]').forEach(display => {
      updateLanguageDisplay(display);
    });
  });
})();
