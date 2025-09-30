/* ===== VedSAAS Production (final, paste as vedsaas-fixes.js) ===== */
(() => {
  // Helper (unique name, no clash)
  const $id = (id) => document.getElementById(id);

  /* ✅ PRODUCTION: same-origin API
     CloudFront behavior `/api/*` -> backend.
     Isliye API_BASE empty rakho, taaki requests https://www.vedsaas.com/api/... par hi jayein. */
  const API_BASE = "";

  // Token store
  let token = localStorage.getItem("token") || null;
  function setToken(t) {
    token = t;
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
  }
  // expose if needed elsewhere
  window.setToken = setToken;

  // Core fetch
  async function apiFetch(path, opts = {}) {
    const url = /^https?:\/\//i.test(path)
      ? path
      : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;

    const headers = new Headers(opts.headers || {});
    const hasBody = opts.body !== undefined && opts.body !== null;

    // JSON body by default
    if (hasBody && !(opts.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    // Bearer token
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const resp = await fetch(url, {
      method: opts.method || "GET",
      headers,
      body: hasBody && !(opts.body instanceof FormData) ? JSON.stringify(opts.body) : opts.body,
      cache: "no-store",
      credentials: "omit",   // cookies ki zarurat nahi
      mode: "cors",
    });

    if (!resp.ok) {
      let msg = "";
      try { msg = await resp.text(); } catch {}
      throw new Error(`HTTP ${resp.status}: ${msg || "Server error"}`);
    }
    const ct = resp.headers.get("content-type") || "";
    return ct.includes("application/json") ? resp.json() : resp.text();
  }

  // Public alias if needed
  async function authFetch(path, opts = {}, extra = {}) {
    return apiFetch(path, { ...opts, ...(extra || {}) });
  }
  window.authFetch = authFetch;

  // Chat
  async function sendChat(text) {
    try {
      renderMessage("user", text);
      const res = await authFetch("/api/chat", { method: "POST", body: { message: text } });
      // backend usually: { ok:true, text:"..." }
      const reply =
        (res && (res.text || res.reply || res.answer || res.response)) ||
        (typeof res === "string" ? res : "");
      renderMessage("assistant", reply || "");
      scrollChatBottom(true);
    } catch (e) {
      console.error("chat error:", e);
      renderMessage("system", "⚠️ Server error. Please try again.");
    }
  }
  window.sendChat = sendChat;

  // UI helpers
  function renderMessage(role, content) {
    const area = $id("chat-area"); if (!area) return;
    const wrap = document.createElement("div");
    wrap.className = `msg msg-${role}`;
    wrap.textContent = content;
    area.appendChild(wrap);

    const landing = $id("landing"), shell = $id("chat-shell");
    if (landing && shell && landing.style.display !== "none") {
      landing.style.display = "none";
      shell.style.display = "flex";
    }
  }

  function scrollChatBottom(smooth) {
    const el = $id("chat-area"); if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }

  // Boot wiring
  document.addEventListener("DOMContentLoaded", () => {
    console.log("VedSAAS frontend loaded ✅");
    console.log("VedSAAS API base:", API_BASE || "(same-origin)");

    const landingBtn = $id("landing-start");
    if (landingBtn) {
      landingBtn.onclick = async () => {
        const t = $id("landing-input")?.value?.trim();
        if (t) await sendChat(t);
      };
    }

    const sendBtn = $id("send-btn");
    const mainInput = $id("main-input");
    if (mainInput && sendBtn) {
      mainInput.addEventListener("input", () => (sendBtn.disabled = !mainInput.value.trim()));
      sendBtn.addEventListener("click", async () => {
        const text = mainInput.value.trim();
        if (!text) return;
        mainInput.value = "";
        sendBtn.disabled = true;
        await sendChat(text);
        sendBtn.disabled = false;
      });
    }

    const toBottom = $id("to-bottom");
    if (toBottom) toBottom.onclick = () => scrollChatBottom(true);
  });
})();
