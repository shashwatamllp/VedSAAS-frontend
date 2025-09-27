/* vedsaas-fixes.js — shared helpers for all pages */
(function () {
  function trimEndSlash(s){ return (s||'').replace(/\/+$/, ''); }
  function resolveApiBase() {
    if (typeof window.API_BASE === 'string' && window.API_BASE) return trimEndSlash(window.API_BASE);
    const meta = document.querySelector('meta[name="api-base"]');
    if (meta && meta.content) return trimEndSlash(meta.content);
    return ''; // same-origin (expects /api/* reverse-proxied)
  }
  let API_BASE = resolveApiBase();

  function joinUrl(base, path){
    if(!base) return path || '';
    if(!path) return base;
    if (base.endsWith('/') && path.startsWith('/')) return base + path.slice(1);
    if (!base.endsWith('/') && !path.startsWith('/')) return base + '/' + path;
    return base + path;
  }

  async function apiFetch(path, opts = {}) {
    const url = joinUrl(API_BASE, path);
    const controller = new AbortController();
    const timeoutMs = typeof opts.timeout === 'number' ? opts.timeout : 25000;
    const retries = typeof opts.retries === 'number' ? opts.retries : 2;

    const init = { ...opts };
    delete init.timeout; delete init.retries;

    init.headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (init.body && typeof init.body === 'object' && !(init.body instanceof FormData)) {
      try { init.body = JSON.stringify(init.body); } catch {}
    }
    init.signal = controller.signal;

    let attempt = 0, lastErr;
    while (attempt <= retries) {
      const t = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, init);
        clearTimeout(t);
        if (res.ok) {
          const ct = (res.headers.get('content-type') || '').toLowerCase();
          if (ct.includes('application/json')) return await res.json();
          try { return await res.json(); } catch { return await res.text(); }
        }
        if ((res.status >= 500 && res.status <= 599) || res.status === 429) {
          lastErr = new Error(`API ${res.status}: ${res.statusText}`);
        } else {
          const body = await res.text().catch(()=>'');
          throw new Error(`API ${res.status}: ${body || res.statusText}`);
        }
      } catch (e) {
        lastErr = e;
      }
      attempt++;
      if (attempt <= retries) await new Promise(r => setTimeout(r, 300 + (attempt-1)*400));
    }
    throw lastErr || new Error('API request failed');
  }

  async function healthBanner() {
    const el = document.getElementById('banner'); if (!el) return;
    try { await apiFetch('/api/health', { method: 'GET', retries: 0, timeout: 6000 }); el.textContent='API OK'; el.className='banner ok'; }
    catch (e) { el.textContent='API unreachable'; el.className='banner warn'; console.warn('[VedSAAS] health:', e.message||e); }
    setTimeout(() => { el.textContent=''; el.className='banner'; }, 4000);
  }
  if (document.readyState === 'complete') healthBanner();
  else window.addEventListener('load', healthBanner);

  // expose
  window.VedSaas = {
    getApiBase: () => API_BASE,
    setApiBase: (b) => { API_BASE = trimEndSlash(b||''); },
    apiFetch,
  };
  window.apiFetch = apiFetch; // convenience
})();
