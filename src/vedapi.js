// ========= VedSAAS Frontend API (core) =========

// ---- DOM helper ----
const $ = (id) => document.getElementById(id);

// ---- Resolve API base ----
function __meta(name){
  try{ const m = document.querySelector(`meta[name="${name}"]`); return (m && m.content || "").trim(); }
  catch{ return ""; }
}
function resolveApiBase(){
  const m = __meta("ved-api-base");                 // "", "/api", "https://api..."
  const w = (typeof window !== "undefined" && window.API_BASE) ? String(window.API_BASE).trim() : "";
  const base = (m || w || "/api").replace(/\/+$/,"");
  return base || "/api";
}
const API_BASE = resolveApiBase();
const VED_API_KEY = (__meta("ved-api-key") || (typeof window !== "undefined" && window.__VED_API_KEY) || "").trim();

// ---- Token helpers ----
function getToken(){ try{ return localStorage.getItem("ved_token"); }catch{ return null; } }
function setToken(t){ try{ t ? localStorage.setItem("ved_token", t) : localStorage.removeItem("ved_token"); }catch{} }

// ---- Fetch wrapper ----
async function apiFetch(path, {method="GET", body=null, headers={}, timeoutMs=12000}={}){
  const abs = /^https?:\/\//i.test(path) ? path : `${API_BASE}${path.startsWith("/")?path:`/${path}`}`;
  const h = new Headers(headers);
  if(!h.has("Accept")) h.set("Accept","application/json");
  const hasBody = body !== null && body !== undefined;
  const isForm  = (typeof FormData !== "undefined") && body instanceof FormData;
  if(hasBody && !isForm && !h.has("Content-Type")) h.set("Content-Type","application/json");
  if(VED_API_KEY && !h.has("X-API-Key")) h.set("X-API-Key", VED_API_KEY);
  const tok = getToken(); if(tok && !h.has("Authorization")) h.set("Authorization", `Bearer ${tok}`);

  const ac = new AbortController(); const to = setTimeout(()=>ac.abort(new Error("timeout")), timeoutMs);
  try{
    const resp = await fetch(abs, {
      method, headers:h,
      body: hasBody && !isForm ? JSON.stringify(body) : body,
      signal: ac.signal, mode:"cors", cache:"no-store", credentials:"omit"
    });
    const ct = (resp.headers.get("content-type")||"").toLowerCase();
    const isJSON = ct.includes("application/json");
    const data = resp.status === 204 ? null : isJSON ? await resp.json().catch(()=>({})) : await resp.text();
    if(!resp.ok){
      const msg = isJSON ? (data && (data.error||data.message)) : String(data||"");
      throw new Error(msg || `HTTP ${resp.status}`);
    }
    return data;
  } finally { clearTimeout(to); }
}

// ---- Endpoint helpers ----
async function sendOTP(identifier){
  return apiFetch("/api/send-otp", {method:"POST", body:{identifier}});
}
async function verifyOTP(identifier, code){
  return apiFetch("/api/auth/verify-otp", {method:"POST", body:{identifier, code}});
}
async function chatSend(message){
  return apiFetch("/api/chat", {method:"POST", body:{message}});
}

// ---- Minimal UI wire (optional) ----
window.addEventListener("DOMContentLoaded", () => {
  const ident = $("otp-ident"), btnSend = $("otp-send"), code = $("otp-code"), btnVerify = $("otp-verify");
  const chatIn = $("chat-input"), chatBtn = $("chat-send"), chatLog = $("chat-log");

  btnSend && (btnSend.onclick = async () => {
    try{
      const res = await sendOTP((ident.value||"").trim());
      alert(res && res.ok ? `OTP sent${res.masked?` to ${res.masked}`:""}` : `OTP failed: ${(res&&res.error)||"Unknown"}`);
    }catch(e){ alert(String(e.message||e)); }
  });

  btnVerify && (btnVerify.onclick = async () => {
    try{
      const res = await verifyOTP((ident.value||"").trim(), (code.value||"").trim());
      if(res && res.ok && res.token){ setToken(res.token); alert("Login success"); }
      else{ alert((res&&res.error)||"Invalid code"); }
    }catch(e){ alert(String(e.message||e)); }
  });

  chatBtn && (chatBtn.onclick = async () => {
    const text = (chatIn.value||"").trim(); if(!text) return;
    try{
      const res = await chatSend(text);
      const reply = (res && (res.text||res.reply||res.message)) || JSON.stringify(res||{});
      if (chatLog) chatLog.value += `\n> ${text}\n${reply}\n`;
    }catch(e){ alert(String(e.message||e)); }
  });
});

// ---- UMD-style export ----
(function expose(){
  const api = { API_BASE, VED_API_KEY, getToken, setToken, apiFetch, sendOTP, verifyOTP, chatSend };
  if(typeof window !== "undefined"){
    window.VED = Object.assign(window.VED||{}, api);
  }
  try{ if(typeof module !== "undefined") module.exports = api; }catch{}
  try{ if(typeof export !== "undefined") export default api; }catch{}
})();
