/* ===== Production config (safe/speedy) ===== */
const $ = (id) => document.getElementById(id);

// Resolve API base in this order: window flag → <meta> → env → default IP
const API_BASE =
  (window.__VED_API_BASE || "").replace(/\/$/, "") ||
  (document.querySelector('meta[name="ved-api-base"]')?.content || "").replace(/\/$/, "") ||
  (typeof process !== "undefined" ? (process.env.REACT_APP_API_BASE || "").replace(/\/$/, "") : "") ||
  "http://13.203.176.31"; // fallback (replace if needed)

/* ---- token handling ---- */
let token = localStorage.getItem("token") || null;

function setToken(t) {
  token = t;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
}
window.setToken = setToken;

/* ---- core fetch wrappers ---- */
async function apiFetch(path, opts = {}) {
  // allow passing full URL; otherwise prefix with API_BASE
  const url = /^https?:\/\//i.test(path)
    ? path
    : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(opts.headers || {});
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  // JSON body convenience
  const hasBody = opts.body !== undefined && opts.body !== null;
  if (hasBody && !(opts.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // auth
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // simple timeout (10s)
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(new Error("Request timeout")), opts.timeoutMs ?? 10000);

  let resp;
  try {
    resp = await fetch(url, {
      method: opts.method || "GET",
      headers,
      body: hasBody && !(opts.body instanceof FormData) ? JSON.stringify(opts.body) : opts.body,
      mode: "cors",
      cache: "no-store",
      signal: ac.signal,
    });
  } finally {
    clearTimeout(t);
  }

  // throw for non-2xx with useful text/json
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status} ${resp.statusText}: ${txt || "(no body)"}`);
  }

  // try json, fallback text
  const ct = resp.headers.get("content-type") || "";
  return ct.includes("application/json") ? resp.json() : resp.text();
}

// auth-aware wrapper
async function authFetch(path, opts = {}, extra = {}) {
  return apiFetch(path, { ...opts, ...(extra || {}) });
}
window.authFetch = authFetch;

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

  // expose a small helper for other scripts/console
  window.VedAPI = { API_BASE, apiFetch, authFetch, setToken, sendChat };
})();

async function sendChat(text) {
  try {
    const res = await authFetch("/api/chat", { method: "POST", body: { message: text } });
    console.log("chat:", res);
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
