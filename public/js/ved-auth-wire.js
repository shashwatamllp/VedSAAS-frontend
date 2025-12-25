/* /public/js/ved-auth-wire.js */
(() => {
  // ── API base detect ──
  // ── API base detect ──
  const API_BASE = (() => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://127.0.0.1:8000';
    }
    return 'https://api.vedsaas.com';
  })();
  const api = p => {
    let x = String(p || ''); if (!x.startsWith('/')) x = '/' + x;
    if (API_BASE.endsWith('/api') && x.startsWith('/api')) x = x.replace(/^\/api\b/, '');
    return API_BASE + x;
  };
  const banner = (msg) => {
    let b = document.getElementById('banner');
    if (!b) {
      b = document.createElement('div'); b.id = 'banner';
      b.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);background:#1f2937;color:#fff;padding:10px 14px;border-radius:8px;z-index:9999;display:none';
      document.body.appendChild(b);
    }
    b.textContent = String(msg || ''); b.style.display = 'block'; setTimeout(() => b.style.display = 'none', 2200);
  };
  async function authFetch(path, opts = {}, { timeoutMs = 12000 } = {}) {
    const token = localStorage.getItem('token') || null;
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(api(path), {
      ...opts, signal: ctrl.signal, credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}), ...(token ? { 'Authorization': 'Bearer ' + token } : {}) }
    });
    clearTimeout(t);
    if (!res.ok) {
      let text = ''; try { text = await res.text(); } catch { }
      throw new Error(`HTTP ${res.status} ${res.statusText} — ${(text || '').slice(0, 160)}`);
    }
    return res;
  }

  // ── LOGIN ──  expects form#login-form with inputs [name=identifier],[name=password]
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      const identifier = String(fd.get('identifier') || '').trim();
      const password = String(fd.get('password') || '');
      if (!identifier || !password) return banner('Enter identifier & password');
      try {
        const r = await fetch(api('/api/login'), {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password })
        });
        const d = await r.json();
        if (r.ok) {
          if (d.token) localStorage.setItem('token', d.token);
          if (d.name) localStorage.setItem('user_name', d.name);
          if (d.email) localStorage.setItem('user_email', d.email);
          if (d.mobile) localStorage.setItem('user_mobile', d.mobile);
          banner('Logged in'); location.href = '/index.html';
        } else banner(d.error || 'Login failed');
      } catch (err) { banner(err.message || 'Network error'); }
    });
  }

  // ── REGISTER ── expects form#reg-form with inputs [name=name],[name=identifier],[name=password],[name=otp?]
  const regForm = document.getElementById('reg-form');
  if (regForm) {
    const sendOtpBtn = document.getElementById('reg-send-otp');
    if (sendOtpBtn) {
      sendOtpBtn.addEventListener('click', async () => {
        const ident = String((new FormData(regForm).get('identifier') || '')).trim();
        if (!ident) return banner('Enter email or mobile');
        try {
          const r = await fetch(api('/api/send-otp'), {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: ident })
          });
          const d = await r.json(); banner(d.message || d.error || 'Sent');
          const otp = regForm.querySelector('[name=otp]'); if (r.ok && otp) otp.disabled = false;
        } catch { banner('Network error'); }
      });
    }
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(regForm);
      const name = String(fd.get('name') || '').trim();
      const ident = String(fd.get('identifier') || '').trim();
      const pass = String(fd.get('password') || '');
      if (!name || !ident || !pass) return banner('Fill all fields');
      const body = { name, email: ident.includes('@') ? ident : null, mobile: ident.includes('@') ? null : ident, password: pass };
      try {
        const r = await fetch(api('/api/register'), {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
        const d = await r.json();
        if (r.ok) {
          const otp = String(fd.get('otp') || '').trim();
          if (d.token) { localStorage.setItem('token', d.token); banner('Registered'); location.href = '/index.html'; return; }
          if (otp) {
            const vr = await fetch(api('/api/verify-otp'), {
              method: 'POST', credentials: 'include',
              headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: ident, otp })
            });
            const vd = await vr.json();
            if (vr.ok && vd.token) { localStorage.setItem('token', vd.token); banner('Verified'); location.href = '/index.html'; return; }
          }
          banner('Check OTP sent');
        } else banner(d.error || 'Registration failed');
      } catch (err) { banner(err.message || 'Network error'); }
    });
  }

  // ── VERIFY ── expects form#verify-form with inputs [name=identifier],[name=otp]
  const verifyForm = document.getElementById('verify-form');
  if (verifyForm) {
    verifyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(verifyForm);
      const ident = String(fd.get('identifier') || '').trim();
      const otp = String(fd.get('otp') || '').trim();
      if (!ident || !otp) return banner('Enter identifier & OTP');
      try {
        const r = await fetch(api('/api/verify-otp'), {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: ident, otp })
        });
        const d = await r.json();
        if (r.ok && d.token) { localStorage.setItem('token', d.token); banner('Verified'); location.href = '/index.html'; }
        else banner(d.error || 'Verification failed');
      } catch (err) { banner(err.message || 'Network error'); }
    });
    const resendBtn = document.getElementById('verify-resend');
    if (resendBtn) {
      resendBtn.addEventListener('click', async () => {
        const ident = String((new FormData(verifyForm).get('identifier') || '')).trim();
        if (!ident) return banner('Enter identifier');
        try {
          const r = await fetch(api('/api/send-otp'), {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: ident })
          });
          const d = await r.json(); banner(d.message || d.error || 'Sent');
        } catch { banner('Network error'); }
      });
    }
  }

  // ── PROFILE ── expects inputs with ids #pf-name, #pf-handle, #ac-email, #ac-mobile and buttons #pf-save, #pf-avatar, #pf-avatar-remove
  const pfSave = document.getElementById('pf-save');
  if (pfSave) {
    (async () => { // preload profile if available
      try {
        const r = await authFetch('/api/user-profile', { method: 'GET' });
        const d = await r.json();
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
        set('pf-name', d.name || localStorage.getItem('user_name'));
        set('pf-handle', d.handle || localStorage.getItem('user_handle'));
        set('ac-email', d.email || localStorage.getItem('user_email'));
        set('ac-mobile', d.mobile || localStorage.getItem('user_mobile'));
      } catch { }
    })();
    pfSave.addEventListener('click', async () => {
      const name = (document.getElementById('pf-name')?.value || 'User').trim();
      const handle = (document.getElementById('pf-handle')?.value || '').trim();
      localStorage.setItem('user_name', name); localStorage.setItem('user_handle', handle);
      try {
        const r = await authFetch('/api/user/profile', { method: 'POST', body: JSON.stringify({ name, handle }) });
        banner(r.ok ? 'Saved' : 'Saved locally');
      } catch { banner('Saved locally'); }
    });
    const pfAvatar = document.getElementById('pf-avatar');
    if (pfAvatar) {
      pfAvatar.addEventListener('change', async (e) => {
        const f = e.target.files?.[0]; if (!f) return;
        const fd = new FormData(); fd.append('avatar', f);
        try {
          const token = localStorage.getItem('token') || '';
          const r = await fetch(api('/api/user/avatar'), { method: 'POST', body: fd, credentials: 'include', headers: token ? { 'Authorization': 'Bearer ' + token } : {} });
          if (r.ok) { const d = await r.json().catch(() => ({})); if (d.url) localStorage.setItem('user_avatar_url', d.url); banner('Avatar updated'); } else banner('Avatar set locally');
        } catch { banner('Avatar set locally'); }
      });
    }
    const pfRem = document.getElementById('pf-avatar-remove');
    if (pfRem) { pfRem.addEventListener('click', () => { localStorage.removeItem('user_avatar_url'); banner('Avatar removed'); }); }
  }

  // ── SETTINGS ── expects #pref-lang, #pref-type-speed and buttons #pref-theme-*, #pref-save, #logout-btn
  const prefSave = document.getElementById('pref-save');
  if (prefSave) {
    const langSel = document.getElementById('pref-lang');
    const typeSel = document.getElementById('pref-type-speed');
    if (langSel) langSel.value = localStorage.getItem('pref_lang') || 'auto';
    if (typeSel) typeSel.value = localStorage.getItem('pref_type_speed') || '55';

    document.getElementById('pref-theme-dark')?.addEventListener('click', () => { localStorage.setItem('pref_theme', 'dark'); document.body.classList.add('dark-mode'); banner('Theme: Dark'); });
    document.getElementById('pref-theme-light')?.addEventListener('click', () => { localStorage.setItem('pref_theme', 'light'); document.body.classList.remove('dark-mode'); banner('Theme: Light'); });
    document.getElementById('pref-theme-system')?.addEventListener('click', () => { localStorage.setItem('pref_theme', 'system'); const d = matchMedia('(prefers-color-scheme: dark)').matches; document.body.classList.toggle('dark-mode', d); banner('Theme: System'); });

    prefSave.addEventListener('click', async () => {
      const lang = langSel?.value || 'auto';
      const speed = Number(typeSel?.value || '55');
      localStorage.setItem('pref_lang', lang);
      localStorage.setItem('pref_type_speed', String(speed));
      banner('Preferences saved');
      try { await authFetch('/api/user/preferences', { method: 'POST', body: JSON.stringify({ lang, typing_speed: speed }) }); } catch { }
    });

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      try { await authFetch('/api/logout', { method: 'POST' }); } catch { } localStorage.clear(); banner('Logged out'); location.href = '/public/login.html';
    });
  }
})();
