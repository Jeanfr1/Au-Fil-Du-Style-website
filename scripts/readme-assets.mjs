// README assets from the production build (npm run build && npm run preview):
// banner.png, hero-scroll.gif frames, desktop-sections.jpg, mobile-screens.jpg in .github/assets/.
// BASE=http://localhost:4367/ FRAMES=/tmp/frames node scripts/readme-assets.mjs, then ffmpeg (see README).
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BASE = process.env.BASE || 'http://localhost:4367/';
const FRAMES = process.env.FRAMES || path.join(ROOT, 'qa/frames');
const OUT = path.join(ROOT, '.github/assets');
await fs.mkdir(FRAMES, { recursive: true });
await fs.mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const hideToggle = 'html .motion-toggle.js-only{display:none!important}';

// ---- banner: the site's own fonts and plates ----
{
  const page = await browser.newPage({ viewport: { width: 1600, height: 520 } });
  // served from the preview's own origin so the site's fonts and plates load
  const f = (p) => `/${p.replace(/^public\//, '')}`;
  const bannerHtml = `<!doctype html><html><head><style>
    @font-face{font-family:B;src:url('${f('public/fonts/BodoniModa-Regular.woff2')}')}
    @font-face{font-family:B;font-style:italic;src:url('${f('public/fonts/BodoniModa-Italic.woff2')}')}
    @font-face{font-family:I;src:url('${f('public/fonts/InstrumentSans-Medium.woff2')}')}
    html,body{margin:0;width:1600px;height:520px;overflow:hidden;background:#141E30;color:#F4F0E8}
    .bg{position:absolute;inset:0;background:url('${f('public/img/salon-proche-flou-v1-480.webp')}') 60% 40%/cover;filter:saturate(.7)}
    .bg::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(20,30,48,.97),rgba(20,30,48,.88) 45%,rgba(20,30,48,.6) 75%,rgba(20,30,48,.85))}
    .ring{position:absolute;left:1010px;top:-300px;width:760px;height:760px;border-radius:50%;border:3px solid rgba(244,240,232,.95);box-shadow:0 0 18px rgba(244,240,232,.35);-webkit-mask-image:linear-gradient(90deg,#000 0 18%,transparent 34%);-webkit-mask-image:linear-gradient(160deg,#000 0 30%,transparent 46%)}
    .hair{position:absolute;left:1060px;top:-14px;width:420px;transform:rotate(2deg)}
    .logo{position:absolute;left:104px;top:24px;width:200px}
    h1{position:absolute;left:112px;top:178px;margin:0;font:400 118px/0.86 B;letter-spacing:-.05em}
    h1 em{display:block;font-size:.86em;letter-spacing:-.075em}
    p{position:absolute;left:120px;top:440px;margin:0;font:500 15px I;letter-spacing:.36em;text-transform:uppercase}
  </style></head><body><div class="bg"></div><div class="ring"></div>
  <img class="hair" src="${f('public/img/cheveux-v1-1060.webp')}">
  <img class="logo" src="${f('public/img/logo-v1-720.webp')}">
  <h1>Le style,<em>en mouvement.</em></h1><p>Coiffure &amp; barbier · Pontchâteau</p></body></html>`;
  await page.route(`${BASE}__banner`, (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body: bannerHtml }));
  await page.goto(`${BASE}__banner`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'banner.png') });
  await page.close();
}

