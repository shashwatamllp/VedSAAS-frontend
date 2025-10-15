<script>
(function () {
  "use strict";

  /* ---------- API base resolution ---------- */
  const META_BASE = document.querySelector('meta[name="ved-api-base"]')?.content || "";
  const H = (location.hostname || "").toLowerCase();
  const ORIGIN = location.origin || "";

  const API_BASE =
    (window.__VED_API_BASE || "").replace(/\/$/, "") ||
    META_BASE.replace(/\/$/, "") ||
    (H.endsWith("vedsaas.com")
      ? (H === "api.vedsaas.com" ? ORIGIN : "https://api.vedsaas.com")
      : /:(8010|8011|8012)\b/.test(ORIGIN) ? ORIGIN : "https://api.vedsaas.com");

  /* ---------- Optional API key (prefer adding at Nginx) ---------- */
  const API_KEY = (window.__VED_API_KEY || "").trim();

  /* ---------- Token helpers ---------- */
  function getToken() { try { return localStorage.getItem("token"); } catch { return null; } }
  function setToken(t) { try { t ? localStorage.setItem("token", t) : localStorage.removeItem("token"); } catch {} }
  function clearToken() { setToken(null); }

  /* ---------- Low-level fetch with timeout + retries ---------- */
  function buildUrl(path) {
    if (/^https?:\/\//i.test(path)) return path;
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE}${p}`;
  }

  function friendlyError(resp, bodyText = "") {
    // Common CF/S3 misroutes show as 403; surface a clearer hint
    if (resp?.status === 403 && /cloudfront|cacheable|accessdenied|<Error>/i.test(bodyText)) {
      return "CDN blocked or origin misrouted (check CloudFront behavior and S3 permissions).";
    }
    if (resp?.status === 401) return "Unauthorized";
    return `HTTP ${resp?.status || "ERR"}${resp?.statusText ? " " + resp.statusText : ""}${bodyText ? ": " + bodyText : ""}`;
  }

  async function postJSON(path, body, { timeoutMs = 10000, retries = 2, bearer = getToken() } = {}) {
    const url = buildUrl(path);
    const headers = new Headers({ Accept: "application/json", "Content-Type": "application/json" });
    if (API_KEY) headers.set("X-API-Key", API_KEY);
    if (bearer && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${bearer}`);

    const payload = JSON.stringify(body || {});
    let lastErr;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const ac = new AbortController();
      const to = setTimeout(() => ac.abort(new Error("timeout")), timeoutMs);
      try {
        const resp = await fetch(url, {
          method: "POST",
          headers,
          body: payload,
          mode: "cors",
          cache: "no-store",
          credentials: "omit",
          signal: ac.signal
        });
        clearTimeout(to);

        const ct = resp.headers.get("content-type") || "";
        const text = await resp.text().catch(() => "");
        const json = ct.includes("application/json") ? (text ? JSON.parse(text) : {}) : null;

        if (!resp.ok) {
          const msg = friendlyError(resp, text.slice(0, 300));
          throw Object.assign(new Error(json?.error || msg), { resp, body: json ?? text });
        }
        return json ?? {};
      } catch (e) {
        clearTimeout(to);
        lastErr = e;
        const msg = String(e?.message || "");
        const transient = /timeout|NetworkError|Failed to fetch/i.test(msg) || /HTTP 50[234]/i.test(msg);
        if (attempt < retries && transient) {
          await new Promise(r => setTimeout(r, 300 * Math.pow(2, attempt))); // backoff
          continue;
        }
        throw e;
      }
    }
    throw lastErr || new Error("Request failed");
  }

  /* ---------- Public API (attach to window) ---------- */
  async function sendOTP(identifier) {
    if (!identifier) throw new Error("Identifier required");
    return postJSON("/api/send-otp", { identifier });
  }

  async function verifyOTP(identifier, otp) {
    if (!identifier || !otp) throw new Error("Identifier and OTP required");
    const res = await postJSON("/api/verify-otp", { identifier, otp });
    if (res?.ok && res?.token) setToken(res.token);
    return res;
  }

  async function resendOTP(identifier) {
    return sendOTP(identifier);
  }

  async function me() {
    return postJSON("/api/user/me", {}, { bearer: getToken() });
  }

  window.VedAuth = {
    API_BASE,
    sendOTP,
    verifyOTP,
    resendOTP,
    me,
    getToken,
    setToken,
    clearToken
  };

  console.log("VedAuth wired ✅", { API_BASE });
})();
</script>
