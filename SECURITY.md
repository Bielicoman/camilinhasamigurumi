# Política de segurança

## Como reportar

Encontrou uma vulnerabilidade? **Não abra issue pública.** Use o [aviso privado de segurança do GitHub](../../security/advisories/new) deste repositório ou chame o ateliê no WhatsApp (67) 99280-4803 pedindo o contato técnico. Respondemos em até 5 dias úteis.

Inclua: o que encontrou, como reproduzir e o impacto. Não teste com cartões reais nem faça pedidos reais em produção; use as [credenciais de teste do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/test/accounts).

## Escopo

- `api/` — criação do pagamento e webhook;
- `public/` — loja e checkout;
- `vercel.json` — cabeçalhos de segurança.

Fora do escopo: o próprio Mercado Pago, a Vercel e o app Ponto a Ponto (que tem repositório e política próprios).

## Versões suportadas

Só a versão publicada na branch `main` recebe correções.

Detalhes do modelo de ameaças e das defesas: [`docs/SEGURANCA.md`](docs/SEGURANCA.md).
