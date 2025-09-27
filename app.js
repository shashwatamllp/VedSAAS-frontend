/* ===== Production config via vedsaas-fixes.js ===== */
const $ = (id) => document.getElementById(id);
let token = localStorage.getItem('token') || null;

// auth-aware fetch
async function authFetch(path, opts = {}, extra = {}) {
  const headers = { ...(opts.headers || {}), ...(token ? { 'Authorization': 'Bearer ' + token } : {}) };
  return await apiFetch(path, { ...opts, headers, ...extra });
}

/* ===== Minimal wiring (keep your existing logic below) ===== */
(function boot(){
  const landingBtn = $('landing-start');
  if (landingBtn) landingBtn.onclick = async () => {
    const t = $('landing-input')?.value?.trim(); if (!t) return;
    await sendChat(t);
  };
  const toBottom = $('to-bottom');
  if (toBottom) toBottom.onclick = () => scrollChatBottom(true);
})();

async function sendChat(text){
  try {
    const res = await authFetch('/api/chat', { method:'POST', body:{ message:text } });
    // TODO: append to chat UI based on your existing rendering
    console.log('chat:', res);
  } catch (e) {
    console.error(e);
  }
}

function scrollChatBottom(smooth){
  const el = $('chat-area'); if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: smooth?'smooth':'auto' });
}
