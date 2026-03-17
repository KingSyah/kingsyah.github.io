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

/* ── FOOTER YEAR ── */
document.getElementById('footerYear').textContent = new Date().getFullYear();

/* ── NEWS ── */
// hnrss.org allows CORS natively — no proxy needed
// For others, try allorigins then corsproxy.io as fallback
const FEEDS = {
  tech:  { url: 'https://hnrss.org/frontpage',          label: 'Hacker News' },
  space: { url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss', label: 'NASA' },
  world: { url: 'https://feeds.bbci.co.uk/news/world/rss.xml',    label: 'BBC World' }
};

const PROXIES = [
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
];

async function fetchWithFallback(url) {
  // Try direct first (works for hnrss.org)
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (r.ok) return r.text();
  } catch {}
  // Try each proxy
  for (const proxy of PROXIES) {
    try {
      const r = await fetch(proxy(url), { signal: AbortSignal.timeout(5000) });
      if (r.ok) return r.text();
    } catch {}
  }
  return null;
}

function parseRSS(xml) {
  const parser = new DOMParser();
  const doc    = parser.parseFromString(xml, 'text/xml');
  const items  = [...doc.querySelectorAll('item')].slice(0, 6);
  return items.map(item => ({
    title:  item.querySelector('title')?.textContent?.trim() || '',
    link:   item.querySelector('link')?.textContent?.trim() || '#',
    date:   item.querySelector('pubDate')?.textContent || '',
    source: item.querySelector('source')?.textContent || ''
  }));
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 36e5);
  const d = Math.floor(diff / 864e5);
  if (h < 1)  return 'now';
  if (h < 24) return h + 'h';
  if (d < 7)  return d + 'd';
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function renderNews(items, label) {
  const list = document.getElementById('newsList');
  if (!items.length) {
    list.innerHTML = '<p class="news-error">No headlines right now.</p>';
    return;
  }
  list.innerHTML = items.map((item, i) => `
    <a href="${item.link}" target="_blank" rel="noopener" class="news-item" style="animation-delay:${i * 55}ms">
      <div class="news-time">${timeAgo(item.date)}</div>
      <div>
        <div class="news-title">${item.title}</div>
        <div class="news-source">${item.source || label}</div>
      </div>
    </a>
  `).join('');
}

let cache = {};
let activeTab = 'tech';

async function loadFeed(key) {
  const list = document.getElementById('newsList');
  if (cache[key]) { renderNews(cache[key], FEEDS[key].label); return; }
  list.innerHTML = '<div class="news-loading">fetching<span class="blink">_</span></div>';
  const xml = await fetchWithFallback(FEEDS[key].url);
  if (!xml) {
    list.innerHTML = '<p class="news-error">Feed unavailable.</p>';
    return;
  }
  const items = parseRSS(xml);
  cache[key]  = items;
  renderNews(items, FEEDS[key].label);
}

document.querySelectorAll('.news-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.news-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTab = btn.dataset.feed;
    loadFeed(activeTab);
  });
});

const newsObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting) { loadFeed(activeTab); newsObserver.disconnect(); }
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
