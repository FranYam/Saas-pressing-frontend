/**
 * Génère les icônes PWA (192, 512, maskable 512) à partir d'un SVG intégré.
 * Usage : npm run icons
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../public/icons');
await mkdir(outDir, { recursive: true });

// Cintre sur fond terracotta ; `padding` en unités viewBox pour la zone sûre maskable
const icon = (padding = 0) => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${padding === 0 ? 96 : 0}" fill="#C75B39"/>
  <g transform="translate(${padding} ${padding}) scale(${(512 - padding * 2) / 512})">
    <path d="M256 96c-23 0-41.6 17.8-43.4 40.4L100.3 234.4c-10.9 10.9-10.9 28.5 0 39.4s28.5 10.9 39.4 0l9.3-9.3V384c0 19.9 16.1 36 36 36h142c19.9 0 36-16.1 36-36V264.5l9.3 9.3c10.9 10.9 28.5 10.9 39.4 0s10.9-28.5 0-39.4L299.4 136.4C297.6 113.8 279 96 256 96zm0 36.9c12.4 0 22.5 10.1 22.5 22.5S268.4 177.9 256 177.9s-22.5-10.1-22.5-22.5 10.1-22.5 22.5-22.5z" fill="#FDF6F0"/>
  </g>
</svg>`);

await sharp(icon(0)).resize(192, 192).png().toFile(path.join(outDir, 'icon-192x192.png'));
await sharp(icon(0)).resize(512, 512).png().toFile(path.join(outDir, 'icon-512x512.png'));
// Maskable : zone sûre ~80% → padding de 10% par côté
await sharp(icon(51)).resize(512, 512).png().toFile(path.join(outDir, 'icon-maskable-512x512.png'));

console.log('✓ Icônes PWA générées dans public/icons/');
