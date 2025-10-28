// public/js/theme-toggle.js
(function(){
  const KEY = 'ved_theme';           // 'auto' | 'light' | 'dark'
  const html = document.documentElement;

  function apply(mode){
    html.setAttribute('data-theme', mode);
    document.body.classList.toggle(
      'light-theme',
      mode === 'light' || (mode === 'auto' && matchMedia('(prefers-color-scheme: light)').matches)
    );
  }

  function load(){
    const v = localStorage.getItem(KEY);
    return (v === 'light' || v === 'dark' || v === 'auto') ? v : 'auto';
  }

  function save(v){ try{ localStorage.setItem(KEY, v); }catch{} }

  function next(v){ return v === 'auto' ? 'light' : v === 'light' ? 'dark' : 'auto'; }

  // Init
  const start = load();
  apply(start);

  // React to system change if in auto
  const mq = matchMedia('(prefers-color-scheme: light)');
  mq.addEventListener?.('change', () => {
    if ((localStorage.getItem(KEY) || 'auto') === 'auto') apply('auto');
  });

  // Wait for DOM and wire button
  document.addEventListener('DOMContentLoaded',()=>{
    const btn = document.getElementById('theme-side-toggle');
    if(!btn) return;
    btn.addEventListener('click', ()=>{
      const v = next(load());
      save(v);
      apply(v);
    });
  });
})();
