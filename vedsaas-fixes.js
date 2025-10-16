/* vedsaas-fixes.js — classic script (no modules, no import.meta) */
(function () {
  "use strict";

  // Resolve API base safely (window -> <meta> -> domain -> default)
  var meta = document.querySelector('meta[name="ved-api-base"]');
  var metaBase = meta && meta.content ? meta.content : "";
  var h = (location.hostname || "").toLowerCase();
  var origin = location.origin || "";

  var fromWindow = (typeof window !== "undefined" && window.__VED_API_BASE)
    ? String(window.__VED_API_BASE) : "";

  var API_BASE =
    (fromWindow || "").replace(/\/$/, "") ||
    (metaBase   || "").replace(/\/$/, "") ||
    (h.endsWith("vedsaas.com")
      ? (h === "api.vedsaas.com" ? origin : "https://api.vedsaas.com")
      : /:(8010|8011|8012)\b/.test(origin) ? origin : "https://api.vedsaas.com");

  // Export globally for app.js
  window.API_BASE = API_BASE;

  // tiny util (scoped)
  function $(id){ return document.getElementById(id); }

  // Health badge (best-effort; never throws during parse)
  function doFetch(url, timeoutMs){
    var ac = new AbortController();
    var t  = setTimeout(function(){ ac.abort(new Error("timeout")); }, timeoutMs || 6000);
    return fetch(url, { mode:"cors", cache:"no-store", credentials:"omit", signal: ac.signal })
      .finally(function(){ clearTimeout(t); });
  }

  doFetch(API_BASE + "/api/health", 8000)
    .then(function(r){
      if (r && r.ok){
        var b = $("api-ok-badge"); if (b) b.style.display = "inline-flex";
        var banner = $("banner"); if (banner){ banner.className = "banner ok"; banner.textContent = "API OK"; }
      } else {
        var banner = $("banner"); if (banner){ banner.className = "banner err"; banner.textContent = "API unreachable"; }
      }
    })
    .catch(function(){
      var banner = $("banner"); if (banner){ banner.className = "banner err"; banner.textContent = "API unreachable"; }
    });

  // Optional autosize util for app.js
  window.__ved = window.__ved || {};
  window.__ved.autosize = function (ta){
    if (!ta) return;
    var fit = function () { ta.style.height = "auto"; ta.style.height = Math.min(160, ta.scrollHeight) + "px"; };
    ta.addEventListener("input", fit, { passive:true });
    setTimeout(fit, 0);
  };

  console.log("vedsaas-fixes.js loaded. API_BASE =", API_BASE);
})();
