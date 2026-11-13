<p align="center"><img src="public/assets/img/brand/logo-camilinhas.webp" alt="Camilinhas Amigurumi" width="160"></p>

<h1 align="center">Camilinhas Amigurumi</h1>

<p align="center">Loja oficial do ateliê da <b>Camila Lopes de Souza</b> — amigurumi e retrato em crochê feitos à mão em Sorocaba-SP.</p>

<p align="center">
  <a href="https://camilinhasamigurumi.vercel.app/">Site</a> ·
  <a href="https://www.instagram.com/camilinhasamigurumi/">Instagram</a> ·
  <a href="https://pontoapontocroche.vercel.app/app/">App Ponto a Ponto</a>
</p>

## O que tem aqui

- **Loja** com catálogo, sacola e checkout com **Mercado Pago Checkout Pro**: Pix com 5% de desconto, cartão em até 6x sem juros e boleto.
- **Retrato em Crochê**: a linha nova do ateliê, com orçamento pelo WhatsApp.
- **Encomendas** (Pititicos, Bebezinho, lembrancinhas) com formulário que monta a mensagem do WhatsApp.
- Página de vendas do **Ponto a Ponto Pro** (`/ponto-a-ponto/`), o app do ateliê onde as fotos viram gráfico: licença vitalícia com preço de lançamento, entrega da chave por e-mail e API de validação para o app.
- Páginas de retorno do pedido, políticas (CDC e LGPD), link na bio (`/links/`) e 404.

Sem framework, sem build e sem dependências: HTML, CSS e JavaScript de módulo, mais duas funções serverless na Vercel.

## Estrutura

```
public/                 site estático (é a única pasta publicada)
  catalog.json          catálogo, preços, frete e regras de pagamento — fonte única
  assets/js/pricing.js  regras de preço compartilhadas entre navegador e servidor
  assets/js/app.js      loja, sacola, checkout e encomendas
  pedido/ politicas/ links/ 404.html
api/
  checkout.js           POST /api/checkout → cria a preferência no Mercado Pago
  webhook.js            POST /api/webhook  → valida assinatura, confirma o pagamento e envia licenças
  licenca.js            POST /api/licenca  → o app Ponto a Ponto valida a chave Pro
  _lib/                 validação, cliente Mercado Pago, aviso por e-mail
tests/                  testes (node:test) da API e das regras de preço
scripts/                servidor local e verificação estática
docs/                   arquitetura, pagamentos, segurança, design system e marketing
```

## Rodar localmente

Requer Node 20 ou superior.

```bash
npm test
```

```bash
MP_SIMULADO=1 node scripts/servidor-local.mjs
```

Abra http://localhost:4173. Com `MP_SIMULADO=1` o Mercado Pago é simulado: o checkout funciona de ponta a ponta sem rede e a preferência gerada aparece no terminal. Para testar com o Mercado Pago de verdade, exporte `MP_ACCESS_TOKEN` com uma **credencial de teste** e rode sem `MP_SIMULADO`.

## Publicar na Vercel

1. Importe o repositório na Vercel. Não há comando de build; a pasta publicada é `public/` (definida em `vercel.json`).
2. Cadastre as variáveis de [`.env.example`](.env.example) em **Settings → Environment Variables**.
3. No painel do Mercado Pago, configure o Webhook para `https://SEU-DOMINIO/api/webhook` com o evento **Pagamentos** e copie a assinatura secreta para `MP_WEBHOOK_SECRET`.
4. Faça uma compra com cartão de teste antes de trocar para as credenciais de produção.

Passo a passo completo e checklist de produção: [`docs/PAGAMENTOS.md`](docs/PAGAMENTOS.md).

## Editar o catálogo

Tudo fica em [`public/catalog.json`](public/catalog.json). Preços são em **centavos** (`16000` = R$ 160,00). O servidor sempre recalcula o valor a partir desse arquivo, então mudar um preço aqui muda o que é cobrado. Para tirar uma peça da loja sem apagar, use `"disponivel": false`. Rode `npm test` depois de editar: o teste confere ids, preços e se as fotos existem.

## Documentação

| Documento | Conteúdo |
|---|---|
| [Arquitetura](docs/ARQUITETURA.md) | como as peças se conectam, decisões e limites |
| [Pagamentos](docs/PAGAMENTOS.md) | Mercado Pago, Pix, parcelas, frete, webhook, checklist de produção |
| [Ponto a Ponto Pro](docs/PONTO-A-PONTO-PRO.md) | oferta, licença, API `/api/licenca` e o que falta no app |
| [Segurança](docs/SEGURANCA.md) | modelo de ameaças e defesas |
| [Design system](docs/DESIGN-SYSTEM.md) | cores, tipografia, componentes e regras de imagem |
| [Marketing](docs/MARKETING.md) | posicionamento, mensagens e lançamento do Retrato em Crochê |

## Licença

O **código** está sob [MIT](LICENSE). Marca, logotipo, fotos e textos do ateliê **não** estão: veja [LICENCA-CONTEUDO.md](LICENCA-CONTEUDO.md).
