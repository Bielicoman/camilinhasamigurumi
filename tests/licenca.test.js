import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { calcularPedido, precoVigente, emLancamento } from '../public/assets/js/pricing.js';
import { gerarChave, conferirChave } from '../api/_lib/licenca.js';
import { prepararPedido } from '../api/_lib/pedido.js';
import webhook from '../api/webhook.js';
import licenca from '../api/licenca.js';
import { criarReq, criarRes, ENV } from './helpers.js';

const catalogo = JSON.parse(readFileSync(new URL('../public/catalog.json', import.meta.url), 'utf8'));
// Os testes simulam a venda aberta, independentemente do interruptor do catálogo.
const aberto = { ...catalogo, produtos: catalogo.produtos.map((p) => (p.id === 'ponto-a-ponto-pro' ? { ...p, disponivel: true } : p)) };
const pro = aberto.produtos.find((p) => p.id === 'ponto-a-ponto-pro');
const SEGREDO = ['licenca', 'ficticia'].join('-');
const ENV_PRO = { ...ENV, LICENCA_SEGREDO: SEGREDO, RESEND_API_KEY: 'x', ORDER_NOTIFY_EMAIL: 'atelie@example.com' };

const antes = Date.parse('2026-12-01T12:00:00-03:00');
const depois = Date.parse('2027-01-01T00:00:01-03:00');

test('preço de lançamento: R$ 250 até a data, R$ 500 depois', () => {
  assert.equal(precoVigente(pro, antes), 25000);
  assert.ok(emLancamento(pro, antes));
  assert.equal(precoVigente(pro, depois), 50000);
  assert.ok(!emLancamento(pro, depois));
});

test('pedido digital: entrega digital obrigatória, uma licença, não mistura com peças', () => {
  const base = { formaPagamento: 'cartao', entrega: 'digital', agora: antes };
  const ok = calcularPedido(aberto, { ...base, itens: [{ id: 'ponto-a-ponto-pro', quantidade: 1 }] });
  assert.ok(ok.ok, ok.erro);
  assert.equal(ok.pedido.totalCentavos, 25000);
  assert.equal(ok.pedido.freteCentavos, 0);
  assert.equal(ok.pedido.parcelas, 5);
  assert.ok(ok.pedido.digital);

  const pix = calcularPedido(aberto, { ...base, formaPagamento: 'pix', itens: [{ id: 'ponto-a-ponto-pro', quantidade: 1 }] });
  assert.equal(pix.pedido.totalCentavos, 23750);

  const tarde = calcularPedido(aberto, { ...base, agora: depois, itens: [{ id: 'ponto-a-ponto-pro', quantidade: 1 }] });
  assert.equal(tarde.pedido.totalCentavos, 50000);

  assert.equal(calcularPedido(aberto, { ...base, itens: [{ id: 'ponto-a-ponto-pro', quantidade: 2 }] }).ok, false);
  assert.equal(calcularPedido(aberto, { ...base, itens: [{ id: 'ponto-a-ponto-pro', quantidade: 1 }, { id: 'capimila', quantidade: 1 }] }).ok, false);
  assert.equal(calcularPedido(aberto, { ...base, entrega: 'correios', cep: '18010000', itens: [{ id: 'ponto-a-ponto-pro', quantidade: 1 }] }).ok, false);
  assert.equal(calcularPedido(aberto, { ...base, itens: [{ id: 'capimila', quantidade: 1 }] }).ok, false);
});

test('venda fechada no catálogo bloqueia a compra no servidor', () => {
  const r = prepararPedido(catalogo, {
    itens: [{ id: 'ponto-a-ponto-pro', quantidade: 1 }], formaPagamento: 'pix', entrega: 'digital',
    cliente: { nome: 'Maria da Silva', email: 'maria@example.com', telefone: '15999990000' },
  });
  assert.equal(r.ok, false);
});

test('chave de licença: confere com o e-mail certo, falha com outro e-mail ou chave alterada', () => {
  const chave = gerarChave(123456789, 'Maria@Example.com', SEGREDO);
  assert.match(chave, /^PAP-123456789-[0-9A-F]{5}-[0-9A-F]{5}-[0-9A-F]{5}-[0-9A-F]{5}$/);
  assert.equal(conferirChave(chave, 'maria@example.com', SEGREDO), '123456789');
  assert.equal(conferirChave(chave.toLowerCase(), ' maria@example.com ', SEGREDO), '123456789');
  assert.equal(conferirChave(chave, 'outra@example.com', SEGREDO), null);
  assert.equal(conferirChave(chave.replace('PAP-123456789', 'PAP-123456780'), 'maria@example.com', SEGREDO), null);
  assert.equal(conferirChave(chave, 'maria@example.com', 'outro-segredo'), null);
  assert.equal(conferirChave('lixo', 'maria@example.com', SEGREDO), null);
});

