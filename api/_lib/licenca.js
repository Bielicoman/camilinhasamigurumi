import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Chave de licença do Ponto a Ponto Pro.
 *
 * Formato: PAP-<id do pagamento no Mercado Pago>-XXXXX-XXXXX-XXXXX-XXXXX
 * Os 20 caracteres finais são um HMAC-SHA256 de "<pagamento>:<e-mail>" com
 * LICENCA_SEGREDO. Não há banco: a chave prova a compra (assinatura) e o
 * Mercado Pago diz se ela continua valendo (pagamento aprovado, não estornado).
 */
const PADRAO = /^PAP-(\d{1,20})-([0-9A-F]{5})-([0-9A-F]{5})-([0-9A-F]{5})-([0-9A-F]{5})$/;

const normalizarEmail = (email) => String(email ?? '').trim().toLowerCase();

function assinatura(pagamentoId, email, segredo) {
  return createHmac('sha256', segredo)
    .update(`${pagamentoId}:${normalizarEmail(email)}`)
    .digest('hex')
    .slice(0, 20)
    .toUpperCase();
}

export function gerarChave(pagamentoId, email, segredo) {
  if (!segredo) throw new Error('LICENCA_SEGREDO ausente');
  const a = assinatura(pagamentoId, email, segredo);
  return `PAP-${pagamentoId}-${a.match(/.{5}/g).join('-')}`;
}

/** Confere a assinatura. Retorna o id do pagamento ou null. */
export function conferirChave(chave, email, segredo) {
  if (!segredo) return null;
  const m = PADRAO.exec(String(chave ?? '').trim().toUpperCase());
  if (!m) return null;
  const [, pagamentoId, ...blocos] = m;
  const recebida = Buffer.from(blocos.join(''));
  const esperada = Buffer.from(assinatura(pagamentoId, email, segredo));
  return recebida.length === esperada.length && timingSafeEqual(recebida, esperada) ? pagamentoId : null;
}

export const PRODUTO_PRO = 'ponto-a-ponto-pro';

export function pagamentoIncluiPro(pagamento) {
  const lista = String(pagamento?.metadata?.produtos_digitais ?? '').split(',');
  return lista.includes(PRODUTO_PRO);
}

export function textoEmailLicenca({ nome, chave, aparelhos }) {
  return [
    `Oi, ${nome || 'tudo bem'}!`,
    '',
    'Obrigado por comprar o Ponto a Ponto Pro. Esta é a sua chave de licença vitalícia:',
    '',
    `    ${chave}`,
    '',
    'Como ativar:',
    '1. Abra o Ponto a Ponto (https://pontoapontocroche.vercel.app/app/ ou o app instalado).',
    '2. No menu de três pontos, toque em "Ativar Pro".',
    '3. Informe este e-mail e cole a chave.',
    '',
    `A licença vale em até ${aparelhos} aparelhos e inclui as atualizações da versão Pro.`,
    'Guarde este e-mail. Se precisar de ajuda, responda pelo WhatsApp (67) 99280-4803.',
    '',
    'Você tem 7 dias para desistir da compra (Código de Defesa do Consumidor, art. 49).',
    'Em caso de estorno, a chave deixa de funcionar.',
    '',
    '— Camilinhas Amigurumi · Ponto a Ponto',
  ].join('\n');
}