// ---- hero GIF frames: pinned passage + the salon taking over, 1440 x 900 ----
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}?nointro`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: hideToggle });
  await page.evaluate(() => document.fonts.ready);
  const rest = await page.evaluate(() => document.querySelector('.salon').offsetTop);
  const end = rest + 560;
  const N = 60;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const y = Math.round(end * (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2));
    await page.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), y);
    await page.waitForTimeout(350);
    await settle(page);
    await page.screenshot({ path: path.join(FRAMES, `f_${String(i).padStart(4, '0')}.png`) });
  }
  await page.close();
}

// ---- browser-framed desktop sections ----
async function shotAt(page, sel, offset = 0) {
  await page.evaluate(([s, o]) => scrollTo({ top: document.querySelector(s).offsetTop + o, behavior: 'instant' }), [sel, offset]);
  await page.waitForTimeout(1600);
  await settle(page);
  return page.screenshot();
}
function browserFrame(png, w, h) {
  const bar = 34;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h + bar}"><rect width="${w}" height="${h + bar}" rx="12" fill="#0d1422"/><circle cx="20" cy="17" r="5.5" fill="#ff5f57"/><circle cx="38" cy="17" r="5.5" fill="#febc2e"/><circle cx="56" cy="17" r="5.5" fill="#28c840"/><rect x="${w / 2 - 170}" y="8" width="340" height="18" rx="9" fill="#1c2638"/><text x="${w / 2}" y="21" font-family="Helvetica, Arial" font-size="11" fill="#9aa6bd" text-anchor="middle">au-fil-du-style-pontchateau.vercel.app</text></svg>`;
  return sharp(Buffer.from(svg)).composite([{ input: png, left: 0, top: bar }]).png().toBuffer();
}
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}?nointro`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: hideToggle });
  await page.evaluate(() => document.fonts.ready);
  const shots = [];
  shots.push(await shotAt(page, '.salon', 0));
  shots.push(await shotAt(page, '.services', -60));
  await page.locator('[data-service="couleur"]').click();
  await page.waitForTimeout(700);
  shots.push(await page.screenshot());
  await page.keyboard.press('Escape');
  shots.push(await shotAt(page, '.realisations', -40));
  await page.locator('[data-open-gallery]').click();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(900);
  shots.push(await page.screenshot());
  await page.keyboard.press('Escape');
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(1600);
  shots.push(await page.screenshot());
  await page.close();
  const W = 720; const H = 450; const gap = 28;
  const framed = [];
  for (const s of shots) framed.push(await browserFrame(await sharp(s).resize(W, H).png().toBuffer(), W, H));
  const cols = 2; const rows = Math.ceil(framed.length / cols);
  await sharp({ create: { width: cols * W + (cols + 1) * gap, height: rows * (H + 34) + (rows + 1) * gap, channels: 3, background: '#E9E4DA' } })
    .composite(framed.map((input, i) => ({ input, left: gap + (i % cols) * (W + gap), top: gap + Math.floor(i / cols) * (H + 34 + gap) })))
    .jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(OUT, 'desktop-sections.jpg'));
}

// ---- phone screens ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}?nointro`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: hideToggle });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  const shots = [await page.screenshot()];
  shots.push(await shotAt(page, '.salon', 0));
  shots.push(await shotAt(page, '.services', 0));
  shots.push(await shotAt(page, '.realisations', -30));
  shots.push(await shotAt(page, '.booking', 60));
  await ctx.close();
  const w = 300; const h = 649; const pad = 12; const gap = 34;
  const phones = [];
  for (const s of shots) {
    const screen = await sharp(s).resize(w, h).png().toBuffer();
    const mask = Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="34" fill="#fff"/></svg>`);
    const rounded = await sharp(screen).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
    const body = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w + 2 * pad}" height="${h + 2 * pad}"><rect width="${w + 2 * pad}" height="${h + 2 * pad}" rx="44" fill="#0b0f18"/></svg>`);
    phones.push(await sharp(body).composite([{ input: rounded, left: pad, top: pad }]).png().toBuffer());
  }
  const PW = w + 2 * pad; const PH = h + 2 * pad;
  await sharp({ create: { width: phones.length * PW + (phones.length + 1) * gap, height: PH + 2 * gap, channels: 3, background: '#E9E4DA' } })
    .composite(phones.map((input, i) => ({ input, left: gap + i * (PW + gap), top: gap })))
    .jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(OUT, 'mobile-screens.jpg'));
}
await browser.close();
console.log('assets written; frames in', FRAMES);
