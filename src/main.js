// Au Fil du Style · motion and interface. No video, no permanent render loop:
// one requestAnimationFrame per scroll / resize / pointer event (motion/timeline.json).
import { BOOKING, SERVICES, GALLERY } from './data/content.js';
import IMAGES from './data/images.json';

const root = document.documentElement;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

const runway = $('.runway');
const stage = $('[data-hero-stage]');
const salon = $('.salon');
const mirror = $('[data-mirror]');
const heroFade = $$('[data-hero-fade]');
const services = $('.services');
const strand = $('[data-strand]');
const doors = $('[data-doors]');
const booking = $('[data-booking]');
const parallax = $$('[data-parallax]');
const toggle = $('[data-motion-toggle]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

let paused = false;
try { paused = localStorage.getItem('aufil.motion.paused') === '1'; } catch { /* préférence non persistée */ }
const forcedStill = location.search.includes('static');
let motion = root.classList.contains('motion');
let geo = null;
let frame = 0;
let pointerX = 0;

// ---------- geometry: board units on desktop, clip polygons in px ----------
function measure() {
  const w = document.documentElement.clientWidth;
  const board = w >= 1024;
  const u = Math.min(w, 1600, 1.66 * document.documentElement.clientHeight) / 1024;
  const fl = (w - 735 * u) / 2;
  geo = { w, board, u, fl, vh: innerHeight };
  if (board) {
    // salon: diagonal from (0, 467) to (735, 536) on the board, section box from y 420
    const yAt = (x) => (467 + (69 / 735) * ((x - fl) / u) - 420) * u;
    salon.style.clipPath = `polygon(0px ${yAt(0).toFixed(1)}px, ${w}px ${yAt(w).toFixed(1)}px, ${w}px 100%, 0px 100%)`;
    // rendez-vous: measured curve, section box from y 1680
    const pts = [[0, 1712], [115, 1716], [230, 1720], [365, 1716], [500, 1710], [620, 1703], [735, 1695]];
    const left = -fl / u; const right = (w - fl) / u;
    const yl = 1712 + (4 / 115) * left; const yr = 1695 - (8 / 115) * (right - 735);
    const poly = [[left, yl], ...pts, [right, yr]].map(([x, y]) => `${(fl + x * u).toFixed(1)}px ${(Math.max(0, y - 1680) * u).toFixed(1)}px`);
    booking.style.clipPath = `polygon(${poly.join(', ')}, ${w}px 100%, 0px 100%)`;
  } else {
    salon.style.removeProperty('clip-path');
    booking.style.removeProperty('clip-path');
  }
  geo.rest = Math.max(1, salon.offsetTop);
}

function setInteractive(el, on) {
  if (el.inert === !on) return;
  el.inert = !on;
  if (on) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', 'true');
}

// ---------- one frame ----------
function draw() {
  frame = 0;
  if (!motion || document.hidden) return;
  const { u, fl, board, vh } = geo;
  const y = scrollY;
  const p = clamp(y / geo.rest);
  root.dataset.heroP = p.toFixed(3);

  // 1 · hero: the salon rises over the pinned stage; the mirror opens onto the room
  const copyO = 1 - smooth(0.22, 0.65, p);
  const s = stage.style;
  s.setProperty('--copy-o', copyO.toFixed(4));
  s.setProperty('--copy-y', `${(-32 * p).toFixed(2)}px`);
  s.setProperty('--fg-x', `${(20 * p).toFixed(2)}px`);
  s.setProperty('--fg-s', (1 + 0.045 * p).toFixed(5));
  s.setProperty('--fg-o', (1 - smooth(0.34, 1, p)).toFixed(4));
  s.setProperty('--halo-r', `${(12 * p).toFixed(2)}deg`);
  s.setProperty('--halo-x', `${(-18 * p).toFixed(2)}px`);
  s.setProperty('--halo-o', (1 - smooth(0.72, 1, p)).toFixed(4));
  s.setProperty('--pointer-x', `${pointerX.toFixed(2)}px`);
  const open = smooth(0.1, 0.88, p);
  // desktop: inside the round mirror whose rim is the halo; phones: from behind the head (kit 60% 62%)
  const cx = board ? fl + 646 * u : 0.6 * geo.w;
  const cy = board ? 175 * u : 0.62 * vh;
  const r = (board ? 306 * u : 1.05 * geo.w) * open;
  mirror.style.clipPath = `circle(${r.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px)`;
  mirror.style.setProperty('--mx', `${cx.toFixed(1)}px`);
  mirror.style.setProperty('--my', `${cy.toFixed(1)}px`);
  heroFade.forEach((el) => setInteractive(el, copyO > 0.15));
  if (p > 0.02 && root.classList.contains('intro')) root.classList.remove('intro');

  // photos: moderate parallax, ratio limited to ±0.8 (24 px desktop, 12 px phones)
  const k = board ? 24 : 12;
  for (const el of parallax) {
    const box = el.parentElement.getBoundingClientRect();
    if (box.bottom < -100 || box.top > vh + 100) continue;
    const ratio = clamp((vh / 2 - (box.top + box.height / 2)) / vh, -0.8, 0.8);
    el.style.setProperty('--py', `${(ratio * k * (Number(el.dataset.k) || 1)).toFixed(2)}px`);
  }

  // 3 · savoir-faire: the strand is revealed top → bottom and drifts against the scroll
  const sv = services.getBoundingClientRect();
  if (sv.bottom > -50 && sv.top < vh + 50) {
    const ratio = clamp((vh / 2 - (sv.top + sv.height / 2)) / vh, -1, 1);
    strand.style.setProperty('--strand-m', `${(smooth(vh * 1.0, vh * 0.12, sv.top) * 118).toFixed(2)}%`);
    strand.style.setProperty('--strand-y', `${(-ratio * (board ? 46 : 24)).toFixed(2)}px`);
    strand.style.setProperty('--strand-r', `${(-ratio * 5).toFixed(3)}deg`);
  }

  // 4 · réalisations: blond and copper open from the seam, title on its own depth
  const rd = doors.getBoundingClientRect();
  if (rd.bottom > -50 && rd.top < vh + 50) {
    const d = smooth(vh * 0.94, vh * 0.3, rd.top);
    doors.style.setProperty('--door-l', `${((1 - d) * 100).toFixed(2)}%`);
    doors.style.setProperty('--door-r', `${((1 - d) * 100).toFixed(2)}%`);
    doors.style.setProperty('--door-s', (1.035 - 0.035 * d).toFixed(4));
    const ratio = clamp((vh / 2 - (rd.top + rd.height / 2)) / vh, -0.8, 0.8);
    doors.style.setProperty('--title-y', `${(-ratio * (board ? 30 : 16)).toFixed(2)}px`);
  }

  // 5 · rendez-vous: rack focus, the blurred room settles into the sharp one
  const bk = booking.getBoundingClientRect();
  if (bk.bottom > -50 && bk.top < vh + 50) {
    booking.style.setProperty('--blur-o', (1 - smooth(vh * 0.95, vh * 0.32, bk.top)).toFixed(4));
  }
}

function schedule() {
  if (motion && !frame && !document.hidden) frame = requestAnimationFrame(draw);
}

function clearMotion() {
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
  root.classList.remove('intro');
  stage.removeAttribute('style');
  mirror.removeAttribute('style');
  [strand, doors, booking].forEach((el) => ['--strand-m', '--strand-y', '--strand-r', '--door-l', '--door-r', '--door-s', '--title-y', '--blur-o'].forEach((v) => el.style.removeProperty(v)));
  parallax.forEach((el) => el.style.removeProperty('--py'));
  heroFade.forEach((el) => setInteractive(el, true));
}

function applyMotion() {
  const system = reduced.matches || !!navigator.connection?.saveData;
  motion = !paused && !system && !forcedStill;
  root.classList.toggle('motion', motion);
  root.classList.toggle('still', !motion);
  toggle.disabled = system;
  toggle.setAttribute('aria-pressed', String(!motion));
  toggle.setAttribute('aria-label', system ? 'Animations désactivées selon vos préférences' : motion ? 'Mettre en pause les animations' : 'Reprendre les animations');
  $('.motion-icon', toggle).textContent = motion ? 'Ⅱ' : '▷';
  if (!motion) clearMotion();
  measure();
  schedule();
}

toggle.addEventListener('click', () => {
  paused = !paused;
  try { localStorage.setItem('aufil.motion.paused', paused ? '1' : '0'); } catch { /* facultatif */ }
  applyMotion();
});
reduced.addEventListener?.('change', applyMotion);
navigator.connection?.addEventListener?.('change', applyMotion);
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', () => { pointerX = 0; measure(); schedule(); }, { passive: true });
document.addEventListener('visibilitychange', schedule);
stage.addEventListener('pointermove', (e) => {
  if (!motion || !finePointer.matches) return;
  pointerX = clamp(e.clientX / innerWidth - 0.5, -0.5, 0.5) * 10;
  schedule();
}, { passive: true });
stage.addEventListener('pointerleave', () => { pointerX = 0; schedule(); });

// ---------- opening: once at the top, interrupted by scrolling ----------
if (root.classList.contains('intro')) {
  if (scrollY > 24) root.classList.remove('intro');
  setTimeout(() => root.classList.remove('intro'), 1600);
}

// ---------- reveals (once) ----------
$$('[data-reveal="words"] > span').forEach((span) => {
  const words = span.textContent.trim().split(/\s+/);
  span.textContent = '';
  words.forEach((word, i) => {
    const w = document.createElement('span');
    w.className = 'w';
    w.style.setProperty('--i', i);
    w.textContent = word;
    span.append(w, i < words.length - 1 ? ' ' : '');
  });
});
const reveals = $$('[data-reveal]');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0, rootMargin: '0px 0px -10% 0px' }); // threshold 0: wipe lines start clipped to a sliver
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('is-in'));
}

