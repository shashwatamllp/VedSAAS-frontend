/* ================================
   VedSAAS – Production Core JS
   Frontend → Junction → Backend
   ================================ */

/* ===== Brand ===== */
const ASSISTANT_NAME = 'VedSAAS';

/* ===== API (same-origin, Junction only) =====
   Frontend: https://app.vedsaas.com
   API:      https://app.vedsaas.com/api/*
*/
const API_BASE = '';

function api(path) {
  let p = String(path || '');
  if (!p.startsWith('/')) p = '/' + p;
  return p;
}

/* ===== State ===== */
let token = localStorage.getItem('token') || null;
let topics = [];
let currentTopicId = null;
let sending = false;

/* ===== Limits ===== */
const MAX_LOCAL_BYTES = 2_000_000;
const TOPIC_HARD_LIMIT = 80;
const MSGS_PER_TOPIC_LIMIT = 200;

/* ===== Utilities ===== */
function uid() { return Math.random().toString(36).slice(2, 9); }

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function mdLite(text) {
  let t = esc(text ?? '');
  t = t.replace(/(https?:\/\/[^\s]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');
  t = t.replace(/`([^`]+)`/g,'<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  t = t.replace(/\*([^*]+)\*/g,'<em>$1</em>');
  return t.replace(/\n/g,'<br/>');
}

function sanitizeBotText(t) {
  if (!t) return '';
  return String(t)
    .replace(/\ban AI assistant\b/gi, ASSISTANT_NAME)
    .replace(/\bmy name is\b[^.!?]*[.!?]?/gi, `My name is ${ASSISTANT_NAME}.`);
}

/* ===== Auth Fetch (Junction contract) ===== */
async function authFetch(path, opts = {}, { timeoutMs = 15000 } = {}) {
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
    let txt = '';
    try { txt = await res.text(); } catch {}
    throw new Error(`HTTP ${res.status} ${txt.slice(0,120)}`);
  }
  return res;
}

/* ===== Guest Auth ===== */
async function authenticateAsGuest() {
  const res = await fetch(api('/api/auth/guest'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: uid() })
  });
  const data = await res.json();
  if (!data.api_token) throw new Error('Guest auth failed');
  token = data.api_token;
  localStorage.setItem('token', token);
}

/* ===== Chat Send (POST ONLY) ===== */
async function sendToServer(text) {
  if (sending) return;
  sending = true;

  try {
    const body = {
      message: text,
      context: {
        assistant: ASSISTANT_NAME
      }
    };

    const res = await authFetch('/api/v2/chat', {
      method: 'POST',
      body: JSON.stringify(body)
    }, { timeoutMs: 45000 });

    const data = await res.json();
    const reply =
      data.answer ||
      data.response ||
      data.message ||
      'Empty response';

    appendMessage('bot', sanitizeBotText(reply));
  } catch (e) {
    appendMessage('bot', e.message || 'Network error');
  } finally {
    sending = false;
  }
}

/* ===== Chat State ===== */
function newTopic(title = 'New Chat') {
  const id = 't_' + Date.now();
  topics.unshift({ id, title, messages: [] });
  currentTopicId = id;
  saveTopics();
}

function appendMessage(from, message) {
  const t = topics.find(x => x.id === currentTopicId);
  if (!t) return;
  t.messages.push({
    id: uid(),
    from,
    message,
    timestamp: Date.now()
  });
  saveTopics();
  renderChat();
}

function saveTopics() {
  localStorage.setItem('vedsaas_topics', JSON.stringify(topics));
  localStorage.setItem('vedsaas_current', currentTopicId || '');
}

function loadTopics() {
  topics = JSON.parse(localStorage.getItem('vedsaas_topics') || '[]');
  currentTopicId = localStorage.getItem('vedsaas_current') || null;
}

/* ===== UI ===== */
function renderChat() {
  const area = document.getElementById('chat-area');
  if (!area) return;
  area.innerHTML = '';
  const t = topics.find(x => x.id === currentTopicId);
  if (!t) return;

  t.messages.forEach(m => {
    const d = document.createElement('div');
    d.className = 'msg ' + m.from;
    d.innerHTML = mdLite(m.message);
    area.appendChild(d);
  });

  area.scrollTop = area.scrollHeight;
}

/* ===== Boot ===== */
(async function boot() {
  loadTopics();

  if (!token) {
    await authenticateAsGuest();
  }

  if (!currentTopicId) newTopic();

  renderChat();

  document.getElementById('send-btn')?.addEventListener('click', async () => {
    const inp = document.getElementById('main-input');
    const text = inp.value.trim();
    if (!text) return;
    appendMessage('user', text);
    inp.value = '';
    await sendToServer(text);
  });
})();
