import { h, $, $$ } from './dom.js';
import { calcularPedido, precoVigente, emLancamento, precoUnitario, calcularParcelas, formatarReais } from './pricing.js';

const ID = 'ponto-a-ponto-pro';
const WHATSAPP = '556792804803';
const DOMINIOS_PAGAMENTO = ['mercadopago.com.br', 'mercadopago.com', 'mercadolivre.com.br'];

const ICONES = [
  // grades 6x6 desenhadas em "pontos", no espírito do app
  'M1 0h4v1H1zM0 1h6v4H0zM1 5h4v1H1z',
  'M0 0h6v6H0zM1 1v4h4V1z',
  'M2 0h2v2H2zM0 2h6v2H0zM2 4h2v2H2z',
  'M1 1h4v1H1zM0 2h6v3H0z',
  'M0 0h2v2H0zM4 0h2v2H4zM2 2h2v2H2zM0 4h2v2H0zM4 4h2v2H4z',
  'M0 1h6v4H3L1 6V5H0z',
];

function iconePixel(i) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '-1 -1 8 8');
  svg.setAttribute('class', 'pap-beneficio__icone');
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', ICONES[i % ICONES.length]);
  p.setAttribute('fill', i % 2 ? '#a8462c' : '#d9694a');
  p.setAttribute('fill-rule', 'evenodd');
  svg.append(p);
  return svg;
}

const dataBR = (iso) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const diaSeguinteBR = (iso) => new Date(Date.parse(iso) + 1000).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

function usarIcone(id) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#${id}`);
  svg.append(use);
  return svg;
}

function renderOferta(catalogo, produto) {
  const preco = precoVigente(produto);
  const pix = precoUnitario(preco, 'pix', catalogo.pagamento);
  const lancamento = emLancamento(produto);
  const parcelas = calcularParcelas(preco, 'cartao', catalogo.pagamento);

  $('[data-preco]').textContent = formatarReais(preco).replace(',00', '');
  $('[data-preco-pix]').textContent = `${formatarReais(pix)} no Pix`;
  $('[data-preco-caixa]').textContent = formatarReais(preco);
  $('[data-valor-pix]').textContent = formatarReais(pix);
  $('[data-valor-cartao]').textContent = formatarReais(preco);
  $('[data-parcelas-pap]').textContent = parcelas > 1 ? `até ${parcelas}x sem juros` : 'à vista';

  const regra = $('[data-regra-preco]');
  const selo = $('[data-selo-lancamento]');
  if (lancamento) {
    const pct = Math.round((1 - produto.precoCentavos / produto.precoAposLancamentoCentavos) * 100);
    selo.textContent = `Lançamento · ${pct}% off`;
    regra.replaceChildren(
      `Preço de lançamento até ${dataBR(produto.lancamentoAte)}. A partir de ${diaSeguinteBR(produto.lancamentoAte)}, o Pro custa `,
      h('strong', { text: formatarReais(produto.precoAposLancamentoCentavos) }), '.',
    );
    $('[data-regra-caixa]').textContent = `lançamento, depois ${formatarReais(produto.precoAposLancamentoCentavos)}`;
    iniciarContagem(Date.parse(produto.lancamentoAte));
  } else {
    selo.hidden = true;
    regra.textContent = 'Licença vitalícia, com atualizações da versão Pro.';
    $('[data-regra-caixa]').textContent = 'licença vitalícia';
  }
}

function iniciarContagem(fim) {
  const el = $('[data-contagem]');
  const atualizar = () => {
    const resto = fim - Date.now();
    if (resto <= 0) { el.hidden = true; return; }
    const d = Math.floor(resto / 86_400_000);
    const hrs = Math.floor((resto % 86_400_000) / 3_600_000);
    el.textContent = d > 0 ? `Faltam ${d} dias e ${hrs} h para o preço subir` : `Últimas ${hrs} h do preço de lançamento`;
    el.hidden = false;
  };
  atualizar();
  setInterval(atualizar, 60_000);
}

function renderBeneficios(info) {
  $('[data-beneficios]').replaceChildren(
    ...info.beneficios.map((b, i) =>
      h('article', { class: 'pap-beneficio' }, iconePixel(i), h('h3', { text: b.titulo }), h('p', { text: b.texto })),
    ),
  );
  const linha = (nome, gratis, pro) => {
    const celula = (sim) => h('td', { class: sim ? 'sim' : 'nao' }, usarIcone(sim ? 'i-check' : 'i-traco'), h('span', { class: 'visualmente-oculto', text: sim ? 'Sim' : 'Não' }));
    return h('tr', {}, h('th', { scope: 'row', text: nome }), celula(gratis), celula(pro));
  };
  $('[data-tabela]').replaceChildren(
    ...info.gratisContinua.map((n) => linha(n, true, true)),
    ...info.beneficios.map((b) => linha(b.titulo, false, true)),
  );
}

