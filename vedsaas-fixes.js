/* vedsaas-fixes.js
 * API base resolve + safe fetch. Works with same-origin /api proxy.
 */
(function () {
  function resolveApiBase() {
    if (window.API_BASE && typeof window.API_BASE === 'string') return window.API_BASE.replace(/\/+$/, '');
    var meta = document.querySelector('meta[name="api-base"]');
    if (meta && meta.content) return meta.content.replace(/\/+$/, '');
    return ''; // same-origin (expects /api proxied on the same domain)
  }

  var API_BASE = resolveApiBase();
  window.__VEDSAAS_API_BASE__ = API_BASE;

  window.apiFetch = async function (path, opts = {}) {
    const url = (API_BASE ? API_BASE : '') + path;
    const init = Object.assign(
      { headers: { 'Content-Type': 'application/json' } },
      opts
    );
    const res = await fetch(url, init);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`API ${res.status}: ${text || res.statusText}`);
    }
    try { return await res.json(); } catch { return await res.text(); }
  };

  async function healthBanner() {
    var el = document.getElementById('banner');
    if (!el) return;
    try {
      await window.apiFetch('/api/health', { method: 'GET' });
      el.textContent = 'API OK';
      el.className = 'banner ok';
    } catch (e) {
      el.textContent = 'API unreachable';
      el.className = 'banner warn';
      console.warn(e);
    }
    setTimeout(() => { el.textContent = ''; el.className = 'banner'; }, 4000);
  }

  if (document.readyState === 'complete') healthBanner();
  else window.addEventListener('load', healthBanner);
})();
