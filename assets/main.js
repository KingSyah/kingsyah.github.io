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
  for (let i = 0; i < 160; i++) {
    stars.push({
      x:       Math.random() * W,
      y:       Math.random() * H,
      r:       Math.random() * 1.2,
      o:       Math.random() * 0.6 + 0.1,
      twinkle: Math.random() * Math.PI * 2
    });
  }
}

function drawStars() {
  ctx.clearRect(0, 0, W, H);
  stars.forEach(s => {
    s.twinkle += 0.015;
    const opacity = s.o * (0.6 + 0.4 * Math.sin(s.twinkle));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 220, 255, ${opacity})`;
    ctx.fill();
  });
  requestAnimationFrame(drawStars);
}

window.addEventListener('resize', () => { resize(); initStars(); });
resize();
initStars();
requestAnimationFrame(drawStars);

/* ── CURSOR ── */
const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

function animateCursor() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
  ring.style.left   = rx + 'px';
  ring.style.top    = ry + 'px';
  requestAnimationFrame(animateCursor);
}
animateCursor();

/* ── ORBIT SYSTEM ── */
(function () {
  const c   = document.getElementById('orbitCanvas');
  const ctx = c.getContext('2d');

  const PLANETS = [
    { a: 0.0,  orb: 90,  spd: 0.0008,  r: 5, color: '#6a9fd8' },
    { a: 1.2,  orb: 148, spd: 0.0005,  r: 8, color: '#4ac98a' },
    { a: 2.7,  orb: 210, spd: 0.0003,  r: 6, color: '#e07b54' },
    { a: 0.8,  orb: 275, spd: 0.00015, r: 9, color: '#a374d5' },
  ];
  const trails = PLANETS.map(() => []);
  let W, H, cx, cy, raf;

  function resize() {
    W = c.width  = c.offsetWidth  * devicePixelRatio;
    H = c.height = c.offsetHeight * devicePixelRatio;
    cx = W * 0.62;
    cy = H * 0.5;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const dpr = devicePixelRatio;

    // Orbit rings
    PLANETS.forEach(p => {
      ctx.beginPath();
      ctx.arc(cx, cy, p.orb * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.045)';
      ctx.lineWidth   = 1;
      ctx.stroke();
    });

    // Sun glow
    const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 54 * dpr);
    sg.addColorStop(0, 'rgba(210,175,80,0.55)');
    sg.addColorStop(1, 'rgba(210,175,80,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, 54 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = sg;
    ctx.fill();

    // Sun body
    ctx.beginPath();
    ctx.arc(cx, cy, 18 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = '#d4aa55';
    ctx.fill();

    // Planets + trails
    PLANETS.forEach((p, i) => {
      p.a += p.spd;
      const px = cx + Math.cos(p.a) * p.orb * dpr;
      const py = cy + Math.sin(p.a) * p.orb * dpr;

      trails[i].push({ x: px, y: py });
      if (trails[i].length > 44) trails[i].shift();

      // Trail
      for (let t = 1; t < trails[i].length; t++) {
        const alpha = (t / trails[i].length) * 0.3;
        ctx.beginPath();
        ctx.moveTo(trails[i][t-1].x, trails[i][t-1].y);
        ctx.lineTo(trails[i][t].x,   trails[i][t].y);
        ctx.strokeStyle = hexAlpha(p.color, alpha);
        ctx.lineWidth   = p.r * dpr * 0.55;
        ctx.stroke();
      }

      // Planet glow
      const pg = ctx.createRadialGradient(px, py, 0, px, py, p.r * 2.8 * dpr);
      pg.addColorStop(0, hexAlpha(p.color, 0.55));
      pg.addColorStop(1, hexAlpha(p.color, 0));
      ctx.beginPath();
      ctx.arc(px, py, p.r * 2.8 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = pg;
      ctx.fill();

      // Planet body
      ctx.beginPath();
      ctx.arc(px, py, p.r * dpr, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });

    raf = requestAnimationFrame(draw);
  }

  function hexAlpha(hex, alpha) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  resize();
  window.addEventListener('resize', resize);

  // Pause when hero is off-screen
  const hero = document.querySelector('.hero');
  new IntersectionObserver(entries => {
    entries[0].isIntersecting
      ? (raf = requestAnimationFrame(draw))
      : cancelAnimationFrame(raf);
  }, { threshold: 0 }).observe(hero);
})();

/* ── FOOTER YEAR ── */
document.getElementById('footerYear').textContent = new Date().getFullYear();

/* ── NEWS SLIDESHOW ── */
const FEED_URL = 'https://feeds.bbci.co.uk/news/world/rss.xml';
const PROXIES  = [
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
];

async function fetchFeed(url) {
  for (const proxy of PROXIES) {
    try {
      const r = await fetch(proxy(url), { signal: AbortSignal.timeout(6000) });
      if (r.ok) return r.text();
    } catch {}
  }
  return null;
}

function parseRSS(xml) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  return [...doc.querySelectorAll('item')].slice(0, 8).map(item => {
    // BBC puts summary in <description>, strip HTML tags
    const rawDesc = item.querySelector('description')?.textContent || '';
    const desc    = rawDesc.replace(/<[^>]+>/g, '').trim();
    return {
      title:  item.querySelector('title')?.textContent?.trim() || '',
      link:   item.querySelector('link')?.textContent?.trim()  || '#',
      desc:   desc || 'No summary available.',
      date:   item.querySelector('pubDate')?.textContent || '',
    };
  }).filter(i => i.title);
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 36e5);
  const d = Math.floor(diff / 864e5);
  if (h < 1)  return 'just now';
  if (h < 24) return h + 'h ago';
  return d + 'd ago';
}

// Slideshow state
let slides   = [];
let current  = 0;
let playing  = true;
let timer    = null;
const DELAY  = 6000; // ms per slide
let progress = 0;
let progTimer = null;

function showSlide(idx) {
  document.querySelectorAll('.slide').forEach((s, i) => {
    s.classList.toggle('active', i === idx);
  });
  document.getElementById('slideCounter').textContent =
    `${idx + 1} / ${slides.length}`;
  // reset progress bar
  progress = 0;
  document.querySelector('.slide-progress-bar').style.transform = 'scaleX(0)';
}

function startProgress() {
  clearInterval(progTimer);
  progress = 0;
  progTimer = setInterval(() => {
    progress = Math.min(progress + (100 / (DELAY / 80)), 100);
    document.querySelector('.slide-progress-bar').style.transform =
      `scaleX(${progress / 100})`;
  }, 80);
}

function startAuto() {
  clearInterval(timer);
  startProgress();
  timer = setInterval(() => {
    current = (current + 1) % slides.length;
    showSlide(current);
    startProgress();
  }, DELAY);
}

function stopAuto() {
  clearInterval(timer);
  clearInterval(progTimer);
}

function buildSlideshow(items) {
  slides = items;
  const track = document.getElementById('slideTrack');

  track.innerHTML = items.map(item => `
    <div class="slide">
      <div class="slide-source">BBC World · ${timeAgo(item.date)}</div>
      <div class="slide-title">${item.title}</div>
      <div class="slide-desc">${item.desc}</div>
      <a href="${item.link}" target="_blank" rel="noopener" class="slide-link">Read full story ↗</a>
      <div class="slide-progress"><div class="slide-progress-bar"></div></div>
    </div>
  `).join('');

  showSlide(0);
  document.getElementById('slideshow').classList.add('ready');
  document.getElementById('newsLoading').style.display = 'none';

  if (playing) startAuto();

  document.getElementById('slidePrev').addEventListener('click', () => {
    current = (current - 1 + slides.length) % slides.length;
    showSlide(current);
    if (playing) startAuto();
  });

  document.getElementById('slideNext').addEventListener('click', () => {
    current = (current + 1) % slides.length;
    showSlide(current);
    if (playing) startAuto();
  });

  document.getElementById('slidePlay').addEventListener('click', () => {
    const btn = document.getElementById('slidePlay');
    playing = !playing;
    btn.textContent = playing ? '⏸' : '▶';
    playing ? startAuto() : stopAuto();
  });

  // Pause on hover
  document.getElementById('slideshow').addEventListener('mouseenter', stopAuto);
  document.getElementById('slideshow').addEventListener('mouseleave', () => {
    if (playing) startAuto();
  });
}

// Load when section enters viewport
const newsObserver = new IntersectionObserver(async entries => {
  if (!entries[0].isIntersecting) return;
  newsObserver.disconnect();

  const xml = await fetchFeed(FEED_URL);
  if (!xml) {
    document.getElementById('newsLoading').innerHTML =
      '<span class="news-error">Feed unavailable.</span>';
    return;
  }
  const items = parseRSS(xml);
  if (!items.length) {
    document.getElementById('newsLoading').innerHTML =
      '<span class="news-error">No stories found.</span>';
    return;
  }
  buildSlideshow(items);
}, { threshold: 0.1 });

const newsSection = document.getElementById('news');
if (newsSection) newsObserver.observe(newsSection);
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));
