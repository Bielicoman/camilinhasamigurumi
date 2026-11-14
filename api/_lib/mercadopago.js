import { createHmac, timingSafeEqual } from 'node:crypto';

const API = 'https://api.mercadopago.com';
const TIMEOUT_MS = 10_000;

export class ErroMercadoPago extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.name = 'ErroMercadoPago';
    this.status = status;
  }
}

async function chamar(caminho, { metodo = 'GET', token, corpo, idempotencia, fetchImpl = fetch }) {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TIMEOUT_MS);
  try {
    const resposta = await fetchImpl(`${API}${caminho}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(idempotencia ? { 'X-Idempotency-Key': idempotencia } : {}),
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
      signal: controle.signal,
    });
    const texto = await resposta.text();
    const dados = texto ? JSON.parse(texto) : null;
    if (!resposta.ok) {
      // Não propaga a mensagem do provedor ao cliente: só ao log.
      console.error('[mercadopago]', metodo, caminho, resposta.status, dados?.message ?? '');
      throw new ErroMercadoPago('Falha ao falar com o Mercado Pago.', resposta.status);
    }
    return dados;
  } finally {
    clearTimeout(timer);
  }
}

const reais = (centavos) => Math.round(centavos) / 100;

/** Data no formato que a documentação do Mercado Pago usa (horário de Brasília, -03:00). */
export function dataMercadoPago(ms) {
  const brasilia = new Date(ms - 3 * 3600 * 1000);
  return `${brasilia.toISOString().slice(0, 23)}-03:00`;
}

/** Monta o corpo da preferência do Checkout Pro a partir do pedido calculado no servidor. */
export function montarPreferencia({ pedido, cliente, pedidoId, siteUrl }) {
  const [primeiroNome, ...resto] = cliente.nome.split(' ');
  const pix = pedido.formaPagamento === 'pix';

  const preferencia = {
    external_reference: pedidoId,
    statement_descriptor: 'CAMILINHAS',
    items: pedido.linhas.map((l) => ({
      id: l.id,
      title: l.nome,
      category_id: l.digital ? 'services' : 'others',
      quantity: l.quantidade,
      currency_id: 'BRL',
      unit_price: reais(l.unitarioCentavos),
      ...(l.imagem ? { picture_url: new URL(l.imagem, siteUrl).toString() } : {}),
    })),
    payer: {
      name: primeiroNome,
      surname: resto.join(' '),
      email: cliente.email,
      phone: { area_code: cliente.telefone.slice(0, 2), number: cliente.telefone.slice(2) },
      ...(cliente.endereco
        ? {
            address: {
              zip_code: cliente.endereco.cep,
              street_name: cliente.endereco.rua,
              street_number: cliente.endereco.numero,
            },
          }
        : {}),
    },
    payment_methods: pix
      ? {
          // Pix = bank_transfer. Exclui todo o resto para garantir que o desconto só vale no Pix.
          excluded_payment_types: [
            { id: 'credit_card' },
            { id: 'debit_card' },
            { id: 'ticket' },
            { id: 'prepaid_card' },
            { id: 'atm' },
            // Saldo, Mercado Crédito e carteiras também não ganham o desconto do Pix.
            { id: 'account_money' },
            { id: 'digital_currency' },
            { id: 'digital_wallet' },
          ],
          installments: 1,
        }
      : {
          excluded_payment_types: [{ id: 'bank_transfer' }],
          installments: pedido.parcelas,
        },
    back_urls: {
      success: `${siteUrl}/pedido/?status=aprovado`,
      pending: `${siteUrl}/pedido/?status=pendente`,
      failure: `${siteUrl}/pedido/?status=recusado`,
    },
    auto_return: 'approved',
    notification_url: `${siteUrl}/api/webhook`,
    metadata: {
      pedido_id: pedidoId,
      entrega: pedido.entrega.id,
      forma_pagamento: pedido.formaPagamento,
      total_centavos: pedido.totalCentavos,
      observacoes: cliente.observacoes,
      cliente_nome: cliente.nome,
      cliente_email: cliente.email,
      produtos_digitais: pedido.linhas.filter((l) => l.digital).map((l) => l.id).join(','),
      cliente_telefone: cliente.telefone,
      endereco: cliente.endereco,
    },
  };

  if (pedido.freteCentavos > 0) {
    preferencia.shipments = { mode: 'not_specified', cost: reais(pedido.freteCentavos) };
  }
  const agora = Date.now();
  if (pix) {
    // O código Pix expira em 24 h.
    preferencia.date_of_expiration = dataMercadoPago(agora + 24 * 3600 * 1000);
  }
  // O link de pagamento vale 48 h: preço antigo não fica disponível para sempre.
  preferencia.expires = true;
  preferencia.expiration_date_from = dataMercadoPago(agora - 60 * 1000);
  preferencia.expiration_date_to = dataMercadoPago(agora + 48 * 3600 * 1000);
  return preferencia;
}

export function criarPreferencia(preferencia, { token, fetchImpl }) {
  return chamar('/checkout/preferences', {
    metodo: 'POST',
    token,
    corpo: preferencia,
    idempotencia: preferencia.external_reference,
    fetchImpl,
  });
}

export function buscarPagamento(id, { token, fetchImpl }) {
  if (!/^\d{1,20}$/.test(String(id))) throw new ErroMercadoPago('ID de pagamento inválido.', 400);
  return chamar(`/v1/payments/${id}`, { token, fetchImpl });
}

/**
 * Valida o cabeçalho x-signature das notificações (Webhooks) do Mercado Pago.
 * Manifesto: `id:{data.id};request-id:{x-request-id};ts:{ts};`
 * https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
// Tolerância larga: o Mercado Pago reenvia notificações por horas; o replay é inofensivo
// porque o webhook só lê o pagamento na API e o aviso por e-mail é idempotente.
export function assinaturaValida({ assinatura, requestId, dataId, segredo, agora = Date.now(), toleranciaMs = 72 * 3600 * 1000 }) {
  if (!assinatura || !segredo || !dataId) return false;

  const partes = Object.fromEntries(
    String(assinatura)
      .split(',')
      .map((p) => p.split('=').map((s) => s.trim()))
      .filter((p) => p.length === 2),
  );
  const { ts, v1 } = partes;
  if (!ts || !v1 || !/^[0-9a-f]{64}$/i.test(v1) || !/^\d+$/.test(ts)) return false;

  // ts vem em milissegundos; rejeita notificações velhas (replay).
  const tsMs = ts.length > 11 ? Number(ts) : Number(ts) * 1000;
  if (Math.abs(agora - tsMs) > toleranciaMs) return false;

  const id = /^[a-z0-9]+$/i.test(dataId) ? String(dataId).toLowerCase() : String(dataId);
  let manifesto = `id:${id};`;
  if (requestId) manifesto += `request-id:${requestId};`;
  manifesto += `ts:${ts};`;

  const esperado = createHmac('sha256', segredo).update(manifesto).digest();
  const recebido = Buffer.from(v1, 'hex');
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}
