/* ============================================================
   kingsyah.github.io — main.js  (v3 — multi-feed news)
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
  const count = window.innerWidth < 720 ? 100 : 220;
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.3,
      o: Math.random() * 0.5 + 0.2,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.03 + 0.008,
      // Some stars are brighter
      bright: Math.random() < 0.15
    });
  }
}

function drawStars() {
  ctx.clearRect(0, 0, W, H);
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    s.twinkle += s.twinkleSpeed;
    const pulse = s.bright ? (0.3 + 0.7 * Math.abs(Math.sin(s.twinkle))) : (0.6 + 0.4 * Math.sin(s.twinkle));
    const opacity = s.o * pulse;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 220, 255, ${opacity})`;
    ctx.fill();
    // Bright stars get a glow
    if (s.bright && opacity > 0.45) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 200, 255, ${opacity * 0.15})`;
      ctx.fill();
    }
  }
  drawMeteors();
  requestAnimationFrame(drawStars);
}

/* ── METEORS ── */
let meteors = [];

function spawnMeteor() {
  const x = Math.random() * W * 0.7;
  const y = Math.random() * H * 0.4;
  const angle = Math.PI * 0.15 + Math.random() * 0.3; // ~25-45 deg
  const speed = 8 + Math.random() * 6;
  const len = 60 + Math.random() * 80;
  meteors.push({
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 1,
    decay: 0.015 + Math.random() * 0.01,
    len,
    width: 1 + Math.random() * 1.5
  });
}

