import { h, icone, $, $$, toast } from './dom.js';
import { sacola } from './sacola.js';
import { calcularPedido, calcularFrete, calcularParcelas, precoUnitario, normalizarCep, formatarReais } from './pricing.js';

const WHATSAPP = '556792804803';
const DOMINIOS_PAGAMENTO = ['mercadopago.com.br', 'mercadopago.com', 'mercadolivre.com.br'];

let catalogo = null;
let filtroAtual = 'todos';

/* ---------------------------------------------------------------- catálogo */
async function carregarCatalogo() {
  const resposta = await fetch('/catalog.json', { cache: 'no-cache' });
  if (!resposta.ok) throw new Error(`catálogo ${resposta.status}`);
  return resposta.json();
}

const nomeCategoria = (id) => catalogo.categorias.find((c) => c.id === id)?.nome ?? '';
const produtoPorId = (id) => catalogo.produtos.find((p) => p.id === id);

/* ------------------------------------------------------------------- loja */
function renderFiltros() {
  const caixa = $('[data-filtros]');
  const opcoes = [{ id: 'todos', nome: 'Tudo' }, ...catalogo.categorias];
  caixa.replaceChildren(
    ...opcoes.map((c) =>
      h('button', {
        type: 'button', class: 'filtro', 'aria-pressed': String(c.id === filtroAtual), text: c.nome,
        onclick: () => { filtroAtual = c.id; renderFiltros(); renderVitrine(); },
      }),
    ),
  );
}

function renderVitrine() {
  const vitrine = $('[data-vitrine]');
  const lista = catalogo.produtos
    .filter((p) => p.disponivel && (filtroAtual === 'todos' || p.categoria === filtroAtual))
    .sort((a, b) => Number(b.destaque) - Number(a.destaque));

  vitrine.replaceChildren(
    ...lista.map((p, i) => {
      const pix = precoUnitario(p.precoCentavos, 'pix', catalogo.pagamento);
      const card = h('article', { class: 'card' },
        h('button', { type: 'button', class: 'card__foto', 'aria-label': `Ver detalhes de ${p.nome}`, onclick: () => abrirProduto(p.id) },
          p.destaque ? h('span', { class: 'card__selo', text: 'Destaque' }) : null,
          h('img', { src: p.imagens[0].src, alt: p.imagens[0].alt, width: 600, height: 600, loading: i < 4 ? 'eager' : 'lazy', decoding: 'async' }),
        ),
        h('button', {
          type: 'button', class: 'card__add', 'aria-label': `Adicionar ${p.nome} à sacola`,
          onclick: () => adicionar(p.id, 1),
        }, icone('i-mais')),
        h('div', { class: 'card__info' },
          h('div', {},
            h('h3', {}, h('a', { href: `#produto/${p.id}`, class: 'link-produto', text: p.nome, onclick: (e) => { e.preventDefault(); abrirProduto(p.id); } })),
            h('p', { class: 'card__resumo', text: p.resumo }),
          ),
          h('p', { class: 'card__preco' },
            h('strong', { text: formatarReais(p.precoCentavos) }),
            h('small', { text: `${formatarReais(pix)} no Pix` }),
          ),
        ),
      );
      card.style.setProperty('--i', String(i));
      return card;
    }),
  );
}

/* ---------------------------------------------------------------- produto */
const modalProduto = () => $('[data-modal-produto]');
let qtdProduto = 1;
let produtoAberto = null;

