import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calcularPedido, calcularFrete, calcularParcelas, precoUnitario } from '../public/assets/js/pricing.js';

const catalogo = JSON.parse(readFileSync(new URL('../public/catalog.json', import.meta.url), 'utf8'));
const metodo = (id) => catalogo.entrega.metodos.find((m) => m.id === id);

test('catálogo: ids únicos, preços inteiros positivos, imagens existentes', () => {
  const ids = new Set();
  for (const p of catalogo.produtos) {
    assert.ok(!ids.has(p.id), `id duplicado ${p.id}`);
    ids.add(p.id);
    assert.ok(Number.isInteger(p.precoCentavos) && p.precoCentavos > 0, p.id);
    assert.ok(catalogo.categorias.some((c) => c.id === p.categoria), p.id);
    for (const img of p.imagens) {
      assert.ok(img.alt.length > 10, `alt curto em ${p.id}`);
      readFileSync(new URL(`../public${img.src}`, import.meta.url));
    }
  }
  for (const e of catalogo.encomendas) readFileSync(new URL(`../public${e.imagem.src}`, import.meta.url));
});

test('desconto Pix de 5% por unidade, arredondado', () => {
  assert.equal(precoUnitario(16000, 'pix', catalogo.pagamento), 15200);
  assert.equal(precoUnitario(4500, 'pix', catalogo.pagamento), 4275);
  assert.equal(precoUnitario(4500, 'cartao', catalogo.pagamento), 4500);
});

test('parcelas: até 6x com parcela mínima de R$ 50', () => {
  assert.equal(calcularParcelas(4500, 'cartao', catalogo.pagamento), 1);
  assert.equal(calcularParcelas(16000, 'cartao', catalogo.pagamento), 3);
  assert.equal(calcularParcelas(35000, 'cartao', catalogo.pagamento), 6);
  assert.equal(calcularParcelas(35000, 'pix', catalogo.pagamento), 1);
});

test('frete por região do CEP', () => {
  assert.equal(calcularFrete(metodo('correios'), '18010-000', 0), 2500);
  assert.equal(calcularFrete(metodo('correios'), '22041001', 0), 3500);
  assert.equal(calcularFrete(metodo('correios'), '90010000', 0), 3500);
  assert.equal(calcularFrete(metodo('correios'), '79002000', 0), 4500);
  assert.equal(calcularFrete(metodo('correios'), '123', 0), null);
  assert.equal(calcularFrete(metodo('retirada'), '', 0), 0);
});

test('motoboy só em Sorocaba e grátis acima de R$ 150', () => {
  assert.equal(calcularFrete(metodo('motoboy'), '18010000', 10000), 1500);
  assert.equal(calcularFrete(metodo('motoboy'), '18010000', 15000), 0);
  assert.equal(calcularFrete(metodo('motoboy'), '01310000', 99999), null);
});

test('pedido completo no cartão', () => {
  const r = calcularPedido(catalogo, {
    itens: [{ id: 'jesus', quantidade: 1 }, { id: 'capimila', quantidade: 2 }],
    formaPagamento: 'cartao', entrega: 'correios', cep: '18010000',
  });
  assert.ok(r.ok);
  assert.equal(r.pedido.subtotalCentavos, 25000);
  assert.equal(r.pedido.freteCentavos, 2500);
  assert.equal(r.pedido.totalCentavos, 27500);
  assert.equal(r.pedido.parcelas, 5);
  assert.equal(r.pedido.descontoCentavos, 0);
});

test('pedido no Pix aplica desconto só nos produtos, não no frete', () => {
  const r = calcularPedido(catalogo, {
    itens: [{ id: 'jesus', quantidade: 1 }], formaPagamento: 'pix', entrega: 'correios', cep: '18010000',
  });
  assert.ok(r.ok);
  assert.equal(r.pedido.subtotalCentavos, 15200);
  assert.equal(r.pedido.descontoCentavos, 800);
  assert.equal(r.pedido.totalCentavos, 17700);
});

test('rejeita item inexistente, duplicado, quantidade fora da faixa e forma inválida', () => {
  const base = { formaPagamento: 'pix', entrega: 'retirada' };
  assert.equal(calcularPedido(catalogo, { ...base, itens: [{ id: 'nao-existe', quantidade: 1 }] }).ok, false);
  assert.equal(calcularPedido(catalogo, { ...base, itens: [{ id: 'jesus', quantidade: 1 }, { id: 'jesus', quantidade: 1 }] }).ok, false);
  assert.equal(calcularPedido(catalogo, { ...base, itens: [{ id: 'jesus', quantidade: 0 }] }).ok, false);
  assert.equal(calcularPedido(catalogo, { ...base, itens: [{ id: 'jesus', quantidade: 1.5 }] }).ok, false);
  assert.equal(calcularPedido(catalogo, { ...base, itens: [{ id: 'jesus', quantidade: 11 }] }).ok, false);
  assert.equal(calcularPedido(catalogo, { ...base, formaPagamento: 'boleto', itens: [{ id: 'jesus', quantidade: 1 }] }).ok, false);
  assert.equal(calcularPedido(catalogo, { ...base, itens: [] }).ok, false);
});
