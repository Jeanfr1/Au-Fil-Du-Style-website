// QA against a running build: QA_BASE=http://localhost:4367/ npm run qa
// Layout (overflow, scale, text size), hero pin, links, dialogs (keyboard), gallery,
// CTA hit-tests, no-JS, reduced motion, process words, kit kept out of the deploy.
// Exit code 1 when a check fails.
import { chromium } from 'playwright';

const BASE = process.env.QA_BASE || 'http://localhost:4367/';
const BOOKING = 'https://www.planity.com/au-fil-du-style-44160-pontchateau';
const PROCESS_WORDS = /\b(conceptuel|conceptual|illustrati|g[ée]n[ée]r[ée]e?s?\b|generated|edited|retouch|original photo|photo d.origine|campagne|campaign|mockup|maquette|transmises|IA\b|AI\b|placeholder|lorem|TODO)/i;
let failed = 0;
const ok = (cond, label, extra = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`); if (!cond) failed++; };

const browser = await chromium.launch({ channel: 'chrome' });

async function open(width, height, { query = '?nointro', js = true, reduced = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, javaScriptEnabled: js, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(BASE + query, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(300);
  return { ctx, page, errors };
}

// ---------- layout at six widths ----------
for (const [w, h] of [[1280, 720], [1440, 900], [1920, 1080], [1024, 768], [390, 844], [360, 740]]) {
  const { ctx, page, errors } = await open(w, h);
  const m = await page.evaluate(async () => {
    const out = { overflow: [] };
    for (let y = 0; y < document.documentElement.scrollHeight; y += Math.round(innerHeight * 0.6)) {
      scrollTo(0, y); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (document.documentElement.scrollWidth > innerWidth) out.overflow.push(y);
    }
    scrollTo(0, 0); await new Promise((r) => setTimeout(r, 120));
    // visible height: the salon box starts 47 board px under the hero's diagonal, the booking box 32 under its curve
    const u = Math.min(document.documentElement.clientWidth, 1600, 1.66 * document.documentElement.clientHeight) / 1024;
    const under = { '.salon': 47, '.booking': 32 };
    const hgt = (s) => (document.querySelector(s).getBoundingClientRect().height - (innerWidth >= 1024 ? (under[s] || 0) * u : 0)) / innerHeight;
    out.hero = hgt('.hero-stage');
    out.sections = ['.salon', '.services', '.realisations', '.booking'].map((s) => [s, hgt(s)]);
    // display titles at the board's size (board px x u), never larger: src/data/board-type.json
    out.titles = [['.hero-title .line', 89.8], ['.salon-title .line', 78], ['.services-title .line', 84.5], ['.real-title .line', 93.2], ['.booking-title .line', 61.8]]
      .map(([s, board]) => parseFloat(getComputedStyle(document.querySelector(s)).fontSize) / (board * u));
    out.small = [...document.querySelectorAll('main a, main p, main span, main button, main li, address a')]
      .filter((el) => el.getClientRects().length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
      .map((el) => [el.textContent.trim().slice(0, 28), parseFloat(getComputedStyle(el).fontSize)])
      .filter(([, fs]) => fs < 11);
    return out;
  });
  ok(m.overflow.length === 0, `${w}x${h} no horizontal overflow`, m.overflow.join(','));
  if (w >= 1024) {
    ok(m.hero <= 1.05, `${w}x${h} hero <= 1.05 screen`, m.hero.toFixed(2));
    ok(m.sections.every(([, r]) => r <= 0.8), `${w}x${h} sections <= 0.8 screen`, m.sections.map(([s, r]) => `${s} ${r.toFixed(2)}`).join(' '));
    ok(m.titles.every((t) => t <= 1.01), `${w}x${h} titles at board size (1024 density), not larger`, m.titles.map((t) => t.toFixed(3)).join(' '));
  }
  ok(m.small.length === 0, `${w}x${h} text >= 11 px`, m.small.slice(0, 4).map(([t, f]) => `${t}:${f}`).join(' | '));
  ok(errors.length === 0, `${w}x${h} no console errors`, errors.join(' | '));
  await ctx.close();
}

// ---------- hero pin, links, dialogs (desktop) ----------
{
  const { ctx, page } = await open(1440, 900);
  const p0 = await page.evaluate(() => document.documentElement.dataset.heroP);
  ok(p0 === '0.000', 'hero passage starts at 0', p0);
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(500);
  const mid = await page.evaluate(() => ({ p: Number(document.documentElement.dataset.heroP), top: document.querySelector('.hero').getBoundingClientRect().top, salon: document.querySelector('.salon').getBoundingClientRect().top, clip: document.querySelector('[data-mirror]').style.clipPath }));
  ok(mid.p > 0.3 && mid.p < 0.8 && Math.abs(mid.top) < 1 && /circle\(\d/.test(mid.clip), 'hero pinned, salon rising, mirror opening', JSON.stringify(mid));
  await page.evaluate(() => scrollTo(0, document.querySelector('.salon').offsetTop));
  await page.waitForTimeout(300);
  const end = await page.evaluate(() => ({ p: document.documentElement.dataset.heroP, salon: Math.round(document.querySelector('.salon').getBoundingClientRect().top), inert: document.querySelector('[data-hero-copy]').inert }));
  ok(end.p === '1.000' && Math.abs(end.salon) <= 1 && end.inert, 'passage ends with the salon at the top, hero links inert', JSON.stringify(end));
  const gap = await page.evaluate(() => { const a = document.querySelector('.salon').getBoundingClientRect().bottom; const b = document.querySelector('.services').getBoundingClientRect().top; return Math.abs(a - b); });
  ok(gap < 1, 'salon meets savoir-faire with no band', String(gap));

  const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.href));
  const book = links.filter((h) => h === BOOKING || h === `${BOOKING}/`);
  ok(book.length >= 6, 'Planity links', String(book.length));
  ok(links.some((h) => h.startsWith('https://www.instagram.com/coiffure_au_fil_du_style')), 'Instagram link');
  ok(links.some((h) => h.startsWith('https://www.google.com/maps/')), 'Maps link');
  ok(links.includes('tel:+33240008153'), 'phone link');
  const ext = await page.evaluate(() => [...document.querySelectorAll('a[target="_blank"]')].every((a) => /noopener/.test(a.rel)));
  ok(ext, 'external links have rel=noopener');

  await page.evaluate(() => scrollTo(0, document.querySelector('.services').offsetTop - 100));
  await page.waitForTimeout(500);
  const trigger = page.locator('[data-service="couleur"]');
  await trigger.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  let st = await page.evaluate(() => ({ open: document.getElementById('service-dialog').open, sel: document.querySelector('[role=tab][aria-selected=true]').dataset.tab, items: document.querySelectorAll('#service-list li').length }));
  ok(st.open && st.sel === 'couleur' && st.items === 4, 'services dialog opens on the chosen tab', JSON.stringify(st));
  await page.locator('[role=tab][aria-selected=true]').focus();
  await page.keyboard.press('ArrowRight');
  st = await page.evaluate(() => document.querySelector('[role=tab][aria-selected=true]').dataset.tab);
  ok(st === 'barbe', 'tabs: ArrowRight', st);
  await page.keyboard.press('Home');
  st = await page.evaluate(() => document.querySelector('[role=tab][aria-selected=true]').dataset.tab);
  ok(st === 'coupe', 'tabs: Home', st);
  await page.keyboard.press('End');
  st = await page.evaluate(() => document.querySelector('[role=tab][aria-selected=true]').dataset.tab);
  ok(st === 'barbe', 'tabs: End', st);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  st = await page.evaluate(() => ({ open: document.getElementById('service-dialog').open, focus: document.activeElement.dataset.service }));
  ok(!st.open && st.focus === 'couleur', 'Escape closes, focus returns', JSON.stringify(st));
  await trigger.click();
  await page.waitForTimeout(300);
  await page.mouse.click(10, 10);
  await page.waitForTimeout(200);
  st = await page.evaluate(() => document.getElementById('service-dialog').open);
  ok(!st, 'click outside closes the services dialog');

  await page.evaluate(() => scrollTo(0, document.querySelector('.realisations').offsetTop - 120));
  await page.waitForTimeout(500);
  await page.locator('[data-open-gallery]').click();
  await page.waitForTimeout(300);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  st = await page.evaluate(() => ({ pos: document.querySelector('[data-gallery-pos]').textContent, cap: document.getElementById('gallery-caption').textContent, img: document.querySelector('[data-gallery-frame] img')?.currentSrc || '' }));
  ok(st.pos === '3 / 4' && st.cap === 'Carré blond' && /carre-blond/.test(st.img), 'gallery: arrows, caption, photo', JSON.stringify(st));
  await page.locator('[data-gallery-next]').click();
  await page.locator('[data-gallery-next]').click();
  st = await page.evaluate(() => document.querySelector('[data-gallery-pos]').textContent);
  ok(st === '1 / 4', 'gallery wraps around', st);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  st = await page.evaluate(() => ({ open: document.getElementById('gallery-dialog').open, focus: document.activeElement.matches('[data-open-gallery]') }));
  ok(!st.open && st.focus, 'gallery closes, focus returns', JSON.stringify(st));

  for (const [label, sel, y] of [['hero', '.hero-pill', 0], ['booking', '.booking-pill', null]]) {
    if (y === null) await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    else await page.evaluate((yy) => scrollTo(0, yy), y);
    await page.waitForTimeout(1200);
    const hit = await page.evaluate((s) => {
      const a = document.querySelector(s); const r = a.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return top && (top === a || a.contains(top)) ? 'ok' : `covered by ${top && top.className}`;
    }, sel);
    ok(hit === 'ok', `${label} CTA is on top and clickable`, hit);
  }

  const text = await page.evaluate(() => document.body.innerText + ' ' + [...document.querySelectorAll('[alt]')].map((i) => i.alt).join(' ') + ' ' + [...document.querySelectorAll('[aria-label]')].map((i) => i.getAttribute('aria-label')).join(' '));
  const word = text.match(PROCESS_WORDS);
  ok(!word, 'no production notes on the page', word ? word[0] : '');
  ok(!/[ãõ]|ção\b|você/.test(text), 'no Portuguese on the page');
  await ctx.close();
}

// ---------- phone: menu ----------
{
  const { ctx, page } = await open(390, 844);
  await page.locator('.mobile-nav summary').click();
  await page.locator('.mobile-nav a[href="#savoir-faire"]').click();
  await page.waitForTimeout(900);
  const r = await page.evaluate(() => ({ open: document.querySelector('.mobile-nav').open, top: Math.round(document.getElementById('savoir-faire').getBoundingClientRect().top) }));
  ok(!r.open && Math.abs(r.top) < 4, 'phone menu: anchor reached, menu closed', JSON.stringify(r));
  await ctx.close();
}

// ---------- reduced motion: board at rest, no pin, no hidden state ----------
{
  const { ctx, page } = await open(1440, 900, { reduced: true });
  const r = await page.evaluate(() => ({ motion: document.documentElement.classList.contains('motion'), pos: getComputedStyle(document.querySelector('.hero')).position, hidden: [...document.querySelectorAll('[data-reveal]')].filter((el) => Number(getComputedStyle(el).opacity) < 0.99).length, btn: document.querySelector('[data-motion-toggle]').disabled }));
  ok(!r.motion && r.pos !== 'sticky' && r.hidden === 0 && r.btn, 'reduced motion: no pin, all content visible, toggle disabled', JSON.stringify(r));
  await ctx.close();
}

// ---------- pause button ----------
{
  const { ctx, page } = await open(1440, 900);
  await page.locator('[data-motion-toggle]').click();
  const r = await page.evaluate(() => ({ motion: document.documentElement.classList.contains('motion'), pressed: document.querySelector('[data-motion-toggle]').getAttribute('aria-pressed'), stored: localStorage.getItem('aufil.motion.paused') }));
  ok(!r.motion && r.pressed === 'true' && r.stored === '1', 'pause: motion off and remembered', JSON.stringify(r));
  await page.reload({ waitUntil: 'networkidle' });
  const again = await page.evaluate(() => document.documentElement.classList.contains('still'));
  ok(again, 'pause survives a reload');
  await page.evaluate(() => localStorage.removeItem('aufil.motion.paused'));
  await ctx.close();
}

// ---------- no JavaScript: everything readable ----------
{
  const { ctx, page } = await open(1440, 900, { js: false, query: '' });
  const r = await page.evaluate(() => ({
    titles: [...document.querySelectorAll('h1, h2')].filter((h) => h.closest('main')).length,
    hidden: [...document.querySelectorAll('main h1, main h2, main p, main a')].filter((el) => Number(getComputedStyle(el).opacity) < 0.99).length,
    book: [...document.querySelectorAll('main a')].filter((a) => a.href.includes('planity.com')).length,
    toggle: getComputedStyle(document.querySelector('[data-motion-toggle]')).display,
  }));
  ok(r.titles === 5 && r.hidden === 0 && r.book >= 5 && r.toggle === 'none', 'no-JS: titles, copy and booking links present', JSON.stringify(r));
  await ctx.close();
}

// ---------- kit stays out of the deploy ----------
{
  const { ctx, page } = await open(800, 600, { query: '' });
  for (const p of ['LEIA-ME-KIT.md', 'roteiros/01-implementacao.md', 'site/index.html', 'references/Modelo-1-Aprovado.png', 'images/originals/salon-large-original.png']) {
    const res = await page.request.get(BASE + p);
    const body = await res.text();
    ok(!(res.status() === 200 && !body.includes('data-hero-stage')), `kit file not served: ${p}`, String(res.status()));
  }
  await ctx.close();
}

await browser.close();
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