function abrirProduto(id) {
  const p = produtoPorId(id);
  if (!p) return;
  produtoAberto = p;
  qtdProduto = 1;
  const m = modalProduto();
  const principal = $('[data-galeria-principal]', m);
  const trocar = (img, botao) => {
    principal.src = img.src;
    principal.alt = img.alt;
    $$('[data-galeria-miniaturas] button', m).forEach((b) => b.setAttribute('aria-current', String(b === botao)));
  };
  trocar(p.imagens[0]);
  $('[data-galeria-miniaturas]', m).replaceChildren(
    ...(p.imagens.length > 1
      ? p.imagens.map((img, i) => {
          const b = h('button', { type: 'button', 'aria-label': `Foto ${i + 1} de ${p.imagens.length}`, 'aria-current': String(i === 0) },
            h('img', { src: img.src, alt: '', width: 58, height: 58 }));
          b.addEventListener('click', () => trocar(img, b));
          return b;
        })
      : []),
  );
  $('[data-produto-categoria]', m).textContent = nomeCategoria(p.categoria);
  $('[data-produto-nome]', m).textContent = p.nome;
  const parcelas = calcularParcelas(p.precoCentavos, 'cartao', catalogo.pagamento);
  $('[data-produto-preco]', m).replaceChildren(
    h('strong', { text: formatarReais(p.precoCentavos) }),
    h('span', { text: `${formatarReais(precoUnitario(p.precoCentavos, 'pix', catalogo.pagamento))} no Pix` }),
    h('small', { text: parcelas > 1 ? `ou ${parcelas}x de ${formatarReais(Math.ceil(p.precoCentavos / parcelas))} sem juros` : 'à vista no cartão ou boleto' }),
  );
  $('[data-produto-descricao]', m).textContent = p.descricao;
  $('[data-produto-meta]', m).replaceChildren(
    h('span', { text: p.tamanho }),
    h('span', { text: `Produção: até ${p.prazoDiasUteis} dias úteis` }),
  );
  $('[data-produto-ficha]', m).replaceChildren(...p.detalhes.map((d) => h('li', { text: d })));
  $('[data-qtd-valor]', m).textContent = '1';
  if (!m.open) m.showModal();
  history.replaceState(null, '', `#produto/${p.id}`);
}

function configurarModalProduto() {
  const m = modalProduto();
  $$('[data-qtd]', m).forEach((b) =>
    b.addEventListener('click', () => {
      qtdProduto = Math.min(sacola.MAX_QTD, Math.max(1, qtdProduto + Number(b.dataset.qtd)));
      $('[data-qtd-valor]', m).textContent = String(qtdProduto);
    }),
  );
  $('[data-adicionar]', m).addEventListener('click', () => {
    adicionar(produtoAberto.id, qtdProduto);
    m.close();
  });
  m.addEventListener('close', () => {
    if (location.hash.startsWith('#produto/')) history.replaceState(null, '', location.pathname + location.search);
  });
}

function adicionar(id, quantidade) {
  sacola.adicionar(id, quantidade);
  const p = produtoPorId(id);
  toast(`${p.nome} na sacola`, { rotulo: 'Ver sacola', fazer: () => abrirGaveta() });
}

/* ----------------------------------------------------------------- sacola */
const gaveta = () => $('[data-gaveta]');

function mostrarEtapa(nome) {
  $$('[data-etapa]', gaveta()).forEach((el) => { el.hidden = el.dataset.etapa !== nome; });
  $('[data-gaveta-titulo]').textContent = nome === 'sacola' ? 'Sua sacola' : 'Finalizar pedido';
  if (nome === 'sacola') $('[data-pe-sacola]').hidden = sacola.itens().length === 0;
}

function abrirGaveta(etapa = 'sacola') {
  mostrarEtapa(etapa);
  if (!gaveta().open) gaveta().showModal();
}

function focoAtualNaSacola() {
  const ativo = document.activeElement;
  const item = ativo?.closest?.('[data-item-id]');
  return item ? { id: item.dataset.itemId, acao: ativo.dataset.acao } : null;
}

function restaurarFoco(anterior) {
  if (!anterior) return;
  const lista = $('[data-itens]');
  const alvo = lista.querySelector(`[data-item-id="${CSS.escape(anterior.id)}"] [data-acao="${anterior.acao}"]:not([disabled])`)
    ?? lista.querySelector(`[data-item-id="${CSS.escape(anterior.id)}"] [data-acao]:not([disabled])`)
    ?? lista.querySelector('[data-acao]')
    ?? $('[data-ir-loja]');
  alvo?.focus();
}

