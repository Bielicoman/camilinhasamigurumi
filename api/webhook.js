import { json } from './_lib/http.js';
import { assinaturaValida, buscarPagamento } from './_lib/mercadopago.js';
import { avisarAtelie } from './_lib/aviso.js';

/**
 * POST /api/webhook — notificações de pagamento do Mercado Pago.
 *
 * 1. Valida a assinatura HMAC (x-signature) com MP_WEBHOOK_SECRET.
 * 2. Ignora o conteúdo do corpo e consulta o pagamento direto na API do
 *    Mercado Pago — a única fonte confiável do status.
 * 3. Se aprovado, avisa o ateliê.
 */
export default async function handler(req, res, { fetchImpl = fetch, env = process.env } = {}) {
  if (req.method !== 'POST') return json(res, 405, { erro: 'Método não permitido.' }, { Allow: 'POST' });

  const url = new URL(req.url, 'https://local');
  const tipo = url.searchParams.get('type') ?? req.body?.type;
  const dataId = url.searchParams.get('data.id') ?? req.body?.data?.id;

  const valida = assinaturaValida({
    assinatura: req.headers['x-signature'],
    requestId: req.headers['x-request-id'],
    dataId: dataId != null ? String(dataId) : '',
    segredo: env.MP_WEBHOOK_SECRET,
  });
  if (!valida) return json(res, 401, { erro: 'Assinatura inválida.' });

  if (tipo !== 'payment') return json(res, 200, { ok: true, ignorado: tipo ?? 'sem tipo' });

  try {
    const pagamento = await buscarPagamento(dataId, { token: env.MP_ACCESS_TOKEN, fetchImpl });
    if (pagamento?.status === 'approved') {
      await avisarAtelie(pagamento, { env, fetchImpl });
    } else {
      console.info('[webhook] pagamento', pagamento?.id, pagamento?.status, pagamento?.external_reference);
    }
    return json(res, 200, { ok: true });
  } catch (erro) {
    if (erro?.status === 404 || erro?.status === 400) {
      // Pagamento inexistente (ex.: notificação de teste do painel): não adianta reenviar.
      console.warn('[webhook] pagamento não encontrado', dataId);
      return json(res, 200, { ok: true, ignorado: 'pagamento não encontrado' });
    }
    console.error('[webhook] falha ao processar', dataId, erro?.message);
    // 500 faz o Mercado Pago reenviar a notificação mais tarde.
    return json(res, 500, { erro: 'Falha temporária.' });
  }
}
