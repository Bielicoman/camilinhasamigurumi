/**
 * Verificação estática do site (roda no CI):
 *  - todo arquivo local referenciado em HTML/CSS existe;
 *  - nenhum <script> inline executável nem atributo style/on* (a CSP bloquearia);
 *  - toda <img> tem alt;
 *  - nenhum segredo com cara de token do Mercado Pago no repositório público.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, dirname, relative } from 'node:path';

const RAIZ = join(process.cwd(), 'public');
const problemas = [];

function arquivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const c = join(dir, n);
    return statSync(c).isDirectory() ? arquivos(c) : [c];
  });
}

const todos = arquivos(RAIZ);
for (const arq of todos.filter((f) => ['.html', '.css'].includes(extname(f)))) {
  const txt = readFileSync(arq, 'utf8');
  const rel = relative(process.cwd(), arq);
  const refs = [...txt.matchAll(/(?:src|href)="([^"#?]+)"|url\(['"]?([^'")]+)['"]?\)/g)].map((m) => m[1] || m[2]);
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|data:|#)/.test(ref)) continue;
    const alvo = ref.startsWith('/') ? join(RAIZ, ref) : join(dirname(arq), ref);
    const ok = existsSync(alvo) && (statSync(alvo).isFile() || existsSync(join(alvo, 'index.html')));
    if (!ok) problemas.push(`${rel}: referência quebrada ${ref}`);
  }
  if (extname(arq) === '.html') {
    for (const m of txt.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>/g)) problemas.push(`${rel}: script inline ${m[0]}`);
    if (/\sstyle="/.test(txt)) problemas.push(`${rel}: atributo style inline (bloqueado pela CSP)`);
    if (/\son[a-z]+="/.test(txt)) problemas.push(`${rel}: handler inline on*= (bloqueado pela CSP)`);
    for (const m of txt.matchAll(/<img\b[^>]*>/g)) if (!/\balt="/.test(m[0])) problemas.push(`${rel}: <img> sem alt`);
  }
}

const SEGREDO = /(APP_USR-\d{6,}-\d{6}-[a-f0-9]{32}|TEST-\d{6,}-\d{6}-[a-f0-9]{32}|re_[A-Za-z0-9]{20,})/;
for (const arq of [...todos, ...arquivos(join(process.cwd(), 'api'))]) {
  if (['.webp', '.png', '.jpg', '.ico', '.woff2'].includes(extname(arq))) continue;
  if (SEGREDO.test(readFileSync(arq, 'utf8'))) problemas.push(`${relative(process.cwd(), arq)}: possível credencial no código`);
}

if (problemas.length) {
  console.error(problemas.join('\n'));
  process.exit(1);
}
console.log(`ok: ${todos.length} arquivos verificados`);
