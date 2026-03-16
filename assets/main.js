/* ============================================================
   kingsyah.github.io — main.js
   ============================================================ */

/* ── STARFIELD ── */
const canvas = document.getElementById('starfield');
const ctx    = canvas.getContext('2d');
let stars = [], W, H;

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

function initStars() {
  stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x:       Math.random() * W,
      y:       Math.random() * H,
      r:       Math.random() * 1.5,
      o:       Math.random(),
      speed:   Math.random() * 0.3 + 0.05,
      twinkle: Math.random() * Math.PI * 2
    });
  }
}

function drawStars() {
  ctx.clearRect(0, 0, W, H);
  stars.forEach(s => {
    s.twinkle += 0.02;
    const opacity = s.o * (0.5 + 0.5 * Math.sin(s.twinkle));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180, 210, 255, ${opacity})`;
    ctx.fill();
    s.y -= s.speed;
    if (s.y < 0) { s.y = H; s.x = Math.random() * W; }
  });
  requestAnimationFrame(drawStars);
}

window.addEventListener('resize', () => { resize(); initStars(); });
resize();
initStars();
requestAnimationFrame(drawStars);

/* ── CUSTOM CURSOR ── */
const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

function animateCursor() {
  rx += (mx - rx) * 0.15;
  ry += (my - ry) * 0.15;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
  ring.style.left   = rx + 'px';
  ring.style.top    = ry + 'px';
  requestAnimationFrame(animateCursor);
}
animateCursor();

document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => {
    ring.style.transform   = 'translate(-50%,-50%) scale(1.6)';
    ring.style.borderColor = 'rgba(0,229,192,0.6)';
  });
  el.addEventListener('mouseleave', () => {
    ring.style.transform   = 'translate(-50%,-50%) scale(1)';
    ring.style.borderColor = 'rgba(74,143,255,0.5)';
  });
});

/* ── SCROLL REVEAL ── */
const reveals = document.querySelectorAll('.reveal');
const io = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
reveals.forEach(el => io.observe(el));
