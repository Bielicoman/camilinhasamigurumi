import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/checkout.js';
import { criarReq, criarRes, ENV, corpoValido } from './helpers.js';

function fetchFalso(captura, resposta = { status: 201, corpo: { id: 'pref-1', init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-1' } }) {
  return async (url, opcoes) => {
    captura.url = url;
    captura.opcoes = opcoes;
    captura.corpo = JSON.parse(opcoes.body);
    return new Response(JSON.stringify(resposta.corpo), { status: resposta.status });
  };
}

test('cria preferência com preços do servidor, ignorando preço enviado pelo cliente', async () => {
  const cap = {};
  const corpo = corpoValido({ itens: [{ id: 'jesus', quantidade: 1, precoCentavos: 1 }, { id: 'capimila', quantidade: 2 }] });
  const res = criarRes();
  await handler(criarReq({ body: corpo }), res, { env: ENV, fetchImpl: fetchFalso(cap) });

  assert.equal(res.statusCode, 201, res.corpo);
  assert.match(res.json.urlPagamento, /^https:\/\/www\.mercadopago\.com\.br\//);
  assert.match(res.json.pedidoId, /^CAM-\d{8}-[0-9A-F]{8}$/);
  assert.equal(cap.url, 'https://api.mercadopago.com/checkout/preferences');
  assert.equal(cap.opcoes.headers.Authorization, `Bearer ${ENV.MP_ACCESS_TOKEN}`);
  assert.equal(cap.opcoes.headers['X-Idempotency-Key'], res.json.pedidoId);
  assert.deepEqual(cap.corpo.items.map((i) => [i.id, i.quantity, i.unit_price]), [['jesus', 1, 160], ['capimila', 2, 45]]);
  assert.deepEqual(cap.corpo.shipments, { mode: 'not_specified', cost: 25 });
  assert.equal(cap.corpo.payment_methods.installments, 5);
  assert.deepEqual(cap.corpo.payment_methods.excluded_payment_types, [{ id: 'bank_transfer' }]);
  assert.equal(cap.corpo.notification_url, 'https://loja.exemplo.com.br/api/webhook');
  assert.equal(cap.corpo.back_urls.success, 'https://loja.exemplo.com.br/pedido/?status=aprovado');
  assert.equal(cap.corpo.payer.phone.area_code, '15');
  assert.equal(cap.corpo.items[0].picture_url, 'https://loja.exemplo.com.br/assets/img/produtos/jesus.webp');
});

test('Pix: só Pix habilitado e preço com 5% de desconto', async () => {
  const cap = {};
  const res = criarRes();
  await handler(criarReq({ body: corpoValido({ formaPagamento: 'pix', entrega: 'retirada' }) }), res, { env: ENV, fetchImpl: fetchFalso(cap) });
  assert.equal(res.statusCode, 201, res.corpo);
  const excluidos = cap.corpo.payment_methods.excluded_payment_types.map((t) => t.id);
  assert.ok(!excluidos.includes('bank_transfer'));
  assert.ok(excluidos.includes('credit_card') && excluidos.includes('ticket'));
  assert.ok(excluidos.includes('account_money') && excluidos.includes('digital_wallet'));
  assert.match(cap.corpo.date_of_expiration, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}-03:00$/);
  assert.equal(cap.corpo.expires, true);
  assert.equal(cap.corpo.items[0].unit_price, 152);
  assert.equal(cap.corpo.shipments, undefined);
  assert.ok(cap.corpo.date_of_expiration);
});

test('retirada não exige endereço', async () => {
  const cap = {};
  const corpo = corpoValido({ entrega: 'retirada' });
  delete corpo.cliente.endereco;
  const res = criarRes();
  await handler(criarReq({ body: corpo }), res, { env: ENV, fetchImpl: fetchFalso(cap) });
  assert.equal(res.statusCode, 201, res.corpo);
  assert.equal(cap.corpo.payer.address, undefined);
});

test('409 quando o total exibido diverge do total do servidor', async () => {
  const res = criarRes();
  await handler(criarReq({ body: corpoValido({ totalExibidoCentavos: 100 }) }), res, { env: ENV, fetchImpl: fetchFalso({}) });
  assert.equal(res.statusCode, 409);
  assert.equal(res.json.codigo, 'PRECO_MUDOU');
});

test('bloqueia método, origem e content-type errados', async () => {
  let res = criarRes();
  await handler(criarReq({ method: 'GET' }), res, { env: ENV });
  assert.equal(res.statusCode, 405);

  res = criarRes();
  await handler(criarReq({ body: corpoValido(), headers: { origin: 'https://golpe.example' } }), res, { env: ENV });
  assert.equal(res.statusCode, 403);

  res = criarRes();
  await handler(criarReq({ body: corpoValido(), headers: { origin: undefined } }), res, { env: ENV });
  assert.equal(res.statusCode, 403);

  res = criarRes();
  await handler(criarReq({ body: 'x', headers: { 'content-type': 'text/plain' } }), res, { env: ENV });
  assert.equal(res.statusCode, 415);
});

test('valida dados do comprador', async () => {
  const casos = [
    (c) => { c.cliente.nome = 'Ana'; },
    (c) => { c.cliente.email = 'nao-e-email'; },
    (c) => { c.cliente.telefone = '1234'; },
    (c) => { c.cliente.endereco.uf = 'XX'; },
    (c) => { c.cliente.endereco.cep = '1801'; },
    (c) => { c.cliente.endereco.numero = ''; },
    (c) => { c.entrega = 'motoboy'; c.cliente.endereco.cep = '01310-100'; },
    (c) => { c.cliente.endereco.uf = 'AM'; },
    (c) => { c.entrega = 'motoboy'; c.cliente.endereco.cidade = 'Manaus'; },
    (c) => { c.itens = Array.from({ length: 21 }, (_, i) => ({ id: `x${i}`, quantidade: 1 })); },
  ];
  for (const mudar of casos) {
    const corpo = corpoValido();
    mudar(corpo);
    const res = criarRes();
    await handler(criarReq({ body: corpo }), res, { env: ENV, fetchImpl: fetchFalso({}) });
    assert.equal(res.statusCode, 422, `${mudar} → ${res.corpo}`);
  }
});

test('saneia texto livre: sem caracteres de controle e limitado', async () => {
  const cap = {};
  const corpo = corpoValido();
  corpo.cliente.observacoes = `oi\u0000‮<script>${'a'.repeat(1000)}`;
  const res = criarRes();
  await handler(criarReq({ body: corpo }), res, { env: ENV, fetchImpl: fetchFalso(cap) });
  assert.equal(res.statusCode, 201);
  assert.ok(cap.corpo.metadata.observacoes.length <= 400);
  assert.ok(!/\u0000/.test(cap.corpo.metadata.observacoes));
});

test('503 sem credenciais e 502 quando o Mercado Pago falha, sem vazar detalhes', async () => {
  let res = criarRes();
  await handler(criarReq({ body: corpoValido() }), res, { env: { SITE_URL: ENV.SITE_URL } });
  assert.equal(res.statusCode, 503);

  res = criarRes();
  await handler(criarReq({ body: corpoValido() }), res, {
    env: ENV,
    fetchImpl: fetchFalso({}, { status: 401, corpo: { message: 'invalid access token XYZ' } }),
  });
  assert.equal(res.statusCode, 502);
  assert.ok(!res.corpo.includes('XYZ'));
});

test('limite de requisições por IP', async () => {
  const headers = { 'x-forwarded-for': '203.0.113.7' };
  let ultimo;
  for (let i = 0; i < 9; i++) {
    ultimo = criarRes();
    await handler(criarReq({ body: corpoValido(), headers }), ultimo, { env: ENV, fetchImpl: fetchFalso({}) });
  }
  assert.equal(ultimo.statusCode, 429);
});

test('motoboy aceita Sorocaba escrita sem acento e em maiúsculas', async () => {
  const corpo = corpoValido({ entrega: 'motoboy' });
  corpo.cliente.endereco.cidade = 'SOROCABA';
  const res = criarRes();
  await handler(criarReq({ body: corpo }), res, { env: ENV, fetchImpl: fetchFalso({}) });
  assert.equal(res.statusCode, 201, res.corpo);
});

test('recusa corpo grande e init_point fora do Mercado Pago', async () => {
  let res = criarRes();
  await handler(criarReq({ body: corpoValido(), headers: { 'content-length': '20000' } }), res, { env: ENV });
  assert.equal(res.statusCode, 413);

  res = criarRes();
  await handler(criarReq({ body: corpoValido() }), res, {
    env: ENV, fetchImpl: fetchFalso({}, { status: 201, corpo: { init_point: 'https://golpe.example/pagar' } }),
  });
  assert.equal(res.statusCode, 502);
});
