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
