/**
 * Avisa o ateliê de um pagamento aprovado.
 * Usa o Resend (https://resend.com) se RESEND_API_KEY estiver configurada;
 * caso contrário só registra no log da função. O Mercado Pago também envia
 * e-mail de venda para a conta vendedora, então o aviso é um reforço.
 */
/**
 * Confere o pagamento contra o pedido gravado na preferência.
 * Retorna a lista de divergências (vazia quando está tudo certo).
 */
export function conferirPagamento(pagamento) {
  const m = pagamento.metadata ?? {};
  const divergencias = [];
  const pagoCentavos = Math.round(Number(pagamento.transaction_amount) * 100);
  if (Number.isInteger(m.total_centavos) && pagoCentavos !== m.total_centavos) {
    divergencias.push(`valor pago R$ ${(pagoCentavos / 100).toFixed(2)} ≠ pedido R$ ${(m.total_centavos / 100).toFixed(2)}`);
  }
  if (m.forma_pagamento === 'pix' && pagamento.payment_type_id !== 'bank_transfer') {
    divergencias.push(`pedido com desconto Pix pago via ${pagamento.payment_type_id}`);
  }
  return divergencias;
}

export function textoDoAviso(pagamento, divergencias = conferirPagamento(pagamento)) {
  const m = pagamento.metadata ?? {};
  const e = m.endereco;
  const itens = (pagamento.additional_info?.items ?? [])
    .map((i) => `- ${i.quantity}x ${i.title} (R$ ${Number(i.unit_price).toFixed(2)})`)
    .join('\n');
  const endereco = e
    ? `${e.rua}, ${e.numero}${e.complemento ? ` - ${e.complemento}` : ''}\n${e.bairro} - ${e.cidade}/${e.uf} - CEP ${e.cep}`
    : 'Retirada agendada';

  return [
    divergencias.length
      ? `Pedido ${pagamento.external_reference} — DIVERGENTE: confira antes de produzir\n${divergencias.map((d) => `! ${d}`).join('\n')}`
      : `Pedido ${pagamento.external_reference} — PAGO`,
    `Pagamento Mercado Pago nº ${pagamento.id} (${pagamento.payment_type_id})`,
    `Valor: R$ ${Number(pagamento.transaction_amount).toFixed(2)}`,
    '',
    `Cliente: ${m.cliente_nome ?? ''}`,
    `E-mail: ${pagamento.payer?.email ?? ''}`,
    `WhatsApp: ${m.cliente_telefone ?? ''}`,
    '',
    'Itens:',
    itens || '(ver no painel do Mercado Pago)',
    '',
    `Entrega: ${m.entrega ?? ''}`,
    endereco,
    '',
    `Observações: ${m.observacoes || '—'}`,
  ].join('\n');
}

export async function avisarAtelie(pagamento, { env = process.env, fetchImpl = fetch } = {}) {
  const divergencias = conferirPagamento(pagamento);
  const texto = textoDoAviso(pagamento, divergencias);
  if (divergencias.length) console.warn('[aviso] pagamento divergente', pagamento.external_reference, pagamento.id, divergencias);
  if (!env.RESEND_API_KEY || !env.ORDER_NOTIFY_EMAIL) {
    console.info('[aviso] pagamento aprovado', pagamento.external_reference, pagamento.id);
    return { enviado: false };
  }
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), 8000);
  const resposta = await fetchImpl('https://api.resend.com/emails', {
    signal: controle.signal,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      // Evita e-mail duplicado quando o Mercado Pago reenvia a notificação.
      'Idempotency-Key': `pagamento-${pagamento.id}`,
    },
    body: JSON.stringify({
      from: env.ORDER_FROM_EMAIL || 'Camilinhas <pedidos@resend.dev>',
      to: [env.ORDER_NOTIFY_EMAIL],
      subject: divergencias.length
        ? `ATENÇÃO, pedido divergente: ${pagamento.external_reference}`
        : `Novo pedido pago: ${pagamento.external_reference}`,
      text: texto,
    }),
  }).finally(() => clearTimeout(timer));
  if (resposta.status === 429 || resposta.status >= 500) {
    // Erro temporário: lança para o webhook responder 500 e o Mercado Pago reenviar.
    throw new Error(`Resend ${resposta.status}`);
  }
  if (!resposta.ok) console.error('[aviso] Resend respondeu', resposta.status);
  return { enviado: resposta.ok };
}
