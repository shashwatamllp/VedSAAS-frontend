/* ===== Brand constant ===== */
const ASSISTANT_NAME = 'VedSAAS';

/* ===== API base normalize ===== */
const API_BASE = (() => {
  // Junction Server Domain
  return 'https://api.vedsaas.com';
})();
function api(path) {
  let p = String(path || '');
  if (!p.startsWith('/')) p = '/' + p;
  if (API_BASE.endsWith('/api') && p.startsWith('/api')) p = p.replace(/^\/api\b/, '');
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

/* Utils */
function banner(msg) {
  const b = document.getElementById('banner');
  b.textContent = msg;
  b.style.display = 'block';
  setTimeout(() => b.style.display = 'none', 2500);
}
async function authFetch(path, opts = {}, { timeoutMs = 10000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  const url = api(path);
  const res = await fetch(url, {
    ...opts,
    signal: ctrl.signal,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
      ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    }
  });
  clearTimeout(t);
  if (!res.ok) {
    let text = '';
    try { text = await res.text(); } catch { }
    const snippet = (text || '').slice(0, 160);
    throw new Error(`HTTP ${res.status} ${res.statusText}${snippet ? ' — ' + snippet : ''}`);
  }
  return res;
}
function formatFull(ts) {
  const d = ts ? new Date(ts) : new Date();
  const z = n => String(n).padStart(2, '0');
  return `${z(d.getDate())}/${z(d.getMonth() + 1)}/${d.getFullYear()}, ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
}
function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function mdLite(text) {
  let t = esc(text ?? '');
  t = t.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return t.replace(/\n/g, '<br/>');
}
function uid() { return Math.random().toString(36).slice(2, 9); }
function pickResponse(o) {
  if (!o || typeof o !== 'object') return '';
  const c =
    o.answer ??
    o.response ??
    o.reply ??
    o.message ??
    o.text ??
    o.output ??
    (o.data && (o.data.answer || o.data.message));
  return String(c ?? '');
}

/* ===== Brand enforcement ===== */
function sanitizeBotText(t) {
  if (!t) return '';
  let s = String(t);
  s = s.replace(/\bI(?:'m| am)\s+(?:an?\s+)?(?:AI\s+)?(?:assistant|chatbot|model)\b/gi, ASSISTANT_NAME);
  s = s.replace(/\bI\s+(?:do\s+not|don't)\s+have\s+(?:a|any)\s+(?:personal\s+)?name\b[^.!?]*[.!?]?/gi, `I am ${ASSISTANT_NAME}.`);
  s = s.replace(/\ban AI assistant\b/gi, ASSISTANT_NAME);
  s = s.replace(/\bmy\s+name\s+is\b[^.!?]*[.!?]?/gi, `My name is ${ASSISTANT_NAME}.`);
  return s;
}

/* Server status with multi-probe */
const PROBES = ['/api/user-status', '/api/health', '/api/engine1/health', '/api/engine2/health', '/__routes', '/openapi.json'];
let serverOnline = false;
let _pingTimer = null;
async function pingServer() {
  let ok = false;
  for (const p of PROBES) {
    try {
      const r = await fetch(api(p), { method: 'GET', credentials: 'include' });
      if (r.ok) { ok = true; break; }
    } catch { }
  }
  serverOnline = ok;
  updateMeta();
}
function updateMeta() {
  const m = document.getElementById('meta-info');
  if (!m) return;
  const kb = Math.round((JSON.stringify(topics || []).length) / 1024);
  m.innerText = `${serverOnline ? 'Online' : 'Offline'} • Local: ${kb} KB`;
  m.style.color = serverOnline ? '#9fe870' : '#ffb3b3';
}
function startPinger() {
  if (_pingTimer) clearInterval(_pingTimer);
  _pingTimer = setInterval(pingServer, 5000);
  pingServer();
}

/* Local storage safe */
function approxBytesOf(o) { try { return JSON.stringify(o).length; } catch { return 0; } }
function tryTrimForQuota() {
  if (topics.length > TOPIC_HARD_LIMIT) topics = topics.slice(0, TOPIC_HARD_LIMIT);
  topics.forEach(t => {
    if (Array.isArray(t.messages) && t.messages.length > MSGS_PER_TOPIC_LIMIT)
      t.messages = t.messages.slice(-MSGS_PER_TOPIC_LIMIT);
  });
  let size = approxBytesOf(topics);
  while (size > MAX_LOCAL_BYTES && topics.length > 1) {
    topics.pop();
    size = approxBytesOf(topics);
  }
  if (size > MAX_LOCAL_BYTES) {
    for (let i = topics.length - 1; i >= 0 && size > MAX_LOCAL_BYTES; i--) {
      const t = topics[i];
      while (t.messages && t.messages.length > 1 && size > MAX_LOCAL_BYTES) {
        t.messages.shift();
        size = approxBytesOf(topics);
      }
    }
  }
}
function safeSetLocal(k, v) {
  try { localStorage.setItem(k, v); }
  catch {
    tryTrimForQuota();
    try {
      localStorage.setItem('vedsaas_topics', JSON.stringify(topics));
      banner('Storage trimmed.');
    } catch { }
  }
}
function saveTopicsToLocal() {
  try {
    tryTrimForQuota();
    safeSetLocal('vedsaas_topics', JSON.stringify(topics));
    localStorage.setItem('vedsaas_current', currentTopicId || '');
  } catch { }
  renderStorageUsage();
}
function loadTopicsFromLocal() {
  try { topics = JSON.parse(localStorage.getItem('vedsaas_topics') || '[]'); }
  catch { topics = []; }
  try {
    currentTopicId = localStorage.getItem('vedsaas_current') || (topics[0] && topics[0].id) || null;
  } catch {
    currentTopicId = (topics[0] && topics[0].id) || null;
  }
}

/* Drafts */
function draftKey() { return 'draft_' + (currentTopicId || 'global'); }
function setDraft(v) { try { localStorage.setItem(draftKey(), v); } catch { } }
function getDraft() { try { return localStorage.getItem(draftKey()) || ''; } catch { return ''; } }
function initials(name) {
  return (name || 'U').split(/\s+/)
    .map(x => x[0]?.toUpperCase() || '')
    .slice(0, 2).join('');
}

/* UI controls */
function showAuth(screen = 'login') {
  document.getElementById('auth-overlay').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  ['login', 'register', 'verify'].forEach(s => {
    document.getElementById(s + '-screen').style.display = (s === screen) ? 'block' : 'none';
  });
}
function hideAuth() {
  document.getElementById('auth-overlay').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
}
function showLanding() {
  document.getElementById('landing').style.display = 'flex';
  document.getElementById('chat-shell').style.display = 'none';
}
function showChat() {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('chat-shell').style.display = 'flex';
}
function setDisplayName(name) {
  const chip = document.getElementById('settings-username');
  const av = document.getElementById('settings-avatar');
  if (chip) chip.innerText = name;
  if (av) {
    const url = localStorage.getItem('user_avatar_url');
    av.innerHTML = '';
    if (url) {
      const i = new Image();
      i.src = url; i.alt = initials(name);
      av.appendChild(i);
    } else {
      av.textContent = initials(name);
    }
  }
  const up = document.getElementById('up-name');
  const upa = document.getElementById('up-avatar');
  if (up) up.innerText = name;
  if (upa) {
    const url2 = localStorage.getItem('user_avatar_url');
    upa.innerHTML = '';
    if (url2) {
      const i2 = new Image();
      i2.src = url2; i2.alt = initials(name);
      upa.appendChild(i2);
    } else {
      upa.textContent = initials(name);
    }
  }
}
function setAccountInfo({ email = '', mobile = '' }) {
  const em = document.getElementById('ac-email');
  const mo = document.getElementById('ac-mobile');
  if (em) em.value = email;
  if (mo) mo.value = mobile;
}

/* Training consent helpers */
function currentConsentValue() {
  const v = localStorage.getItem('train_consent');
  return v && v !== 'unset' ? v : 'unset';
}
function maybeShowConsent() {
  const overlay = document.getElementById('consent-overlay');
  if (!overlay) return;
  const v = currentConsentValue();
  overlay.style.display = (v === 'unset') ? 'flex' : 'none';
}

/* History */
function renderHistory() {
  const list = document.getElementById('history-list');
  if (!list) return;
  list.innerHTML = '';
  (topics || []).forEach(t => {
    const div = document.createElement('div');
    div.className = 'topic' + (t.id === currentTopicId ? ' active' : '');
    div.dataset.id = t.id;
    const last = (t.messages && t.messages.length) ? t.messages[t.messages.length - 1] : null;
    const preview = esc(String(last ? (last.message ?? last.text ?? '') : '').replace(/\n/g, ' ')).slice(0, 40);
    div.innerHTML = `<div style="font-weight:600">${esc(t.title || 'Chat')}</div><div class="preview">${preview}</div>`;
    div.onclick = () => { location.hash = '#/chat/' + encodeURIComponent(t.id); };
    list.appendChild(div);
  });
}

/* Messages */
function messageNode(m) {
  const wrap = document.createElement('div');
  wrap.className = 'message-row ' + (m.from === 'user' ? 'from-user' : 'from-bot');
  wrap.dataset.mid = m.id;
  const label = document.createElement('div');
  label.className = 'msg-label';
  label.innerText = `${m.from === 'user' ? 'You' : ASSISTANT_NAME} • ${formatFull(m.timestamp)}`;
  const body = document.createElement('div');
  body.className = 'msg-body';
  body.innerHTML = mdLite(String(m.message ?? ''));
  const act = document.createElement('div');
  act.className = 'msg-actions';
  const btnCopy = document.createElement('button');
  btnCopy.innerHTML = '<i class="fas fa-copy"></i>';
  btnCopy.title = 'Copy';
  btnCopy.onclick = () => { navigator.clipboard.writeText(String(m.message ?? '')); banner('Copied'); };
  const btnDel = document.createElement('button');
  btnDel.innerHTML = '<i class="fas fa-trash"></i>';
  btnDel.title = 'Delete';
  btnDel.onclick = () => { deleteMessage(m.id); };
  act.append(btnCopy, btnDel);
  const block = document.createElement('div');
  block.append(label);
  wrap.append(body, act);
  return [block, wrap];
}
function renderChat() {
  const area = document.getElementById('chat-area');
  area.innerHTML = '';
  const t = topics.find(x => x.id === currentTopicId);
  if (!t) {
    area.innerHTML = `<div style="color:#bbb;text-align:center;margin-top:40px">No conversation selected.</div>`;
    return;
  }
  const header = document.createElement('div');
  header.style.textAlign = 'center';
  header.style.marginBottom = '10px';
  header.innerHTML = `<strong style="font-size:18px">${esc(t.title || 'New Chat')}</strong>`;
  area.appendChild(header);
  t.messages.forEach(m => {
    const [label, row] = messageNode(m);
    area.appendChild(label);
    area.appendChild(row);
  });
  const live = document.querySelector('.typing-row');
  if (live) area.appendChild(live);
  autoScroll();
}
function newTopic(title = 'New Chat') {
  const id = 't_' + Date.now();
  topics.unshift({ id, title, created_at: Date.now(), messages: [] });
  currentTopicId = id;
  saveTopicsToLocal();
  renderHistory();
  renderChat();
  updateUsage();
  return id;
}
function appendMessage(from, message) {
  const t = topics.find(x => x.id === currentTopicId);
  if (!t) return;
  const m = { id: uid(), from, message, timestamp: Date.now() };
  t.messages.push(m);
  saveTopicsToLocal();
  updateUsage();
  return m;
}
function deleteMessage(mid) {
  const t = topics.find(x => x.id === currentTopicId);
  if (!t) return;
  t.messages = t.messages.filter(m => m.id !== mid);
  saveTopicsToLocal();
  renderChat();
  updateUsage();
}

/* Delete / Clear */
function deleteCurrentChat() {
  if (!currentTopicId) return banner('No chat selected');
  const t = topics.find(x => x.id === currentTopicId);
  if (!t) return;
  if (!confirm('Delete this chat from local storage?')) return;
  topics = topics.filter(x => x.id !== currentTopicId);
  currentTopicId = (topics[0] && topics[0].id) || null;
  saveTopicsToLocal();
  renderHistory();
  renderChat();
  updateUsage();
  if (!currentTopicId) showLanding();
}
function clearAllChats() {
  if (!topics.length) return banner('No chats to clear.');
  if (!confirm('Clear ALL chats stored locally?')) return;
  topics = [];
  currentTopicId = null;
  saveTopicsToLocal();
  renderHistory();
  renderChat();
  updateUsage();
  showLanding();
}

/* Typing */
function showTyping() {
  let tip = document.querySelector('.typing-row');
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'typing-row';
    tip.innerHTML = `<span class="dots"><i></i><i></i><i></i></span> <span style="opacity:.8">${ASSISTANT_NAME} is typing…</span>`;
  }
  const area = document.getElementById('chat-area');
  if (tip.parentElement !== area) area.appendChild(tip);
  autoScroll(true);
}
function hideTyping() {
  const tip = document.querySelector('.typing-row');
  if (tip && tip.parentElement) tip.remove();
}

/* Typewriter */
function typeWriteBot(text, speed = null) {
  const sp = Number(localStorage.getItem('pref_type_speed') || '55');
  const typingSpeed = (speed !== null ? speed : sp);
  hideTyping();
  showChat();
  const t = topics.find(x => x.id === currentTopicId);
  if (!t) return;
  const msg = { id: uid(), from: 'bot', message: '', timestamp: Date.now() };
  t.messages.push(msg);
  saveTopicsToLocal();
  renderChat();
  const area = document.getElementById('chat-area');
  let el = area.querySelector(`.message-row.from-bot[data-mid="${msg.id}"]`);
  if (!el) {
    const label = document.createElement('div');
    label.className = 'msg-label';
    label.innerText = `${ASSISTANT_NAME} • ${formatFull(msg.timestamp)}`;
    el = document.createElement('div');
    el.className = 'message-row from-bot';
    el.dataset.mid = msg.id;
    const body = document.createElement('div');
    body.className = 'msg-body';
    el.appendChild(body);
    area.appendChild(label);
    area.appendChild(el);
  }
  const body = el.querySelector('.msg-body');
  const safeMD = s => {
    try { return mdLite(s); }
    catch (_) {
      const d = document.createElement('div');
      d.innerText = s;
      return d.innerHTML;
    }
  };

  const cleaned = sanitizeBotText(text);
  if (typingSpeed <= 0) {
    msg.message = cleaned;
    saveTopicsToLocal();
    body.innerHTML = safeMD(cleaned);
    autoScroll(true);
    return;
  }
  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  body.textContent = '';
  body.appendChild(cursor);
  let i = 0;
  const src = cleaned;
  const timer = setInterval(() => {
    if (i >= src.length) {
      clearInterval(timer);
      msg.message = src;
      saveTopicsToLocal();
      body.innerHTML = safeMD(src);
      autoScroll(true);
      return;
    }
    msg.message += src[i++];
    body.textContent = msg.message;
    body.appendChild(cursor);
    autoScroll(true);
  }, typingSpeed);
}

/* Routing */
function goToChat(id) {
  if (!id) return;
  if (currentTopicId !== id) {
    currentTopicId = id;
    saveTopicsToLocal();
    renderHistory();
    renderChat();
  }
  showChat();
  const want = '#/chat/' + encodeURIComponent(id);
  if (location.hash !== want) location.hash = want;
}
function handleRoute() {
  const m = location.hash.match(/^#\/chat\/(.+)$/);
  if (m) {
    const id = decodeURIComponent(m[1]);
    const t = (topics || []).find(x => x.id === id);
    if (t) { goToChat(id); }
    else { showLanding(); }
  } else {
    showLanding();
  }
}
window.addEventListener('hashchange', handleRoute);

/* Auth + profile: login check */
async function checkLoginAndOpen() {
  if (!token) {
    showAuth('login');
    return;
  }
  try {
    const res = await authFetch('/api/user-status');
    const data = await res.json();
    const name = (data.user?.name) || localStorage.getItem('user_name') || 'User';
    setDisplayName(name);
    setAccountInfo({ email: data.user?.email || '', mobile: data.user?.mobile || '' });
    hideAuth();
    renderHistory();
    renderChat();
    handleRoute();
    loadHistoryFromServer();
    updateUsage();
    maybeShowConsent();
  } catch {
    const name = localStorage.getItem('user_name') || 'User';
    setDisplayName(name);
    hideAuth();
    renderHistory();
    renderChat();
    handleRoute();
    updateUsage();
    maybeShowConsent();
  }
}

/* Landing */
const landingInput = document.getElementById('landing-input');
const landingStart = document.getElementById('landing-start');
document.getElementById('landing-open-history').addEventListener('click', () => {
  if (!currentTopicId && topics[0]) currentTopicId = topics[0].id;
  if (currentTopicId) location.hash = '#/chat/' + encodeURIComponent(currentTopicId);
  renderHistory();
  renderChat();
});
landingStart.addEventListener('click', async () => {
  const text = (landingInput.value || '').trim();
  if (!text) { landingInput.focus(); return; }
  const id = newTopic('New Chat');
  location.hash = '#/chat/' + encodeURIComponent(id);
  appendMessage('user', text);
  landingInput.value = '';
  autosize(landingInput);
  await sendToServer(text);
});
landingInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    landingStart.click();
  }
});
landingInput.addEventListener('input', () => autosize(landingInput));

/* Composer */
const mainInput = document.getElementById('main-input');
const sendBtn = document.getElementById('send-btn');
function autosize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}
function updateSendState() {
  sendBtn.disabled = sending || !mainInput.value.trim().length;
}
mainInput.addEventListener('input', () => {
  autosize(mainInput);
  setDraft(mainInput.value);
  updateSendState();
});
mainInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
  if (e.key === 'Escape') {
    mainInput.value = '';
    setDraft('');
    updateSendState();
  }
});
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    mainInput.focus();
  }
});
sendBtn.addEventListener('click', async () => {
  const text = mainInput.value.trim();
  if (!text || sending) return;
  if (!currentTopicId) {
    const id = newTopic('New Chat');
    location.hash = '#/chat/' + encodeURIComponent(id);
  }
  appendMessage('user', text);
  mainInput.value = '';
  setDraft('');
  autosize(mainInput);
  updateSendState();
  await sendToServer(text);
});
function restoreDraft() {
  const d = getDraft();
  if (d) {
    mainInput.value = d;
    autosize(mainInput);
  }
  updateSendState();
}
restoreDraft();

/* Chat send – ONLY /api/engine1/ask */
async function sendToServer(text) {
  sending = true;
  updateSendState();
  showChat();
  showTyping();
  const langPref = localStorage.getItem('pref_lang') || 'auto';
  const consent = currentConsentValue();

  try {
    const body = {
      assistant: ASSISTANT_NAME,
      assistant_name: ASSISTANT_NAME,
      lang: langPref,
      consent,
      query: text,
      user: 'web'
    };
    const res = await authFetch('/api/engine1/ask', {
      method: 'POST',
      body: JSON.stringify(body)
    }, { timeoutMs: 15000 });

    let data = null;
    try { data = await res.json(); } catch { }
    let reply = pickResponse(data);
    if (!reply && data && (data.detail || data.error)) {
      reply = String(data.detail || data.error);
    }
    if (!reply) {
      reply = 'Engine returned empty reply.';
    }
    reply = sanitizeBotText(reply);
    hideTyping();
    typeWriteBot(reply);
    serverOnline = true;
    updateMeta();
  } catch (e) {
    hideTyping();
    const msg = e && e.message ? e.message : 'Network error';
    banner(msg);
    typeWriteBot(msg);
    serverOnline = false;
    updateMeta();
  } finally {
    sending = false;
    updateSendState();
  }
}

/* Scroll pill */
const chatArea = document.getElementById('chat-area');
const toBottom = document.getElementById('to-bottom');
function isAtBottom() {
  return chatArea.scrollHeight - chatArea.scrollTop - chatArea.clientHeight < 8;
}
function autoScroll(force = false) {
  if (force || isAtBottom())
    chatArea.scrollTop = chatArea.scrollHeight;
  toggleBottomPill();
}
function toggleBottomPill() {
  toBottom.classList.toggle('show', !isAtBottom());
}
chatArea.addEventListener('scroll', toggleBottomPill);
toBottom.addEventListener('click', () => autoScroll(true));

/* Export */
document.getElementById('export-topic').addEventListener('click', () => {
  const t = topics.find(x => x.id === currentTopicId);
  if (!t) return banner('No conversation to export.');
  let out = '';
  t.messages.forEach(m => {
    const who = m.from === 'user' ? 'You' : ASSISTANT_NAME;
    out += `${who} • ${formatFull(m.timestamp)}\n${m.message}\n\n`;
  });
  const blob = new Blob([out], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(t.title || 'chat').replace(/\s+/g, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

/* Usage */
function renderStorageUsage() {
  const size = (JSON.stringify(topics || []).length || 0);
  const kb = Math.round(size / 1024);
  const el = document.getElementById('usg-local');
  if (el) el.innerText = `${kb} KB`;
  const meta = document.getElementById('meta-info');
  if (meta) {
    meta.innerText = `${serverOnline ? 'Online' : 'Offline'} • Local: ${kb} KB`;
    meta.style.color = serverOnline ? '#9fe870' : '#ffb3b3';
  }
}
function updateUsage() {
  const conv = topics.length;
  const msg = topics.reduce((n, t) => n + (t.messages?.length || 0), 0);
  const last = topics[0]?.messages?.slice(-1)[0]?.timestamp || Date.now();
  const c1 = document.getElementById('usg-conv');
  if (c1) c1.innerText = conv;
  const c2 = document.getElementById('usg-msg');
  if (c2) c2.innerText = msg;
  const c3 = document.getElementById('usg-last');
  if (c3) c3.innerText = new Date(last).toLocaleString();
  renderStorageUsage();
}

/* Optional: server history */
async function loadHistoryFromServer() {
  try {
    const res = await authFetch('/api/chat/history');
    const data = await res.json();
    const h = Array.isArray(data.history) ? data.history : (data || []);
    if (h.length) {
      const serverTopic = {
        id: 'server_' + Date.now(),
        title: 'Server History',
        created_at: Date.now(),
        messages: h.map(it => ({
          id: uid(),
          from: it.from === ASSISTANT_NAME ? 'bot' : (it.from === 'VedSAAS' ? 'bot' : 'user'),
          message: it.message,
          timestamp: it.timestamp || Date.now()
        }))
      };
      topics = topics.filter(t => t.id !== serverTopic.id);
      topics.unshift(serverTopic);
      saveTopicsToLocal();
      renderHistory();
      renderChat();
      updateUsage();
    }
  } catch { }
}

/* Boot */
(function boot() {
  document.getElementById('brand-title').textContent = ASSISTANT_NAME;
  loadTopicsFromLocal();
  document.getElementById('app').style.display = 'flex';
  renderHistory();
  renderChat();
  handleRoute();
  updateUsage();
  startPinger();

  const pref = localStorage.getItem('pref_theme');
  if (pref === 'dark') document.body.classList.add('dark-mode');
  else if (pref === 'light') document.body.classList.remove('dark-mode');
  else if (pref === 'system') {
    const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark-mode', prefersDark);
  }
})();
