(function(){ 'use strict';

/* ===== Config ===== */ 
const API_BASE = (() => {
  const F = 'http://127.0.0.1:8000';
  try {
    const o = location.origin || '';
    if (!o || o.startsWith('file://')) return F;
    if (o.includes(':3000')) return F;
    if (o.includes(':8000')) return o;
    return o.startsWith('http') ? o : F;
  } catch { return F; }
})();

/* ===== Tiny helpers ===== */
const $ = (id) => document.getElementById(id);
const on = (id, ev, fn) => { const el = $(id); if (el) el.addEventListener(ev, fn); return !!el; };

const banner = (m) => { const b = $('banner'); if(!b) return; b.textContent = m; b.style.display = 'block'; clearTimeout(b._t); b._t = setTimeout(()=> b.style.display='none', 2500); };
const esc = (s) => String(s||'').replace(/[&<>"']/g, c => ({'&':'&','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mdLite(t){ let s=esc(t??''); s=s.replace(/(https?:\/\/[^\s]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>'); s=s.replace(/`([^`]+)`/g,'<code>$1</code>'); s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>'); s=s.replace(/\*([^*]+)\*/g,'<em>$1</em>'); return s.replace(/\n/g,'<br/>'); }
const uid = () => Math.random().toString(36).slice(2,9);
const formatFull = (ts)=>{ const d=ts?new Date(ts):new Date(); const z=n=>String(n).padStart(2,'0'); return `${z(d.getDate())}/${z(d.getMonth()+1)}/${d.getFullYear()}, ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`; };

// --- autosize shim (prevents "Identifier 'autosize' has already been declared") ---
const __autosize_local = (el)=>{ if(!el) return; el.style.height='44px'; el.style.height = Math.min(el.scrollHeight, 300)+'px'; };
const autosize = (typeof window !== 'undefined' && window.autosize) ? window.autosize : __autosize_local;

const autoScroll = (force)=>{ const area=$('chat-area'); if(!area) return; if(force) area.scrollTop = area.scrollHeight; };

/* ===== Auth fetch ===== */
let token = localStorage.getItem('token') || null;
async function authFetch(path, opts={}, {timeoutMs=12000}={}){
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(), timeoutMs);
  try{
    const res = await fetch(API_BASE+path, {
      ...opts,
      signal: ctrl.signal,
      headers: {
        ...(opts.headers||{}),
        ...(opts.body && typeof opts.body==='string' ? {'Content-Type':'application/json'} : {}),
        ...(token ? {'Authorization':'Bearer '+token} : {})
      }
    });
    return res;
  }catch(err){
    let m=String(err?.message||err);
    if(err.name==='AbortError') m='Server timeout — VedSAAS (8000) running?';
    else if(m.includes('Failed to fetch')) m='Connection failed — server down?';
    throw new Error(m);
  }finally{ clearTimeout(t); }
}

/* ===== State & Limits ===== */
let topics = [];
let currentTopicId = null;
let sending = false;

const MAX_LOCAL_BYTES = 2_000_000;
const TOPIC_HARD_LIMIT = 80;
const MSGS_PER_TOPIC_LIMIT = 200;

/* ===== Storage ===== */
const approxBytesOf = (o)=>{ try{return JSON.stringify(o).length;}catch{return 0;} };
function renderStorageUsage(){
  const meta = $('meta-info'); if(!meta) return;
  const sizeKB = Math.round(approxBytesOf(topics)/1024);
  meta.innerText = `Local: ${sizeKB} KB`;
}
function tryTrimForQuota(){
  if (topics.length > TOPIC_HARD_LIMIT) topics = topics.slice(0, TOPIC_HARD_LIMIT);
  topics.forEach(t => {
    if (Array.isArray(t.messages) && t.messages.length > MSGS_PER_TOPIC_LIMIT) {
      t.messages = t.messages.slice(-MSGS_PER_TOPIC_LIMIT);
    }
  });
  let size = approxBytesOf(topics);
  while (size > MAX_LOCAL_BYTES && topics.length > 1) { topics.pop(); size = approxBytesOf(topics); }
}
function saveTopicsToLocal(){
  try{
    tryTrimForQuota();
    localStorage.setItem('vedsaas_topics', JSON.stringify(topics));
    localStorage.setItem('vedsaas_current', currentTopicId||'');
  }catch{}
  renderStorageUsage();
}
function loadTopicsFromLocal(){
  try{ topics = JSON.parse(localStorage.getItem('vedsaas_topics')||'[]'); }catch{ topics=[]; }
  try{ currentTopicId = localStorage.getItem('vedsaas_current') || (topics[0]&&topics[0].id) || null; }catch{ currentTopicId = (topics[0]&&topics[0].id)||null; }
}

/* ===== UI toggles ===== */
function setDisplayName(name){
  const u = name || 'User';
  const uname = $('settings-username'); if (uname) uname.innerText = u;
  const av = $('settings-avatar');
  if (av) av.textContent = u.split(/\s+/).map(x=>x[0]?.toUpperCase()||'').slice(0,2).join('');
}
function showLanding(){ const a=$('landing'), b=$('chat-shell'); if(a) a.style.display='flex'; if(b) b.style.display='none'; }
function showChat(){ const a=$('landing'), b=$('chat-shell'); if(a) a.style.display='none'; if(b) b.style.display='flex'; }
function showAuth(screen='login'){
  const ol=$('auth-overlay'), app=$('app');
  if(ol) ol.style.display='flex'; if(app) app.style.display='none';
  const l=$('login-screen'), v=$('verify-screen');
  if(l) l.style.display = screen==='login' ? 'block' : 'none';
  if(v) v.style.display = screen==='verify' ? 'block' : 'none';
}
function hideAuth(){
  const ol=$('auth-overlay'), app=$('app');
  if(ol) ol.style.display='none'; if(app) app.style.display='flex';
}

/* ===== History render ===== */
function renderHistory(){
  const list = $('history-list'); if(!list) return;
  list.innerHTML='';
  (topics||[]).forEach(t=>{
    const div=document.createElement('div');
    div.className='topic'+(t.id===currentTopicId?' active':''); div.dataset.id=t.id;
    const last = (t.messages && t.messages.length)? t.messages[t.messages.length-1] : null;
    let previewRaw = last ? (last.message ?? last.text ?? '') : '';
    const preview = esc(String(previewRaw)).replace(/\n/g,' ').slice(0,40);
    div.innerHTML = `<div style="font-weight:600">${esc(t.title||'Chat')}</div><div class="preview">${preview}</div>`;
    div.onclick=()=>{ currentTopicId=t.id; saveTopicsToLocal(); renderHistory(); renderChat(); showChat(); };
    list.appendChild(div);
  });
}
function messageNode(m){
  const wrap=document.createElement('div'); wrap.className='message-row '+(m.from==='user'?'from-user':'from-bot'); wrap.dataset.mid=m.id;
  const label=document.createElement('div'); label.className='msg-label';
  label.innerText=`${m.from==='user'?'You':'VedSAAS'} • ${formatFull(m.timestamp)}`;
  const body=document.createElement('div'); body.className='msg-body'; body.innerHTML=mdLite(String(m.message ?? ''));
  const act=document.createElement('div'); act.className='msg-actions';
  const btnCopy=document.createElement('button'); btnCopy.innerHTML='<i class="fas fa-copy"></i>'; btnCopy.title='Copy';
  btnCopy.onclick=()=>{ navigator.clipboard.writeText(String(m.message??'')); banner('Copied'); };
  act.append(btnCopy);
  const block=document.createElement('div'); block.append(label);
  wrap.append(body, act);
  return [block, wrap];
}
function renderChat(){
  const area=$('chat-area'); if(!area) return;
  area.innerHTML='';
  const topic=topics.find(t=>t.id===currentTopicId);
  if(!topic){
    area.innerHTML = `<div style="color:#bbb;text-align:center;margin-top:40px">No conversation selected.</div>`;
    return;
  }
  const header=document.createElement('div'); header.style.textAlign='center'; header.style.marginBottom='10px';
  header.innerHTML=`<strong style="font-size:18px">${esc(topic.title||'New Chat')}</strong>`;
  area.appendChild(header);
  topic.messages.forEach(m=>{ const [labelNode, row]=messageNode(m); area.appendChild(labelNode); area.appendChild(row); });
  autoScroll(true);
}

/* ===== Topic helpers ===== */
function newTopic(title='New Chat'){
  const id='t_'+Date.now();
  topics.unshift({id,title,created_at:Date.now(),messages:[]});
  currentTopicId=id; saveTopicsToLocal(); renderHistory(); renderChat();
  return id;
}
function appendMessage(from, message){
  const t=topics.find(x=>x.id===currentTopicId); if(!t) return;
  const m={id:uid(),from,message,timestamp:Date.now()};
  t.messages.push(m); saveTopicsToLocal(); return m;
}

/* ===== Composer ===== */
const mainInput = $('main-input');
const sendBtn = $('send-btn');
const updateSendState = ()=>{ if(sendBtn && mainInput) sendBtn.disabled = sending || !mainInput.value.trim().length; };

if (mainInput) {
  mainInput.addEventListener('input', ()=>{ autosize(mainInput); updateSendState(); });
  mainInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); if(sendBtn) sendBtn.click(); }});
}
if (sendBtn) {
  sendBtn.addEventListener('click', async ()=>{
    if(!mainInput) return;
    const text=mainInput.value.trim(); if(!text || sending) return;
    if(!currentTopicId){ newTopic('New Chat'); }
    appendMessage('user', text); mainInput.value=''; autosize(mainInput); updateSendState();
    await sendToServer(text);
  });
}

