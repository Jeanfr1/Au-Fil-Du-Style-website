// Board check: renders the static desktop layout (?static), crops the board frame,
// scales it to the board's 735 px and writes qa/board-compare.png
// (board | page | 50 % blend) plus the mean absolute difference per scene.
// QA_BASE=http://localhost:4367/ W=1440 npm run compare
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BASE = process.env.QA_BASE || 'http://localhost:4367/';
const W = Number(process.env.W || 1440);
const BW = 735; const BH = 2140;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: W, height: 900 }, deviceScaleFactor: 1 });
await page.goto(`${BASE}?static`, { waitUntil: 'networkidle' });
await page.evaluate(async () => {
  for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
  scrollTo(0, 0);
  await document.fonts.ready;
  const pending = [...document.querySelectorAll('main img')].filter((img) => !img.complete);
  await Promise.race([Promise.all(pending.map((img) => new Promise((r) => { img.onload = img.onerror = r; }))), new Promise((r) => setTimeout(r, 5000))]);
});
await page.waitForTimeout(500);
const { fl, u } = await page.evaluate(() => { const w = document.documentElement.clientWidth; const u = Math.min(w, 1600, 1.66 * document.documentElement.clientHeight) / 1024; return { fl: (w - 735 * u) / 2, u }; });
const shot = await page.screenshot({ fullPage: true });
await browser.close();
const cropW = Math.round(BW * u);
const meta0 = await sharp(shot).metadata();
const cropH = Math.min(Math.round(BH * u), meta0.height);
const outH = Math.round((cropH * BW) / cropW);
const pageCrop = await sharp(shot).extract({ left: Math.round(fl), top: 0, width: cropW, height: cropH }).resize({ width: BW, height: outH, fit: 'fill' }).png().toBuffer();
const H = Math.min(outH, BH);
const board = await sharp(path.join(ROOT, 'references/Modelo-1-Aprovado.png')).extract({ left: 0, top: 0, width: BW, height: H }).png().toBuffer();
const pageH = await sharp(pageCrop).extract({ left: 0, top: 0, width: BW, height: H }).png().toBuffer();
const blend = await sharp(board).composite([{ input: await sharp(pageH).ensureAlpha(0.5).png().toBuffer(), blend: 'over' }]).png().toBuffer();
await fs.mkdir(path.join(ROOT, 'qa'), { recursive: true });
await sharp({ create: { width: BW * 3 + 40, height: H, channels: 3, background: '#ffffff' } })
  .composite([{ input: board, left: 0, top: 0 }, { input: pageH, left: BW + 20, top: 0 }, { input: blend, left: BW * 2 + 40, top: 0 }])
  .png().toFile(path.join(ROOT, 'qa/board-compare.png'));
const a = await sharp(board).removeAlpha().raw().toBuffer();
const b = await sharp(pageH).removeAlpha().raw().toBuffer();
const rows = { hero: [0, 467], salon: [467, 949], services: [949, 1304], realisations: [1304, 1712], booking: [1712, 2140] };
for (const [name, [y0, y1]] of Object.entries(rows)) {
  let sum = 0; let n = 0;
  for (let y = y0; y < Math.min(y1, H); y++) for (let x = 0; x < BW; x++) for (let c = 0; c < 3; c++) { const i = (y * BW + x) * 3 + c; sum += Math.abs(a[i] - b[i]); n++; }
  console.log(name.padEnd(13), 'mean |diff|', (sum / n).toFixed(1));
}
console.log(`page height ${(meta0.height / u).toFixed(0)} board px (board ${BH}); wrote qa/board-compare.png`);
