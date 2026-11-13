# Pagamentos

Integração com o **Mercado Pago Checkout Pro**. O comprador escolhe Pix ou cartão/boleto no site, e o servidor cria uma preferência de pagamento já restrita àquela forma.

## Regras (em `public/catalog.json → pagamento`)

| Regra | Valor | Onde é aplicada |
|---|---|---|
| Desconto Pix | 5% sobre os produtos, por unidade, arredondado ao centavo | `precoUnitario()` |
| Frete no Pix | sem desconto | `calcularPedido()` |
| Parcelas | até 6x sem juros, parcela mínima R$ 50 | `calcularParcelas()` → `payment_methods.installments` |
| Pix | só Pix habilitado (exclui cartão, débito, boleto) e expira em 24 h | `montarPreferencia()` |
| Cartão/boleto | Pix excluído, para o desconto não valer fora do Pix | `montarPreferencia()` |

> **Juros do parcelamento.** "Sem juros" para o comprador significa que o ateliê paga a taxa de parcelamento. Confirme no painel do Mercado Pago (Seu negócio → Custos) se o parcelamento sem juros está ativado e qual é a tarifa; sem isso, o Mercado Pago pode cobrar juros do comprador.

## Frete (em `public/catalog.json → entrega`)

| Método | Preço | Condição |
|---|---|---|
| Retirada agendada | grátis | Sorocaba |
| Motoboy | R$ 15, grátis acima de R$ 150 (sobre o valor cheio) | CEP começando em 180 ou 181 |
| Correios | R$ 25 (SP) · R$ 35 (Sudeste/Sul) · R$ 45 (demais) | faixas de CEP |

Os valores de frete são uma **tabela fixa por região**, não uma cotação em tempo real. Revise-os com base no peso e nas dimensões reais da embalagem; para cotação automática, a evolução natural é integrar o Melhor Envio no `api/checkout.js`.

O frete vai na preferência como `shipments: { mode: "not_specified", cost }`, então aparece separado no Checkout Pro.

## Variáveis de ambiente

| Nome | Obrigatória | Para quê |
|---|---|---|
| `MP_ACCESS_TOKEN` | sim | criar preferências e consultar pagamentos |
| `MP_WEBHOOK_SECRET` | sim | validar a assinatura das notificações |
| `SITE_URL` | sim | `back_urls`, `notification_url` e checagem de origem (`https://…`, sem barra final) |
| `RESEND_API_KEY`, `ORDER_NOTIFY_EMAIL`, `ORDER_FROM_EMAIL` | para vender o Pro | e-mail ao ateliê e entrega da licença ao comprador |
| `LICENCA_SEGREDO` | para vender o Pro | assina as chaves de licença (ver `PONTO-A-PONTO-PRO.md`) |
| `LICENCA_ORIGENS` | não | origens liberadas no CORS de `/api/licenca` |

Sem `MP_ACCESS_TOKEN` ou com `SITE_URL` sem https, o checkout responde 503 com a mensagem "fale com a gente no WhatsApp" — a loja continua navegável.

## Configurar o Mercado Pago

1. Entre em [Suas integrações](https://www.mercadopago.com.br/developers/panel/app) com a conta **vendedora** do ateliê e crie uma aplicação do tipo **Checkout Pro**.
2. Copie o **Access Token de teste** para `MP_ACCESS_TOKEN` no ambiente *Preview* da Vercel.
3. Em **Webhooks → Configurar notificações**, cadastre `https://SEU-DOMINIO/api/webhook` (modo teste e modo produção), marque o evento **Pagamentos** e salve. Copie a **assinatura secreta** para `MP_WEBHOOK_SECRET`.
4. Crie [contas de teste](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/test/accounts) (vendedor e comprador) e faça compras com os [cartões de teste](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/test/cards): uma aprovada (titular `APRO`), uma recusada (`OTHE`) e um Pix.
5. Confira em **Webhooks → Histórico** que as notificações chegaram com status 200.
6. Só então troque para o **Access Token de produção** no ambiente *Production* e faça uma compra real de valor baixo, estornando em seguida.

## Checklist antes de vender

- [ ] Preços, prazos e fotos do `catalog.json` revisados pela Camila
- [ ] Tabela de frete conferida com embalagem real
- [ ] Parcelamento sem juros ativado no Mercado Pago (ou texto "sem juros" removido)
- [ ] Webhook de produção cadastrado e testado (status 200)
- [ ] `SITE_URL` igual ao domínio final
- [ ] Compra real de teste aprovada e estornada
- [ ] Rate limiting do Firewall da Vercel ativado em `/api/checkout` (ver SEGURANCA.md)

## Fluxo de um pedido

1. `POST /api/checkout` recebe `itens[{id, quantidade}]`, `formaPagamento`, `entrega`, `cliente` e `totalExibidoCentavos`.
2. A função valida o comprador, recalcula tudo pelo catálogo e compara com o total exibido (`409` se mudou).
3. Gera `CAM-AAAAMMDD-XXXXXXXX`, cria a preferência com `X-Idempotency-Key` igual a esse id e devolve o `init_point`.
4. O navegador confere que o endereço é do Mercado Pago e redireciona.
5. O comprador paga e volta para `/pedido/?status=…`. A sacola só é limpa no retorno aprovado.
6. O Mercado Pago chama `/api/webhook`. A função valida a assinatura, busca o pagamento pela API e, se `approved`, envia o aviso. O status da URL de retorno é só informativo; a confirmação que vale é a do webhook e do painel.

## Testes

`npm test` cobre: preço do servidor ignorando o do cliente, desconto Pix, parcelas, frete por faixa de CEP, motoboy fora de Sorocaba, validações do comprador, saneamento de texto, origem, content-type, rate limit, erro do provedor sem vazar detalhe, assinatura do webhook (correta, adulterada, segredo errado, antiga) e aviso só em pagamento aprovado.

O que os testes **não** cobrem: a chamada real ao Mercado Pago. Isso só se valida com credenciais de teste, no passo 4 acima.
