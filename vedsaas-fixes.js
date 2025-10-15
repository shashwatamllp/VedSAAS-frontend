/* ===== VedSAAS Production Config (HTTPS Safe) ===== */
"use strict";

const $ = (id) => document.getElementById(id);

// Decide API base
const API_BASE = (() => {
  const h = (window.location.hostname || "").toLowerCase();
  if (h.endsWith("vedsaas.com")) return "https://api.vedsaas.com";
  return "http://127.0.0.1:8012"; // local dev/gunicorn
})();

// TEMP: frontend-injected API key so protected routes work.
// ⚠️ Replace only if you’re okay exposing it client-side.
// Better: inject X-API-Key in nginx/CloudFront and leave this empty.
const API_KEY = (window.location.hostname || "").toLowerCase().endsWith("vedsaas.com")
  ? "" // keep empty if nginx adds the header
  : "";

// Optional bearer (if you later issue JWTs)
let token = localStorage.getItem("token") || null;
function setVedToken(t) {
  token = t || null;
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}
window.setVedToken = setVedToken;

// ----- HTTP helper -----
function niceHttpError(resp, bodyText) {
  const txt = bodyText || "";
  if (resp.status === 403 && /cloudfront|cacheable requests/i.test(txt)) {
    return "Blocked by CDN: request hit static behavior (/api/* must route to api.vedsaas.com origin).";
  }
  if (resp.status === 401) return "Unauthorized";
  return `HTTP ${resp.status}${resp.statusText ? " " + resp.statusText : ""}${txt ? ": " + txt : ""}`;
}

async function apiFetch(path, opts = {}) {
  const url = /^https?:\/\//i.test(path)
    ? path
    : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(opts.headers || {});
  const hasBody = Object.prototype.hasOwnProperty.call(opts, "body");
  const isForm = hasBody && (opts.body instanceof FormData);

  if (hasBody && !isForm && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (API_KEY && !headers.has("X-API-Key")) {
    headers.set("X-API-Key", API_KEY);
  }

  const resp = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: hasBody && !isForm ? JSON.stringify(opts.body) : opts.body,
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

// ----- Chat UI helpers -----
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
  if (!text) return;
  const btn = $("landing-start");
  btn && (btn.disabled = true);

  try {
    renderMessage("user", text);

    const res = await apiFetch("/api/chat", {
      method: "POST",
      body: { msg: text, message: text },
    });

    const reply =
      (res && (res.reply || res.message || res.text)) ||
      (typeof res === "string" ? res : JSON.stringify(res));

    renderMessage("assistant", reply);
    scrollChatBottom(true);
  } catch (e) {
    console.error("Chat error:", e);
    renderMessage("system", "⚠️ " + (e?.message || "Server error"));
  } finally {
    btn && (btn.disabled = false);
  }
}

// ----- Boot -----
(function boot() {
  console.log("VedSAAS frontend ✅");
  console.log("VedSAAS API base:", API_BASE);

  const btn = $("landing-start");
  const ip = $("landing-input");

  if (btn) btn.onclick = async () => {
    const val = ip?.value?.trim();
    if (val) await sendChat(val);
  };
  if (ip) {
    ip.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault();
        btn?.click();
      }
    });
  }

  apiFetch("/api/health")
    .then(() => { const b = $("api-ok-badge"); if (b) b.style.display = "inline-flex"; })
    .catch(() => {});
})();
