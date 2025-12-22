/* ===== Brand constant ===== */
const ASSISTANT_NAME = 'VedSAAS';

/* ===== API base (Junction only, same-origin) ===== */
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

/* ===== Guest Auth (SESSION-BASED, JSON NOT REQUIRED) ===== */
async function authenticateAsGuest() {
  try {
    // Step 1: trigger guest session (cookie)
    await fetch(api('/api/auth/guest'), {
      method: 'GET',
      credentials: 'include'
    });

    // Step 2: verify session / token
    const res = await authFetch('/api/user/profile');
    const data = await res.json();

    if (data && data.api_token) {
      token = data.api_token;
      localStorage.setItem('token', token);
    }

    finishBoot();
  } catch (e) {
    console.error('Guest auth error:', e.message);
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
    context: { assistant: ASSISTANT_NAME }
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

/* ===== Boot Finish ===== */
function finishBoot() {
  console.info('finishBoot executed');
  document.body.classList.remove('loading');
}

/* ===== Boot ===== */
(function boot() {
  const title = document.getElementById('brand-title');
  if (title) title.textContent = ASSISTANT_NAME;
  checkLoginAndOpen();
})();
