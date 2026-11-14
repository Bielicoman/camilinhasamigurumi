# Marketing e conteúdo

## Posicionamento

**Camilinhas é o ateliê da Camila: amigurumi com cara de personagem e, agora, retrato em crochê.**
Enquanto as lojas genéricas de amigurumi vendem catálogo, o Camilinhas vende *o seu* personagem — a pessoa, o pet, o bebê que vai nascer, a fé da família — tecido ponto a ponto por alguém com nome e rosto.

Três pilares, na ordem do site:

1. **Retrato em Crochê** (novo, diferencial): sua foto vira tapeçaria. O gráfico é feito no Ponto a Ponto, o app criado em família — isso dá autoridade técnica e é história própria.
2. **Encomendas afetivas**: Bebezinho (chá revelação, chá de bebê, mesversário, maternidade), Pititicos (seu personagem), lembrancinhas.
3. **Loja de pronta produção**: presépios, Sagrada Família, bichinhos e chaveiros, com compra direta e pagamento online.

## Regras de comunicação

- A marca é da **Camila**. A Adriana Nunes aparece só como referência ("minha mãe, minha referência de capricho").
- Nada de prova social inventada: depoimentos e números só quando forem reais e autorizados.
- Nada de "melhor do Brasil", "pioneira" ou "único": não dá para provar.
- Segurança infantil: dizer o que é verdade (algodão, enchimento antialérgico, olho com trava) e que **não é brinquedo certificado** — usar com supervisão para menores de 3 anos.
- Personagens de marcas registradas (Disney, Nintendo, Marvel, Chaves etc.) **não entram na loja**. Encomenda particular de fã é outra conversa, mas anunciar e vender em catálogo expõe o ateliê a notificação por uso de marca. Por isso a coleção "Turma do Chaves" e o "Jesus Funko" do site antigo saíram ou foram renomeados.

## Lançamento do Retrato em Crochê

1. **Prévia antes do sinal.** A cliente recebe o gráfico em pixels da própria foto (feito no Ponto a Ponto) antes de pagar. Derruba a objeção "como vai ficar?" sem mexer no preço.
2. **Bastidor da primeira leva.** Cada retrato encomendado vira conteúdo — foto → gráfico → carreiras → peça pronta — com autorização da cliente. O número de vagas do lote é o que a Camila realmente consegue produzir, sem escassez falsa.
3. **Datas com prazo real.** Dia dos Pais, aniversários, o pet da família. A data-limite sai do calendário (5–15 dias úteis + frete). Brinde: o PDF do gráfico do próprio retrato.

Formatos de Reels que já funcionam no perfil e devem continuar: "One girl, two different versions" (antes/depois), unboxing da encomenda, tela do app convertendo a foto, e a Camila mostrando a peça no corpo.

## Pendências de conteúdo (para a Camila validar)

| Item | Onde | Situação |
|---|---|---|
| Preços | `public/catalog.json` | herdados do site anterior; confirmar todos |
| Prazos por peça | `catalog.json → prazoDiasUteis` | estimados dentro dos 5–15 dias do site anterior |
| Tabela de frete | `catalog.json → entrega` | valores-base; conferir com embalagem real |
| Texto "Oi, eu sou a Camila" | `index.html` | versão neutra; trocar por história nas palavras dela |
| Foto da Camila | `assets/img/atelie/camila-retrato.webp` | recorte de 360 px de um Reel; substituir por retrato em alta |
| Fotos do Retrato em Crochê | `assets/img/atelie/` | recortes de Reels em baixa resolução; fotografar peças prontas |
| Fotos de produto | `assets/img/produtos/` | vêm do site anterior; confirmar que cada uma é a peça real vendida |
| WhatsApp | vários | número com DDD 67 e ateliê em Sorocaba (DDD 15): confirmar |
| Valores mínimos de encomenda | `catalog.json → encomendas.aPartirDeCentavos` | vazio; preencher "a partir de" ajuda a qualificar o orçamento |
