import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import handler from '../api/webhook.js';
import { assinaturaValida } from '../api/_lib/mercadopago.js';
import { textoDoAviso, conferirPagamento } from '../api/_lib/aviso.js';
import { criarReq, criarRes, ENV } from './helpers.js';

function assinar(dataId, requestId, ts = String(Date.now()), segredo = ENV.MP_WEBHOOK_SECRET) {
  const v1 = createHmac('sha256', segredo).update(`id:${dataId};request-id:${requestId};ts:${ts};`).digest('hex');
  return `ts=${ts},v1=${v1}`;
}

const pagamentoAprovado = {
  id: 123456789, status: 'approved', external_reference: 'CAM-20261113-ABCDEF12',
  payment_type_id: 'bank_transfer', transaction_amount: 177,
  payer: { email: 'maria@example.com' },
  additional_info: { items: [{ title: 'Jesus', quantity: '1', unit_price: '152' }] },
  metadata: { cliente_nome: 'Maria da Silva', cliente_telefone: '15999990000', entrega: 'retirada', observacoes: '', forma_pagamento: 'pix', total_centavos: 17700 },
};

function req(dataId, assinatura) {
  return criarReq({
    url: `/api/webhook?data.id=${dataId}&type=payment`,
    body: { type: 'payment', data: { id: String(dataId) } },
    headers: { 'x-signature': assinatura, 'x-request-id': 'req-1', origin: undefined },
  });
}

test('assinatura: aceita a correta, rejeita adulterada, segredo errado e antiga', () => {
  const ts = String(Date.now());
  const base = { requestId: 'req-1', dataId: '123', segredo: ENV.MP_WEBHOOK_SECRET };
  assert.ok(assinaturaValida({ ...base, assinatura: assinar('123', 'req-1', ts) }));
  assert.ok(!assinaturaValida({ ...base, assinatura: assinar('124', 'req-1', ts) }));
  assert.ok(!assinaturaValida({ ...base, assinatura: assinar('123', 'req-1', ts, 'outro') }));
  const velho = String(Date.now() - 4 * 24 * 60 * 60 * 1000);
  assert.ok(!assinaturaValida({ ...base, assinatura: assinar('123', 'req-1', velho) }));
  assert.ok(!assinaturaValida({ ...base, assinatura: 'ts=1,v1=zz' }));
  assert.ok(!assinaturaValida({ ...base, assinatura: undefined }));
  assert.ok(!assinaturaValida({ ...base, segredo: '', assinatura: assinar('123', 'req-1', ts) }));
});

test('webhook sem assinatura válida responde 401 e não consulta o Mercado Pago', async () => {
  let chamou = false;
  const res = criarRes();
  await handler(req(123456789, 'ts=1,v1=00'), res, { env: ENV, fetchImpl: async () => { chamou = true; } });
  assert.equal(res.statusCode, 401);
  assert.equal(chamou, false);
});

test('webhook válido consulta o pagamento e avisa o ateliê quando aprovado', async () => {
  const chamadas = [];
  const fetchImpl = async (url, opcoes) => {
    chamadas.push({ url, opcoes });
    if (url.startsWith('https://api.mercadopago.com/v1/payments/')) {
      return new Response(JSON.stringify(pagamentoAprovado), { status: 200 });
    }
    return new Response('{}', { status: 200 });
  };
  const env = { ...ENV, RESEND_API_KEY: ['re', 'ficticio'].join('_'), ORDER_NOTIFY_EMAIL: 'atelie@example.com' };
  const res = criarRes();
  await handler(req(123456789, assinar('123456789', 'req-1')), res, { env, fetchImpl });
  assert.equal(res.statusCode, 200, res.corpo);
  assert.equal(chamadas[0].url, 'https://api.mercadopago.com/v1/payments/123456789');
  assert.equal(chamadas[1].url, 'https://api.resend.com/emails');
  assert.equal(chamadas[1].opcoes.headers['Idempotency-Key'], 'pagamento-123456789');
  assert.match(JSON.parse(chamadas[1].opcoes.body).text, /CAM-20261113-ABCDEF12 — PAGO/);
});

test('webhook não avisa pagamento pendente e devolve 500 se o Mercado Pago falhar', async () => {
  const chamadas = [];
  let res = criarRes();
  await handler(req(1, assinar('1', 'req-1')), res, {
    env: { ...ENV, RESEND_API_KEY: 'x', ORDER_NOTIFY_EMAIL: 'y@z.com' },
    fetchImpl: async (url) => { chamadas.push(url); return new Response(JSON.stringify({ id: 1, status: 'pending' })); },
  });
  assert.equal(res.statusCode, 200);
  assert.equal(chamadas.length, 1);

  res = criarRes();
  await handler(req(2, assinar('2', 'req-1')), res, { env: ENV, fetchImpl: async () => new Response('{}', { status: 500 }) });
  assert.equal(res.statusCode, 500);
});

test('aviso em texto puro inclui endereço e observações', () => {
  const t = textoDoAviso({ ...pagamentoAprovado, metadata: { ...pagamentoAprovado.metadata, entrega: 'correios', endereco: { rua: 'Rua A', numero: '1', complemento: '', bairro: 'Centro', cidade: 'Sorocaba', uf: 'SP', cep: '18010000' } } });
  assert.match(t, /Rua A, 1\nCentro - Sorocaba\/SP - CEP 18010000/);
  assert.match(t, /1x Jesus \(R\$ 152\.00\)/);
});

test('pagamento divergente (valor ou meio) é sinalizado, não marcado como pago', () => {
  assert.deepEqual(conferirPagamento(pagamentoAprovado), []);
  const outroValor = { ...pagamentoAprovado, transaction_amount: 10 };
  assert.equal(conferirPagamento(outroValor).length, 1);
  const saldo = { ...pagamentoAprovado, payment_type_id: 'account_money' };
  assert.match(textoDoAviso(saldo), /DIVERGENTE/);
  assert.doesNotMatch(textoDoAviso(saldo), /— PAGO/);
});

test('webhook: pagamento inexistente responde 200 (sem reenvio); Resend fora do ar responde 500 (com reenvio)', async () => {
  let res = criarRes();
  await handler(req(9, assinar('9', 'req-1')), res, { env: ENV, fetchImpl: async () => new Response('{}', { status: 404 }) });
  assert.equal(res.statusCode, 200);

  res = criarRes();
  const env = { ...ENV, RESEND_API_KEY: 'x', ORDER_NOTIFY_EMAIL: 'y@z.com' };
  await handler(req(123456789, assinar('123456789', 'req-1')), res, {
    env,
    fetchImpl: async (url) => url.includes('mercadopago')
      ? new Response(JSON.stringify(pagamentoAprovado), { status: 200 })
      : new Response('{}', { status: 503 }),
  });
  assert.equal(res.statusCode, 500);
});
