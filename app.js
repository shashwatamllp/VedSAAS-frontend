// ===== Production config (safe/speedy) =====
const $ = (id) => document.getElementById(id);

/* --------- Resolve API base (window -> <meta> -> env -> default) --------- */
const API_BASE =
  (window.__VED_API_BASE || "").replace(/\/$/, "") ||
  (document.querySelector('meta[name="ved-api-base"]')?.content || "").replace(/\/$/, "") ||
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE
    ? String(import.meta.env.VITE_API_BASE).replace(/\/$/, "")
    : (typeof process !== "undefined" && process.env && process.env.VITE_API_BASE
        ? String(process.env.VITE_API_BASE).replace(/\/$/, "")
        : "")) ||
  "https://api.vedsaas.com"; // final fallback

/* --------- Optional API key (header: X-API-Key) ---------
   Prefer setting this at Nginx/CloudFront. This is a client-side fallback. */
let API_KEY =
  (window.__VED_API_KEY || "").trim() ||
  (document.querySelector('meta[name="ved-api-key"]')?.content || "").trim() ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_KEY ? String(import.meta.env.VITE_API_KEY).trim() : "") ||
  (typeof process !== "undefined" && process.env?.VITE_API_KEY ? String(process.env.VITE_API_KEY).trim() : "");

/* ---- token handling ---- */
function getToken() { try { return localStorage.getItem("token"); } catch { return null; } }
function setToken(t) { try { t ? localStorage.setItem("token", t) : localStorage.removeItem("token"); } catch {} }
function clearToken() { setToken(null); }

let token = getToken();
window.setToken = (t) => { token = t; setToken(t); };
window.clearToken = () => { token = null; clearToken(); };

/* ---------------- core fetch helpers ---------------- */

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

function isTransientError(e, statusText) {
  const msg = String(e?.message || statusText || "");
  return /HTTP 50[234]/.test(msg) || /timeout|NetworkError|Failed to fetch|TypeError: Failed to fetch/i.test(msg);
}

function mapNiceError(resp, bodyText = "") {
  if (!resp) return "Network error";
  if (resp.status === 403 && /cloudfront|cacheable requests|cdn/i.test(bodyText)) {
    return "Blocked by CDN: /api/* likely routed to static behavior. Fix CloudFront origin path/behavior.";
  }
  if (resp.status === 401) return "Unauthorized";
  if (resp.status === 429) return "Too many requests. Please slow down.";
  if (resp.status >= 500) return "Server error. Please try again.";
  return `HTTP ${resp.status}${resp.statusText ? " " + resp.statusText : ""}${bodyText ? ": " + bodyText : ""}`;
}

async function _doFetch(url, opts, timeoutMs) {
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(new Error("Request timeout")), timeoutMs || 10000);
  try {
    return await fetch(url, { ...opts, signal: ac.signal, mode: "cors", cache: "no-store", credentials: "omit" });
  } finally {
    clearTimeout(to);
  }
}

/** Basic fetch with JSON handling + conservative retries on 502/503/504/timeout.
 *  POST will also retry, but only on clearly transient failures. */
