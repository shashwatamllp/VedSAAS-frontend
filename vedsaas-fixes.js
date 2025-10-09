/* ===== VedSAAS Production Config (HTTPS Safe) ===== */
"use strict";

const $ = (id) => document.getElementById(id);

// Decide API base: prod → https://api.vedsaas.com, else local dev
const API_BASE = (() => {
  const h = window.location.hostname;
  if (h.endsWith("vedsaas.com")) return "https://api.vedsaas.com";
  // prefer 8012 (your gunicorn bind); change to 8010 if your local proxy expects it
  return "http://127.0.0.1:8012";
})();

let token = localStorage.getItem("token") || null;

function setVedToken(t) {
  token = t || null;
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}
window.setVedToken = setVedToken;

async function apiFetch(path, opts = {}) {
  // Build absolute URL
  const url = /^https?:\/\//i.test(path)
    ? path
    : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  // Headers/body handling
  const headers = new Headers(opts.headers || {});
  const hasBody = Object.prototype.hasOwnProperty.call(opts, "body");
  const isFormData = hasBody && opts.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
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
    let msg = "";
    try { msg = await resp.text(); } catch {}
    throw new Error(`HTTP ${resp.status}${msg ? `: ${msg}` : ""}`);
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
    renderMessage("user", text);
    const res = await apiFetch("/api/chat", {
      method: "POST",
      body: { message: text },
    });
    renderMessage("assistant", (res && res.reply) || JSON.stringify(res));
    scrollChatBottom(true);
  } catch (e) {
    console.error("Chat error:", e);
    renderMessage("system", "⚠️ Server error. Please try again.");
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

  // Optional: show a tiny “API OK” badge if health works
  apiFetch("/api/health")
    .then(() => { const b = $("api-ok-badge"); if (b) b.style.display = "inline-flex"; })
    .catch(() => {});
})();
