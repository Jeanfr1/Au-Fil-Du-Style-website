import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// <img data-plate="name" sizes="…" alt="…"> → <picture> with AVIF/WebP srcsets from
// src/data/images.json (written by scripts/build-images.mjs). Width/height come from the plate.
function plates() {
  return {
    name: 'plates',
    transformIndexHtml(html) {
      const meta = JSON.parse(readFileSync(new URL('./src/data/images.json', import.meta.url)));
      // team notes (TODO, layout comments) stay in the source, never in the published page
      return html.replace(/<!--[\s\S]*?-->\s*/g, '').replace(/<img data-plate="([\w-]+)"([^>]*)>/g, (_, name, attrs) => {
        const p = meta[name];
        if (!p) throw new Error(`unknown plate ${name}`);
        const set = (ext) => p.widths.map((w) => `/img/${name}-${p.v}-${w}.${ext} ${w}w`).join(', ');
        const sizes = (attrs.match(/\ssizes="([^"]*)"/) || [])[1] || '100vw';
        const rest = attrs.replace(/\ssizes="[^"]*"/, '');
        const fallback = `/img/${name}-${p.v}-${p.widths[Math.min(1, p.widths.length - 1)]}.webp`;
        return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">`
          + `<source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">`
          + `<img src="${fallback}" width="${p.width}" height="${p.height}"${rest}></picture>`;
      });
    },
  };
}

export default defineConfig({
  plugins: [plates()],
  build: { target: 'es2020', assetsInlineLimit: 0 },
});
