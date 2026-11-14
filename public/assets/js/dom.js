/**
 * Criação de elementos sem innerHTML: todo texto entra como textContent,
 * o que elimina XSS a partir do catálogo ou de dados digitados.
 */
export function h(tag, atributos = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(atributos)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const filho of filhos.flat()) {
    if (filho == null || filho === false) continue;
    el.append(filho instanceof Node ? filho : document.createTextNode(String(filho)));
  }
  return el;
}

const SVG = 'http://www.w3.org/2000/svg';
export function icone(id) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(SVG, 'use');
  use.setAttribute('href', `#${id}`);
  svg.append(use);
  return svg;
}

export const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
export const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];

let timerToast;
let toastPreparado = false;
const DURACAO_TOAST = 8000;

function agendarFechamento(el) {
  clearTimeout(timerToast);
  timerToast = setTimeout(() => el.classList.remove('visivel'), DURACAO_TOAST);
}

export function toast(mensagem, acao) {
  const el = $('[data-toast]');
  if (!toastPreparado) {
    // Pausa enquanto o ponteiro ou o foco estiverem no aviso (WCAG 2.2.1).
    el.addEventListener('mouseenter', () => clearTimeout(timerToast));
    el.addEventListener('focusin', () => clearTimeout(timerToast));
    el.addEventListener('mouseleave', () => agendarFechamento(el));
    el.addEventListener('focusout', () => agendarFechamento(el));
    toastPreparado = true;
  }
  el.replaceChildren(h('span', { text: mensagem }));
  if (acao) el.append(h('button', { type: 'button', text: acao.rotulo, onclick: () => { acao.fazer(); el.classList.remove('visivel'); } }));
  el.classList.add('visivel');
  agendarFechamento(el);
}
