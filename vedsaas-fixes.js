/* ===== VedSAAS Production Config (HTTPS Safe) ===== */
const $ = (id) => document.getElementById(id);

const API_BASE =
  window.location.origin.includes("vedsaas.com")
    ? "https://api.vedsaas.com"  // ✅ Secure backend endpoint
    : "http://127.0.0.1:8010";   // Dev fallback

let token = localStorage.getItem("token") || null;
function setVedToken(t) {
  token = t;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
}
window.setVedToken = setVedToken;

async function apiFetch(path, opts = {}) {
  const url = /^https?:\/\//i.test(path)
    ? path
    : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(opts.headers || {});
  const hasBody = opts.body !== undefined && opts.body !== null;
  if (hasBody && !(opts.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
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
    let msg = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status}: ${msg || "Server error"}`);
  }

  const ct = resp.headers.get("content-type") || "";
  return ct.includes("application/json") ? resp.json() : resp.text();
}

async function sendChat(text) {
  try {
    renderMessage("user", text);
    const res = await apiFetch("/api/chat", { method: "POST", body: { message: text } });
    renderMessage("assistant", res?.reply || JSON.stringify(res));
    scrollChatBottom(true);
  } catch (e) {
    console.error("Chat error:", e);
    renderMessage("system", "⚠️ Server error. Please try again.");
  }
}

function renderMessage(role, content) {
  const area = $("chat-area"); if (!area) return;
  const wrap = document.createElement("div");
  wrap.className = `msg msg-${role}`;
  wrap.textContent = content;
  area.appendChild(wrap);
}

function scrollChatBottom(smooth) {
  const el = $("chat-area"); if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
}

(function boot() {
  console.log("VedSAAS frontend ✅");
  console.log("VedSAAS API base:", API_BASE);

  const btn = $("landing-start");
  if (btn) btn.onclick = async () => {
    const val = $("landing-input")?.value?.trim();
    if (val) await sendChat(val);
  };
})();
