<!-- vedsaas-fixes.js (UPDATED, ready to paste) -->
<script>
/* ===== VedSAAS Production Config (HTTPS Safe) ===== */
"use strict";

const $ = (id) => document.getElementById(id);

// Decide API base
const API_BASE = (() => {
  const h = window.location.hostname.toLowerCase();
  if (h.endsWith("vedsaas.com")) return "https://api.vedsaas.com";
  // prefer 8012 (gunicorn bind)
  return "http://127.0.0.1:8012";
})();

// ⚠️ TEMP: frontend-injected API key so protected routes (e.g., /api/chat) work.
// Replace with your real key. Prefer moving this to Nginx (proxy_set_header X-API-Key "...").
const API_KEY =
  window.location.hostname.toLowerCase().endsWith("vedsaas.com")
    ? "SUPER_LONG_RANDOM_KEY" // <-- put your real VED_API_KEY here
    : ""; // local may not need it if backend unset

let token = localStorage.getItem("token") || null;
function setVedToken(t) {
  token = t || null;
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}
window.setVedToken = setVedToken;

function niceHttpError(resp, bodyText) {
  if (resp.status === 403 && /cloudfront|cacheable requests/i.test(bodyText || "")) {
    return "Blocked by CDN: request hit static behavior. Check CloudFront /api/* behavior.";
  }
  if (resp.status === 401) return "Unauthorized";
  return `HTTP ${resp.status}${resp.statusText ? " " + resp.statusText : ""}${bodyText ? ": " + bodyText : ""}`;
}

async function apiFetch(path, opts = {}) {
  // Absolute URL
  const url = /^https?:\/\//i.test(path)
    ? path
    : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(opts.headers || {});
  const hasBody = Object.prototype.hasOwnProperty.call(opts, "body");
  const isFormData = hasBody && opts.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  // 👉 add API key for protected routes
  if (API_KEY && !headers.has("X-API-Key")) {
    headers.set("X-API-Key", API_KEY);
  }

  const resp = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: hasBody && !isFormData ? JSON.stringify(opts.body) : opts.body,
    mode: "cors",
    cache: "no-store",
    credentials: "omit",
  });

  if (!resp.ok) {
    let txt = "";
    try { txt = await resp.text(); } catch {}
    throw new Error(niceHttpError(resp, txt));
  }

  const ct = resp.headers.get("content-type") || "";
  return ct.includes("application/json") ? resp.json() : resp.text();
}

// --- Chat helpers -----------------------------------------------------------
function renderMessage(role, content) {
  const area = $("chat-area");
  if (!area) return;
  const wrap = document.createElement("div");
  wrap.className = `msg msg-${role}`;
  wrap.textContent = content;
  area.appendChild(wrap);
}

function scrollChatBottom(smooth) {
  const el = $("chat-area");
  if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
}

async function sendChat(text) {
  try {
    if (!text) return;
    renderMessage("user", text);

    const res = await apiFetch("/api/chat", {
      method: "POST",
      // send both fields for compatibility
      body: { msg: text, message: text },
    });

    const reply =
      (res && (res.reply || res.message || res.text)) ||
      (typeof res === "string" ? res : JSON.stringify(res));

    renderMessage("assistant", reply);
    scrollChatBottom(true);
  } catch (e) {
    console.error("Chat error:", e);
    const msg = (e && e.message) || "Server error";
    renderMessage("system", "⚠️ " + msg);
  }
}

// --- Boot -------------------------------------------------------------------
(function boot() {
  console.log("VedSAAS frontend ✅");
  console.log("VedSAAS API base:", API_BASE);

  const btn = $("landing-start");
  if (btn) btn.onclick = async () => {
    const val = $("landing-input")?.value?.trim();
    if (val) await sendChat(val);
  };

  // Health badge
  apiFetch("/api/health")
    .then(() => { const b = $("api-ok-badge"); if (b) b.style.display = "inline-flex"; })
    .catch(() => {});
})();
</script>
