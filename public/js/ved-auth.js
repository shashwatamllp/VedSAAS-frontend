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

  /* ---------- Optional API key (prefer on Nginx/CF) ---------- */
  let API_KEY = (window.__VED_API_KEY || "").trim();

  /* ---------- Token helpers ---------- */
  function getToken() { try { return localStorage.getItem("token"); } catch { return null; } }
  function setToken(t) { try { t ? localStorage.setItem("token", t) : localStorage.removeItem("token"); } catch {} }
  function clearToken() { setToken(null); }

  /* ---------- URL + errors ---------- */
  function buildUrl(path) {
    if (/^https?:\/\//i.test(path)) return path;
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE}${p}`;
  }

  function friendlyError(resp, bodyText = "") {
    if (resp?.status === 403 && /cloudfront|cacheable|accessdenied|<Error>/i.test(bodyText)) {
      return "CDN blocked or origin misrouted (check CloudFront behavior and S3 permissions).";
    }
    if (resp?.status === 401) return "Unauthorized";
    if (resp?.status === 429) return "Too many requests. Please slow down.";
    if (resp?.status >= 500) return "Server error. Please try again.";
    return `HTTP ${resp?.status || "ERR"}${resp?.statusText ? " " + resp.statusText : ""}${bodyText ? ": " + bodyText : ""}`;
  }

  /* ---------- generic JSON fetch (timeout + retries) ---------- */
  async function jsonFetch(path, {
    method = "GET",
    body,
    bearer = getToken(),
    timeoutMs = 10000,
    retries = 2,
    headers: extraHeaders
  } = {}) {
    const url = buildUrl(path);
    const headers = new Headers({ Accept: "application/json" });
    if (API_KEY) headers.set("X-API-Key", API_KEY);

    const hasBody = body !== undefined && body !== null;
    if (hasBody && !(body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    if (bearer && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${bearer}`);
    }
    if (extraHeaders) {
      for (const [k, v] of Object.entries(extraHeaders)) headers.set(k, v);
    }

    let payload = body;
    if (hasBody && !(body instanceof FormData) && typeof body !== "string") {
      payload = JSON.stringify(body);
    }

    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const ac = new AbortController();
      const to = setTimeout(() => ac.abort(new Error("timeout")), timeoutMs);
      try {
        const resp = await fetch(url, {
          method,
          headers,
          body: hasBody ? payload : undefined,
          mode: "cors",
          cache: "no-store",
          credentials: "omit",
          signal: ac.signal
        });
        clearTimeout(to);

        const ct = resp.headers.get("content-type") || "";
        const text = await resp.text().catch(() => "");
        const json = ct.includes("application/json") ? (text ? safeParseJSON(text) : {}) : null;

        if (!resp.ok) {
          const msg = friendlyError(resp, text.slice(0, 300));
          // transient retry for 502/503/504 or timeouts only
          if (attempt < retries && [502, 503, 504].includes(resp.status)) {
            await backoff(attempt);
            continue;
          }
          throw Object.assign(new Error(json?.error || msg), { resp, body: json ?? text });
        }
        return json ?? {};
      } catch (e) {
        clearTimeout(to);
        lastErr = e;
        const transient = isTransientError(e);
        if (attempt < retries && transient) {
          await backoff(attempt);
          continue;
        }
        throw e;
      }
    }
    throw lastErr || new Error("Request failed");
  }

  function safeParseJSON(t) { try { return JSON.parse(t); } catch { return null; } }
  function isTransientError(e) {
    const msg = String(e?.message || "");
    return /timeout|NetworkError|Failed to fetch/i.test(msg);
  }
  function backoff(attempt) {
    const ms = 300 * Math.pow(2, attempt);
    return new Promise(r => setTimeout(r, ms));
  }

  /* ---------- public methods ---------- */
  async function sendOTP(identifier) {
    if (!identifier) throw new Error("Identifier required");
    return jsonFetch("/api/send-otp", { method: "POST", body: { identifier } });
  }

  async function verifyOTP(identifier, otp) {
    if (!identifier || !otp) throw new Error("Identifier and OTP required");
    const res = await jsonFetch("/api/verify-otp", { method: "POST", body: { identifier, otp } });
    if (res?.ok && res?.token) setToken(res.token);
    return res;
  }

  async function resendOTP(identifier) {
    return sendOTP(identifier);
  }

  async function me() {
    // अगर तुमारे backend में POST चाहिए तो: { method:"POST", body:{} }
    return jsonFetch("/api/user/me", { method: "GET", bearer: getToken() });
  }

  window.VedAuth = {
    API_BASE,
    sendOTP,
    verifyOTP,
    resendOTP,
    me,
    getToken,
    setToken,
    clearToken,
    // optional: expose apiKey setter/getter
    get apiKey() { return API_KEY; },
    set apiKey(v) { API_KEY = (v || "").trim(); }
  };

  console.log("VedAuth wired ✅", { API_BASE });
})();
</script>
