import { json, ipDoCliente, criarLimitador } from './_lib/http.js';
import { buscarPagamento } from './_lib/mercadopago.js';
import { conferirChave, pagamentoIncluiPro } from './_lib/licenca.js';

const limitar = criarLimitador({ janelaMs: 60_000, maximo: 20 });
const ORIGENS_PADRAO = 'https://pontoapontocroche.vercel.app';

function cors(req, res, env) {
  const permitidas = (env.LICENCA_ORIGENS || ORIGENS_PADRAO).split(',').map((s) => s.trim()).filter(Boolean);
  const origem = req.headers.origin;
  if (origem && permitidas.includes(origem)) {
    res.setHeader('Access-Control-Allow-Origin', origem);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '600');
  }
  // Sem Origin = app de computador/Android chamando direto: permitido.
  return !origem || permitidas.includes(origem);
}

/**
 * POST /api/licenca  { email, chave }
 * Usado pelo app Ponto a Ponto para ativar e revalidar a versão Pro.
 * Resposta: { valida: true, plano: 'pro', aparelhos } ou { valida: false, motivo }.
 */
export default async function handler(req, res, { fetchImpl = fetch, env = process.env } = {}) {
  const origemOk = cors(req, res, env);
  if (req.method === 'OPTIONS') {
    res.statusCode = origemOk ? 204 : 403;
    return res.end();
  }
  if (req.method !== 'POST') return json(res, 405, { erro: 'Método não permitido.' }, { Allow: 'POST, OPTIONS' });
  if (!origemOk) return json(res, 403, { erro: 'Origem não permitida.' });
  if (!limitar(ipDoCliente(req))) {
    return json(res, 429, { erro: 'Muitas tentativas. Aguarde um minuto.' }, { 'Retry-After': '60' });
  }

  const segredo = env.LICENCA_SEGREDO;
  const token = env.MP_ACCESS_TOKEN;
  if (!segredo || !token) {
    console.error('[licenca] variáveis de ambiente de licença/Mercado Pago ausentes');
    return json(res, 503, { erro: 'Validação indisponível no momento.' });
  }

  let corpo = req.body;
  if (typeof corpo === 'string') {
    try { corpo = JSON.parse(corpo); } catch { corpo = null; }
  }
  const email = typeof corpo?.email === 'string' ? corpo.email.slice(0, 254) : '';
  const chave = typeof corpo?.chave === 'string' ? corpo.chave.slice(0, 80) : '';

  const pagamentoId = conferirChave(chave, email, segredo);
  if (!pagamentoId) return json(res, 200, { valida: false, motivo: 'chave ou e-mail não conferem' });

  try {
    const pagamento = await buscarPagamento(pagamentoId, { token, fetchImpl });
    if (pagamento?.status !== 'approved' || !pagamentoIncluiPro(pagamento)) {
      return json(res, 200, { valida: false, motivo: 'compra não está ativa' });
    }
    return json(res, 200, { valida: true, plano: 'pro', aparelhos: 3 });
  } catch (erro) {
    if (erro?.status === 404) return json(res, 200, { valida: false, motivo: 'compra não encontrada' });
    console.error('[licenca] falha ao consultar pagamento', erro?.message);
    return json(res, 502, { erro: 'Não foi possível validar agora. Tente de novo.' });
  }
}