function renderSacola() {
  const focoAnterior = focoAtualNaSacola();
  const itens = sacola.itens();
  const qtd = $('[data-qtd-sacola]');
  const anterior = qtd.textContent;
  qtd.textContent = String(sacola.quantidadeTotal());
  if (anterior !== qtd.textContent) { qtd.classList.remove('pulo'); void qtd.offsetWidth; qtd.classList.add('pulo'); }

  const vazia = itens.length === 0;
  $('[data-vazio]').hidden = !vazia;
  if ($('[data-form-checkout]').hidden) $('[data-pe-sacola]').hidden = vazia;

  $('[data-itens]').replaceChildren(
    ...itens.map(({ id, quantidade }) => {
      const p = produtoPorId(id);
      return h('li', { class: 'item', dataset: { itemId: id } },
        h('img', { src: p.imagens[0].src, alt: '', width: 76, height: 76, loading: 'lazy' }),
        h('div', {},
          h('strong', { text: p.nome }),
          h('small', { text: `${formatarReais(p.precoCentavos)} cada` }),
          h('div', { class: 'qtd', role: 'group', 'aria-label': `Quantidade de ${p.nome}` },
            h('button', { type: 'button', 'aria-label': `Diminuir ${p.nome}`, text: '−', dataset: { acao: 'menos' }, onclick: () => sacola.definir(id, quantidade - 1) }),
            h('output', { text: quantidade }),
            h('button', { type: 'button', 'aria-label': `Aumentar ${p.nome}`, text: '+', dataset: { acao: 'mais' }, disabled: quantidade >= sacola.MAX_QTD, onclick: () => sacola.definir(id, quantidade + 1) }),
          ),
        ),
        h('div', { class: 'item__preco' },
          h('span', { text: formatarReais(p.precoCentavos * quantidade) }),
          h('button', { type: 'button', class: 'remover', text: 'Remover', 'aria-label': `Remover ${p.nome}`, dataset: { acao: 'remover' }, onclick: () => sacola.remover(id) }),
        ),
      );
    }),
  );

  const cheio = itens.reduce((s, i) => s + produtoPorId(i.id).precoCentavos * i.quantidade, 0);
  const pix = itens.reduce((s, i) => s + precoUnitario(produtoPorId(i.id).precoCentavos, 'pix', catalogo.pagamento) * i.quantidade, 0);
  $('[data-subtotal-sacola]').textContent = formatarReais(cheio);
  $('[data-subtotal-pix]').textContent = formatarReais(pix);

  if (!$('[data-form-checkout]').hidden) {
    if (vazia) mostrarEtapa('sacola');
    else atualizarCheckout();
  }
  if (gaveta().open) restaurarFoco(focoAnterior);
}

/* --------------------------------------------------------------- checkout */
const form = () => $('[data-form-checkout]');
let enviando = false;

function valoresForm() {
  const f = new FormData(form());
  const v = (k) => String(f.get(k) ?? '').trim();
  return {
    nome: v('nome'), email: v('email'), telefone: v('telefone'), observacoes: v('observacoes'),
    cep: normalizarCep(v('cep')), entrega: v('entrega'), formaPagamento: v('formaPagamento') || 'pix',
    endereco: { rua: v('rua'), numero: v('numero'), complemento: v('complemento'), bairro: v('bairro'), cidade: v('cidade'), uf: v('uf').toUpperCase() },
  };
}

function subtotalCheio() {
  return sacola.itens().reduce((s, i) => s + produtoPorId(i.id).precoCentavos * i.quantidade, 0);
}

function renderOpcoesEntrega() {
  const { cep, entrega } = valoresForm();
  const caixa = $('[data-opcoes-entrega]');
  const sub = subtotalCheio();
  caixa.replaceChildren(
    ...catalogo.entrega.metodos.map((m) => {
      const frete = calcularFrete(m, cep, sub);
      const disponivel = frete != null;
      let valor = 'informe o CEP';
      if (disponivel) valor = frete === 0 ? 'Grátis' : formatarReais(frete);
      else if (cep) valor = 'indisponível';
      const descricao = m.id === 'motoboy' ? 'Só para CEPs de Sorocaba' : m.id === 'retirada' ? 'Combinamos dia e hora pelo WhatsApp' : 'Rastreio enviado pelo WhatsApp';
      return h('label', { class: 'opcao' },
        h('input', { type: 'radio', name: 'entrega', value: m.id, checked: entrega === m.id && disponivel, disabled: !disponivel, required: true }),
        h('span', { class: 'opcao__texto' }, h('strong', { text: m.nome }), descricao),
        h('span', { class: 'opcao__valor', text: valor }),
      );
    }),
  );
}