function configurarCompra(catalogo, produto) {
  const form = $('[data-form-pap]');
  if (!produto.disponivel) {
    form.hidden = true;
    $('[data-espera]').hidden = false;
    const msg = encodeURIComponent('Oi! Quero entrar na lista do Ponto a Ponto Pro com o preço de lançamento.');
    $('[data-link-espera]').href = `https://wa.me/${WHATSAPP}?text=${msg}`;
    $$('a[href="#comprar"]').forEach((a) => { a.textContent = a.classList.contains('btn--pequeno') ? 'Lista de espera' : 'Entrar na lista de espera'; });
    return;
  }

  const erro = $('[data-erro-pap]');
  const botao = $('[data-pagar-pap]');
  const texto = $('[data-pagar-pap-texto]');
  let enviando = false;

  form.elements.telefone.addEventListener('input', (e) => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 11);
    let t = d;
    if (d.length > 2) t = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length > 7) t = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
    e.target.value = t;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (enviando) return;
    const f = new FormData(form);
    const v = (k) => String(f.get(k) ?? '').trim();
    const marcar = (campo, msg) => { erro.textContent = msg; form.elements[campo].setAttribute('aria-invalid', 'true'); form.elements[campo].focus(); };
    $$('[aria-invalid]', form).forEach((el) => el.removeAttribute('aria-invalid'));
    if (v('nome').split(/\s+/).length < 2) return marcar('nome', 'Informe nome e sobrenome.');
    if (!/^\S+@\S+\.\S{2,}$/.test(v('email'))) return marcar('email', 'Confira o e-mail: é nele que a chave chega.');
    const tel = v('telefone').replace(/\D/g, '');
    if (tel.length < 10 || tel.length > 11) return marcar('telefone', 'Informe o WhatsApp com DDD.');

    const formaPagamento = v('formaPagamento') || 'pix';
    const calculo = calcularPedido(catalogo, { itens: [{ id: ID, quantidade: 1 }], formaPagamento, entrega: 'digital' });
    if (!calculo.ok) { erro.textContent = calculo.erro; return; }

    enviando = true;
    botao.disabled = true;
    texto.textContent = 'Abrindo o Mercado Pago…';
    erro.textContent = '';
    try {
      const resposta = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itens: [{ id: ID, quantidade: 1 }],
          formaPagamento,
          entrega: 'digital',
          totalExibidoCentavos: calculo.pedido.totalCentavos,
          cliente: { nome: v('nome'), email: v('email'), telefone: v('telefone'), observacoes: '', endereco: null },
        }),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (resposta.status === 409) {
        throw new Error('O preço foi atualizado. Recarregue a página para ver o valor atual.');
      }
      if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível abrir o pagamento.');
      const url = new URL(dados.urlPagamento);
      if (url.protocol !== 'https:' || !DOMINIOS_PAGAMENTO.some((d) => url.hostname === d || url.hostname.endsWith(`.${d}`))) {
        throw new Error('Endereço de pagamento inesperado.');
      }
      try { sessionStorage.setItem('camilinhas:pedido', dados.pedidoId); } catch { /* sem armazenamento */ }
      location.assign(url.toString());
    } catch (falha) {
      erro.textContent = falha.message || 'Algo deu errado. Tente de novo.';
      botao.disabled = false;
      texto.textContent = 'Comprar o Pro';
      enviando = false;
    }
  });
  window.addEventListener('pageshow', () => { enviando = false; botao.disabled = false; texto.textContent = 'Comprar o Pro'; });
}

async function iniciar() {
  const topo = $('#topo');
  const aoRolar = () => topo.classList.toggle('rolou', window.scrollY > 8);
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  let catalogo;
  try {
    const r = await fetch('/catalog.json', { cache: 'no-cache' });
    catalogo = await r.json();
  } catch {
    $('[data-erro-pap]').textContent = 'Não conseguimos carregar o preço agora. Atualize a página.';
    return;
  }
  const produto = catalogo.produtos.find((p) => p.id === ID);
  renderOferta(catalogo, produto);
  renderBeneficios(catalogo.pontoAPontoPro);
  configurarCompra(catalogo, produto);
}

iniciar();
