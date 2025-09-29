/* ===== VedSAAS Production Config (Stable Release) ===== */

// ---- Helper for quick element access ----
const $ = (id) => document.getElementById(id);

// ---- API Base Resolution ----
const API_BASE =
  (window.__VED_API_BASE || "").replace(/\/$/, "") ||
  (document.querySelector('meta[name="ved-api-base"]')?.content || "").replace(/\/$/, "") ||
  (typeof process !== "undefined" ? (process.env.REACT_APP_API_BASE || "").replace(/\/$/, "") : "") ||
  "http://13.203.176.31"; // ✅ fallback (EC2 public IP or API Gateway)

// ---- Token Handling ----
let token = localStorage.getItem("token") || null;

function setVedToken(t) {
  token = t;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
}
window.setVedToken = setVedToken;

// ---- Core Fetch Wrapper ----
async function apiFetch(path, opts = {}) {
  // Build full URL
  const url = /^https?:\/\//i.test(path)
    ? path
    : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(opts.headers || {});
  const hasBody = opts.body !== undefined && opts.body !== null;

  if (hasBody && !(opts.body instanceof FormData)) {
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const resp = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: hasBody && !(opts.body instanceof FormData) ? JSON.stringify(opts.body) : opts.body,
    mode: "cors",
    cache: "no-store",
  });

  if (!resp.ok) {
    let msg = "";
    try { msg = await resp.text(); } catch {}
    throw new Error(`HTTP ${resp.status}: ${msg || "Server error"}`);
  }

  const ct = resp.headers.get("content-type") || "";
  return ct.includes("application/json") ? resp.json() : resp.text();
}

// ---- Auth Fetch (alias) ----
async function authFetch(path, opts = {}, extra = {}) {
  return apiFetch(path, { ...opts, ...(extra || {}) });
}

// ---- Send Chat ----
async function sendChat(text) {
  try {
    renderMessage("user", text);
    const res = await authFetch("/api/chat", { method: "POST", body: { message: text } });
    renderMessage("assistant", res?.reply || JSON.stringify(res));
    scrollChatBottom(true);
  } catch (e) {
    console.error("Chat error:", e);
    renderMessage("system", "⚠️ Server error. Please try again.");
  }
}

// ---- Render Chat Messages ----
function renderMessage(role, content) {
  const area = $("chat-area"); if (!area) return;
  const wrap = document.createElement("div");
  wrap.className = `msg msg-${role}`;
  wrap.textContent = content;
  area.appendChild(wrap);

  const landing = $("landing"), shell = $("chat-shell");
  if (landing && shell && landing.style.display !== "none") {
    landing.style.display = "none";
    shell.style.display = "flex";
  }
}

// ---- Scroll Helper ----
function scrollChatBottom(smooth) {
  const el = $("chat-area"); if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
}

// ---- Init ----
(function boot() {
  console.log("VedSAAS frontend loaded ✅");
  console.log("VedSAAS API base:", API_BASE || "(same-origin)");

  const landingBtn = $("landing-start");
  if (landingBtn) {
    landingBtn.onclick = async () => {
      const t = $("landing-input")?.value?.trim();
      if (t) await sendChat(t);
    };
  }

  const sendBtn = $("send-btn");
  const mainInput = $("main-input");
  if (mainInput && sendBtn) {
    mainInput.addEventListener("input", () => sendBtn.disabled = !mainInput.value.trim());
    sendBtn.addEventListener("click", async () => {
      const text = mainInput.value.trim();
      if (!text) return;
      mainInput.value = "";
      sendBtn.disabled = true;
      await sendChat(text);
    });
  }

  const toBottom = $("to-bottom");
  if (toBottom) toBottom.onclick = () => scrollChatBottom(true);
})();
