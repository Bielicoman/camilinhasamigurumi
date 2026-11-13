# Ponto a Ponto Pro: venda e licença

Página de vendas: [`/ponto-a-ponto/`](../public/ponto-a-ponto/index.html). Produto `ponto-a-ponto-pro` em `public/catalog.json`.

## Oferta

| Regra | Valor | Onde |
|---|---|---|
| Preço de lançamento | R$ 250 até `lancamentoAte` (31/12/2026 23:59, horário de Brasília) | `precoCentavos` |
| Preço depois | R$ 500, aplicado automaticamente pelo servidor após a data | `precoAposLancamentoCentavos` |
| Pix | 5% de desconto (R$ 237,50 no lançamento) | regra geral da loja |
| Cartão | até 5x sem juros no lançamento (parcela mínima R$ 50) | regra geral da loja |
| Licença | vitalícia, pessoal, até 3 aparelhos, presa ao e-mail | `pontoAPontoPro.aparelhosPorLicenca` |

**Por que "lançamento" e não "de R$ 500 por R$ 250".** O preço "de" precisa ter sido praticado; como o Pro nunca foi vendido, um "de/por" seria publicidade enganosa (CDC art. 37). A página diz a verdade verificável: R$ 250 é 50% abaixo do preço final de R$ 500, que entra em vigor numa data fixa — e o servidor de fato passa a cobrar R$ 500 nessa data. Para adiar a data, mude `lancamentoAte` e o texto da política em `public/politicas/index.html#digital`.

## Interruptor de venda

`"disponivel": false` no produto deixa a página no modo **pré-lançamento**: mostra preço e benefícios, troca o formulário por "entrar na lista" no WhatsApp e o servidor recusa qualquer compra. Abra a venda (`true`) **só depois** que o app aceitar a chave e os recursos Pro existirem — vender antes é vender algo que o comprador não recebe.

Os benefícios listados na página vêm de `pontoAPontoPro.beneficios` no catálogo. São a proposta da versão Pro; ajuste a lista para o que o app realmente entregar antes de abrir a venda.

## Fluxo da compra

1. Página → `POST /api/checkout` com `itens: [{ id: "ponto-a-ponto-pro", quantidade: 1 }]`, `entrega: "digital"`.
2. O servidor exige entrega digital, uma licença por pedido e não deixa misturar com peças físicas.
3. Pagamento no Checkout Pro. `metadata.produtos_digitais` e `metadata.cliente_email` vão na preferência.
4. Webhook aprovado → confere valor e meio de pagamento → gera a chave → envia ao e-mail do comprador (Resend, com `Idempotency-Key` por pagamento) → avisa o ateliê. Se houver divergência, a chave **não** é enviada e o ateliê é avisado.
5. Se o Resend estiver fora, o webhook responde 500 e o Mercado Pago reenvia.

## Chave de licença

```
PAP-<id do pagamento no Mercado Pago>-XXXXX-XXXXX-XXXXX-XXXXX
```

Os 20 caracteres finais são `HMAC-SHA256(LICENCA_SEGREDO, "<pagamento>:<email em minúsculas>")`. Não existe banco de licenças: a assinatura prova que a chave foi emitida pelo ateliê para aquele e-mail, e o Mercado Pago diz se o pagamento continua aprovado. Estorno, chargeback ou cancelamento desativam a chave na próxima validação.

**Nunca troque `LICENCA_SEGREDO` depois de vender.** Todas as chaves emitidas deixariam de valer.

## API para o app: `POST /api/licenca`

```http
POST https://camilinhasamigurumi.vercel.app/api/licenca
Content-Type: application/json

{ "email": "maria@example.com", "chave": "PAP-987654321-AB12C-..." }
```

Respostas:

| Situação | Status | Corpo |
|---|---|---|
| Válida | 200 | `{ "valida": true, "plano": "pro", "aparelhos": 3 }` |
| Chave/e-mail não conferem | 200 | `{ "valida": false, "motivo": "chave ou e-mail não conferem" }` |
| Estornada/cancelada | 200 | `{ "valida": false, "motivo": "compra não está ativa" }` |
| Limite (20/min por IP) | 429 | `{ "erro": … }` |
| Mercado Pago indisponível | 502 | `{ "erro": … }` — o app deve manter o último estado conhecido |

CORS liberado para as origens em `LICENCA_ORIGENS` (padrão: `https://pontoapontocroche.vercel.app`). Apps instalados (Electron, Capacitor) não enviam `Origin` e são aceitos.

## O que falta no app (repositório `Bielicoman/pontoapontocroche`)

1. Item "Ativar Pro" no menu de três pontos: campos e-mail e chave → chama `/api/licenca`.
2. Guardar `{ email, chave, validadoEm }` no aparelho; revalidar a cada 7 dias com internet. Sem internet, manter o Pro por até 30 dias desde a última validação.
3. **Recursos Pro do lado do servidor sempre que possível** (cota maior da Fia, nuvem sem limite): o servidor do app chama `/api/licenca` antes de liberar. Recurso Pro só no navegador pode ser desbloqueado por quem editar o código aberto — por isso o valor do Pro deve estar nos serviços.
4. Controle de 3 aparelhos: o servidor do app registra um id por aparelho ativado (Firebase, que o app já usa) e recusa o quarto.
5. Exportação "sem marca do app" e "Modo Retrato" precisam existir antes de serem anunciados.

## Checklist antes de abrir a venda

- [ ] Recursos Pro implementados no app e lista de benefícios revisada no catálogo
- [ ] "Ativar Pro" no app chamando `/api/licenca`
- [ ] `LICENCA_SEGREDO` gerado e salvo em lugar seguro (cofre de senhas) além da Vercel
- [ ] Domínio verificado no Resend e `ORDER_FROM_EMAIL` configurado
- [ ] Compra de teste: chave chega, ativa no app, estorno desativa
- [ ] `"disponivel": true` no catálogo
