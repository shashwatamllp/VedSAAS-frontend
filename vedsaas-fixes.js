/* vedsaas-fixes.js
 * VedSAAS frontend helpers:
 * - Robust API base resolution (meta or global override)
 * - Safe fetch with timeout + small retry on 5xx / network errors
 * - Auto JSON body/stringify + headers
 * - Tiny /api/health banner
 *
 * Usage:
 *   apiFetch('/api/chat', { method:'POST', body:{ message:'Hi' } })
 *   // or:
 *   VedSaas.apiFetch('/api/health')
 */
(function () {
  // ------------------------------
  // 1) API base resolution
  // ------------------------------
  function trimSlashes(s) { return s.replace(/\/+$/, ''); }
  function resolveApiBase() {
    // window override (can be set before this file)
    if (typeof window.API_BASE === 'string' && window.API_BASE.length) {
      return trimSlashes(window.API_BASE);
    }
    // <meta name="api-base" content="https://api.example.com">
    var meta = document.querySelector('meta[name="api-base"]');
    if (meta && meta.content) return trimSlashes(meta.content);
    // default: same-origin (expects /api/* proxied on this domain)
    return '';
  }
  var API_BASE = resolveApiBase();

  // join like URL without duplicate slashes
  function joinUrl(base, path) {
    if (!base) return path;
    if (!path) return base;
    if (base.endsWith('/') && path.startsWith('/')) return base + path.slice(1);
    if (!base.endsWith('/') && !path.startsWith('/')) return base + '/' + path;
    return base + path;
  }

  // ------------------------------
  // 2) Safe fetch with timeout + retry
  // ------------------------------
  async function apiFetch(path, opts = {}) {
    const url = joinUrl(API_BASE, path || '');
    const controller = new AbortController();
    const timeoutMs = typeof opts.timeout === 'number' ? opts.timeout : 25000; // 25s
    const retries = typeof opts.retries === 'number' ? opts.retries : 2;

    // shallow clone
    const init = Object.assign({}, opts);
    delete init.timeout; delete init.retries;

    // auto headers
    init.headers = Object.assign(
      { 'Content-Type': 'application/json' },
      (opts.headers || {})
    );

    // auto stringify JSON body
    if (init.body && typeof init.body === 'object' && !(init.body instanceof FormData)) {
      try { init.body = JSON.stringify(init.body); } catch (_) {}
    }

    init.signal = controller.signal;

    let attempt = 0, lastErr;
    while (attempt <= retries) {
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, init);
        clearTimeout(timer);

        // success
        if (res.ok) {
          // try JSON first, fallback to text
          const ct = (res.headers.get('content-type') || '').toLowerCase();
          if (ct.includes('application/json')) return await res.json();
          try { return await res.json(); } catch { return await res.text(); }
        }

        // retry on 5xx and 429
        if ((res.status >= 500 && res.status <= 599) || res.status === 429) {
          lastErr = new Error(`API ${res.status}: ${res.statusText}`);
        } else {
          // don't retry on 4xx (except 429 handled above)
          const body = await res.text().catch(()=>'');
          throw new Error(`API ${res.status}: ${body || res.statusText}`);
        }
      } catch (e) {
        clearTimeout(timer);
        // network/abort errors eligible for retry
        lastErr = e;
      }

      attempt++;
      if (attempt <= retries) {
        // small backoff: 300ms, 700ms
        await new Promise(r => setTimeout(r, 300 + (attempt-1)*400));
        // create a fresh controller for the next attempt
        if (!controller.signal.aborted) controller.abort(); // ensure cleanup
      }
    }
    throw lastErr || new Error('API request failed');
  }

  // expose helpers (optional)
  function setApiBase(nextBase) { API_BASE = trimSlashes(nextBase || ''); }
  function getApiBase() { return API_BASE; }

  // attach to window
  window.apiFetch = apiFetch;
  window.__VEDSAAS_API_BASE__ = API_BASE;
  window.VedSaas = { apiFetch, setApiBase, getApiBase, joinUrl };

  // ------------------------------
  // 3) Tiny /api/health banner
  // ------------------------------
  async function healthBanner() {
    var el = document.getElementById('banner');
    if (!el) return;
    try {
      await apiFetch('/api/health', { method: 'GET', timeout: 6000, retries: 0 });
      el.textContent = 'API OK';
      el.className = 'banner ok';
    } catch (e) {
      el.textContent = 'API unreachable';
      el.className = 'banner warn';
      console.warn('[VedSAAS] health check failed:', e.message || e);
    }
    setTimeout(() => { el.textContent = ''; el.className = 'banner'; }, 4000);
  }

  if (document.readyState === 'complete') healthBanner();
  else window.addEventListener('load', healthBanner);
})();