function atualizarCheckout() {
  const dados = valoresForm();
  const metodo = catalogo.entrega.metodos.find((m) => m.id === dados.entrega);
  $('[data-endereco]').hidden = !(metodo?.exigeEndereco);

  const resumo = $('[data-resumo-checkout]');
  const sub = subtotalCheio();
  const textoParcelas = $('[data-parcelas-texto]');
  const n = calcularParcelas(sub, 'cartao', catalogo.pagamento);
  textoParcelas.textContent = n > 1 ? `Até ${n}x sem juros, parcela mínima de R$ 50` : 'À vista (parcelamento a partir de R$ 100)';

  const calculo = calcularPedido(catalogo, {
    itens: sacola.itens(), formaPagamento: dados.formaPagamento, entrega: dados.entrega || 'retirada', cep: dados.cep,
  });
  const linhas = [];
  if (calculo.ok) {
    const p = calculo.pedido;
    linhas.push(h('div', {}, h('span', { text: 'Produtos' }), h('span', { text: formatarReais(p.subtotalCheioCentavos) })));
    if (p.descontoCentavos > 0) linhas.push(h('div', { class: 'desconto' }, h('span', { text: 'Desconto Pix' }), h('span', { text: `− ${formatarReais(p.descontoCentavos)}` })));
    linhas.push(h('div', {}, h('span', { text: 'Entrega' }), h('span', { text: dados.entrega ? (p.freteCentavos ? formatarReais(p.freteCentavos) : 'Grátis') : 'escolha acima' })));
    const total = h('div', { class: 'total' }, h('span', { text: 'Total' }), h('span', { text: formatarReais(p.totalCentavos) }));
    linhas.push(total);
    if (dados.formaPagamento === 'cartao' && p.parcelas > 1) {
      linhas.push(h('div', {}, h('span', { text: '' }), h('span', { text: `ou ${p.parcelas}x de ${formatarReais(Math.ceil(p.totalCentavos / p.parcelas))}` })));
    }
    linhas.push(h('div', {}, h('span', { text: 'Pronto para envio em' }), h('span', { text: `até ${p.prazoDiasUteis} dias úteis` })));
  }
  resumo.replaceChildren(...linhas);
  $('[data-pagar-texto]').textContent = dados.formaPagamento === 'pix' ? 'Pagar com Pix' : 'Pagar com cartão ou boleto';
  return calculo;
}

let ultimoCepBuscado = null;
async function buscarCep(cep) {
  if (!cep || cep === ultimoCepBuscado) return;
  ultimoCepBuscado = cep;
  const dica = $('[data-cep-dica]');
  try {
    const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout(5000) });
    const d = await r.json();
    if (d.erro) { dica.textContent = 'CEP não encontrado. Confira os números.'; return; }
    const preencher = (nome, valor) => { const el = form().elements[nome]; if (el && !el.value && valor) el.value = String(valor).slice(0, el.maxLength > 0 ? el.maxLength : 120); };
    preencher('rua', d.logradouro); preencher('bairro', d.bairro); preencher('cidade', d.localidade); preencher('uf', d.uf);
    dica.textContent = `${d.localidade ?? ''} - ${d.uf ?? ''}`;
  } catch {
    dica.textContent = 'Não conseguimos consultar o CEP agora. Preencha o endereço à mão.';
  }
}

function erroCheckout(mensagem, campo) {
  $('[data-erro-checkout]').textContent = mensagem;
  $$('[aria-invalid]', form()).forEach((el) => el.removeAttribute('aria-invalid'));
  if (campo) {
    const el = form().elements[campo];
    if (el?.setAttribute) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
  }
}