/* ===== Chat send ===== */
async function sendToServer(text){
  sending=true; updateSendState(); showTyping();
  try{
    const res = await authFetch('/api/chat', {method:'POST', body: JSON.stringify({ message: text })});
    hideTyping();
    let data=null; try{ data=await res.json(); }catch{}
    if(!res.ok || !data?.ok){
      const msg = (data&&data.error)||('HTTP '+res.status);
      banner(msg); typeWriteBot(msg||'No response'); return;
    }
    typeWriteBot(String(data.text||''));
  }catch(e){
    hideTyping(); banner(String(e.message||e)); typeWriteBot(String(e.message||e));
  }finally{
    sending=false; updateSendState();
  }
}
function showTyping(){
  let tip=document.querySelector('.typing-row');
  if(!tip){ tip=document.createElement('div'); tip.className='typing-row'; tip.innerHTML=`<span class="dots"><i></i><i></i><i></i></span> <span style="opacity:.8">VedSAAS is typing…</span>`; }
  const area=$('chat-area'); if(!area) return;
  if(tip.parentElement!==area) area.appendChild(tip);
  autoScroll(true);
}
function hideTyping(){ const tip=document.querySelector('.typing-row'); if(tip && tip.parentElement) tip.remove(); }
function typeWriteBot(text){
  hideTyping(); showChat();
  const t = topics.find(x=>x.id===currentTopicId); if(!t) return;
  const msgObj = { id: uid(), from:'bot', message:'', timestamp:Date.now() };
  t.messages.push(msgObj); saveTopicsToLocal(); renderChat();
  const area = $('chat-area'); if(!area) return;
  let el = area.querySelector(`.message-row.from-bot[data-mid="${msgObj.id}"]`);
  if(!el) el = Array.from(area.querySelectorAll('.message-row.from-bot')).pop();
  if(!el) return;
  const body = el.querySelector('.msg-body'); if(!body) return;
  const safe = (s)=> mdLite(s);
  const sp = Number(localStorage.getItem('pref_type_speed')||'55');
  if(sp<=0){ msgObj.message=text; saveTopicsToLocal(); body.innerHTML=safe(text); autoScroll(true); return; }
  const cursor=document.createElement('span'); cursor.className='typing-cursor'; body.textContent=''; body.appendChild(cursor);
  let i=0; const timer=setInterval(()=>{ 
    if(i>=text.length){ clearInterval(timer); msgObj.message=text; saveTopicsToLocal(); body.innerHTML=safe(text); autoScroll(true); return; }
    msgObj.message+=text[i++]; body.textContent=msgObj.message; body.appendChild(cursor); autoScroll(true);
  }, sp);
}

