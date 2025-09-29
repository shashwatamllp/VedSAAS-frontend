/* ===== VedSAAS Frontend Glue (Production Safe Build) ===== */
const $ = (id) => document.getElementById(id);

// Auto-detect backend API base (default = backend public IP)
const API_BASE =
  (window.__VED_API_BASE || "").replace(/\/$/, "") ||
  (document.querySelector('meta[name="ved-api-base"]')?.content || "").replace(/\/$/, "") ||
  (typeof process !== "undefined" ? (process.env.REACT_APP_API_BASE || "").replace(/\/$/, "") : "") ||
  "http://13.203.176.31"; // <--- Your backend API base

console.log("VedSAAS API base:", API_BASE);

/* ===== Token Handling ===== */
let token = localStorage.getItem("token") || null;
function setToken(t) {
  token = t;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
}
window.setToken = setToken;

/* ===== Core Fetch Wrapper ===== */
async function apiFetch(path, opts = {}) {
  const url = /^https?:\/\//i.test(path)
    ? path
    : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(opts.headers || {});
  const hasBody = opts.body !== undefined && opts.body !== null;

  if (hasBody && !(opts.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  if (token && !headers.has("Authorization"))
    headers.set("Authorization", `Bearer ${token}`);

  const resp = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: hasBody && !(opts.body instanceof FormData)
      ? JSON.stringify(opts.body)
      : opts.body,
    mode: "cors",
    cache: "no-store",
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status} ${resp.statusText}: ${txt || "(no body)"}`);
  }

  const ct = resp.headers.get("content-type") || "";
  return ct.includes("application/json") ? resp.json() : resp.text();
}

/* Auth Wrapper */
async function authFetch(path, opts = {}, extra = {}) {
  return apiFetch(path, { ...opts, ...(extra || {}) });
}

/* ===== Boot UI Events ===== */
(function boot() {
  const landingBtn = $("landing-start");
  if (landingBtn)
    landingBtn.onclick = async () => {
      const t = $("landing-input")?.value?.trim();
      if (!t) return;
      await sendChat(t);
    };

  const toBottom = $("to-bottom");
  if (toBottom) toBottom.onclick = () => scrollChatBottom(true);

  console.log("VedSAAS frontend loaded successfully ✅");
})();

/* ===== Chat ===== */
async function sendChat(text) {
  try {
    renderMessage("user", text);
    const res = await authFetch("/api/chat", {
      method: "POST",
      body: { message: text },
    });
    renderMessage("assistant", res?.reply || JSON.stringify(res));
    scrollChatBottom(true);
  } catch (e) {
    console.error("Chat error:", e);
    renderMessage("system", "⚠️ Server error. Please try again.");
  }
}

/* ===== UI Helpers ===== */
function renderMessage(role, content) {
  const area = $("chat-area");
  if (!area) return;
  const wrap = document.createElement("div");
  wrap.className = `msg msg-${role}`;
  wrap.textContent = content;
  area.appendChild(wrap);

  const landing = $("landing"),
    shell = $("chat-shell");
  if (landing && shell && landing.style.display !== "none") {
    landing.style.display = "none";
    shell.style.display = "flex";
  }
}

function scrollChatBottom(smooth) {
  const el = $("chat-area");
  if (!el) return;
  el.scrollTo({
    top: el.scrollHeight,
    behavior: smooth ? "smooth" : "auto",
  });
}

/* ===== Expose globally ===== */
window.VedAPI = { API_BASE, apiFetch, authFetch, sendChat, setToken };
