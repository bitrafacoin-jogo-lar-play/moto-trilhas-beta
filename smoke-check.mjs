import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'public/game.js'), 'utf8');

const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
const referenced = [...js.matchAll(/\$\('#([^']+)'\)/g)].map(m => m[1]);
const missing = [...new Set(referenced.filter(id => !ids.has(id)))];

if (missing.length) {
  console.error(`IDs ausentes no HTML: ${missing.join(', ')}`);
  process.exit(1);
}

const duplicateIds = [...ids].filter(id => (html.match(new RegExp(`id="${id}"`, 'g')) || []).length > 1);
if (duplicateIds.length) {
  console.error(`IDs duplicados: ${duplicateIds.join(', ')}`);
  process.exit(1);
}

if (!html.includes('/socket.io/socket.io.js')) {
  console.error('Cliente Socket.IO não encontrado no HTML.');
  process.exit(1);
}

console.log(`Smoke check OK: ${referenced.length} referências de interface validadas.`);
