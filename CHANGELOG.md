# Changelog

## 2.1.0 — 2026-11-13

- Página de vendas do **Ponto a Ponto Pro** (`/ponto-a-ponto/`): licença vitalícia, preço de lançamento de R$ 250 com virada automática para R$ 500 em 1º/1/2027, contagem regressiva, comparação honesta grátis × Pro e modo pré-lançamento com lista de espera.
- Produto digital no checkout: entrega digital, uma licença por pedido, sem misturar com peças.
- Chave de licença assinada (HMAC) enviada por e-mail no webhook; `POST /api/licenca` para o app validar, com revogação automática em estorno.
- Política do produto digital e arrependimento de 7 dias.

## 2.0.0 — 2026-11-13

Site refeito do zero.

- Marca centrada na Camila Lopes de Souza; Adriana Nunes como referência.
- Nova seção **Retrato em Crochê** e integração com o app **Ponto a Ponto**.
- Checkout real com **Mercado Pago Checkout Pro**: Pix com 5% de desconto, cartão até 6x sem juros, boleto. Preço recalculado no servidor, webhook com assinatura HMAC.
- Frete por método (retirada, motoboy em Sorocaba, Correios por região de CEP) com preenchimento de endereço pelo ViaCEP.
- Encomendas (Pititicos, Bebezinho, lembrancinhas) com mensagem pronta para o WhatsApp.
- Design system próprio a partir do logo; fontes auto-hospedadas; CSP sem `unsafe-inline`.
- Políticas de trocas (CDC), entregas e privacidade (LGPD).
- Removidos: coleção Turma do Chaves (marca de terceiros), Tailwind via CDN, imagens PNG de até 38 MB (repositório de 185 MB para ~2 MB), scripts de geração fictícios.
- Revisões independentes de segurança, design/acessibilidade e copy aplicadas (Pix blindado contra saldo/carteira, conferência de valor no webhook, frete validado por cidade/UF, contraste e foco WCAG AA, menu no celular).
- Testes automatizados (26) e CI no GitHub Actions. Licença MIT para o código; marca e fotos com direitos reservados.

## 1.x

Versão anterior (até o commit `317a6f1`), centrada na Adriana Nunes, com pedido finalizado pelo WhatsApp.
