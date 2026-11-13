import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let cache = null;

/**
 * Lê public/catalog.json — a mesma fonte que o site exibe.
 * O arquivo é incluído no bundle da função via `functions.includeFiles` (vercel.json).
 */
export function carregarCatalogo() {
  if (!cache) {
    const caminho = join(process.cwd(), 'public', 'catalog.json');
    cache = Object.freeze(JSON.parse(readFileSync(caminho, 'utf8')));
  }
  return cache;
}
