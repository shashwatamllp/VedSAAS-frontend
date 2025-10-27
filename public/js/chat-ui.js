// public/js/chat-ui.js
(() => {
  const $ = (id) => document.getElementById(id);

  // ---- API bridge (VED core or fallback) ----
  const VED = (window.VED || {});
  const API_BASE = (VED.apiBase ? VED.apiBase() : ((window.API_BASE || "/api").replace(/\/+$/,"")));
  const API = {
    async get(path, opt={}) {
      if (VED.apiFetch) return VED.apiFetch(path, { method: "GET", ...opt });
      const url = /^https?:\/\//i.test(path) ? path : `${API_BASE}${path.startsWith("/")?path:`/${path}`}`;
      const r = await fetch(url, { method: "GET", cache: "no-store" });
      const ct = (r.headers.get("content-type")||"").toLowerCase();
      const data = ct.includes("application/json") ? await r.json().catch(()=> ({})) : await r.text();
      if (!r.ok) throw new Error((data && data.error) || `HTTP ${r.status}`);
      return data;
    },
    async post(path, body, opt={}) {
      if (VED.apiFetch) return VED.apiFetch(path, { method: "POST", body, ...opt });
      const url = /^https?:\/\//i.test(path) ? path : `${API_BASE}${path.startsWith("/")?path:`/${path}`}`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept":"application/json" },
        body: JSON.stringify(body || {}),
        cache: "no-store"
      });
      const ct = (r.headers.get("content-type")||"").toLowerCase();
      const data = ct.includes("application/json") ? await r.json().catch(()=> ({})) : await r.text();
      if (!r.ok) throw new Error((data && data.error) || `HTTP ${r.status}`);
      return data;
    }
  };

  // ---- UI helpers ----
  function autosizeTA(ta){
    if (!ta) return;
    const fit = () => { ta.style.height = 'auto'; ta.style.height = Math.min(160, ta.scrollHeight) + 'px'; };
    ta.addEventListener('input', fit);
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
    const el = $("chat-area"); if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }

  // ---- Chat send ----
  async function sendChat(text){
    if (!text) return;
    const landing = $("landing"), shell = $("chat-shell");
    if (landing && shell && shell.style.display === "none") { landing.style.display="none"; shell.style.display="flex"; }

    const mainBtn = $("send-btn"); const landBtn = $("landing-start");
    if (mainBtn) mainBtn.disabled = true; if (landBtn) landBtn.disabled = true;

    try {
      renderMessage("user", text); scrollChatBottom(true);
      const res = await API.post("/api/chat", { message: text, mode: "default" });
      const reply = (res && (res.reply || res.answer || res.message || res.text)) ||
                    (typeof res === "string" ? res : JSON.stringify(res || {}));
      renderMessage("assistant", reply || "(empty)"); scrollChatBottom(true);
    } catch (e) {
      console.error("chat error:", e);
      renderMessage("system", "⚠️ " + (e?.message || "Server error. Please try again."));
      setBanner("warn", e?.message || "API error");
    } finally {
      if (mainBtn) mainBtn.disabled = false; if (landBtn) landBtn.disabled = false;
    }
  }
  window.sendChat = sendChat; window.scrollChatBottom = scrollChatBottom;

  // ---- Boot ----
  document.addEventListener("DOMContentLoaded", () => {
    const app = $("app"); if (app) app.style.display = "block";

    const landingBtn = $("landing-start"); const landingInput = $("landing-input");
    if (landingBtn) landingBtn.onclick = async () => {
      const t = landingInput?.value?.trim(); if (!t) return;
      landingInput.value=""; autosizeTA(landingInput); await sendChat(t);
    };
    if (landingInput){
      autosizeTA(landingInput);
      landingInput.addEventListener("keydown", (ev) => {
        if (ev.key==="Enter" && !ev.shiftKey){ ev.preventDefault(); landingBtn?.click(); }
      });
    }

    const mainBtn = $("send-btn"); const mainInput = $("main-input");
    if (mainBtn) mainBtn.onclick = async () => {
      const t = mainInput?.value?.trim(); if (!t) return;
      mainInput.value=""; autosizeTA(mainInput); await sendChat(t);
    };
    if (mainInput){
      autosizeTA(mainInput);
      mainInput.addEventListener("keydown", (ev)=>{
        if (ev.key==="Enter" && !ev.shiftKey){ ev.preventDefault(); mainBtn?.click(); }
      });
    }

    const toBottom = $("to-bottom"); if (toBottom) toBottom.onclick = () => scrollChatBottom(true);

    // Health badge: support both ids
    const badge = $("api-ok-badge") || $("apiBadge");
    setBanner("warn", "Checking API…");
    API.get("/api/health")
      .then((j)=>{ if (badge) badge.style.display="inline-flex"; setBanner("ok", "API OK"); return j; })
      .catch(()=> setBanner("err","API unreachable"));
  });
})();
