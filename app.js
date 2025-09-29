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
export function setToken(t) { token = t; t ? localStorage.setItem("token", t) : localStorage.removeItem("token"); }

/* ---- core fetch wrappers ---- */
async function apiFetch(path, opts = {}) {
  // allow passing full URL; otherwise prefix with API_BASE
  const url = /^https?:\/\//i.test(path) ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = new Headers(opts.headers || {});
  // JSON body convenience
  const hasBody = opts.body !== undefined && opts.body !== null;
  if (hasBody && !(opts.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  // auth
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const resp = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: hasBody && !(opts.body instanceof FormData) ? JSON.stringify(opts.body) : opts.body,
    // keep CORS simple; cookies not required with Bearer
    mode: "cors",
    cache: "no-store",
  });

  // throw for non-2xx with useful text/json
  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status} ${resp.statusText}: ${txt || "(no body)"}`);
  }
  // try json, fallback text
  const ct = resp.headers.get("content-type") || "";
  return ct.includes("application/json") ? resp.json() : resp.text();
}

// auth-aware wrapper (kept for your code)
async function authFetch(path, opts = {}, extra = {}) {
  const merged = { ...opts, ...(extra || {}) };
  return apiFetch(path, merged);
}

/* ===== Minimal wiring ===== */
(function boot() {
  const landingBtn = $("landing-start");
  if (landingBtn) landingBtn.onclick = async () => {
    const t = $("landing-input")?.value?.trim(); if (!t) return;
    await sendChat(t);
  };
  const toBottom = $("to-bottom");
  if (toBottom) toBottom.onclick = () => scrollChatBottom(true);
  console.log("VedSAAS API base:", API_BASE);
})();

async function sendChat(text) {
  try {
    const res = await authFetch("/api/chat", { method: "POST", body: { message: text } });
    // TODO: render in your chat UI
    console.log("chat:", res);
  } catch (e) {
    console.error("chat error:", e);
    showToast?.("Server error. Please try again.");
  }
}

function scrollChatBottom(smooth) {
  const el = $("chat-area"); if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
}
