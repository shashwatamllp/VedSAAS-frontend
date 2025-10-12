<script>
(function(){
  const API_BASE =
    (window.__VED_API_BASE || "").replace(/\/$/,"") ||
    (document.querySelector('meta[name="ved-api-base"]')?.content || "").replace(/\/$/,"") ||
    "https://api.vedsaas.com";

  const API_KEY = window.__VED_API_KEY || ""; // if you set VED_API_KEY on server

  async function postJSON(path, body, {timeout=10000} = {}) {
    const url = /^https?:\/\//i.test(path) ? path : `${API_BASE}${path.startsWith("/")?path:`/${path}`}`;
    const ac = new AbortController();
    const t = setTimeout(()=>ac.abort(new Error("timeout")), timeout);
    const headers = {"Accept":"application/json","Content-Type":"application/json"};
    if (API_KEY) headers["X-API-Key"] = API_KEY;
    const resp = await fetch(url, {method:"POST", headers, body:JSON.stringify(body||{}), signal: ac.signal, mode:"cors", cache:"no-store"});
    clearTimeout(t);
    const text = await resp.text();
    let data; try{ data = text ? JSON.parse(text) : {}; } catch { data = {raw:text}; }
    if (!resp.ok) { const err = new Error(data?.error || `HTTP ${resp.status}`); err.data = data; throw err; }
    return data;
  }

  // Send OTP (email or phone)
  window.VedAuthSendOTP = async function(identifier){
    return postJSON("/api/send-otp", {identifier});
  };

  // Example usage (wire to your buttons/inputs):
  // document.getElementById("btnSendOtp").onclick = async () => {
  //   try {
  //     const id = document.getElementById("login-ident").value.trim();
  //     const r = await VedAuthSendOTP(id);
  //     toast(`OTP sent via ${r.via} to ${r.masked}`);
  //   } catch(e) {
  //     toast(e.message || "Failed to send OTP");
  //   }
  // };

  console.log("VedAuth wired ✅", {API_BASE});
})();
</script>
