# Design system

A identidade parte do logotipo que já existe no Instagram: a **bonequinha de cabelo cacheado, vestido amarelo e novelos vermelhos sobre fundo azul-claro**. O logo não foi redesenhado; o site usa o arquivo oficial (`public/assets/img/brand/logo-camilinhas.webp`) e o wordmark manuscrito "Camilinhas" recolorido em cacau e creme.

O segundo eixo é o **pixel**: o ateliê agora faz retrato em crochê e o perfil se apresenta como "Amigurumi & Pixel Crochê". Ele aparece em detalhes — micro-rótulos em fonte pixel, o coração 9×8 pontos (o mesmo desenho do ícone do app Ponto a Ponto), a grade pontilhada do hero e a grade neon da seção Retrato.

## Cor

| Token | Hex | De onde vem | Uso |
|---|---|---|---|
| `--creme` | `#fff8ee` | papel | fundo geral |
| `--linho` | `#f6ecdc` | tecido cru | fundos secundários, placeholders de foto |
| `--ceu` | `#dceef4` | fundo do logo | seção de encomendas, páginas simples |
| `--girassol` | `#f5c443` | vestido | selos, destaques, contadores |
| `--novelo-escuro` | `#b3352c` | novelos | botão primário, ênfase em títulos |
| `--novelo` | `#d9473d` | novelos | hover do botão, coração pixel |
| `--cacau` | `#3a2117` | cabelo | texto, rodapé, botão escuro |
| `--cacau-2` | `#6b4a3a` | — | texto secundário |
| `--neon` | `#c6f432` | linha neon do pixel crochê da Camila | só na seção Retrato em Crochê |
| `--sucesso` | `#2f7d4f` | — | preço Pix, confirmações |
| `--noite` / `--noite-2` | `#1d140f` / `#2c1f17` | — | fundo da seção Retrato em Crochê |
| `--borda-campo` | `#a88d78` | — | contorno de campos, filtros e opções (3:1 sobre branco) |
| `--borda` | `#e5d5bd` | — | só divisórias, nunca contorno de controle |

Estados de hover têm token próprio (`--novelo-hover`, `--cacau-hover`, `--girassol-hover`, `--neon-hover`). Nenhuma cor solta no CSS: tudo passa pelo `:root`.

**Neon é exclusivo do Retrato em Crochê.** Vem da linha verde neon que a Camila usa no pixel crochê; fora daquela seção (e do selo "novo" no menu) não aparece.

Contraste (WCAG 2.2): cacau sobre creme 15,1:1 · cacau-2 sobre creme 8,0:1 · creme sobre novelo-escuro 5,6:1 · creme sobre novelo-hover 4,9:1 · cacau sobre girassol 9,9:1 · cacau sobre neon 13,4:1 · sucesso sobre creme 5,1:1. O vermelho mais claro (`--novelo`) não é usado como fundo de texto pequeno.

## Tipografia

| Papel | Fonte | Por quê |
|---|---|---|
| Títulos | **Fraunces** (eixo SOFT 100) | serifa macia e arredondada, conversa com o fio e com o app Ponto a Ponto, que usa a mesma família |
| Texto e interface | **Bricolage Grotesque** | grotesca com personalidade, legível em corpo pequeno |
| Micro-rótulos | **Silkscreen** | fonte pixel; só em rótulos curtos e caixa-alta, sempre em **8 px ou 16 px** (a fonte é desenhada em grade de 8; outros tamanhos borram) |

Itálico do Fraunces em vermelho marca a palavra-chave de cada título ("*ponto a ponto*", "*tecida em crochê*"). Uma por título, no máximo. Fontes auto-hospedadas em `public/assets/fonts/` (subconjunto latino, ~150 KB no total).

Escala fluida em `--t-xs` … `--t-3xl` (clamp), espaçamentos `--s-1` … `--s-9`, raios `--raio-s/m/l/xl`.

## Assinaturas visuais

- **Costura**: borda tracejada (`--costura`) dentro das fotos de produto e nos cartões de "como funciona" — lembra o alinhavo.
- **Arco**: a foto do hero e o retrato da Camila usam topo em arco, como janela de vitrine.
- **Faixa**: tira cacau com borda girassol, levemente inclinada, rolando as linhas do ateliê.
- **Babado**: as bordas superior e inferior da seção de encomendas têm recorte em meia-lua, como barrado de crochê.

## Componentes

`btn` (primário vermelho, `--claro`, `--girassol`, `--cacau`, `--neon`, `--pequeno`, `--bloco`), `card` de produto, `tipo` de encomenda, `opcao` (rádio em cartão, para entrega e pagamento), `campo`, `qtd`, `resumo`, `modal-produto`, `gaveta` (sacola/checkout em `<dialog>`), `toast`, `cartao` (páginas simples).

Todos os diálogos usam `<dialog>` nativo: foco preso, `Esc` fecha, clique fora fecha. Na sacola, o foco volta ao botão equivalente depois de mudar quantidade ou remover. O aviso "na sacola" fica 8 s e pausa com foco ou ponteiro. Transformações de hover só em dispositivos com ponteiro (`@media (hover: hover)`). Alvos de toque com no mínimo 40–44 px. No celular, o botão "Adicionar" do produto fica fixo no rodapé do modal e há um menu de seções rolável abaixo do cabeçalho.

Selo "Destaque" em no máximo duas peças: se tudo é destaque, nada é.

## Movimento

Entrada dos cards com atraso escalonado, selos flutuando no hero, faixa rolando, zoom suave na foto ao passar o mouse. Tudo respeita `prefers-reduced-motion`.

## Fotografia de produto

Regra do ateliê: **a foto mostra a peça que o cliente recebe.** Fundo neutro e quente (madeira, linho, creme), luz lateral suave, peça ocupando ~70% do quadro, formato quadrado 1:1 com no mínimo 1200 px. Sem texto sobre a foto (o Instagram usa texto; a loja não). Ver as pendências de fotos em `MARKETING.md`.
