/* app.js — classic script (no modules, no import.meta) */
(function () {
  "use strict";

  // --------- DOM helper ----------
  function $(id){ return document.getElementById(id); }

  // --------- Config (API base resolution) ----------
  // Prefer single-origin: https://vedsaas.com (CloudFront routes /api/* to backend)
  var META_BASE = (function(){
    try { var m = document.querySelector('meta[name="ved-api-base"]'); return m ? (m.content||"").trim() : ""; } catch(_) { return ""; }
  })();
  var API_BASE = META_BASE || (typeof window !== "undefined" && window.API_BASE) || "https://vedsaas.com";

  // For rare cases you want to hit api subdomain directly, set meta:
  // <meta name="ved-api-base" content="https://api.vedsaas.com">

  // Client-side API key sending is OFF by default for security.
  // If you really want to allow it (temporary), set window.__ALLOW_CLIENT_API_KEY = true before app.js loads.
  var API_KEY  = (typeof window !== "undefined" && window.__VED_API_KEY) ? String(window.__VED_API_KEY).trim() : "";
  var ALLOW_CLIENT_API_KEY = !!(typeof window !== "undefined" && window.__ALLOW_CLIENT_API_KEY === true);

  // --------- Token helpers ----------
  function getToken(){ try { return localStorage.getItem("token"); } catch { return null; } }
  function setToken(t){ try { t ? localStorage.setItem("token", t) : localStorage.removeItem("token"); } catch {} }
  function clearToken(){ setToken(null); }
  window.setToken = function(t){ setToken(t); };
  window.clearToken = function(){ clearToken(); };

  // --------- URL helpers ----------
  function ensureApiPath(path){
    // If absolute URL, return as-is
    if (/^https?:\/\//i.test(path)) return path;
    // Ensure leading slash
    path = (path[0] === "/") ? path : ("/" + path);
    // Force /api/ prefix
    if (!path.startsWith("/api/")) path = "/api" + path;
    return path;
  }
  function buildUrl(path){
    return API_BASE.replace(/\/+$/,"") + ensureApiPath(path);
  }

  // --------- Fetch helpers ----------
  function doFetch(url, opts, timeoutMs){
    var ac = new AbortController();
    var t  = setTimeout(function(){ ac.abort(new Error("timeout")); }, timeoutMs || 10000);
    var merged = Object.assign({ mode:"cors", cache:"no-store", credentials:"omit", signal: ac.signal }, opts || {});
    return fetch(url, merged).finally(function(){ clearTimeout(t); });
  }

  function apiFetch(path, options){
    options = options || {};
    var url = buildUrl(path);

    var headers = new Headers(options.headers || {});
    if (!headers.has("Accept")) headers.set("Accept","application/json");

    var hasBody = options.body !== undefined && options.body !== null;
    var isForm  = (typeof FormData !== "undefined") && (options.body instanceof FormData);
    if (hasBody && !isForm && !headers.has("Content-Type")) headers.set("Content-Type","application/json");

    var tok = getToken();
    if (tok && !headers.has("Authorization")) headers.set("Authorization", "Bearer " + tok);

    // DO NOT send API key from browser unless explicitly allowed
    if (ALLOW_CLIENT_API_KEY && API_KEY && !headers.has("X-API-Key")) {
      headers.set("X-API-Key", API_KEY);
    }

    var body = hasBody && !isForm ? JSON.stringify(options.body) : options.body;
    var opts = { method: options.method || "GET", headers: headers, body: body };

    return doFetch(url, opts, options.timeoutMs || 10000).then(function(resp){
      if (!resp.ok) {
        return resp.text().then(function(text){ throw new Error("HTTP " + resp.status + (text?(": "+text):"")); });
      }
      var ct = (resp.headers.get("content-type") || "").toLowerCase();

      // Guard: if CloudFront misroutes to S3/static, you'll get HTML here
      if (ct.includes("text/html")) {
        return resp.text().then(function(html){
          var snip = html.slice(0,160).replace(/\s+/g,' ').trim();
          throw new Error("API misrouted (got HTML). Check CloudFront /api/* behavior & app.js paths. Snip: " + snip);
        });
      }
      return ct.includes("application/json") ? resp.json() : resp.text();
    });
  }

  // Public surface (optional)
  window.VedAPI = {
    API_BASE: API_BASE,
    apiFetch: apiFetch,
    getToken: getToken, setToken: setToken, clearToken: clearToken
  };

  // --------- UI helpers ----------
  function autosizeTA(ta){
    if (!ta) return;
    if (window.__ved && typeof window.__ved.autosize === "function") return window.__ved.autosize(ta);
    // fallback
    var fit = function(){ ta.style.height = "auto"; ta.style.height = Math.min(160, ta.scrollHeight) + "px"; };
    ta.addEventListener("input", fit, { passive:true });
    setTimeout(fit, 0);
  }
  function setBanner(cls, msg){
    var b = $("banner"); if (!b) return;
    b.className = "banner " + cls;
    b.textContent = msg;
  }
  function renderMessage(role, content){
    var area = $("chat-area"); if (!area) return;
    var div = document.createElement("div");
    div.className = "msg msg-" + role;
    div.textContent = content;
    area.appendChild(div);
  }
  function scrollChatBottom(smooth){
    var el = $("chat-area"); if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }

  // --------- Chat send ----------
  function sendChat(text){
    if (!text) return Promise.resolve();

    var landing = $("landing"), shell = $("chat-shell");
    if (landing && shell && shell.style.display === "none"){
      landing.style.display = "none";
      shell.style.display = "flex";
    }

    var mainBtn = $("send-btn");
    var landBtn = $("landing-start");
    if (mainBtn) mainBtn.disabled = true;
    if (landBtn) landBtn.disabled = true;

    renderMessage("user", text); scrollChatBottom(true);

    return apiFetch("/chat", { method:"POST", body:{ message: text, mode:"default" } }) // <-- "/chat" becomes "/api/chat"
      .then(function(res){
        var reply = (res && (res.reply || res.answer || res.message || res.text)) ||
                    (typeof res === "string" ? res : JSON.stringify(res));
        renderMessage("assistant", reply || "(empty)");
        scrollChatBottom(true);
      })
      .catch(function(e){
        console.error("chat error:", e);
        renderMessage("system", "⚠️ " + (e && e.message ? e.message : "Server error. Please try again."));
        setBanner("warn", (e && e.message) || "API error");
      })
      .finally(function(){
        if (mainBtn) mainBtn.disabled = false;
        if (landBtn) landBtn.disabled = false;
      });
  }

  // --------- Boot wiring ----------
  window.addEventListener("DOMContentLoaded", function () {
    var app = $("app"); if (app) app.style.display = "block";

    // landing
    var landingBtn   = $("landing-start");
    var landingInput = $("landing-input");
    if (landingInput) autosizeTA(landingInput);
    if (landingBtn && landingInput){
      landingBtn.onclick = function(){
        var t = (landingInput.value || "").trim();
        if (!t) return;
        landingInput.value = "";
        autosizeTA(landingInput);
        sendChat(t);
      };
      landingInput.addEventListener("keydown", function(ev){
        if (ev.key === "Enter" && !ev.shiftKey){ ev.preventDefault(); landingBtn.click(); }
      });
    }

    // main composer
    var mainBtn   = $("send-btn");
    var mainInput = $("main-input");
    if (mainInput) autosizeTA(mainInput);
    if (mainBtn && mainInput){
      mainBtn.disabled = false;
      mainBtn.onclick = function(){
        var t = (mainInput.value || "").trim();
        if (!t) return;
        mainInput.value = "";
        autosizeTA(mainInput);
        sendChat(t);
      };
      mainInput.addEventListener("keydown", function(ev){
        if (ev.key === "Enter" && !ev.shiftKey){ ev.preventDefault(); mainBtn.click(); }
      });
    }

    // “Latest”
    var toBottom = $("to-bottom");
    if (toBottom) toBottom.onclick = function(){ scrollChatBottom(true); };

    // Health banner (soft)
    setBanner("warn", "Checking API…");
    apiFetch("/health")
      .then(function(){ var b = $("api-ok-badge"); if (b) b.style.display = "inline-flex"; setBanner("ok","API OK"); })
      .catch(function(){ setBanner("err","API unreachable"); });

    console.log("app.js booted. API_BASE =", API_BASE);
  });

  // expose for console
  window.sendChat = sendChat;
  window.scrollChatBottom = scrollChatBottom;
})();
