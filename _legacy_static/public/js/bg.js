// bg.js — cosmic starfield + subtle orbiters (perf friendly)
const c = document.getElementById('bg');
const ctx = c.getContext('2d', { alpha: false });

// settings
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
let DPR = Math.min(window.devicePixelRatio || 1.5, 2);
let W = 0, H = 0;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1.5, 2);
  W = c.width  = Math.floor(innerWidth  * DPR);
  H = c.height = Math.floor(innerHeight * DPR);
  c.style.width  = innerWidth + 'px';
  c.style.height = innerHeight + 'px';
}
addEventListener('resize', resize, { passive: true });
resize();

// stars
const BASE = Math.min(260, Math.max(140, Math.floor((innerWidth * innerHeight) / 12000)));
const N = REDUCED ? Math.floor(BASE * 0.5) : BASE;

const stars = Array.from({ length: N }, () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  z: 0.25 + Math.random() * 0.9,           // depth
  r: 0.6 + Math.random() * 1.8,
  tw: Math.random() * Math.PI * 2
}));

// orbiters
const orbiters = REDUCED ? [] : [
  { R: 0.28, r: 6, speed:  0.04, hue: 220 }, // blue
  { R: 0.48, r: 4, speed: -0.03, hue:  45 }, // amber
  { R: 0.65, r: 3, speed:  0.02, hue: 300 }  // magenta
];

// mouse parallax (very subtle)
let mx = 0, my = 0, tx = 0, ty = 0;
addEventListener('mousemove', e => {
  const cx = innerWidth / 2, cy = innerHeight / 2;
  mx = (e.clientX - cx) / cx;  // -1..1
  my = (e.clientY - cy) / cy;
}, { passive: true });

let t0 = performance.now();
let running = true;
document.addEventListener('visibilitychange', () => {
  running = document.visibilityState === 'visible';
  if (running) { t0 = performance.now(); requestAnimationFrame(frame); }
});

function frame(now) {
  if (!running) return;
  const t = (now - t0) / 1000;

  // ease mouse target
  tx += (mx - tx) * 0.03;
  ty += (my - ty) * 0.03;

  // background gradient
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0,   '#080e24');
  g.addColorStop(0.5, '#0b1433');
  g.addColorStop(1,   '#0a1026');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // faint nebula
  ctx.globalCompositeOperation = 'lighter';
  const fog = ctx.createRadialGradient(W*0.65 + tx*80*DPR, H*0.2 + ty*50*DPR, 0,
                                       W*0.65 + tx*80*DPR, H*0.2 + ty*50*DPR, Math.min(W, H)*0.6);
  fog.addColorStop(0, 'rgba(77,107,255,0.08)');
  fog.addColorStop(1, 'rgba(77,107,255,0)');
  ctx.fillStyle = fog;
  ctx.beginPath(); ctx.arc(W*0.65 + tx*80*DPR, H*0.2 + ty*50*DPR, Math.min(W,H)*0.6, 0, Math.PI*2); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';

  // stars
  for (const s of stars) {
    s.tw += 0.02;
    const tw = 0.35 + 0.65 * (0.5 + Math.sin(s.tw) * 0.5);
    // parallax drift + mouse offset
    s.x = (s.x + 0.06*s.z + W) % W;
    const px = s.x + tx * (12 * s.z) * DPR;
    const py = s.y + ty * (8  * s.z) * DPR;

    ctx.globalAlpha = tw * s.z;
    ctx.fillStyle = '#cfe3ff';
    ctx.beginPath();
    ctx.arc(px, py, s.r * DPR * s.z, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // orbiters
  const cx = W * 0.5 + tx * 20 * DPR;
  const cy = H * 0.45 + ty * 14 * DPR;
  for (let i = 0; i < orbiters.length; i++) {
    const o = orbiters[i];
    const ang = t * o.speed + i * 2.1;
    const R = Math.min(W, H) * o.R;
    const x = cx + Math.cos(ang) * R;
    const y = cy + Math.sin(ang) * (R * 0.55);

    const gl = ctx.createRadialGradient(x, y, 0, x, y, o.r * 14 * DPR);
    gl.addColorStop(0, `hsla(${o.hue},100%,70%,0.22)`);
    gl.addColorStop(1, `hsla(${o.hue},100%,70%,0)`);
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, o.r * 14 * DPR, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = `hsl(${o.hue},100%,70%)`;
    ctx.beginPath(); ctx.arc(x, y, o.r * DPR, 0, Math.PI * 2); ctx.fill();
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