async function apiFetch(path, options = {}) {
  const url = buildUrl(path);
  const headers = new Headers(options.headers || {});
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const hasBody = options.body !== undefined && options.body !== null;
  const isForm = (typeof FormData !== "undefined") && (options.body instanceof FormData);
  if (hasBody && !isForm && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  // Bearer
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  // Optional API key
  if (API_KEY && !headers.has("X-API-Key")) headers.set("X-API-Key", API_KEY);

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
        const text = await resp.text().catch(() => "");
        if (attempt < maxRetries && [502,503,504].includes(resp.status)) {
          await new Promise(r => setTimeout(r, 300 * Math.pow(2, attempt)));
          continue;
        }
        throw new Error(mapNiceError(resp, text));
      }
      const ct = resp.headers.get("content-type") || "";
      return ct.includes("application/json") ? resp.json() : resp.text();
    } catch (e) {
      lastErr = e;
      if (attempt < maxRetries && isTransientError(e)) {
        await new Promise(r => setTimeout(r, 300 * Math.pow(2, attempt)));
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

/* ---------------- Convenience helpers + exports ---------------- */
const VedAPI = {
  API_BASE,
  getToken, setToken, clearToken,
  get apiKey() { return API_KEY; },
  set apiKey(v) { API_KEY = (v || "").trim(); },
  get: (p, opts) => apiFetch(p, { ...(opts||{}), method: "GET" }),
  post: (p, body, opts) => apiFetch(p, { ...(opts||{}), method: "POST", body }),
  upload: (p, formData, opts) => apiFetch(p, { ...(opts||{}), method: "POST", body: formData }),
  apiFetch,
  authFetch,
};
window.VedAPI = VedAPI;

/* ================= UI glue + Chat rendering ================= */

/* --- tiny helpers --- */
function autosizeTA(ta){
  if (!ta) return;
  const fit = () => { ta.style.height = 'auto'; ta.style.height = Math.min(160, ta.scrollHeight) + 'px'; };
  ta.addEventListener('input', fit, { passive:true });
  queueMicrotask(fit);
}
function setBanner(cls, msg){
  const b = $("banner"); if (!b) return;
  b.className = "banner " + cls;
  b.textContent = msg;
}
function renderMessage(role, content){
  const area = $("chat-area"); if (!area) return;
  const div = document.createElement("div");
  div.className = `msg msg-${role}`;
  div.textContent = content;
  area.appendChild(div);
}
function scrollChatBottom(smooth){
  const el = $("chat-area");
  if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
}

/* --- chat send --- */
async function sendChat(text) {
  if (!text) return;

  // switch to chat shell on first send
  const landing = $("landing"), shell = $("chat-shell");
  if (landing && shell && shell.style.display === "none") {
    landing.style.display = "none";
    shell.style.display = "flex";
  }

  const mainBtn = $("send-btn");
  const landBtn = $("landing-start");
  if (mainBtn) mainBtn.disabled = true;
  if (landBtn) landBtn.disabled = true;

  try {
    renderMessage("user", text);
    scrollChatBottom(true);

    const res = await VedAPI.post("/api/chat", { message: text, mode: "default" });
    const reply =
      (res && (res.reply || res.answer || res.message || res.text)) ||
      (typeof res === "string" ? res : JSON.stringify(res));
    renderMessage("assistant", reply || "(empty)");
    scrollChatBottom(true);
  } catch (e) {
    console.error("chat error:", e);
    renderMessage("system", "⚠️ " + (e?.message || "Server error. Please try again."));
    setBanner("warn", e?.message || "API error");
  } finally {
    if (mainBtn) mainBtn.disabled = false;
    if (landBtn) landBtn.disabled = false;
  }
}

/* --- boot wiring --- */
(function boot() {
  // show container (in case CSS hid it before load)
  const app = $("app"); if (app) app.style.display = "block";

  // wire landing composer
  const landingBtn = $("landing-start");
  const landingInput = $("landing-input");
  if (landingBtn) {
    landingBtn.onclick = async () => {
      const t = landingInput?.value?.trim();
      if (!t) return;
      landingInput.value = "";
      autosizeTA(landingInput);
      await sendChat(t);
    };
  }
  if (landingInput) {
    autosizeTA(landingInput);
    landingInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); landingBtn?.click(); }
    });
  }

  // wire main composer
  const mainBtn = $("send-btn");
  const mainInput = $("main-input");
  if (mainBtn) {
    mainBtn.onclick = async () => {
      const t = mainInput?.value?.trim();
      if (!t) return;
      mainInput.value = "";
      autosizeTA(mainInput);
      await sendChat(t);
    };
  }
  if (mainInput) {
    autosizeTA(mainInput);
    mainInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); mainBtn?.click(); }
    });
  }

  // “Latest” button
  const toBottom = $("to-bottom");
  if (toBottom) toBottom.onclick = () => scrollChatBottom(true);

  // Health badge + banner
  setBanner("warn", "Checking API…");
  VedAPI.get("/api/health")
    .then(() => {
      const badge = $("api-ok-badge"); if (badge) badge.style.display = "inline-flex";
      setBanner("ok", "API OK");
    })
    .catch(() => setBanner("err", "API unreachable"));

  // Log boot
  console.log("VedSAAS API base:", API_BASE);
  if (API_KEY) console.log("VedSAAS: using client API key header (X-API-Key)");
  console.log("VedSAAS frontend loaded successfully ✅");
})();

// Keep named exports for reuse
window.sendChat = sendChat;
window.scrollChatBottom = scrollChatBottom;
