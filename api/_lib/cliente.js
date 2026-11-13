/** Validação e saneamento dos dados do comprador. */

const UFS = new Set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '));
// Faixas de CEP por UF (Correios). Usadas para recusar CEP de um estado com endereço de outro.
const FAIXAS_CEP = {
  SP: [['01000', '19999']], RJ: [['20000', '28999']], ES: [['29000', '29999']], MG: [['30000', '39999']],
  BA: [['40000', '48999']], SE: [['49000', '49999']], PE: [['50000', '56999']], AL: [['57000', '57999']],
  PB: [['58000', '58999']], RN: [['59000', '59999']], CE: [['60000', '63999']], PI: [['64000', '64999']],
  MA: [['65000', '65999']], PA: [['66000', '68899']], AP: [['68900', '68999']],
  AM: [['69000', '69299'], ['69400', '69899']], RR: [['69300', '69399']], AC: [['69900', '69999']],
  DF: [['70000', '72799'], ['73000', '73699']], GO: [['72800', '72999'], ['73700', '76799']],
  RO: [['76800', '76999']], TO: [['77000', '77999']], MT: [['78000', '78899']], MS: [['79000', '79999']],
  PR: [['80000', '87999']], SC: [['88000', '89999']], RS: [['90000', '99999']],
};

export function cepPertenceAUf(cep, uf) {
  const prefixo = String(cep).slice(0, 5);
  return (FAIXAS_CEP[uf] ?? []).some(([de, ate]) => prefixo >= de && prefixo <= ate);
}

const semAcento = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const EMAIL = /^[^\s@<>()[\]\\,;:"]{1,64}@[a-z0-9.-]{1,253}\.[a-z]{2,24}$/i;

/** Remove caracteres de controle, colapsa espaços e corta no limite. */
export function limparTexto(valor, max) {
  if (typeof valor !== 'string') return '';
  return valor
    .normalize('NFC')
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2028\u2029\u2066-\u2069]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/**
 * @returns {{ok: true, cliente: object} | {ok: false, erro: string}}
 */
export function validarCliente(entrada, { exigeEndereco, cidadeExigida }) {
  const c = entrada ?? {};
  const nome = limparTexto(c.nome, 80);
  const email = limparTexto(c.email, 254).toLowerCase();
  const telefone = String(c.telefone ?? '').replace(/\D/g, '');
  const observacoes = limparTexto(c.observacoes, 400);

  if (nome.length < 3 || !nome.includes(' ')) return { ok: false, erro: 'Informe nome e sobrenome.' };
  if (!EMAIL.test(email)) return { ok: false, erro: 'E-mail inválido.' };
  if (telefone.length < 10 || telefone.length > 11) return { ok: false, erro: 'Telefone com DDD inválido.' };

  const cliente = { nome, email, telefone, observacoes, endereco: null };

  if (exigeEndereco) {
    const e = c.endereco ?? {};
    const endereco = {
      cep: String(e.cep ?? '').replace(/\D/g, ''),
      rua: limparTexto(e.rua, 120),
      numero: limparTexto(e.numero, 12),
      complemento: limparTexto(e.complemento, 60),
      bairro: limparTexto(e.bairro, 80),
      cidade: limparTexto(e.cidade, 80),
      uf: limparTexto(e.uf, 2).toUpperCase(),
    };
    if (endereco.cep.length !== 8) return { ok: false, erro: 'CEP inválido.' };
    if (endereco.rua.length < 2 || !endereco.numero || endereco.bairro.length < 2 || endereco.cidade.length < 2) {
      return { ok: false, erro: 'Endereço incompleto.' };
    }
    if (!UFS.has(endereco.uf)) return { ok: false, erro: 'UF inválida.' };
    if (!cepPertenceAUf(endereco.cep, endereco.uf)) return { ok: false, erro: 'O CEP não corresponde à UF informada.' };
    if (cidadeExigida && (semAcento(endereco.cidade) !== semAcento(cidadeExigida.cidade) || endereco.uf !== cidadeExigida.uf)) {
      return { ok: false, erro: `Essa entrega só atende ${cidadeExigida.cidade}-${cidadeExigida.uf}.` };
    }
    cliente.endereco = endereco;
  }

  return { ok: true, cliente };
}
