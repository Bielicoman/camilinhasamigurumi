---
name: higgsfield
description: "Workflow completo para gerar vídeos no Higgsfield com Seedance 2.0: criação de roteiro cinematográfico, prompt estruturado com sistema @referência, automação do browser para upload de referências, geração com máxima qualidade e download automático. Ativar quando o usuário mencionar: higgsfield, seedance, seedance 2, gerar vídeo higgsfield, seedance 2.0, video ia higgsfield, vídeo com referência."
allowed-tools: Bash, mcp__Claude_in_Chrome__navigate, mcp__Claude_in_Chrome__computer, mcp__Claude_in_Chrome__find, mcp__Claude_in_Chrome__get_page_text, mcp__Claude_in_Chrome__javascript_tool, mcp__Claude_in_Chrome__tabs_context_mcp, mcp__Claude_in_Chrome__tabs_create_mcp, mcp__Claude_in_Chrome__form_input, mcp__Claude_in_Chrome__file_upload, mcp__Claude_in_Chrome__upload_image, mcp__Claude_in_Chrome__read_page
---

# 🎬 Higgsfield Seedance 2.0 — Workflow Completo

Workflow de ponta a ponta para gerar vídeos de alta qualidade no Higgsfield usando Seedance 2.0.

## Plataforma

- **URL**: https://higgsfield.ai
- **Modelo principal**: Seedance 2.0 (o mais avançado disponível no Higgsfield)
- **Acesso**: Login com a conta existente do usuário
- **Interface**: Web (controlada via Chrome MCP)

---

## FASE 1 — ROTEIRO E PLANEJAMENTO

### Perguntas obrigatórias antes de gerar

Sempre pergunte ao usuário:

1. **Conceito**: O que você quer criar? (produto, curta, clipe, ad, conteúdo educacional, etc.)
2. **Duração**: Quantos segundos? (4–15s por clipe no Seedance 2.0)
3. **Referências disponíveis**:
   - Imagens de referência? (personagem, cena, produto, estilo visual)
   - Vídeo de referência? (para copiar câmera, transição, efeito, ritmo)
   - Áudio de referência? (trilha, voz, efeito sonoro)
4. **Orientação**: Vertical (9:16) / Horizontal (16:9) / Quadrado / Cinemascope (2.35:1)?
5. **Estilo visual**: Realista / Cinematográfico / Animação / Sci-fi / Fantasy / etc.
6. **Tom**: Épico / Tenso / Romântico / Humorístico / Documental / etc.

### Limites técnicos do Seedance 2.0

| Tipo | Quantidade | Formato | Tamanho máx |
|------|-----------|---------|-------------|
| Imagens | ≤ 9 | jpeg, png, webp, bmp, tiff, gif | 30 MB cada |
| Vídeos | ≤ 3 | mp4, mov | 50 MB cada, duração total 2–15s |
| Áudios | ≤ 3 | mp3, wav | 15 MB cada, duração ≤ 15s |
| **Total** | **≤ 12 arquivos** | — | — |

⚠️ **Proibido**: rostos humanos realistas em imagens/vídeos de referência (a plataforma bloqueia automaticamente)

---

## FASE 2 — CONSTRUÇÃO DO PROMPT SEEDANCE 2.0

### Sistema @ de Referências (CRÍTICO)

Sempre atribua uma função explícita a cada referência:

```
@Imagem1 como primeiro frame
@Imagem2 como último frame
@Imagem1's character as the subject
scene references @Imagem3
reference @Vídeo1's camera movement
reference @Vídeo1's action choreography
completely reference @Vídeo1's effects and transitions
video rhythm references @Vídeo1
BGM references @Áudio1
narration voice references @Vídeo1
wearing the outfit from @Imagem2
product details reference @Imagem3
```

### Estrutura Completa do Prompt

```
[Setup do Sujeito/Personagem] + [Cena/Ambiente] + [Descrição da Ação] +
[Movimento de Câmera] + [Breakdown Temporal] + [Transições/Efeitos] +
[Design de Áudio] + [Estilo/Mood] + [Modificadores de Qualidade]
```

### Breakdown Temporal (para vídeos ≥ 10s)

