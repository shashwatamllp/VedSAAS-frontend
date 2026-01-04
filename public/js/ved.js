export function ready(fn){document.readyState!=='loading'?fn():document.addEventListener('DOMContentLoaded',fn)}
export async function include(sel, url){
  try{
    const r = await fetch(url,{cache:'no-cache'});
    if(!r.ok) throw new Error(r.status);
    document.querySelector(sel).innerHTML = await r.text();
  }catch(e){ console.warn('include failed', url, e); }
}
export function goto(href){ window.location.href = href; }