/* ===== Landing ===== */
on('landing-open-history','click', ()=>{
  if(!currentTopicId && topics[0]) currentTopicId=topics[0].id;
  renderHistory(); renderChat(); showChat();
});
on('landing-start','click', ()=>{
  const inp=$('landing-input'); if(!inp) return;
  const text=(inp.value||'').trim();
  if(!text) return;
  newTopic('New Chat'); appendMessage('user', text); inp.value=''; sendToServer(text);
});

/* ===== OTP overlay (guards) ===== */
on('login-send-otp','click', async ()=>{
  const id = ($('login-identifier')?.value||'').trim(); if(!id) return banner('Enter email/phone');
  try{
    const r = await fetch(API_BASE+'/api/send-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier:id})});
    const j = await r.json(); if(j.ok){
      banner('OTP sent');
      if ($('verify-identifier')) $('verify-identifier').value=id;
      if ($('verify-code')) $('verify-code').focus();
      if ($('login-screen')) $('login-screen').style.display='none';
      if ($('verify-screen')) $('verify-screen').style.display='block';
    } else banner(j.error||'Failed to send OTP');
  }catch(e){ banner('Network error'); }
});
on('verify-form','submit', async (e)=>{
  e.preventDefault();
  const id = ($('verify-identifier')?.value||'').trim();
  const code = ($('verify-code')?.value||'').trim();
  if(!id || !code) return banner('Enter id & OTP');
  try{
    const r = await fetch(API_BASE+'/api/verify-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier:id, otp:code})});
    const j = await r.json();
    if(j.ok && j.token){ token=j.token; localStorage.setItem('token', token); setDisplayName(j.name||'User'); banner('Logged in'); hideAuth(); }
    else banner(j.error||'Invalid OTP');
  }catch(e){ banner('Network error'); }
});

/* ===== Buttons etc (guards) ===== */
on('new-topic','click', ()=>{ newTopic('New Chat'); renderChat(); $('main-input')?.focus(); });
on('clear-all-chats','click', ()=>{
  if(!topics.length) return banner('No chats');
  if(!confirm('Clear ALL local chats?')) return;
  topics=[]; currentTopicId=null; saveTopicsToLocal(); renderHistory(); renderChat(); showLanding();
});
on('delete-topic','click', ()=>{
  if(!currentTopicId) return;
  topics = topics.filter(t=>t.id!==currentTopicId);
  currentTopicId=(topics[0]&&topics[0].id)||null;
  saveTopicsToLocal(); renderHistory(); renderChat(); if(!currentTopicId) showLanding();
});
on('top-delete-chat','click', ()=> $('delete-topic')?.click());
on('refresh-history','click', ()=> banner('Nothing to refresh (local only)'));
on('dark-toggle','click', ()=> document.body.classList.toggle('dark-mode'));
on('lang-toggle','click', ()=>{
  const current = localStorage.getItem('pref_lang') || 'auto';
  const order = ['auto','en','hi']; const next = order[(order.indexOf(current)+1)%order.length];
  localStorage.setItem('pref_lang', next); banner('Language: '+next.toUpperCase());
});
on('logout-btn','click', ()=>{ localStorage.removeItem('token'); token=null; banner('Logged out'); });

/* ===== Boot ===== */
(function boot(){
  // ensure app visible even if earlier HTML had display:none
  if ($('app')) $('app').style.display='flex';

  loadTopicsFromLocal();
  renderHistory(); renderChat(); renderStorageUsage();

  // theme
  const pref = localStorage.getItem('pref_theme');
  if(pref==='dark') document.body.classList.add('dark-mode');
  else if(pref==='light') document.body.classList.remove('dark-mode');

  // first view
  if(currentTopicId) showChat(); else showLanding();

  // (settings chip now opens settings.html via HTML onclick)
  setDisplayName(localStorage.getItem('pendingName') || 'User');
})();

})();