```
0–3s: [cena inicial, câmera, ação]
3–6s: [desenvolvimento]
6–10s: [clímax ou ação principal]
10–15s: [resolução, encerramento, branding]
```

---

## FASE 3 — REFERÊNCIA DE CÂMERA

### Movimentos Básicos
| Termo (EN) | Descrição |
|-----------|-----------|
| Push in / Slow push | Câmera avança em direção ao sujeito |
| Pull back / Pull away | Câmera recua |
| Pan left/right | Rotação horizontal |
| Tilt up/down | Rotação vertical |
| Track / Follow shot | Câmera segue o sujeito |
| Orbit / Revolve | Câmera circula em torno do sujeito |
| One-take / Oner | Plano sequência sem cortes |

### Técnicas Avançadas
| Termo (EN) | Descrição |
|-----------|-----------|
| Hitchcock zoom (dolly zoom) | Push in + zoom out — efeito de vertigem |
| Fisheye lens | Lente ultra-wide com distorção |
| Low angle / High angle | Câmera abaixo/acima do sujeito |
| Bird's eye / Overhead | Vista de cima |
| First-person POV | Câmera subjetiva |
| Whip pan | Pan ultra-rápido com motion blur |
| Crane shot | Movimento vertical como grua |

### Tamanhos de Plano
| Termo | Descrição |
|-------|-----------|
| Extreme close-up | Olhos, boca ou detalhe mínimo |
| Close-up | Rosto preenche o frame |
| Medium close-up | Cabeça e ombros |
| Medium shot | Cintura para cima |
| Full shot | Corpo inteiro |
| Wide / Establishing shot | Ambiente completo |

---

## FASE 4 — MODIFICADORES DE QUALIDADE MÁXIMA

Sempre adicionar ao final do prompt para resultado cinematográfico:

```
Cinematic quality, film grain, shallow depth of field, 2.35:1 widescreen, 24fps,
high dynamic range lighting, photorealistic rendering, ultra-detailed textures,
professional color grading, smooth motion with no stuttering or freezing.
```

---

## FASE 5 — AUTOMAÇÃO DO BROWSER (Higgsfield)

### Passo a passo no Higgsfield

```
1. Abrir: https://higgsfield.ai
2. Verificar login → se não logado: clicar "Sign In" e aguardar o usuário logar
3. Navegar para a ferramenta de geração de vídeo (Video Studio / Cinema Studio)
4. Selecionar modelo: Seedance 2.0
5. Configurar duração (4–15s)
6. Configurar orientação (vertical/horizontal)
7. Upload das referências (@Imagem1, @Vídeo1, etc.)
8. Inserir o prompt no campo de texto
9. Clicar "Generate"
10. Aguardar geração e fazer download
```

### Código de automação Chrome MCP

Ao executar no browser:

```javascript
// Verificar se está logado
const loginBtn = document.querySelector('[data-testid="login"], .login-btn, [href*="sign-in"]');
if (loginBtn) {
  // Não logado — pedir ao usuário para fazer login manualmente
  console.log('NOT_LOGGED_IN');
}
```

---

## FASE 6 — TEMPLATES PRONTOS

### Template: Anúncio de Produto (15s)
```
Reference @Vídeo1's editing style and camera transitions. Replace @Vídeo1's
product with @Imagem1 as the hero product. Create a 15-second product showcase.
0–3s: Product enters frame with dynamic rotation, close-up on surface texture and logo.
4–8s: Multiple angle transitions — front, side, back — with highlight scanning light.
9–12s: Product in lifestyle context showing usage scenario.
13–15s: Hero shot with brand tagline appearing, music builds to resolution.
Sound: Reference @Vídeo1's BGM. Add product interaction sound effects.
Cinematic quality, film grain, shallow depth of field, 24fps, ultra-detailed.
```

### Template: Consistência de Personagem
```
The character from @Imagem1 walks through [environment], [action description].
Close-up on face — [emotion]. [Camera movement] reveals [scene detail].
@Imagem2 as scene reference. Natural dialogue and movement throughout.
Cinematic quality, shallow depth of field, warm color grading.
```

