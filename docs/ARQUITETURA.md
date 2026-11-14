# Arquitetura

## Visão geral

```
Navegador ──GET──▶ Vercel (public/, estático, CSP estrita)
    │
    ├─ POST /api/checkout ─▶ função ─▶ catálogo (public/catalog.json)
    │                              └▶ Mercado Pago: cria preferência ─▶ devolve init_point
    │
    └─ redireciona para o Checkout Pro (Mercado Pago)
                         │
                         ├─ back_urls ─▶ /pedido/?status=aprovado|pendente|recusado
                         └─ webhook ──▶ POST /api/webhook ─▶ valida HMAC ─▶ GET /v1/payments/{id}
                                                                └▶ aprovado? avisa o ateliê (Resend)
```

## Decisões

**Sem framework nem build.** A loja tem uma página, dez produtos e um fluxo de compra. HTML, CSS e módulos JS servidos direto pela Vercel carregam rápido, não têm dependências para atualizar e qualquer pessoa consegue editar.

**Catálogo como fonte única.** `public/catalog.json` é lido pelo navegador (para exibir) e pela função de checkout (para cobrar). `public/assets/js/pricing.js` é o mesmo módulo nos dois lados, então desconto, parcelas e frete nunca divergem. O cliente envia só `id` e `quantidade`; se o total que ele viu for diferente do calculado no servidor, a API responde `409` e a página recarrega o catálogo.

**Checkout Pro em vez de formulário de cartão próprio.** Os dados de cartão nunca passam pelo site. Isso tira a loja do escopo PCI e entrega Pix, cartão e boleto com a tela que o comprador já conhece.

**Sem banco de dados.** O registro do pedido é a própria preferência/pagamento no Mercado Pago (`external_reference` = id do pedido, `metadata` = cliente, endereço, entrega e observações). O ateliê consulta tudo no painel do Mercado Pago e recebe e-mail a cada aprovação. Limite conhecido: não há baixa de estoque automática, o que é aceitável porque as peças são produzidas sob demanda (5 a 15 dias úteis). Se o volume crescer, o próximo passo é gravar pedidos em um banco (Vercel Postgres ou Supabase) dentro do webhook.

**Encomendas pelo WhatsApp.** Peças personalizadas precisam de conversa, fotos e aprovação de gráfico. O formulário só organiza a mensagem; nenhum dado é enviado ao servidor.

## Pastas publicadas

`vercel.json` define `outputDirectory: "public"`. Nada fora de `public/` é servido como arquivo estático (nem `docs/`, `tests/` ou `.agent/`). As funções em `api/` são empacotadas à parte; `public/catalog.json` entra no pacote via `functions.includeFiles`. Arquivos em `api/_lib/` não viram rotas (prefixo `_`).
