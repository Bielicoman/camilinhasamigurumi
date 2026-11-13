/**
 * Estado da sacola, persistido no navegador.
 * Guarda só id e quantidade; preço e nome vêm sempre do catálogo.
 */
const CHAVE = 'camilinhas:sacola:v1';
const MAX_QTD = 10;
const ouvintes = new Set();
let itens = [];
let idsValidos = null;

function ler() {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE) ?? '[]');
    return Array.isArray(bruto) ? bruto : [];
  } catch {
    return [];
  }
}

function gravar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(itens)); } catch { /* modo privado: segue só em memória */ }
  for (const fn of ouvintes) fn(itens);
}

function sanear(lista) {
  const vistos = new Set();
  return lista
    .filter((i) => i && typeof i.id === 'string' && (!idsValidos || idsValidos.has(i.id)))
    .filter((i) => (vistos.has(i.id) ? false : vistos.add(i.id)))
    .map((i) => ({ id: i.id, quantidade: Math.min(MAX_QTD, Math.max(1, Math.trunc(Number(i.quantidade)) || 1)) }));
}

export const sacola = {
  iniciar(catalogo) {
    idsValidos = new Set(catalogo.produtos.filter((p) => p.disponivel).map((p) => p.id));
    itens = sanear(ler());
    gravar();
  },
  itens: () => itens.map((i) => ({ ...i })),
  quantidadeTotal: () => itens.reduce((s, i) => s + i.quantidade, 0),
  adicionar(id, quantidade = 1) {
    const atual = itens.find((i) => i.id === id);
    if (atual) atual.quantidade = Math.min(MAX_QTD, atual.quantidade + quantidade);
    else itens.push({ id, quantidade: Math.min(MAX_QTD, quantidade) });
    itens = sanear(itens);
    gravar();
  },
  definir(id, quantidade) {
    if (quantidade < 1) return this.remover(id);
    const atual = itens.find((i) => i.id === id);
    if (atual) atual.quantidade = Math.min(MAX_QTD, quantidade);
    gravar();
  },
  remover(id) {
    itens = itens.filter((i) => i.id !== id);
    gravar();
  },
  limpar() {
    itens = [];
    gravar();
  },
  aoMudar(fn) { ouvintes.add(fn); },
  MAX_QTD,
};
