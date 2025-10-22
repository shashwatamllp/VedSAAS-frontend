<!-- app.js — drop in -->
<script>
(function () {
  "use strict";

  if (window.__ved_chat_wired) return;
  window.__ved_chat_wired = true;

  var __sending = false;
  function $(id){ return document.getElementById(id); }

  // --------- Config ----------
  var META_BASE = (function(){
    try {
      var m = document.querySelector('meta[name="ved-api-base"]');
      return m ? (m.content || "").trim() : "";
    } catch(_) { return ""; }
  })();
  var API_BASE = (META_BASE || (typeof window !== "undefined" && window.API_BASE) || "")
    .replace(/\/+$/,""); // '' | '/api' | 'https://api.vedsaas.com' | 'https://api.vedsaas.com/api'

  var API_KEY  = (typeof window !== "undefined" && window.__VED_API_KEY) ? String(window.__VED_API_KEY).trim() : "";
  var ALLOW_CLIENT_API_KEY = !!(typeof window !== "undefined" && window.__ALLOW_CLIENT_API_KEY === true);

  // --------- Token helpers ----------
  function getToken(){ try { return localStorage.getItem("token"); } catch { return null; } }
  function setToken(t){ try { t ? localStorage.setItem("token", t) : localStorage.removeItem("token"); } catch {} }
  function clearToken(){ setToken(null); }
  window.setToken = setToken;
  window.clearToken = clearToken;

  // --------- URL helpers ----------
  function ensureApiPath(path){
    if (!path) path = "/";
    if (/^https?:\/\//i.test(path)) return path;
    path = (path[0] === "/") ? path : ("/" + path);

    var base = (typeof API_BASE === "string" ? API_BASE : "");
    var baseIsAbs = /^https?:\/\//i.test(base);
    var baseHasApi = /\/api\/?$/.test(base);

    // Prepend '/api' only when needed:
    // - same-origin (base == '')
    // - absolute base that does NOT already include '/api'
    if ( (base === "" || (baseIsAbs && !baseHasApi)) && !/^\/api\//i.test(path) ) {
      path = "/api" + path;
    }
    return path;
  }
  function buildUrl(path){
    var base = API_BASE || "";
    var url = ensureApiPath(path);
    // Avoid double slashes at join
    if (base && url.startsWith("/") && /^https?:\/\//i.test(base)) return base + url;
    if (base && url.startsWith("/") && base.endsWith("/")) return base.replace(/\/+$/,"") + url;
    return base + url;
  }

  // --------- Fetch helpers ----------
  function doFetch(url, opts, timeoutMs){
    var ac = new AbortController();
    var t  = setTimeout(function(){ ac.abort(new Error("timeout")); }, timeoutMs || 15000);
    var merged = Object.assign({ mode:"cors", cache:"no-store", credentials:"omit", signal: ac.signal }, opts || {});
    return fetch(url, merged).finally(function(){ clearTimeout(t); });
  }

  function isLikelyHTML(ct, textHead){
    if (ct && ct.toLowerCase().includes("text/html")) return true;
    if (!textHead) return false;
    var head = String(textHead).slice(0,200).trim().toLowerCase();
    return head.startsWith("<!doctype") || head.startsWith("<html");
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

    if (ALLOW_CLIENT_API_KEY && API_KEY && !headers.has("X-API-Key")) headers.set("X-API-Key", API_KEY);

    var body = hasBody && !isForm ? JSON.stringify(options.body) : options.body;
    var opts = { method: options.method || "GET", headers: headers, body: body };

    return doFetch(url, opts, options.timeoutMs || 15000).then(function(resp){
      if (!resp.ok) {
        var ct = (resp.headers.get("content-type") || "").toLowerCase();
        if (ct.includes("application/json")) {
          return resp.json().then(function(j){ throw new Error("HTTP " + resp.status + ": " + (j.error || j.message || JSON.stringify(j))); });
        }
        return resp.text().then(function(text){ throw new Error("HTTP " + resp.status + (text?(": "+text):"")); });
      }

      var ctOK = (resp.headers.get("content-type") || "").toLowerCase();
      if (ctOK.includes("application/json")) return resp.json();

      return resp.text().then(function(txt){
        if (isLikelyHTML(ctOK, txt)) {
          var snip = String(txt).slice(0,200).replace(/\s+/g," ").trim();
          throw new Error("API misrouted (got HTML). Fix CloudFront behavior /api/* to EC2. Snip: " + snip);
        }
        return txt;
      });
    });
  }

  window.VedAPI = { API_BASE, apiFetch, getToken, setToken, clearToken };

  // --------- UI helpers ----------
  function autosizeTA(ta){
    if (!ta) return;
    if (window.__ved && typeof window.__ved.autosize === "function") return window.__ved.autosize(ta);
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
    if (typeof content === "string" && /^(\s*<!doctype|\s*<html)/i.test(content)) {
      var pre = document.createElement("pre");
      pre.textContent = content;
      div.appendChild(pre);
    } else {
      div.textContent = content;
    }
    area.appendChild(div);
  }
  function scrollChatBottom(smooth){
    var el = $("chat-area"); if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }

  // --------- Chat send ----------
  function sendChat(text){
    if (!text) return Promise.resolve();
    if (__sending) return Promise.resolve();
    __sending = true;

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

    return apiFetch("/chat", { method:"POST", body:{ message: text, mode:"default" } })
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
        __sending = false;
      });
  }

  // --------- Boot wiring ----------
  window.addEventListener("DOMContentLoaded", function () {
    var app = $("app"); if (app) app.style.display = "block";

    var landingBtn   = $("landing-start");
    var landingInput = $("landing-input");
    if (landingBtn) landingBtn.setAttribute("type", "button");
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

    var mainBtn   = $("send-btn");
    var mainInput = $("main-input");
    if (mainBtn) mainBtn.setAttribute("type", "button");
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

    var toBottom = $("to-bottom");
    if (toBottom) toBottom.onclick = function(){ scrollChatBottom(true); };

    setBanner("warn", "Checking API…");
    apiFetch("/health")
      .then(function(){ var b = $("api-ok-badge"); if (b) b.style.display = "inline-flex"; setBanner("ok","API OK"); })
      .catch(function(){ setBanner("err","API unreachable"); });

    console.log("app.js booted. API_BASE =", API_BASE);
  });

  window.sendChat = sendChat;
  window.scrollChatBottom = scrollChatBottom;
})();
</script>
