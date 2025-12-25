/* Settings + userpage */
const settingsHeader = document.getElementById('settings-header');
const settingsPanel = document.getElementById('settings-panel');
const settingsCaret = document.getElementById('settings-caret');
const userPage = document.getElementById('userpage');
const userPageClose = document.getElementById('userpage-close');

settingsHeader.addEventListener('click', () => {
  userPage.classList.add('show');
  userPage.querySelectorAll('.aside .nav button').forEach(b => b.classList.remove('active'));
  const btn = userPage.querySelector('.aside .nav button[data-tab="account"]');
  if (btn) btn.classList.add('active');
  userPage.querySelectorAll('.main section').forEach(sec => {
    sec.style.display = (sec.getAttribute('data-panel') === 'account') ? 'block' : 'none';
  });
  loadUserPage();
});
settingsCaret.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = settingsPanel.style.display === 'block';
  settingsPanel.style.display = open ? 'none' : 'block';
  settingsCaret.classList.toggle('fa-chevron-up', !open);
});
userPage.querySelector('.backdrop').addEventListener('click', () => userPage.classList.remove('show'));
userPageClose.addEventListener('click', () => userPage.classList.remove('show'));
document.getElementById('profile-open').addEventListener('click', () => {
  userPage.classList.add('show');
  loadUserPage();
});
Array.from(userPage.querySelectorAll('.aside .nav button[data-tab]')).forEach(btn => {
  btn.addEventListener('click', () => {
    userPage.querySelectorAll('.aside .nav button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.getAttribute('data-tab');
    userPage.querySelectorAll('.main section').forEach(sec => {
      sec.style.display = (sec.getAttribute('data-panel') === tab) ? 'block' : 'none';
    });
  });
});

/* Auth handlers */
document.getElementById('login-submit').addEventListener('click', async () => {
  const identifier = document.getElementById('login-identifier').value.trim();
  const password = document.getElementById('login-password').value;
  if (!identifier || !password) { banner('Enter identifier & password'); return; }
  try {
    const res = await fetch(api('/api/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (res.ok) {
      if (data.token) {
        token = data.token;
        localStorage.setItem('token', token);
      } else {
        token = null;
        localStorage.removeItem('token');
      }
      const name = data.name || identifier;
      localStorage.setItem('user_name', name);
      localStorage.setItem('user_email', data.email || '');
      localStorage.setItem('user_mobile', data.mobile || '');
      setDisplayName(name);
      setAccountInfo({ email: data.email || '', mobile: data.mobile || '' });
      hideAuth();
      renderHistory();
      renderChat();
      handleRoute();
      loadHistoryFromServer();
      updateUsage();
      maybeShowConsent();
    } else {
      banner(data.error || 'Login failed');
    }
  } catch {
    banner('Server unreachable');
  }
});
document.getElementById('open-register').addEventListener('click', e => {
  e.preventDefault();
  showAuth('register');
});
document.getElementById('open-login').addEventListener('click', e => {
  e.preventDefault();
  showAuth('login');
});
document.getElementById('reg-send-otp').addEventListener('click', async () => {
  const ident = document.getElementById('reg-identifier').value.trim();
  if (!ident) return banner('Enter email or mobile');
  try {
    const r = await fetch(api('/api/send-otp'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ identifier: ident })
    });
    const d = await r.json();
    banner(d.message || d.error || 'Done');
    if (r.ok) document.getElementById('reg-otp').disabled = false;
  } catch {
    banner('Server unreachable');
  }
});
document.getElementById('reg-submit').addEventListener('click', async () => {
  const name = document.getElementById('reg-name').value.trim();
  const ident = document.getElementById('reg-identifier').value.trim();
  const pass = document.getElementById('reg-password').value;
  if (!name || !ident || !pass) return banner('Fill all fields');
  try {
    const r = await fetch(api('/api/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name,
        email: (ident.includes('@') ? ident : null),
        mobile: (!ident.includes('@') ? ident : null),
        password: pass
      })
    });
    const d = await r.json();
    if (r.ok) {
      document.getElementById('verify-identifier').value = ident;
      showAuth('verify');
      banner('Registered. OTP sent.');
    } else {
      banner(d.error || 'Registration failed');
    }
  } catch {
    banner('Server unreachable');
  }
});
document.getElementById('verify-submit').addEventListener('click', async () => {
  const ident = document.getElementById('verify-identifier').value.trim();
  const otp = document.getElementById('verify-otp').value.trim();
  if (!ident || !otp) return banner('Enter identifier & OTP');
  try {
    const r = await fetch(api('/api/verify-otp'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ identifier: ident, otp })
    });
    const d = await r.json();
    if (r.ok) {
      if (d.token) {
        token = d.token;
        localStorage.setItem('token', token);
      } else {
        token = null;
        localStorage.removeItem('token');
      }
      const name = d.name || ident;
      localStorage.setItem('user_name', name);
      localStorage.setItem('user_email', d.email || '');
      localStorage.setItem('user_mobile', d.mobile || '');
      setDisplayName(name);
      setAccountInfo({ email: d.email || '', mobile: d.mobile || '' });
      hideAuth();
      renderHistory();
      renderChat();
      handleRoute();
      loadHistoryFromServer();
      updateUsage();
      maybeShowConsent();
    } else {
      banner(d.error || 'Verification failed');
    }
  } catch {
    banner('Server unreachable');
  }
});
document.getElementById('verify-resend').addEventListener('click', async () => {
  const ident = document.getElementById('verify-identifier').value.trim();
  if (!ident) return banner('Missing identifier');
  try {
    const r = await fetch(api('/api/send-otp'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ identifier: ident })
    });
    const d = await r.json();
    banner(d.message || d.error || 'Done');
  } catch {
    banner('Server unreachable');
  }
});

