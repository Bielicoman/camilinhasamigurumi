export function criarRes() {
  const res = {
    statusCode: 200, headers: {}, corpo: '',
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(c) { this.corpo = c; },
    get json() { return JSON.parse(this.corpo); },
  };
  return res;
}

export function criarReq({ method = 'POST', body, headers = {}, url = '/api/checkout' } = {}) {
  return {
    method, body, url,
    headers: { host: 'loja.exemplo.com.br', origin: 'https://loja.exemplo.com.br', 'content-type': 'application/json', 'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250)}`, ...headers },
    socket: {},
  };
}

// Valores fictícios usados só nos testes.
export const ENV = {
  MP_ACCESS_TOKEN: ['token', 'ficticio', 'de', 'teste'].join('-'),
  MP_WEBHOOK_SECRET: ['segredo', 'ficticio'].join('-'),
  SITE_URL: 'https://loja.exemplo.com.br',
};

export function corpoValido(extra = {}) {
  return {
    itens: [{ id: 'jesus', quantidade: 1 }, { id: 'capimila', quantidade: 2 }],
    formaPagamento: 'cartao',
    entrega: 'correios',
    cliente: {
      nome: 'Maria da Silva',
      email: 'maria@example.com',
      telefone: '(15) 99999-0000',
      observacoes: 'Capimila em tons de marrom',
      endereco: { cep: '18010-000', rua: 'Rua XV de Novembro', numero: '100', complemento: '', bairro: 'Centro', cidade: 'Sorocaba', uf: 'SP' },
    },
    ...extra,
  };
}