$$('.mobile-nav a').forEach((a) => a.addEventListener('click', () => a.closest('details').removeAttribute('open')));

// ---------- services dialog (tabs: arrows / Home / End) ----------
const serviceDialog = $('#service-dialog');
const tabs = $$('[data-tab]', serviceDialog);
let serviceOpener = null;
function selectService(key, focus = false) {
  const service = SERVICES[key];
  if (!service) return;
  $('#service-dialog-title').textContent = service.title;
  $('#service-description').textContent = service.description;
  $('#service-list').replaceChildren(...service.items.map((text) => Object.assign(document.createElement('li'), { textContent: text })));
  tabs.forEach((tab) => {
    const on = tab.dataset.tab === key;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    if (on && focus) tab.focus();
  });
  $('#service-panel').setAttribute('aria-labelledby', `tab-${key}`);
}
$$('[data-service]').forEach((link) => link.addEventListener('click', (e) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  if (typeof serviceDialog.showModal !== 'function') return;
  e.preventDefault();
  serviceOpener = link;
  selectService(link.dataset.service);
  if (!serviceDialog.open) serviceDialog.showModal();
  $('[data-close-dialog]', serviceDialog).focus();
}));
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectService(tab.dataset.tab, true));
  tab.addEventListener('keydown', (e) => {
    const next = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
    if (next !== undefined) { e.preventDefault(); selectService(tabs[next].dataset.tab, true); }
  });
});