function validarLocal(d) {
  if (d.nome.split(/\s+/).length < 2) return ['Informe nome e sobrenome.', 'nome'];
  if (!/^\S+@\S+\.\S{2,}$/.test(d.email)) return ['Confira o e-mail.', 'email'];
  const tel = d.telefone.replace(/\D/g, '');
  if (tel.length < 10 || tel.length > 11) return ['Informe o WhatsApp com DDD.', 'telefone'];
  if (!d.entrega) return ['Escolha a forma de entrega.', 'cep'];
  const metodo = catalogo.entrega.metodos.find((m) => m.id === d.entrega);
  if (metodo?.exigeEndereco) {
    if (!d.cep) return ['Informe um CEP válido.', 'cep'];
    for (const [campo, rotulo] of [['rua', 'a rua'], ['numero', 'o número'], ['bairro', 'o bairro'], ['cidade', 'a cidade'], ['uf', 'a UF']]) {
      if (!d.endereco[campo]) return [`Informe ${rotulo}.`, campo];
    }
  }
  return null;
}

async function pagar(evento) {
  evento.preventDefault();
  if (enviando) return;
  const d = valoresForm();
  const problema = validarLocal(d);
  if (problema) return erroCheckout(...problema);

  const calculo = atualizarCheckout();
  if (!calculo.ok) return erroCheckout(calculo.erro);

  const metodo = catalogo.entrega.metodos.find((m) => m.id === d.entrega);
  const corpo = {
    itens: sacola.itens(),
    formaPagamento: d.formaPagamento,
    entrega: d.entrega,
    totalExibidoCentavos: calculo.pedido.totalCentavos,
    cliente: {
      nome: d.nome, email: d.email, telefone: d.telefone, observacoes: d.observacoes,
      endereco: metodo?.exigeEndereco ? { ...d.endereco, cep: d.cep } : null,
    },
  };

  enviando = true;
  const botao = $('[data-pagar]');
  botao.disabled = true;
  $('[data-pagar-texto]').textContent = 'Abrindo o Mercado Pago…';
  erroCheckout('');

  try {
    const resposta = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
    const dados = await resposta.json().catch(() => ({}));
    if (resposta.status === 409) {
      catalogo = await carregarCatalogo();
      sacola.iniciar(catalogo);
      renderVitrine(); renderSacola(); renderOpcoesEntrega(); atualizarCheckout();
      throw new Error(dados.erro || 'Os valores mudaram. Confira o total e tente de novo.');
    }
    if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível abrir o pagamento.');

    const url = new URL(dados.urlPagamento);
    if (url.protocol !== 'https:' || !DOMINIOS_PAGAMENTO.some((dom) => url.hostname === dom || url.hostname.endsWith(`.${dom}`))) {
      throw new Error('Endereço de pagamento inesperado.');
    }
    try { sessionStorage.setItem('camilinhas:pedido', dados.pedidoId); } catch { /* sem armazenamento */ }
    location.assign(url.toString());
  } catch (e) {
    erroCheckout(e.message || 'Algo deu errado. Tente de novo.');
    botao.disabled = false;
    enviando = false;
    atualizarCheckout();
  }
}

function configurarCheckout() {
  const g = gaveta();
  $$('[data-fechar]', g).forEach((b) => b.addEventListener('click', () => g.close()));
  $('[data-ir-checkout]').addEventListener('click', () => {
    mostrarEtapa('checkout');
    renderOpcoesEntrega();
    atualizarCheckout();
    form().elements.nome.focus();
  });
  $('[data-voltar-sacola]').addEventListener('click', () => {
    mostrarEtapa('sacola');
    renderSacola();
    $('[data-ir-checkout]').focus();
  });
  $('[data-ir-loja]').addEventListener('click', () => { g.close(); $('#loja').scrollIntoView(); });

  const f = form();
  f.addEventListener('submit', pagar);
  f.addEventListener('change', (e) => {
    if (e.target.name === 'entrega' || e.target.name === 'formaPagamento') atualizarCheckout();
  });
  f.elements.cep.addEventListener('input', (e) => {
    const digitos = e.target.value.replace(/\D/g, '').slice(0, 8);
    e.target.value = digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
    renderOpcoesEntrega();
    atualizarCheckout();
    if (digitos.length === 8) buscarCep(digitos);
  });
  f.elements.telefone.addEventListener('input', (e) => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 11);
    let t = d;
    if (d.length > 2) t = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length > 7) t = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
    e.target.value = t;
  });
  f.elements.uf.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^a-z]/gi, '').toUpperCase(); });
  // Volta do Mercado Pago pelo botão "voltar" do navegador: reabilita o botão.
  window.addEventListener('pageshow', () => { enviando = false; $('[data-pagar]').disabled = false; });
}