### Template: Replicar Câmera de Vídeo Referência
```
Reference @Imagem1's character in @Imagem2's setting.
Completely reference @Vídeo1's camera movements and protagonist's expressions.
[Hitchcock zoom / orbit / follow] during [key moment].
Exterior scene references @Imagem3.
Cinematic quality, 24fps, film grain.
```

### Template: Extensão de Vídeo
```
Extend @Vídeo1 by [X] seconds.
1–[X/3]s: [continuação natural da cena]
[X/3]–[2X/3]s: [desenvolvimento]
[2X/3]–[X]s: [encerramento, texto/branding se necessário]
Match color grade and audio tone of original.
```

### Template: Clipe Musical com Batidas (15s)
```
@Imagem1 @Imagem2 @Imagem3 @Imagem4 @Imagem5 @Imagem6 — match the
keyframe positions and overall rhythm of @Vídeo1 for beat-synced cuts.
Dynamic movement throughout. Dreamlike visual style with strong tension.
Adjust shot sizes with lighting changes matching music rhythm.
@Áudio1 as background music reference.
```

### Template: Curta Drama (15s)
```
Scene (0–5s): [descrição emocional, câmera, ação]
Dialogue 1 ([Personagem A], [tom emocional]): "[fala]"
Scene (6–10s): [reação, câmera]
Dialogue 2 ([Personagem B], [tom]): "[fala]"
Scene (11–15s): [resolução emocional, câmera final]
Sound: [música + efeitos sonoros específicos]
Duration: Precise 15 seconds, every frame tight, no filler.
```

### Template: Efeitos Criativos / Transformação
```
@Imagem1 as the first frame. Character [ação inicial].
Completely reference @Vídeo1's effects and transitions — [descrever efeito específico].
Transition through [elemento visual] into @Imagem2's world.
[Continuação cinematográfica].
@Áudio1 as background music. Cinematic quality.
```

---

## FASE 7 — ERROS COMUNS A EVITAR

1. **Referências vagas**: Nunca diga apenas "reference @Vídeo1" — especifique O QUÊ referenciar (câmera? ação? efeito? ritmo?)
2. **Instruções conflitantes**: Não peça "câmera estática" e "orbiting shot" no mesmo segmento
3. **Sobrecarga temporal**: Não tente colocar muitas cenas em 4–5 segundos
4. **@ sem função**: Se subir 5 imagens, cada uma deve ter função definida
5. **Ignorar áudio**: Design de som melhora dramaticamente o resultado
6. **Duração incorreta**: Alinhe a complexidade do prompt com a duração selecionada
7. **Rostos reais**: A plataforma bloqueia automaticamente

---

## FLUXO DE TRABALHO COMPLETO

```
USUÁRIO descreve ideia
    ↓
CLAUDE faz 5–6 perguntas estratégicas
    ↓
CLAUDE cria roteiro estruturado (breakdown por segundos)
    ↓
CLAUDE gera prompt Seedance 2.0 completo com:
  - Sistema @ para cada referência
  - Linguagem de câmera precisa
  - Design de áudio detalhado
  - Modificadores de qualidade máxima
    ↓
CLAUDE abre https://higgsfield.ai no Chrome
    ↓
CLAUDE verifica login → usuário loga se necessário
    ↓
CLAUDE seleciona Seedance 2.0 + configura parâmetros
    ↓
CLAUDE faz upload das referências
    ↓
CLAUDE insere o prompt e clica Generate
    ↓
CLAUDE aguarda e faz download do resultado
```

---

## NOTAS DE QUALIDADE MÁXIMA

- Sempre usar **Seedance 2.0** (não versões anteriores)
- Duração máxima: **15 segundos** por geração (mais detalhado = melhor qualidade)
- Sempre incluir modificadores de qualidade cinematográfica no final
- Para personagens consistentes: usar **múltiplas imagens de referência** do mesmo personagem em ângulos diferentes
- Para câmera precisa: **sempre ter vídeo de referência** para movimentos complexos
- Para beat-sync: **sempre enviar o áudio** como @Áudio1
- Qualidade de resolução: Higgsfield usa **720p** para Seedance 2.0 (máximo disponível)