const pagamentoPro = {
  id: 987654321, status: 'approved', external_reference: 'CAM-20261201-AAAABBBB',
  payment_type_id: 'credit_card', transaction_amount: 250,
  payer: { email: 'conta-mp@example.com' },
  additional_info: { items: [{ title: 'Ponto a Ponto Pro', quantity: '1', unit_price: '250' }] },
  metadata: {
    cliente_nome: 'Maria da Silva', cliente_email: 'maria@example.com', cliente_telefone: '15999990000',
    entrega: 'digital', forma_pagamento: 'cartao', total_centavos: 25000, produtos_digitais: 'ponto-a-ponto-pro',
  },
};

function assinar(dataId) {
  const ts = String(Date.now());
  const v1 = createHmac('sha256', ENV.MP_WEBHOOK_SECRET).update(`id:${dataId};request-id:req-1;ts:${ts};`).digest('hex');
  return `ts=${ts},v1=${v1}`;
}

function reqWebhook(id) {
  return criarReq({
    url: `/api/webhook?data.id=${id}&type=payment`,
    body: { type: 'payment', data: { id: String(id) } },
    headers: { 'x-signature': assinar(String(id)), 'x-request-id': 'req-1', origin: undefined },
  });
}

test('webhook: compra do Pro aprovada envia a chave ao e-mail informado no checkout', async () => {
  const emails = [];
  const fetchImpl = async (url, opcoes) => {
    if (url.includes('api.mercadopago.com')) return new Response(JSON.stringify(pagamentoPro));
    emails.push(JSON.parse(opcoes.body));
    return new Response('{}', { status: 200 });
  };
  const res = criarRes();
  await webhook(reqWebhook(987654321), res, { env: ENV_PRO, fetchImpl });
  assert.equal(res.statusCode, 200, res.corpo);
  const paraCliente = emails.find((e) => e.to[0] === 'maria@example.com');
  assert.ok(paraCliente, 'e-mail ao comprador');
  const chave = paraCliente.text.match(/PAP-\S+/)[0];
  assert.equal(conferirChave(chave, 'maria@example.com', SEGREDO), '987654321');
  const paraAtelie = emails.find((e) => e.to[0] === 'atelie@example.com');
  assert.match(paraAtelie.text, /Licença do Ponto a Ponto Pro enviada para maria@example\.com/);
});

test('webhook: compra do Pro com valor divergente não envia chave', async () => {
  const emails = [];
  const divergente = { ...pagamentoPro, transaction_amount: 1 };
  const fetchImpl = async (url, opcoes) => {
    if (url.includes('api.mercadopago.com')) return new Response(JSON.stringify(divergente));
    emails.push(JSON.parse(opcoes.body));
    return new Response('{}');
  };
  const res = criarRes();
  await webhook(reqWebhook(987654321), res, { env: ENV_PRO, fetchImpl });
  assert.equal(res.statusCode, 200);
  assert.ok(!emails.some((e) => e.to[0] === 'maria@example.com'));
  assert.match(emails[0].text, /NÃO enviada/);
});

test('webhook: sem LICENCA_SEGREDO responde 500 para o Mercado Pago reenviar', async () => {
  const res = criarRes();
  await webhook(reqWebhook(987654321), res, {
    env: { ...ENV_PRO, LICENCA_SEGREDO: '' },
    fetchImpl: async () => new Response(JSON.stringify(pagamentoPro)),
  });
  assert.equal(res.statusCode, 500);
});

function reqLicenca(corpo, headers = {}) {
  return criarReq({ url: '/api/licenca', body: corpo, headers: { origin: undefined, ...headers } });
}

test('/api/licenca: válida com compra aprovada; inválida com estorno, e-mail errado ou origem estranha', async () => {
  const chave = gerarChave(987654321, 'maria@example.com', SEGREDO);
  const mp = (status) => async () => new Response(JSON.stringify({ ...pagamentoPro, status }));

  let res = criarRes();
  await licenca(reqLicenca({ email: 'maria@example.com', chave }), res, { env: ENV_PRO, fetchImpl: mp('approved') });
  assert.deepEqual(res.json, { valida: true, plano: 'pro', aparelhos: 3 });

  res = criarRes();
  await licenca(reqLicenca({ email: 'maria@example.com', chave }), res, { env: ENV_PRO, fetchImpl: mp('refunded') });
  assert.equal(res.json.valida, false);

  res = criarRes();
  let consultou = false;
  await licenca(reqLicenca({ email: 'joao@example.com', chave }), res, { env: ENV_PRO, fetchImpl: async () => { consultou = true; } });
  assert.equal(res.json.valida, false);
  assert.equal(consultou, false);

  res = criarRes();
  await licenca(reqLicenca({ email: 'maria@example.com', chave }, { origin: 'https://pontoapontocroche.vercel.app' }), res, { env: ENV_PRO, fetchImpl: mp('approved') });
  assert.equal(res.json.valida, true);
  assert.equal(res.headers['access-control-allow-origin'], 'https://pontoapontocroche.vercel.app');

  res = criarRes();
  await licenca(reqLicenca({ email: 'maria@example.com', chave }, { origin: 'https://golpe.example' }), res, { env: ENV_PRO, fetchImpl: mp('approved') });
  assert.equal(res.statusCode, 403);
});
