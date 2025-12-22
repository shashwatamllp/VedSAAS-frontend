/* ===== Brand constant ===== */
const ASSISTANT_NAME = 'VedSAAS';

/* ===== API base ===== */
// Production: Use relative path (Same Origin)
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
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

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

/* ===== Guest Auth (Junction creates token) ===== */
async function authenticateAsGuest() {
  try {
    const res = await fetch(api('/api/auth/guest'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: uid() })
    });

    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      throw new Error('Guest auth returned non-JSON');
    }

    const data = await res.json();
    if (!data.api_token) {
      throw new Error('Token missing');
    }

    token = data.api_token;
    localStorage.setItem('token', token);
    finishBoot();
  } catch (e) {
    console.error('Guest auth error:', e.message);
    setTimeout(authenticateAsGuest, 3000);
  }
}

/* ===== Login Check ===== */
async function checkLoginAndOpen() {
  if (!token) {
    await authenticateAsGuest();
    return;
  }

  try {
    await authFetch('/api/user/profile');
    finishBoot();
  } catch {
    await authenticateAsGuest();
  }
}

/* ===== Chat Send ===== */
async function sendToServer(text) {
  sending = true;

  try {
    const res = await authFetch('/api/v2/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: text,
        context: { assistant: ASSISTANT_NAME }
      })
    }, { timeoutMs: 45000 });

    const data = await res.json().catch(() => ({}));
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

/* ===== UI minimal helpers ===== */
function typeWriteBot(text) {
  const area = document.getElementById('chat-area');
  const div = document.createElement('div');
  div.className = 'message bot';
  div.textContent = text;
  area.appendChild(div);
}

function appendUser(text) {
  const area = document.getElementById('chat-area');
  const div = document.createElement('div');
  div.className = 'message user';
  div.textContent = text;
  area.appendChild(div);
}

/* ===== Finish Boot ===== */
function finishBoot() {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('chat-shell').style.display = 'flex';
}

/* ===== Boot ===== */
(function boot() {
  document.getElementById('brand-title').textContent = ASSISTANT_NAME;

  document.getElementById('send-btn').addEventListener('click', async () => {
    const input = document.getElementById('main-input');
    const text = input.value.trim();
    if (!text || sending) return;

    appendUser(text);
    input.value = '';
    await sendToServer(text);
  });

  checkLoginAndOpen();
})();