/* Training consent popup buttons */
document.getElementById('consent-yes').addEventListener('click', () => {
  localStorage.setItem('train_consent', 'yes');
  document.getElementById('consent-overlay').style.display = 'none';
  banner('Thanks for helping improve VedSAAS.');
});
document.getElementById('consent-no').addEventListener('click', () => {
  localStorage.setItem('train_consent', 'no');
  document.getElementById('consent-overlay').style.display = 'none';
  banner('Your chats will not be used for training.');
});

/* Theme + prefs + profile */
document.getElementById('dark-toggle').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

async function doLogout() {
  try {
    await fetch(api('/api/logout'), { method: 'POST', credentials: 'include' });
  } catch { }
  try { localStorage.clear(); } catch { }
  token = null;
  try { document.getElementById('userpage').classList.remove('show'); } catch { }
  showAuth('login');
  banner('Logged out');
}
document.getElementById('logout-btn').addEventListener('click', doLogout);
document.getElementById('userpage-logout').addEventListener('click', doLogout);
document.getElementById('new-topic').addEventListener('click', () => {
  const id = newTopic('New Chat');
  location.hash = '#/chat/' + encodeURIComponent(id);
  renderChat();
  document.getElementById('main-input').focus();
});
document.getElementById('refresh-history').addEventListener('click', () => loadHistoryFromServer());
document.getElementById('top-delete-chat').addEventListener('click', deleteCurrentChat);
document.getElementById('delete-topic').addEventListener('click', deleteCurrentChat);
document.getElementById('clear-all-chats').addEventListener('click', clearAllChats);

