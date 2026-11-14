/**
 * Servidor local para desenvolvimento e testes de ponta a ponta.
 * Serve /public com os mesmos cabeçalhos do vercel.json e roda as funções de /api.
 *
 *   node scripts/servidor-local.mjs            # usa MP_ACCESS_TOKEN real do ambiente
 *   MP_SIMULADO=1 node scripts/servidor-local.mjs   # simula o Mercado Pago (sem rede)
 *
 * Não use em produção: em produção quem serve é a Vercel.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const RAIZ = join(process.cwd(), 'public');
const PORTA = Number(process.env.PORT || 4173);
const config = JSON.parse(await readFile(join(process.cwd(), 'vercel.json'), 'utf8'));
const cabecalhos = Object.fromEntries(config.headers[0].headers.map((h) => [h.key, h.value]));
delete cabecalhos['Strict-Transport-Security'];
cabecalhos['Content-Security-Policy'] = cabecalhos['Content-Security-Policy'].replace('; upgrade-insecure-requests', '');

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
};

const env = { ...process.env, SITE_URL: process.env.SITE_URL || `https://localhost:${PORTA}` };
const simulado = process.env.MP_SIMULADO === '1';
if (simulado) env.MP_ACCESS_TOKEN = 'simulado';

const fetchSimulado = async (url, opcoes) => {
  if (url.endsWith('/checkout/preferences')) {
    const pref = JSON.parse(opcoes.body);
    console.log('[simulado] preferência', JSON.stringify(pref, null, 2));
    return new Response(JSON.stringify({ id: 'pref-simulada', init_point: `https://www.mercadopago.com.br/simulado?ref=${pref.external_reference}` }), { status: 201 });
  }
  return new Response('{}', { status: 404 });
};

async function lerCorpo(req) {
  let tamanho = 0;
  const partes = [];
  for await (const p of req) {
    tamanho += p.length;
    if (tamanho > 32_000) throw new Error('corpo grande');
    partes.push(p);
  }
  const texto = Buffer.concat(partes).toString('utf8');
  try { return JSON.parse(texto); } catch { return texto; }
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  for (const [k, v] of Object.entries(cabecalhos)) res.setHeader(k, v);

  if (url.pathname.startsWith('/api/')) {
    const nome = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
    if (!/^[a-z]+$/.test(nome)) { res.statusCode = 404; return res.end(); }
    try {
      const { default: handler } = await import(`../api/${nome}.js`);
      req.body = await lerCorpo(req);
      // Em local o navegador manda Origin http://localhost; trata como o próprio site.
      if (req.headers.origin === `http://${req.headers.host}`) req.headers.origin = env.SITE_URL;
      return await handler(req, res, { env, fetchImpl: simulado ? fetchSimulado : fetch });
    } catch (e) {
      console.error(e); res.statusCode = 500; return res.end();
    }
  }

  let caminho = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let arquivo = join(RAIZ, caminho);
  if (!arquivo.startsWith(RAIZ)) { res.statusCode = 403; return res.end(); }
  try {
    if ((await stat(arquivo)).isDirectory()) arquivo = join(arquivo, 'index.html');
    const dados = await readFile(arquivo);
    res.setHeader('Content-Type', TIPOS[extname(arquivo)] ?? 'application/octet-stream');
    res.end(dados);
  } catch {
    res.statusCode = 404;
    res.setHeader('Content-Type', TIPOS['.html']);
    res.end(await readFile(join(RAIZ, '404.html')));
  }
}).listen(PORTA, () => console.log(`Camilinhas em http://localhost:${PORTA}${simulado ? ' (Mercado Pago simulado)' : ''}`));
