/* ===== Brand constant ===== */
const ASSISTANT_NAME = 'VedSAAS';

/* ===== API base (Junction only, same-origin) =====
   Frontend: https://app.vedsaas.com
   Junction: https://app.vedsaas.com/api/*
   Backend is NEVER called directly
*/
const API_BASE = '';

function api(path) {
  let p = String(path || '');
  if (!p.startsWith('/')) p = '/' + p;
  return API_BASE + p;
}

/* ===== State ===== */
let token = localStorage.getItem('token') || null;
let topics = [];
let currentTopicId = null;
let sending = false;

/* Limits */
const MAX_LOCAL_BYTES = 2_000_000;
const TOPIC_HARD_LIMIT = 80;
const MSGS_PER_TOPIC_LIMIT = 200;

/* ===== Utils ===== */
async function authFetch(path, opts = {}, { timeoutMs = 10000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  const res = await fetch(api(path), {
    ...opts,
    signal: ctrl.signal,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
      ...(token ? { 'X-API-Token': token } : {})
    }
  });

  clearTimeout(t);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${text}`);
  }
  return res;
}

/* ===== Guest Auth (JUNCTION-CORRECT) ===== */
async function authenticateAsGuest() {
  try {
    const res = await fetch(api('/api/auth/guest'), {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) throw new Error('Guest auth failed');

    const data = await res.json();
    if (!data.api_token) throw new Error('Token missing');

    token = data.api_token;
    localStorage.setItem('token', token);

    finishBoot();
  } catch (e) {
    console.error('Guest auth error:', e);
    setTimeout(authenticateAsGuest, 3000);
  }
}

/* ===== Login Check ===== */
async function checkLoginAndOpen() {
  if (!token) return authenticateAsGuest();
  try {
    await authFetch('/api/user/profile');
    finishBoot();
  } catch {
    authenticateAsGuest();
  }
}

/* ===== Chat Send ===== */
async function sendToServer(text, imageBase64 = null) {
  if (sending) return;
  sending = true;

  const body = {
    message: text,
    context: {
      assistant: ASSISTANT_NAME
    }
  };

  if (imageBase64) body.image = imageBase64;

  try {
    const res = await authFetch('/api/v2/chat', {
      method: 'POST',
      body: JSON.stringify(body)
    }, { timeoutMs: 45000 });

    const data = await res.json();
    const reply =
      data.answer ||
      data.response ||
      data.message ||
      'No response';

    typeWriteBot(reply);
  } catch (e) {
    typeWriteBot(e.message);
  } finally {
    sending = false;
  }
}

/* ===== Boot ===== */
(function boot() {
  const title = document.getElementById('brand-title');
  if (title) title.textContent = ASSISTANT_NAME;
  checkLoginAndOpen();
})();