function drawMeteors() {
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.x += m.vx;
    m.y += m.vy;
    m.life -= m.decay;
    if (m.life <= 0) { meteors.splice(i, 1); continue; }

    const tailX = m.x - m.vx * (m.len / (Math.sqrt(m.vx*m.vx + m.vy*m.vy)));
    const tailY = m.y - m.vy * (m.len / (Math.sqrt(m.vx*m.vx + m.vy*m.vy)));

    const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
    grad.addColorStop(0, `rgba(255, 255, 255, ${m.life * 0.9})`);
    grad.addColorStop(0.3, `rgba(180, 210, 255, ${m.life * 0.5})`);
    grad.addColorStop(1, `rgba(100, 150, 255, 0)`);

    ctx.beginPath();
    ctx.moveTo(m.x, m.y);
    ctx.lineTo(tailX, tailY);
    ctx.strokeStyle = grad;
    ctx.lineWidth = m.width;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Head glow
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.width * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${m.life * 0.3})`;
    ctx.fill();
  }
  // Spawn new meteors randomly (~every 2-5 seconds)
  if (Math.random() < 0.004) spawnMeteor();
}

window.addEventListener('resize', () => { resize(); initStars(); });
resize();
initStars();
requestAnimationFrame(drawStars);

/* ── CURSOR ── */
const cursorEl = document.getElementById('cursor');
const ring     = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;
const isMobile = window.innerWidth < 720;

if (isMobile) {
  cursorEl.style.display = 'none';
  ring.style.display = 'none';
  document.body.style.cursor = 'auto';
}

document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

function animateCursor() {
  if (isMobile) return;
  rx += (mx - rx) * 0.1;
  ry += (my - ry) * 0.1;
  cursorEl.style.left = mx + 'px';
  cursorEl.style.top  = my + 'px';
  ring.style.left     = rx + 'px';
  ring.style.top      = ry + 'px';
  requestAnimationFrame(animateCursor);
}
animateCursor();

/* ── ORBIT SYSTEM ── */
(function () {
  const c   = document.getElementById('orbitCanvas');
  const ctx = c.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const isDesktop = window.innerWidth >= 720;
  const scale = isDesktop ? 1.15 : 0.85;

  const PLANETS = [
    { a: 0.0,  orb: 90,  spd: 0.0007,  r: 5,  color: '#6a9fd8' },
    { a: 1.2,  orb: 148, spd: 0.00045, r: 8,  color: '#4ac98a' },
    { a: 2.7,  orb: 210, spd: 0.00028, r: 6,  color: '#e07b54' },
    { a: 0.8,  orb: 275, spd: 0.00013, r: 9,  color: '#a374d5' },
  ].map(p => ({ ...p, orb: p.orb * scale, r: p.r * scale }));

  const trails = PLANETS.map(() => []);
  let W, H, cx, cy, raf;
  let mouseOffX = 0, mouseOffY = 0, targetOffX = 0, targetOffY = 0;

  function resize() {
    W = c.width  = c.offsetWidth  * dpr;
    H = c.height = c.offsetHeight * dpr;
    cx = W * 0.6;
    cy = H * 0.5;
  }

  if (isDesktop) {
    document.addEventListener('mousemove', e => {
      targetOffX = (e.clientX / window.innerWidth - 0.5) * 2 * 18 * dpr;
      targetOffY = (e.clientY / window.innerHeight - 0.5) * 2 * 12 * dpr;
    });
  }

  function hexAlpha(hex, a) {
    return `rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},${a})`;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    mouseOffX += (targetOffX - mouseOffX) * 0.04;
    mouseOffY += (targetOffY - mouseOffY) * 0.04;
    const ox = cx + mouseOffX, oy = cy + mouseOffY;

    for (let i = 0; i < PLANETS.length; i++) {
      ctx.beginPath();
      ctx.arc(ox, oy, PLANETS[i].orb * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      // Outer glow
      ctx.beginPath();
      ctx.arc(ox, oy, PLANETS[i].orb * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = hexAlpha(PLANETS[i].color, 0.06);
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    const sg = ctx.createRadialGradient(ox, oy, 0, ox, oy, 64 * dpr);
    sg.addColorStop(0, 'rgba(210,175,80,0.5)');
    sg.addColorStop(0.5, 'rgba(210,175,80,0.12)');
    sg.addColorStop(1, 'rgba(210,175,80,0)');
    ctx.beginPath();
    ctx.arc(ox, oy, 64 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = sg;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ox, oy, 18 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = '#d4aa55';
    ctx.fill();

    for (let i = 0; i < PLANETS.length; i++) {
      const p = PLANETS[i];
      p.a += p.spd;
      const px = ox + Math.cos(p.a) * p.orb * dpr;
      const py = oy + Math.sin(p.a) * p.orb * dpr;
      trails[i].push({ x: px, y: py });
      if (trails[i].length > 50) trails[i].shift();

      const trail = trails[i];
      for (let t = 1; t < trail.length; t++) {
        ctx.beginPath();
        ctx.moveTo(trail[t-1].x, trail[t-1].y);
        ctx.lineTo(trail[t].x, trail[t].y);
        ctx.strokeStyle = hexAlpha(p.color, (t / trail.length) * 0.28);
        ctx.lineWidth = p.r * dpr * 0.5;
        ctx.stroke();
      }

      const glowR = p.r * 3 * dpr;
      const pg = ctx.createRadialGradient(px, py, 0, px, py, glowR);
      pg.addColorStop(0, hexAlpha(p.color, 0.5));
      pg.addColorStop(1, hexAlpha(p.color, 0));
      ctx.beginPath();
      ctx.arc(px, py, glowR, 0, Math.PI * 2);
      ctx.fillStyle = pg;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, p.r * dpr, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  const hero = document.querySelector('.hero');
  new IntersectionObserver(entries => {
    entries[0].isIntersecting
      ? (raf = requestAnimationFrame(draw))
      : cancelAnimationFrame(raf);
  }, { threshold: 0 }).observe(hero);
})();

/* ── FOOTER YEAR ── */
document.getElementById('footerYear').textContent = new Date().getFullYear();

/* ══════════════════════════════════════════
   NEWS — mixed random feed (all sources)
   ══════════════════════════════════════════ */

const ALL_FEEDS = [
  // Tech
  'https://feeds.arstechnica.com/arstechnica/index',
  'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
  // Space
  'https://www.nasa.gov/rss/dyn/breaking_news.rss',
  'https://www.space.com/feeds/all',
  // Indonesia
  'https://www.cnnindonesia.com/nasional/rss',
  'https://feed.liputan6.com/rss/news',
  // World headlines
  'https://feeds.bbci.co.uk/news/world/rss.xml',
  'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
];

const PROXIES = [
  // codetabs — follows redirects, works for all feeds
  u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  // allorigins /get — returns JSON {contents: "..."}
  u => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
];

/* ── Slideshow state ── */
let slides   = [];
let current  = 0;
let playing  = true;
let timer    = null;
const DELAY  = 6000;
let progress = 0;
let progTimer = null;

async function fetchFeed(url) {
  for (const proxy of PROXIES) {
    try {
      const r = await fetch(proxy(url), { signal: AbortSignal.timeout(10000), redirect: 'follow' });
      if (!r.ok) continue;
      let text = await r.text();
      // allorigins /get returns JSON with contents field
      if (text.startsWith('{')) {
        try { text = JSON.parse(text).contents || ''; } catch {}
      }
      if (text.includes('<')) return text;
    } catch {}
  }
  return null;
}

function parseRSS(xml) {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const channelTitle = doc.querySelector('channel > title')?.textContent || 'Unknown';
  return [...doc.querySelectorAll('item')].slice(0, 6).map(item => {
    const rawDesc = item.querySelector('description')?.textContent || '';
    const desc    = rawDesc.replace(/<[^>]+>/g, '').trim();
    return {
      title:  item.querySelector('title')?.textContent?.trim() || '',
      link:   item.querySelector('link')?.textContent?.trim()  || '#',
      desc:   desc || 'No summary available.',
      date:   item.querySelector('pubDate')?.textContent || '',
      source: channelTitle,
    };
  }).filter(i => i.title);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

function showSlide(idx) {
  document.querySelectorAll('.slide').forEach((s, i) => {
    s.classList.toggle('active', i === idx);
  });
  document.getElementById('slideCounter').textContent = `${idx + 1} / ${slides.length}`;
  progress = 0;
  const bar = document.querySelector('.slide-progress-bar');
  if (bar) bar.style.transform = 'scaleX(0)';
}

function startProgress() {
  clearInterval(progTimer);
  progress = 0;
  progTimer = setInterval(() => {
    progress = Math.min(progress + (100 / (DELAY / 80)), 100);
    const bar = document.querySelector('.slide-progress-bar');
    if (bar) bar.style.transform = `scaleX(${progress / 100})`;
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
      <div class="slide-source">${item.source} · ${timeAgo(item.date)}</div>
      <div class="slide-title">${item.title}</div>
      <div class="slide-desc">${item.desc}</div>
      <a href="${item.link}" target="_blank" rel="noopener" class="slide-link">Read full story ↗</a>
      <div class="slide-progress"><div class="slide-progress-bar"></div></div>
    </div>
  `).join('');

  current = 0;
  showSlide(0);
  document.getElementById('slideshow').classList.add('ready');
  document.getElementById('newsLoading').style.display = 'none';

  if (playing) startAuto();
}

