/**
 * Regras de preço, desconto, parcelas e frete.
 *
 * Módulo puro (sem DOM, sem rede) compartilhado entre o navegador e a API
 * (`api/_lib/pedido.js`). O navegador usa para exibir valores; a API usa o
 * mesmo código para calcular o valor que de fato é cobrado — o preço enviado
 * pelo cliente nunca é aceito.
 *
 * Todos os valores monetários são inteiros em centavos.
 */

export const FORMAS_PAGAMENTO = Object.freeze(['pix', 'cartao']);

/** Normaliza CEP para 8 dígitos ou retorna null. */
export function normalizarCep(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '');
  return digitos.length === 8 ? digitos : null;
}

/** Preço unitário após desconto Pix, arredondado por unidade. */
export function precoUnitario(precoCentavos, formaPagamento, pagamento) {
  if (formaPagamento !== 'pix') return precoCentavos;
  const pct = pagamento?.descontoPixPercentual ?? 0;
  return Math.round((precoCentavos * (100 - pct)) / 100);
}

/** Frete em centavos para um método e CEP. Retorna null se indisponível. */
export function calcularFrete(metodo, cep, subtotalCentavos) {
  if (!metodo) return null;
  if (metodo.id === 'retirada') return 0;

  const cepOk = normalizarCep(cep);
  if (!cepOk) return null;

  if (Array.isArray(metodo.cepPrefixos)) {
    if (!metodo.cepPrefixos.some((p) => cepOk.startsWith(p))) return null;
  }

  if (Array.isArray(metodo.tabelaPorRegiao)) {
    const faixa = metodo.tabelaPorRegiao.find((f) => cepOk >= f.cepDe && cepOk <= f.cepAte);
    return faixa ? faixa.precoCentavos : null;
  }

  if (metodo.gratisAcimaDeCentavos != null && subtotalCentavos >= metodo.gratisAcimaDeCentavos) {
    return 0;
  }
  return metodo.precoCentavos ?? null;
}

/** Número máximo de parcelas sem juros respeitando a parcela mínima. */
export function calcularParcelas(totalCentavos, formaPagamento, pagamento) {
  if (formaPagamento !== 'cartao') return 1;
  const max = pagamento?.parcelasMaximas ?? 1;
  const minimo = pagamento?.parcelaMinimaCentavos ?? 0;
  if (minimo <= 0) return max;
  return Math.max(1, Math.min(max, Math.floor(totalCentavos / minimo)));
}

/**
 * Calcula o pedido a partir do catálogo.
 * @param {object} catalogo  conteúdo de catalog.json
 * @param {{itens: {id: string, quantidade: number}[], formaPagamento: string, entrega: string, cep?: string}} entrada
 * @returns {{ok: true, pedido: object} | {ok: false, erro: string}}
 */
export function calcularPedido(catalogo, entrada) {
  const { itens, formaPagamento, entrega, cep } = entrada ?? {};

  if (!FORMAS_PAGAMENTO.includes(formaPagamento)) {
    return { ok: false, erro: 'Forma de pagamento inválida.' };
  }
  if (!Array.isArray(itens) || itens.length === 0) {
    return { ok: false, erro: 'A sacola está vazia.' };
  }

  const porId = new Map(catalogo.produtos.map((p) => [p.id, p]));
  const linhas = [];
  const vistos = new Set();
  let subtotalCheio = 0;
  let subtotal = 0;

  for (const item of itens) {
    const produto = porId.get(item?.id);
    if (!produto || produto.disponivel !== true) {
      return { ok: false, erro: 'Um dos itens não está mais disponível.' };
    }
    if (vistos.has(produto.id)) {
      return { ok: false, erro: 'Item duplicado na sacola.' };
    }
    vistos.add(produto.id);

    const quantidade = item.quantidade;
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 10) {
      return { ok: false, erro: 'Quantidade inválida.' };
    }

    const unitario = precoUnitario(produto.precoCentavos, formaPagamento, catalogo.pagamento);
    linhas.push({
      id: produto.id,
      nome: produto.nome,
      quantidade,
      unitarioCheioCentavos: produto.precoCentavos,
      unitarioCentavos: unitario,
      totalCentavos: unitario * quantidade,
      prazoDiasUteis: produto.prazoDiasUteis,
      imagem: produto.imagens?.[0]?.src ?? null,
    });
    subtotalCheio += produto.precoCentavos * quantidade;
    subtotal += unitario * quantidade;
  }

  const metodo = catalogo.entrega.metodos.find((m) => m.id === entrega);
  if (!metodo) return { ok: false, erro: 'Escolha uma forma de entrega.' };

  // Frete grátis do motoboy é calculado sobre o subtotal cheio (antes do Pix).
  const frete = calcularFrete(metodo, cep, subtotalCheio);
  if (frete == null) {
    return { ok: false, erro: 'Essa forma de entrega não atende o CEP informado.' };
  }

  const total = subtotal + frete;
  const prazoProducao = Math.max(...linhas.map((l) => l.prazoDiasUteis ?? 0));

  return {
    ok: true,
    pedido: {
      linhas,
      formaPagamento,
      entrega: { id: metodo.id, nome: metodo.nome, exigeEndereco: metodo.exigeEndereco === true },
      subtotalCheioCentavos: subtotalCheio,
      subtotalCentavos: subtotal,
      descontoCentavos: subtotalCheio - subtotal,
      freteCentavos: frete,
      totalCentavos: total,
      parcelas: calcularParcelas(total, formaPagamento, catalogo.pagamento),
      prazoDiasUteis: prazoProducao + (metodo.prazoExtraDiasUteis ?? 0),
    },
  };
}

/** Formata centavos em reais (pt-BR). */
export function formatarReais(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
