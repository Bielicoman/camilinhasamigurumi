import { carregarCatalogo } from './_lib/catalogo.js';
import { json, ipDoCliente, criarLimitador, origemPermitida } from './_lib/http.js';
import { prepararPedido, novoPedidoId } from './_lib/pedido.js';
import { montarPreferencia, criarPreferencia } from './_lib/mercadopago.js';

const limitar = criarLimitador({ janelaMs: 60_000, maximo: 8 });

/**
 * POST /api/checkout
 * Recebe a sacola e os dados do comprador, recalcula tudo a partir do catálogo
 * e devolve a URL do Checkout Pro do Mercado Pago.
 */
export default async function handler(req, res, { fetchImpl = fetch, env = process.env } = {}) {
  if (req.method !== 'POST') {
    return json(res, 405, { erro: 'Método não permitido.' }, { Allow: 'POST' });
  }

  const token = env.MP_ACCESS_TOKEN;
  const siteUrl = (env.SITE_URL || '').replace(/\/+$/, '');
  if (!token || !siteUrl.startsWith('https://')) {
    console.error('[checkout] MP_ACCESS_TOKEN ou SITE_URL ausentes/inválidos');
    return json(res, 503, { erro: 'Pagamento temporariamente indisponível. Fale com a gente no WhatsApp.' });
  }

  if (!origemPermitida(req, siteUrl)) return json(res, 403, { erro: 'Origem não permitida.' });
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) {
    return json(res, 415, { erro: 'Envie JSON.' });
  }
  if (!limitar(ipDoCliente(req))) {
    return json(res, 429, { erro: 'Muitas tentativas. Aguarde um minuto.' }, { 'Retry-After': '60' });
  }

  if (Number(req.headers['content-length'] || 0) > 16_000) {
    return json(res, 413, { erro: 'Requisição grande demais.' });
  }

  let corpo = req.body;
  if (typeof corpo === 'string') {
    if (corpo.length > 16_000) return json(res, 413, { erro: 'Requisição grande demais.' });
    try { corpo = JSON.parse(corpo); } catch { return json(res, 400, { erro: 'JSON inválido.' }); }
  }

  const resultado = prepararPedido(carregarCatalogo(), corpo);
  if (!resultado.ok) {
    return json(res, resultado.codigo === 'PRECO_MUDOU' ? 409 : 422, { erro: resultado.erro, codigo: resultado.codigo });
  }

  const pedidoId = novoPedidoId();
  const preferencia = montarPreferencia({ pedido: resultado.pedido, cliente: resultado.cliente, pedidoId, siteUrl });

  try {
    const criada = await criarPreferencia(preferencia, { token, fetchImpl });
    const destino = new URL(criada?.init_point ?? 'invalido:');
    if (destino.protocol !== 'https:' || !/(^|\.)mercadopago\.com(\.br)?$/.test(destino.hostname)) {
      throw new Error('init_point inesperado');
    }
    return json(res, 201, { pedidoId, urlPagamento: criada.init_point, totalCentavos: resultado.pedido.totalCentavos });
  } catch (erro) {
    console.error('[checkout] falha ao criar preferência', pedidoId, erro?.status ?? '', erro?.message);
    return json(res, 502, { erro: 'Não conseguimos abrir o pagamento agora. Tente de novo em instantes.' });
  }
}
