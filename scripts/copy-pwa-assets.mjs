import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

const timestamp = Date.now();

// Copia manifest e service worker para dist/
const swSrc = join(ROOT, 'public', 'sw.js');
const swContent = readFileSync(swSrc, 'utf-8').replace('__TIMESTAMP__', String(timestamp));
writeFileSync(join(DIST, 'sw.js'), swContent);

const manifestSrc = join(ROOT, 'public', 'manifest.webmanifest');
copyFileSync(manifestSrc, join(DIST, 'manifest.webmanifest'));

// Copia ícones se existirem
for (const icon of ['icon-192.png', 'icon-512.png', 'favicon.ico']) {
  const src = join(ROOT, 'public', icon);
  if (existsSync(src)) {
    copyFileSync(src, join(DIST, icon));
  }
}

// Injeta link para manifest e SW no index.html
const indexPath = join(DIST, 'index.html');
if (existsSync(indexPath)) {
  let html = readFileSync(indexPath, 'utf-8');

  if (!html.includes('manifest.webmanifest')) {
    html = html.replace('</head>', `  <link rel="manifest" href="/manifest.webmanifest" />\n  <meta name="theme-color" content="#1a56db" />\n</head>`);
  }

  if (!html.includes('sw.js')) {
    html = html.replace('</body>', `  <script>if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}</script>\n</body>`);
  }

  writeFileSync(indexPath, html);
}

console.log(`✅ PWA assets copiados (cache: ${timestamp})`);