/* ── Fetch all feeds in parallel, mix randomly ── */
async function loadAllFeeds() {
  const results = await Promise.allSettled(
    ALL_FEEDS.map(url => fetchFeed(url))
  );

  let allItems = [];
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      allItems = allItems.concat(parseRSS(r.value));
    }
  }

  if (!allItems.length) {
    document.getElementById('newsLoading').innerHTML =
      '<span class="news-error">No feeds available.</span>';
    return;
  }

  // Deduplicate by title similarity
  const seen = new Set();
  allItems = allItems.filter(item => {
    const key = item.title.toLowerCase().replace(/\s+/g, ' ').slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Shuffle for random order, cap at 12
  shuffle(allItems);
  allItems = allItems.slice(0, 12);

  buildSlideshow(allItems);
}

/* ── Nav buttons ── */
document.getElementById('slidePrev').addEventListener('click', () => {
  if (!slides.length) return;
  current = (current - 1 + slides.length) % slides.length;
  showSlide(current);
  if (playing) startAuto();
});

document.getElementById('slideNext').addEventListener('click', () => {
  if (!slides.length) return;
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

/* ── Hover pause ── */
const slideshow = document.getElementById('slideshow');
slideshow.addEventListener('mouseenter', stopAuto);
slideshow.addEventListener('mouseleave', () => { if (playing) startAuto(); });

/* ── Load when section enters viewport ── */
const newsObserver = new IntersectionObserver(entries => {
  if (!entries[0].isIntersecting) return;
  newsObserver.disconnect();
  loadAllFeeds();
}, { threshold: 0.1 });

const newsSection = document.getElementById('news');
if (newsSection) newsObserver.observe(newsSection);

/* ── SCROLL REVEAL ── */
const io = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));
