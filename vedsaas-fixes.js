/* ===== VedSAAS production wiring (API + minimal UI glue) ===== */
const $ = (id) => document.getElementById(id);

/* -------- API base resolution (PROD: same-origin by default) -------- */
const API_BASE = (() => {
  const explicit =
    (window.__VED_API_BASE || "") ||
    (document.querySelector('meta[name="ved-api-base"]')?.content || "") ||
    (typeof process !== "undefined" ? (process.env.REACT_APP_API_BASE || "") : "");
  // In prod we want same-origin unless explicitly set:
  return explicit.replace(/\/$/, ""); // "" means same-origin
})();

/* -------- token handling -------- */
let token = localStorage.getItem("token") || null;
window.setVedToken = function setVedToken(t){
  token = t;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
};

/* -------- core fetch wrapper -------- */
async function apiFetch(path, opts = {}) {
  // allow absolute URLs; otherwise prefix with API_BASE (may be "")
  const url = /^https?:\/\//i.test(path)
    ? path
    : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(opts.headers || {});
  const hasBody = opts.body !== undefined && opts.body !== null;

  if (hasBody && !(opts.body instanceof FormData)) {
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);

  const resp = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body: hasBody && !(opts.body instanceof FormData) ? JSON.stringify(opts.body) : opts.body,
    mode: "cors",
    cache: "no-store",
  });

  if (!resp.ok) {
    let text = "";
    try { text = await resp.text(); } catch {}
    throw new Error(`HTTP ${resp.status} ${resp.statusText}: ${text || "(no body)"}`);
  }
  const ct = resp.headers.get("content-type") || "";
  return ct.includes("application/json") ? resp.json() : resp.text();
}

/* auth-aware wrapper (kept for future extensions) */
async function authFetch(path, opts = {}, extra = {}) {
  return apiFetch(path, { ...opts, ...(extra || {}) });
}

/* -------- minimal UI glue -------- */
(function boot(){
  console.log("VedSAAS API base:", API_BASE || "(same-origin)");

  const landingBtn = $("landing-start");
  if (landingBtn) landingBtn.onclick = async () => {
    const t = $("landing-input")?.value?.trim(); if (!t) return;
    await sendChat(t);
  };

  const toBottom = $("to-bottom");
  if (toBottom) toBottom.onclick = () => scrollChatBottom(true);

  // enable main composer when chat shell is shown (optional)
  const sendBtn = $("send-btn");
  const mainInput = $("main-input");
  if (mainInput && sendBtn) {
    mainInput.addEventListener("input", () => sendBtn.disabled = !mainInput.value.trim());
    sendBtn.addEventListener("click", async () => {
      const text = mainInput.value.trim(); if (!text) return;
      mainInput.value = ""; sendBtn.disabled = true;
      await sendChat(text);
    });
  }
})();

/* -------- chat call -------- */
async function sendChat(text){
  try {
    renderMessage("user", text);
    const res = await authFetch("/api/chat", { method:"POST", body:{ message:text } });
    renderMessage("assistant", res?.reply || JSON.stringify(res));
    scrollChatBottom(true);
  } catch (e) {
    console.error(e);
    renderMessage("system", "Server error. Please try again.");
  }
}

/* -------- tiny render helpers (non-intrusive) -------- */
function renderMessage(role, content){
  const area = $("chat-area"); if (!area) return;
  const wrap = document.createElement("div");
  wrap.className = `msg msg-${role}`;
  wrap.textContent = content;
  area.appendChild(wrap);

  // switch shells first time
  const landing = $("landing"), shell = $("chat-shell");
  if (landing && shell && landing.style.display !== "none"){
    landing.style.display = "none";
    shell.style.display = "flex";
  }
}

function scrollChatBottom(smooth){
  const el = $("chat-area"); if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
}

/* expose for app.js if needed */
window.VedAPI = { API_BASE, apiFetch, authFetch, sendChat, setVedToken: window.setVedToken };
