// ========= VedSAAS Frontend API (Production) =========
const $ = (id) => document.getElementById(id);

const API_BASE = "https://api.vedsaas.com"; // hard-coded prod
const VED_API_KEY = "<same-as-service-VED_API_KEY>"; // या "" (यदि API key बंद रखी है)

function getToken() { try { return localStorage.getItem("ved_token"); } catch { return null; } }
function setToken(t){ try { t?localStorage.setItem("ved_token", t):localStorage.removeItem("ved_token"); } catch{} }

async function apiFetch(path, {method="GET", body=null, headers={}, timeoutMs=10000}={}) {
  const url = /^https?:\/\//i.test(path) ? path : `${API_BASE}${path.startsWith("/")?path:`/${path}`}`;
  const h = new Headers(headers);
  if (!h.has("Accept")) h.set("Accept", "application/json");
  const hasBody = body !== null && body !== undefined;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (hasBody && !isForm && !h.has("Content-Type")) h.set("Content-Type","application/json");
  if (VED_API_KEY && !h.has("X-API-Key")) h.set("X-API-Key", VED_API_KEY);
  const tok = getToken();
  if (tok && !h.has("Authorization")) h.set("Authorization", `Bearer ${tok}`);

  const ac = new AbortController();
  const to = setTimeout(()=>ac.abort(new Error("timeout")), timeoutMs);
  try {
    const resp = await fetch(url, {method, headers:h, body: hasBody && !isForm ? JSON.stringify(body): body, signal: ac.signal, mode:"cors", cache:"no-store"});
    const ct = resp.headers.get("content-type")||"";
    const data = ct.includes("application/json") ? await resp.json() : await resp.text();
    if (!resp.ok) throw new Error(typeof data==="string"?data:(data.error||`HTTP ${resp.status}`));
    return data;
  } finally { clearTimeout(to); }
}

export async function sendOTP(identifier){
  return apiFetch("/api/send-otp", {method:"POST", body:{identifier}});
}

export async function verifyOTP(identifier, code){
  return apiFetch("/api/auth/verify-otp", {method:"POST", body:{identifier, code}});
}

export async function chatSend(message){
  return apiFetch("/api/chat", {method:"POST", body:{message}});
}

// ===== Minimal UI wire (optional) =====
window.addEventListener("DOMContentLoaded", () => {
  const ident = $("otp-ident"), btnSend = $("otp-send"), code = $("otp-code"), btnVerify = $("otp-verify");
  const chatIn = $("chat-input"), chatBtn = $("chat-send"), chatLog = $("chat-log");

  btnSend && (btnSend.onclick = async () => {
    try{
      const res = await sendOTP(ident.value.trim());
      alert(res.ok ? `OTP sent to ${res.masked} via ${res.via}` : `OTP failed: ${res.error||"Unknown"}`);
    }catch(e){ alert(String(e.message||e)); }
  });

  btnVerify && (btnVerify.onclick = async () => {
    try{
      const res = await verifyOTP(ident.value.trim(), code.value.trim());
      if(res.ok && res.token){ setToken(res.token); alert("Login success!"); }
      else{ alert(res.error || "Invalid code"); }
    }catch(e){ alert(String(e.message||e)); }
  });

  chatBtn && (chatBtn.onclick = async () => {
    const text = chatIn.value.trim();
    if(!text) return;
    try{
      const res = await chatSend(text);
      if (chatLog) chatLog.value += `\n> ${text}\n${res.text}\n`;
    }catch(e){ alert(String(e.message||e)); }
  });
});
