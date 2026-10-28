// Web images: AVIF + WebP at the widths each plate is shown at.
// Sources: cleaned + Real-ESRGAN plates of the salon's photos (scripts/out/plates, from
// `npm run prepare-images`), the kit's hero foreground and the approved logo PNG.
// Writes public/img/<name>-<v>-<width>.{avif,webp} and src/data/images.json.
// Bump a plate's v when it changes: /img is cached for 30 days.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'public/img');
const V = 'v1';

const PLATES = [
  { name: 'cheveux', src: 'images/master/hero-cheveux-detoure.png', widths: [540, 760, 1060], alpha: true },
  { name: 'salon', src: 'scripts/out/plates/salon-large.png', widths: [800, 1280, 1800, 2400] },
  { name: 'salon-proche', src: 'scripts/out/plates/salon-proche.png', widths: [800, 1280, 1800, 2400] },
  { name: 'salon-proche-flou', src: 'scripts/out/plates/salon-proche.png', widths: [480], blur: 7 },
  { name: 'ondes-blondes', src: 'scripts/out/plates/ondes-blondes.png', widths: [560, 900, 1300, 1832] },
  { name: 'ondes-cuivrees', src: 'scripts/out/plates/ondes-cuivrees.png', widths: [560, 900, 1300, 1800] },
  { name: 'carre-blond', src: 'scripts/out/plates/carre-blond.png', widths: [640, 1132] },
  { name: 'chignon', src: 'scripts/out/plates/chignon.png', widths: [640, 936] },
  { name: 'logo', src: 'brand/Logo-Au-Fil-Du-Style-Porcelaine-Transparente.png', widths: [360, 720], alpha: true },
];

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const meta = {};
  for (const plate of PLATES) {
    const base = sharp(path.join(ROOT, plate.src));
    const info = await base.metadata();
    const files = [];
    for (const w of [...new Set(plate.widths.map((width) => Math.min(width, info.width)))]) {
      let pipe = base.clone().resize({ width: w, kernel: 'lanczos3' });
      if (plate.blur) pipe = pipe.blur(plate.blur);
      const stem = `${plate.name}-${plate.v || V}-${w}`;
      await pipe.clone().avif({ quality: plate.blur ? 45 : 60, effort: 6 }).toFile(path.join(OUT, `${stem}.avif`));
      await pipe.clone().webp({ quality: plate.blur ? 65 : 82, alphaQuality: 90, effort: 6 }).toFile(path.join(OUT, `${stem}.webp`));
      files.push(w);
    }
    meta[plate.name] = { width: info.width, height: info.height, widths: files, v: plate.v || V };
    console.log(plate.name.padEnd(18), `${info.width}x${info.height}`, files.join(','));
  }
  await fs.writeFile(path.join(ROOT, 'src/data/images.json'), `${JSON.stringify(meta, null, 2)}\n`);
}

main();