// ---------- gallery: four photos of the salon ----------
const galleryDialog = $('#gallery-dialog');
const galleryFrame = $('[data-gallery-frame]');
let galleryIndex = 0;
let galleryOpener = null;
function picture(name, alt) {
  const p = IMAGES[name];
  const set = (ext) => p.widths.map((w) => `/img/${name}-${p.v}-${w}.${ext} ${w}w`).join(', ');
  const pic = document.createElement('picture');
  pic.innerHTML = `<source type="image/avif" srcset="${set('avif')}" sizes="(min-width: 1024px) 50vw, 92vw"><source type="image/webp" srcset="${set('webp')}" sizes="(min-width: 1024px) 50vw, 92vw">`;
  const img = Object.assign(document.createElement('img'), { src: `/img/${name}-${p.v}-${p.widths[0]}.webp`, alt, width: p.width, height: p.height, decoding: 'async' });
  pic.append(img);
  return pic;
}
function showPhoto(index) {
  galleryIndex = (index + GALLERY.length) % GALLERY.length;
  const item = GALLERY[galleryIndex];
  galleryFrame.replaceChildren(picture(item.plate, item.caption));
  $('#gallery-caption').textContent = item.caption;
  $('[data-gallery-pos]').textContent = `${galleryIndex + 1} / ${GALLERY.length}`;
}
$$('[data-open-gallery]').forEach((button) => {
  if (typeof galleryDialog.showModal !== 'function') { button.hidden = true; return; }
  button.addEventListener('click', () => {
    galleryOpener = button;
    showPhoto(0);
    if (!galleryDialog.open) galleryDialog.showModal();
    $('[data-close-dialog]', galleryDialog).focus();
  });
});
$('[data-gallery-prev]').addEventListener('click', () => showPhoto(galleryIndex - 1));
$('[data-gallery-next]').addEventListener('click', () => showPhoto(galleryIndex + 1));
galleryDialog.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); showPhoto(galleryIndex + (e.key === 'ArrowRight' ? 1 : -1)); }
});
[serviceDialog, galleryDialog].forEach((dialog) => {
  $('[data-close-dialog]', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    const b = dialog.getBoundingClientRect();
    if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) dialog.close();
  });
});
serviceDialog.addEventListener('close', () => serviceOpener?.focus({ preventScroll: true }));
galleryDialog.addEventListener('close', () => galleryOpener?.focus({ preventScroll: true }));
selectService('coupe');

// every booking link points at the salon's Planity page
$$('a[href*="planity.com"]').forEach((a) => { a.href = BOOKING; });

applyMotion();
document.fonts?.ready.then(() => { measure(); schedule(); });
