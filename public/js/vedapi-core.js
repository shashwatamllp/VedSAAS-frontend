// public/js/vedapi-core.js
(() => {
  const API_BASE =
    (window.__VED_API_BASE || "").replace(/\/$/, "") ||
    (document.querySelector('meta[name="ved-api-base"]')?.content || "").replace(/\/$/, "") ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE
      ? String(import.meta.env.VITE_API_BASE).replace(/\/$/, "")
      : (typeof process !== "undefined" && process.env?.VITE_API_BASE
          ? String(process.env.VITE_API_BASE).replace(/\/$/, "")
          : "")) ||
    "https://api.vedsaas.com";

  let API_KEY =
    (window.__VED_API_KEY || "").trim() ||
    (document.querySelector('meta[name="ved-api-key"]')?.content || "").trim() ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_KEY ? String(import.meta.env.VITE_API_KEY).trim() : "") ||
    (typeof process !== "undefined" && process.env?.VITE_API_KEY ? String(process.env.VITE_API_KEY).trim() : "");

  function getToken(){ try { return localStorage.getItem("token"); } catch { return null; } }
  function setToken(t){ try { t ? localStorage.setItem("token", t) : localStorage.removeItem("token"); } catch {} }
  function clearToken(){ setToken(null); }

  let token = getToken();
  window.setToken = (t) => { token = t; setToken(t); };
  window.clearToken = () => { token = null; clearToken(); };

  const buildUrl = (path) => /^https?:\/\//i.test(path) ? path : `${API_BASE}${path.startsWith("/") ? path : "/"+path}`;

  const isTransient = (e, statusText) => {
    const msg = String(e?.message || statusText || "");
    return /HTTP 50[234]/.test(msg) || /timeout|NetworkError|Failed to fetch|TypeError: Failed to fetch/i.test(msg);
  };

  const mapErr = (resp, bodyText = "") => {
    if (!resp) return "Network error";
    if (resp.status === 403 && /cloudfront|cacheable requests|cdn/i.test(bodyText)) {
      return "Blocked by CDN: /api/* likely routed to static behavior. Fix CloudFront behavior.";
    }
    if (resp.status === 401) return "Unauthorized";
    if (resp.status === 429) return "Too many requests. Please slow down.";
    if (resp.status >= 500) return "Server error. Please try again.";
    return `HTTP ${resp.status}${resp.statusText ? " " + resp.statusText : ""}${bodyText ? ": " + bodyText : ""}`;
  };

  async function _doFetch(url, opts, timeoutMs){
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(new Error("Request timeout")), timeoutMs || 10000);
    try {
      return await fetch(url, { ...opts, signal: ac.signal, mode:"cors", cache:"no-store", credentials:"omit" });
    } finally { clearTimeout(to); }
  }

  async function apiFetch(path, options = {}){
    const url = buildUrl(path);
    const headers = new Headers(options.headers || {});
    if (!headers.has("Accept")) headers.set("Accept", "application/json");

    const hasBody = options.body !== undefined && options.body !== null;
    const isForm = (typeof FormData !== "undefined") && (options.body instanceof FormData);
    if (hasBody && !isForm && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

    if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    if (API_KEY && !headers.has("X-API-Key")) headers.set("X-API-Key", API_KEY);

    const opts = { method: options.method || "GET", headers, body: hasBody && !isForm ? JSON.stringify(options.body) : options.body };
    const timeoutMs = options.timeoutMs ?? 10000;
    const maxRetries = options.retries ?? 2;

    let lastErr = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const resp = await _doFetch(url, opts, timeoutMs);
        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          if (attempt < maxRetries && [502,503,504].includes(resp.status)) {
            await new Promise(r => setTimeout(r, 300 * Math.pow(2, attempt)));
            continue;
          }
          throw new Error(mapErr(resp, text));
        }
        const ct = resp.headers.get("content-type") || "";
        return ct.includes("application/json") ? resp.json() : resp.text();
      } catch (e) {
        lastErr = e;
        if (attempt < maxRetries && isTransient(e)) {
          await new Promise(r => setTimeout(r, 300 * Math.pow(2, attempt)));
          continue;
        }
        throw e;
      }
    }
    throw lastErr || new Error("Request failed");
  }

  const VedAPI = {
    API_BASE,
    getToken, setToken, clearToken,
    get apiKey(){ return API_KEY; }, set apiKey(v){ API_KEY = (v||"").trim(); },
    get:(p,opts)=>apiFetch(p,{...(opts||{}),method:"GET"}),
    post:(p,body,opts)=>apiFetch(p,{...(opts||{}),method:"POST",body}),
    upload:(p,formData,opts)=>apiFetch(p,{...(opts||{}),method:"POST",body:formData}),
    apiFetch,
    authFetch: (p, opts={}, extra={}) => apiFetch(p, { ...opts, ...(extra||{}) }),
  };
  window.VedAPI = VedAPI;

  // Optional boot health ping for quick badge
  document.addEventListener("DOMContentLoaded", () => {
    const badge = document.getElementById("api-ok-badge");
    if (badge) {
      VedAPI.get("/api/health").then(() => badge.style.display = "inline-flex").catch(() => {});
    }
    console.log("VedSAAS API base:", API_BASE);
  });
})();