async function loadUserPage() {
  const nameLS = localStorage.getItem('user_name') || 'User';
  const handleLS = localStorage.getItem('user_handle') || '';
  const emailLS = localStorage.getItem('user_email') || '';
  const mobileLS = localStorage.getItem('user_mobile') || '';
  const planLS = localStorage.getItem('user_plan') || 'Free';
  const pfName = document.getElementById('pf-name');
  const pfHandle = document.getElementById('pf-handle');
  const acEmail = document.getElementById('ac-email');
  const acMobile = document.getElementById('ac-mobile');
  const planLbl = document.getElementById('plan-label');
  const acPlanLbl = document.getElementById('ac-plan-label');
  if (pfName) pfName.value = nameLS;
  if (pfHandle) pfHandle.value = handleLS;
  if (acEmail) acEmail.value = emailLS;
  if (acMobile) acMobile.value = mobileLS;
  if (planLbl) planLbl.innerHTML = `<i class="fas fa-crown"></i><span style="margin-left:6px">${planLS}</span>`;
  if (acPlanLbl) acPlanLbl.innerText = planLS;

  const langPref = localStorage.getItem('pref_lang') || 'auto';
  const typePref = localStorage.getItem('pref_type_speed') || '55';
  const selLang = document.getElementById('pref-lang');
  const selType = document.getElementById('pref-type-speed');
  const selTrain = document.getElementById('pref-train-consent');
  if (selLang) selLang.value = langPref;
  if (selType) selType.value = typePref;
  if (selTrain) selTrain.value = currentConsentValue();

  if (token) {
    try {
      const r = await authFetch('/api/user-profile');
      if (r.ok) {
        const d = await r.json();
        if (d.name) {
          if (pfName) pfName.value = d.name;
          localStorage.setItem('user_name', d.name);
          setDisplayName(d.name);
        }
        if (d.handle) {
          if (pfHandle) pfHandle.value = d.handle;
          localStorage.setItem('user_handle', d.handle);
        }
        if (d.email) {
          if (acEmail) acEmail.value = d.email;
          localStorage.setItem('user_email', d.email);
        }
        if (d.mobile) {
          if (acMobile) acMobile.value = d.mobile;
          localStorage.setItem('user_mobile', d.mobile);
        }
        if (d.plan) {
          if (planLbl) planLbl.innerHTML = `<i class="fas fa-crown"></i><span style="margin-left:6px">${d.plan}</span>`;
          if (acPlanLbl) acPlanLbl.innerText = d.plan;
          localStorage.setItem('user_plan', d.plan);
        }
        if (d.avatar_url) {
          localStorage.setItem('user_avatar_url', d.avatar_url);
          setDisplayName(localStorage.getItem('user_name') || 'User');
        }
      }
    } catch { }
  }
}
document.getElementById('pf-save').addEventListener('click', async () => {
  const name = document.getElementById('pf-name').value.trim() || 'User';
  const handle = document.getElementById('pf-handle').value.trim();
  localStorage.setItem('user_name', name);
  localStorage.setItem('user_handle', handle);
  setDisplayName(name);
  if (token) {
    try {
      const r = await authFetch('/api/user/profile', {
        method: 'POST',
        body: JSON.stringify({ name, handle })
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        banner(d.error || 'Saved locally');
      } else {
        banner('Profile saved');
      }
    } catch {
      banner('Saved locally');
    }
  } else {
    banner('Profile saved locally');
  }
});
document.getElementById('pf-avatar').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  localStorage.setItem('user_avatar_url', url);
  setDisplayName(localStorage.getItem('user_name') || 'User');
  if (token) {
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const r = await fetch(api('/api/user/avatar'), {
        method: 'POST',
        body: fd,
        credentials: 'include',
        headers: token ? { 'X-API-Token': token } : {}
      });
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        if (d.url) {
          localStorage.setItem('user_avatar_url', d.url);
          setDisplayName(localStorage.getItem('user_name') || 'User');
        }
        banner('Avatar updated');
      } else {
        banner('Avatar set locally');
      }
    } catch {
      banner('Avatar set locally');
    }
  }
});
document.getElementById('pf-avatar-remove').addEventListener('click', () => {
  localStorage.removeItem('user_avatar_url');
  setDisplayName(localStorage.getItem('user_name') || 'User');
  banner('Avatar removed');
});
document.getElementById('pref-theme-dark').addEventListener('click', () => {
  localStorage.setItem('pref_theme', 'dark');
  document.body.classList.add('dark-mode');
  banner('Theme: Dark');
});
document.getElementById('pref-theme-light').addEventListener('click', () => {
  localStorage.setItem('pref_theme', 'light');
  document.body.classList.remove('dark-mode');
  banner('Theme: Light');
});
document.getElementById('pref-theme-system').addEventListener('click', () => {
  localStorage.setItem('pref_theme', 'system');
  const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
  document.body.classList.toggle('dark-mode', prefersDark);
  banner('Theme: System');
});
document.getElementById('pref-save').addEventListener('click', async () => {
  const lang = document.getElementById('pref-lang').value;
  const speed = document.getElementById('pref-type-speed').value;
  const train = document.getElementById('pref-train-consent').value;
  localStorage.setItem('pref_lang', lang);
  localStorage.setItem('pref_type_speed', String(speed));
  if (train === 'unset') {
    localStorage.setItem('train_consent', 'unset');
  } else {
    localStorage.setItem('train_consent', train);
  }
  banner('Preferences saved');
  maybeShowConsent();
  if (token) {
    try {
      await authFetch('/api/user/preferences', {
        method: 'POST',
        body: JSON.stringify({
          lang,
          typing_speed: Number(speed),
          train_consent: train
        })
      });
    } catch { }
  }
});

/* Initial login check after scripts load */
checkLoginAndOpen();
