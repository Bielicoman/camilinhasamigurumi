# Segurança

## O que proteger

| Ativo | Ameaça | Defesa |
|---|---|---|
| Valor cobrado | cliente altera preço, quantidade, frete ou desconto | servidor aceita só `id` e `quantidade`; tudo é recalculado de `catalog.json`; quantidade inteira 1–10, até 20 itens, sem itens duplicados |
| Desconto Pix | pagar com cartão pelo preço de Pix | a preferência Pix exclui todos os outros meios; a de cartão exclui o Pix |
| Confirmação de pagamento | webhook falso, replay | HMAC-SHA256 do `x-signature` com `MP_WEBHOOK_SECRET`, comparação em tempo constante, janela de 10 min; o status é lido da API do Mercado Pago, nunca do corpo da notificação |
| Segredos | vazamento no front ou no repositório | tokens só em variáveis de ambiente; erros do provedor vão para o log, nunca para o cliente; `verificar-site.mjs` procura padrões de token no CI |
| Comprador | XSS, roubo de sessão, clickjacking | sem `innerHTML`: todo texto entra por `textContent`; CSP sem `unsafe-inline`; `frame-ancestors 'none'`; HSTS |
| Dados pessoais (LGPD) | coleta excessiva | coleta só o necessário para entregar; sem cookies de rastreamento nem analytics; sem banco próprio |
| Checkout | abuso / spam de preferências | checagem de `Origin`, `Content-Type`, limite de corpo e de requisições por IP |

## Cabeçalhos (vercel.json)

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;
  font-src 'self'; connect-src 'self' https://viacep.com.br; frame-src 'none'; frame-ancestors 'none';
  object-src 'none'; base-uri 'self'; form-action 'self'; manifest-src 'self'; upgrade-insecure-requests
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), …
Cross-Origin-Opener-Policy: same-origin
```

As fontes são servidas do próprio domínio (sem Google Fonts em tempo de execução), o que mantém a CSP fechada e evita enviar o IP do visitante a terceiros. O único destino externo do navegador é o ViaCEP, para preencher o endereço.

Regra para quem editar: **nada de `<script>` inline, atributo `style=` ou `onclick=`** — a CSP bloqueia e o CI acusa.

## Limites conhecidos

- **Rate limit em memória.** Vale por instância da função; não segura um ataque distribuído. Ative o [Firewall da Vercel](https://vercel.com/docs/vercel-firewall) com uma regra de rate limiting para `/api/checkout` (ex.: 20 requisições/min por IP).
- **Sem idempotência persistente no aviso.** Se o Mercado Pago reenviar a notificação, o e-mail usa `Idempotency-Key` no Resend para não duplicar; sem Resend, o log pode registrar a mesma aprovação mais de uma vez.
- **Checagem de origem** depende do cabeçalho `Origin`, que navegadores sempre enviam em POST. Ela barra outros sites, não scripts fora do navegador — a defesa real é o servidor recalcular tudo.

## Rotina

- Trocar `MP_ACCESS_TOKEN` e `MP_WEBHOOK_SECRET` se alguém que tinha acesso sair do projeto.
- Manter o branch `main` protegido com o CI obrigatório.
- Ativar o *secret scanning* e o *Dependabot alerts* do GitHub (não há dependências npm hoje, mas a Action usa `actions/*`).
