/** Utilidades HTTP compartilhadas pelas funções serverless. */

export function json(res, status, corpo, cabecalhos = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(cabecalhos)) res.setHeader(k, v);
  res.end(JSON.stringify(corpo));
}

export function ipDoCliente(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress ?? 'desconhecido';
}

/**
 * Limite de requisições por IP em memória (por instância da função).
 * É uma barreira contra abuso casual, não um WAF: para proteção forte,
 * ative o Firewall/Rate Limiting da Vercel (ver docs/SEGURANCA.md).
 */
export function criarLimitador({ janelaMs, maximo }) {
  const baldes = new Map();
  return function permitir(chave, agora = Date.now()) {
    const balde = baldes.get(chave);
    if (!balde || agora - balde.inicio > janelaMs) {
      baldes.set(chave, { inicio: agora, contagem: 1 });
      if (baldes.size > 5000) {
        for (const [k, b] of baldes) if (agora - b.inicio > janelaMs) baldes.delete(k);
      }
      return true;
    }
    balde.contagem += 1;
    return balde.contagem <= maximo;
  };
}

/** Confere se a requisição veio do próprio site. */
export function origemPermitida(req, siteUrl) {
  const origem = req.headers.origin;
  if (!origem) return false;
  try {
    const esperado = new URL(siteUrl).origin;
    if (origem === esperado) return true;
    // Previews da Vercel usam o mesmo host do deployment.
    const host = req.headers.host;
    return Boolean(host) && origem === `https://${host}`;
  } catch {
    return false;
  }
}
