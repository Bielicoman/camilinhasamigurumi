import { randomBytes } from 'node:crypto';
import { calcularPedido, normalizarCep } from '../../public/assets/js/pricing.js';
import { validarCliente } from './cliente.js';

export function novoPedidoId(agora = new Date()) {
  const data = agora.toISOString().slice(0, 10).replace(/-/g, '');
  return `CAM-${data}-${randomBytes(4).toString('hex').toUpperCase()}`;
}

/**
 * Valida a entrada bruta do checkout e devolve o pedido calculado no servidor.
 * Aceita apenas `id` e `quantidade` de cada item — preço, nome e frete vêm do catálogo.
 */
export function prepararPedido(catalogo, corpo) {
  if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) {
    return { ok: false, erro: 'Requisição inválida.' };
  }
  const itensBrutos = Array.isArray(corpo.itens) ? corpo.itens : null;
  if (!itensBrutos || itensBrutos.length > 20) return { ok: false, erro: 'Sacola inválida.' };

  const itens = itensBrutos.map((i) => ({
    id: typeof i?.id === 'string' ? i.id.slice(0, 64) : '',
    quantidade: Number(i?.quantidade),
  }));

  const metodo = catalogo.entrega.metodos.find((m) => m.id === corpo.entrega);
  const validacao = validarCliente(corpo.cliente, {
    exigeEndereco: metodo?.exigeEndereco === true,
    cidadeExigida: metodo?.cidadeExigida ?? null,
  });
  if (!validacao.ok) return validacao;

  const cep = validacao.cliente.endereco?.cep ?? normalizarCep(corpo.cliente?.endereco?.cep);
  const calculo = calcularPedido(catalogo, {
    itens,
    formaPagamento: corpo.formaPagamento,
    entrega: corpo.entrega,
    cep,
  });
  if (!calculo.ok) return calculo;

  // O total exibido ao cliente precisa bater com o calculado aqui. Se não bater,
  // o catálogo mudou durante a compra: o cliente revisa antes de pagar.
  if (Number.isInteger(corpo.totalExibidoCentavos) && corpo.totalExibidoCentavos !== calculo.pedido.totalCentavos) {
    return { ok: false, erro: 'Os valores foram atualizados. Revise a sacola antes de pagar.', codigo: 'PRECO_MUDOU' };
  }

  return { ok: true, pedido: calculo.pedido, cliente: validacao.cliente };
}