/* -------------------------------------------------------------- encomendas */
function renderEncomendas() {
  const caixa = $('[data-tipos]');
  const select = $('#enc-tipo');
  select.replaceChildren(...catalogo.encomendas.map((e) => h('option', { value: e.id, text: e.nome })));
  const escolher = (id) => {
    select.value = id;
    $$('.tipo', caixa).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
  };
  caixa.replaceChildren(
    ...catalogo.encomendas.map((e) =>
      h('button', { type: 'button', class: 'tipo', 'aria-pressed': 'false', dataset: { id: e.id }, onclick: () => { escolher(e.id); $('#enc-ideia').focus(); } },
        h('img', { src: e.imagem.src, alt: e.imagem.alt, width: 400, height: 300, loading: 'lazy' }),
        h('span', { class: 'tipo__corpo' },
          h('span', { class: 'tipo__selo', text: e.selo }),
          h('span', { class: 'tipo__titulo', text: e.nome }),
          h('span', { text: e.descricao }),
        ),
      ),
    ),
  );
  select.addEventListener('change', () => escolher(select.value));
  escolher(catalogo.encomendas[0].id);
  $$('[data-escolher-encomenda]').forEach((a) => a.addEventListener('click', () => escolher(a.dataset.escolherEncomenda)));

  $('[data-form-encomenda]').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const v = (k) => String(f.get(k) ?? '').trim();
    const erro = $('[data-erro-encomenda]');
    if (v('nome').length < 2) { erro.textContent = 'Diga seu nome.'; e.target.elements.nome.focus(); return; }
    if (v('ideia').length < 10) { erro.textContent = 'Conte um pouco mais sobre a peça.'; e.target.elements.ideia.focus(); return; }
    erro.textContent = '';
    const tipo = catalogo.encomendas.find((x) => x.id === v('tipo'))?.nome ?? 'Encomenda';
    const data = v('data') ? new Date(`${v('data')}T12:00:00`).toLocaleDateString('pt-BR') : 'sem data definida';
    const texto = [
      `Oi, Camila! Vim pelo site e quero um orçamento.`,
      ``,
      `*Tipo:* ${tipo}`,
      `*Quantidade:* ${Math.max(1, Math.min(500, Number(v('quantidade')) || 1))}`,
      `*Para quando:* ${data}`,
      `*Ideia:* ${v('ideia').slice(0, 800)}`,
      ``,
      `${v('nome').slice(0, 80)}`,
    ].join('\n');
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  });
}

/* ------------------------------------------------------------------ início */
function configurarGeral() {
  $$('[data-abrir-sacola]').forEach((b) => b.addEventListener('click', () => abrirGaveta()));
  $$('dialog').forEach((d) => {
    $$('[data-fechar]', d).forEach((b) => b.addEventListener('click', () => d.close()));
    // Fecha ao clicar fora do conteúdo.
    d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  });
  const topo = $('#topo');
  const aoRolar = () => topo.classList.toggle('rolou', window.scrollY > 8);
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();
  $$('[data-ano]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
}

async function iniciar() {
  configurarGeral();
  try {
    catalogo = await carregarCatalogo();
  } catch {
    $('[data-vitrine]').replaceChildren(h('p', { class: 'aviso' }, 'Não conseguimos carregar as peças agora. Atualize a página ou fale com a gente no ',
      h('a', { href: `https://wa.me/${WHATSAPP}`, text: 'WhatsApp' }), '.'));
    return;
  }
  sacola.iniciar(catalogo);
  renderFiltros();
  renderVitrine();
  renderEncomendas();
  configurarModalProduto();
  configurarCheckout();
  sacola.aoMudar(renderSacola);
  renderSacola();

  const m = location.hash.match(/^#produto\/([a-z0-9-]+)$/);
  if (m && produtoPorId(m[1])) abrirProduto(m[1]);
}

iniciar();
