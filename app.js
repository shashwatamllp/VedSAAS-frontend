// ===== Production config (safe/speedy) =====
const $ = (id) => document.getElementById(id);

// Resolve API base in this order: window flag → <meta> → env → default
const API_BASE =
  (window.__VED_API_BASE || "").replace(/\/$/, "") ||
  (document.querySelector('meta[name="ved-api-base"]')?.content || "").replace(/\/$/, "") ||
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE
    ? String(import.meta.env.VITE_API_BASE).replace(/\/$/, "")
    : (typeof process !== "undefined" && process.env && process.env.VITE_API_BASE
        ? String(process.env.VITE_API_BASE).replace(/\/$/, "")
        : "")) ||
  "https://api.vedsaas.com"; // final fallback

/* ---- token handling ---- */
function getToken() {
  try { return localStorage.getItem("token"); } catch { return null; }
}
function setToken(t) {
  try {
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
  } catch {}
}
function clearToken() { setToken(null); }

let token = getToken();
window.setToken = (t) => { token = t; setToken(t); };
window.clearToken = () => { token = null; clearToken(); };

/* ---- core fetch wrappers ---- */

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

async function _doFetch(url, opts, timeoutMs) {
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(new Error("Request timeout")), timeoutMs || 10000);
  try {
    const resp = await fetch(url, { ...opts, signal: ac.signal, mode: "cors", cache: "no-store" });
    return resp;
  } finally {
    clearTimeout(to);
  }
}

/** Basic fetch with JSON handling + retries on 502/503/504/network */
async function apiFetch(path, options = {}) {
  const url = buildUrl(path);
  const headers = new Headers(options.headers || {});
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const hasBody = options.body !== undefined && options.body !== null;
  const isForm = (typeof FormData !== "undefined") && (options.body instanceof FormData);
  if (hasBody && !isForm && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // auth header
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const opts = {
    method: options.method || "GET",
    headers,
    body: hasBody && !isForm ? JSON.stringify(options.body) : options.body
  };

  const timeoutMs = options.timeoutMs ?? 10000;
  const maxRetries = options.retries ?? 2;

  let lastErr = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const resp = await _doFetch(url, opts, timeoutMs);
      if (!resp.ok) {
        // if unauthorized, bubble up with body
        const text = await resp.text().catch(() => "");
        throw new Error(`HTTP ${resp.status} ${resp.statusText}: ${text || "(no body)"}`);
      }
      const ct = resp.headers.get("content-type") || "";
      return ct.includes("application/json") ? resp.json() : resp.text();
    } catch (e) {
      lastErr = e;
      // retry only on network/5xx
      const msg = String(e?.message || "");
      const transient = /HTTP 50[234]/.test(msg) || /timeout|NetworkError|Failed to fetch/i.test(msg);
      if (attempt < maxRetries && transient) {
        await new Promise(r => setTimeout(r, 300 * Math.pow(2, attempt))); // backoff
        continue;
      }
      throw e;
    }
  }
  throw lastErr || new Error("Request failed");
}

// auth-aware alias (kept for compatibility)
async function authFetch(path, opts = {}, extra = {}) {
  return apiFetch(path, { ...opts, ...(extra || {}) });
}

// Convenience helpers
const VedAPI = {
  API_BASE,
  get: (p, opts) => apiFetch(p, { ...(opts||{}), method: "GET" }),
  post: (p, body, opts) => apiFetch(p, { ...(opts||{}), method: "POST", body }),
  upload: (p, formData, opts) => apiFetch(p, { ...(opts||{}), method: "POST", body: formData }),
  apiFetch,
  authFetch,
  getToken, setToken, clearToken
};
window.VedAPI = VedAPI;

/* ===== Minimal wiring ===== */
(function boot() {
  const landingBtn = $("landing-start");
  if (landingBtn) {
    landingBtn.onclick = async () => {
      const t = $("landing-input")?.value?.trim();
      if (!t) return;
      await sendChat(t);
    };
  }

  const toBottom = $("to-bottom");
  if (toBottom) toBottom.onclick = () => scrollChatBottom(true);

  console.log("VedSAAS API base:", API_BASE);
  console.log("VedSAAS frontend loaded successfully ✅");
})();

/* ===== Chat example ===== */
async function sendChat(text) {
  try {
    const res = await VedAPI.post("/api/chat", { message: text, mode: "default" });
    console.log("chat:", res);
    // TODO: render to UI if needed
  } catch (e) {
    console.error("chat error:", e);
    if (typeof showToast === "function") showToast("Server error. Please try again.");
  }
}

function scrollChatBottom(smooth) {
  const el = $("chat-area");
  if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
}
