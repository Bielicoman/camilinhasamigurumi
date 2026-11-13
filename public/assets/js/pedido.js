// Página de retorno do Mercado Pago. O status exibido aqui é só informativo:
// a confirmação real do pagamento chega ao ateliê pelo webhook.
const params = new URLSearchParams(location.search);
const status = params.get('status');
const referencia = params.get('external_reference');

const textos = {
  aprovado: ['Pedido confirmado!', 'Recebemos o seu pagamento. A Camila já vai separar os fios — você recebe as novidades pelo WhatsApp.'],
  pendente: ['Pagamento em análise', 'Assim que o Mercado Pago confirmar, a gente começa a produção e avisa pelo WhatsApp. Se escolheu boleto, ele compensa em até 3 dias úteis.'],
  recusado: ['O pagamento não foi concluído', 'Nada foi cobrado. Sua sacola continua salva: tente de novo com outra forma de pagamento ou fale com a gente.'],
};
const [titulo, texto] = textos[status] ?? ['Acompanhe seu pedido', 'Se você acabou de pagar, o status chega por e-mail e pelo WhatsApp.'];
document.querySelector('[data-titulo]').textContent = titulo;
document.querySelector('[data-texto]').textContent = texto;
document.title = `${titulo} — Camilinhas Amigurumi`;

let pedido = referencia;
try { pedido = pedido || sessionStorage.getItem('camilinhas:pedido'); } catch { /* sem armazenamento */ }
if (pedido && /^CAM-\d{8}-[0-9A-F]{8}$/.test(pedido)) {
  document.querySelector('[data-pedido]').textContent = `Pedido ${pedido}`;
  const msg = encodeURIComponent(`Oi, Camila! Sobre o meu pedido ${pedido}:`);
  document.querySelector('[data-whats]').href = `https://wa.me/556792804803?text=${msg}`;
}
if (status === 'aprovado') {
  try {
    localStorage.removeItem('camilinhas:sacola:v1');
    sessionStorage.removeItem('camilinhas:pedido');
  } catch { /* sem armazenamento */ }
}
