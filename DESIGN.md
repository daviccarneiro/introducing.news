# DESIGN.md — introducing.news

> Guia de marca, estilo e assets para pessoas e **agentes de IA**. Este arquivo traduz o design do site para uso em telas, conteúdo, e-mails e **geração de imagens**.
>
> Fontes de verdade: `src/styles/tokens.css` (código), `design/tokens.json` (tokens legíveis por máquina) e o arquivo Figma **"introducing.news — Design"** (páginas Fundações, Componentes e Telas). Em caso de divergência, o código e o `tokens.css` vencem.

## 1. A marca

- **O que é**: newsletter semanal em português sobre tecnologia — novos modelos de IA, ferramentas recém-lançadas e as discussões da área — com curadoria de profissionais de tecnologia e de pesquisadores que testam e checam cada informação.
- **Promessa**: ficar em dia com tecnologia sem passar horas pesquisando. Sem hype, sem review patrocinado, sem ruído.
- **Personalidade**: editorial, precisa, sóbria e direta. "Minimalismo editorial com precisão técnica."
- **Voz**: frases curtas, em pt-BR, sem exclamações e sem jargão de marketing. Fala de igual para igual com quem trabalha com tecnologia.
- **Cadência**: toda segunda-feira, às 07:45 (horário de Brasília).
- **Palavras-chave visuais**: grade técnica, órbitas, arcos, sinal, traço fino, muito espaço negativo, um único acento laranja.

## 2. Logotipo

Lockup horizontal: **estrela (sparkle)** + wordmark **introducing.news**, na fonte Inter SemiBold, com a parte ".news" em cinza (não é ruído: é a assinatura).

| Asset | Arquivo local | URL pública | Uso |
| --- | --- | --- | --- |
| Logo (fundo claro) | `public/brand/logo.svg` · `public/brand/logo.png` (712×88) | `/brand/logo.svg` · `/brand/logo.png` | Site, mídia, apresentações |
| Logo (fundo escuro) | `public/brand/logo-dark.svg` | `/brand/logo-dark.svg` | Sobre ink-950/preto |
| Ícone/estrela | `public/brand/icon.svg` · `public/brand/icon.png` (512) | `/brand/icon.svg` · `/brand/icon.png` | Favicon, avatar, e-mail |
| Wordmark em uso | `public/icons/sparkle.svg` + Inter 600 18px | — | Cabeçalho/rodapé do site e e-mail |

**Construção** (site): estrela 20×20 + 8px de respiro + wordmark **Inter SemiBold 18/1** com `letter-spacing: -0.01em`; "introducing" em `--foreground` e ".news" em `--muted-foreground`. A estrela é a forma do `public/favicon.svg` (traço 2,5, laranja `#F6821F`).

**Regras**
- Área de proteção: a altura da estrela (≈20px) em todos os lados.
- Largura mínima do lockup: 120px. Abaixo disso, use apenas a estrela.
- Sobre fundo escuro, troque os textos para branco/`ink-400` (arquivo `logo-dark.svg`).
- Não rotacione, não aplique sombras/gradientes, não altere cores fora da paleta, não estique, não coloque sobre fotos ou imagens com contraste baixo, não escreva "Introducing News" sem o domínio.

## 3. Cor

Paleta enxuta: neutros **Ink**, um **Paper** branco e **Accent** laranja. Nada além disso.

**Primitivas**

| Token | Hex | Nota |
| --- | --- | --- |
| `paper` | `#FFFFFF` | branco puro |
| `ink/50` | `#F9F9FB` | cinza de fundo |
| `ink/100` | `#F2F2F5` | |
| `ink/200` | `#E4E4E9` | bordas |
| `ink/300` | `#C9C9D1` | bordas fortes |
| `ink/400` | `#9A9AA4` | texto inativo |
| `ink/500` | `#6B6B76` | texto secundário |
| `ink/600` | `#4B4B55` | |
| `ink/700` | `#33333A` | |
| `ink/800` | `#1F1F23` | traços em fundo escuro |
| `ink/900` | `#141417` | |
| `ink/950` | `#0B0B0C` | texto principal / fundo escuro |
| `accent/50` | `#FFF6ED` | fundo suave de acento |
| `accent/100` | `#FDEBD7` | seleção de texto |
| `accent/500` | `#F6821F` | **acento da marca** |
| `accent/600` | `#E06C0F` | hover do acento |
| `accent/700` | `#A63E0A` | links no texto |

**Semânticas** (o que usar no dia a dia)

| Token | Valor | Onde |
| --- | --- | --- |
| `background` | `#FFFFFF` | fundo de página |
| `foreground` | `#0B0B0C` | texto principal |
| `card` | `#FFFFFF` | cartões e campos |
| `muted` | `#F9F9FB` | faixas, blocos de destaque |
| `muted-foreground` | `#6B6B76` | texto secundário/metadados |
| `border` | `#E4E4E9` | bordas/divisores |
| `border-strong` | `#C9C9D1` | hover/foco de controles |
| `accent` | `#F6821F` | CTA e realces |
| `accent-foreground` | `#0B0B0C` | texto sobre o laranja |
| `accent-soft` | `#FFF6ED` | avatar/selos |
| `accent-soft-foreground` | `#A63E0A` | texto de acento sobre claro |
| `link` | `#A63E0A` | links |
| `ring` | `#0B0B0C` | foco visível |
| `code-bg` / `code-fg` | `#0B0B0C` / `#F2F2F5` | código |

**Regras de cor**
- O laranja é o **único** acento. Use em 1–2 elementos por tela (um CTA + um detalhe, por exemplo).
- Texto sobre laranja é sempre `ink-950` (preto). **Nunca** branco sobre laranja.
- Sem gradientes, sem cores fora da tabela, sem sombras coloridas.
- Fundos: branco nas páginas; `muted` nas faixas; `ink-950` em capas/imagens escuras.

## 4. Tipografia

| Família | Papel | Arquivo local | Pesos usados |
| --- | --- | --- | --- |
| **Source Serif 4** | Títulos e leitura longa | `design/fonts/SourceSerif4[opsz,wght].ttf` (+ itálico) | 400, 600, itálico 400 |
| **Geist** | Interface e textos curtos | `design/fonts/Geist[wght].ttf` | 400, 500, 600 |
| **JetBrains Mono** | Rótulos, datas, rodapé | `design/fonts/JetBrainsMono[wght].ttf` | 400, 500 |
| **Geist Mono** | Código | `design/fonts/GeistMono[wght].ttf` | 400 |
| **Inter** | Apenas o logotipo | `design/fonts/Inter[opsz,wght].ttf` | 600 |

Licenças OFL em `design/fonts/` (ver `README.md` da pasta). No site, as fontes vêm do Google Fonts (link em `src/layouts/Base.astro`).

**Escala** (nomes iguais aos estilos do Figma — "Fundações → Escala tipográfica")

| Estilo | Fonte | Tamanho/peso | Entrelinha | Uso típico |
| --- | --- | --- | --- | --- |
| `Display/XL` | Serif | 64 / 600 | 1.05 · -1,5% | H1 da home (`clamp(40px, 5.5vw, 64px)`) |
| `Display/LG` | Serif | 56 / 600 | 1.08 · -1,5% | títulos grandes de apoio |
| `Display/MD` | Serif | 44 / 600 | 1.12 · -1,5% | H1 de post/arquivo (`clamp(32px, 4.5vw, 44px)`) |
| `Heading/H1` | Serif | 40 / 600 | 1.15 · -1,5% | títulos intermediários |
| `Heading/H2` | Serif | 28 / 600 | 1.22 · -1% | seções ("Última edição", "Perguntas frequentes") |
| `Heading/H3` | Serif | 21 / 600 | 1.3 · -0,5% | cartões e subtítulos |
| `Heading/H4` | Geist | 17 / 500 | 1.4 | pergunta do FAQ, nome do autor |
| `Body/Serif-LG` | Serif | 21 / 400 | 1.65 | lead do destaque |
| `Body/Serif` | Serif | 18 / 400 | 1.75 | corpo do artigo |
| `Quote/Serif` | Serif itálico | 24 / 400 | 1.5 · -0,5% | citação (barra laranja à esquerda) |
| `Body/Sans` | Geist | 16 / 400 | 1.6 | interface e subtítulos |
| `Body/Sans-SM` | Geist | 14 / 400 | 1.5 | resumos de cartões |
| `Body/Sans-XS` | Geist | 13 / 400 | 1.45 | consentimento |
| `Meta/Sans` | Geist | 13 / 400 | 1.4 | datas e metadados |
| `Label/Mono` | JetBrains Mono | 11 / 500 · +8% · CAIXA ALTA | 1.4 | "EDIÇÃO #1", "COMPARTILHE" |
| `Code/Mono` | Geist Mono | 14 / 400 | 1.7 | código |
| `Button/Sans` | Geist | 14 / 500 (lg: 15) | 1.4 | botões |
| `Nav/Sans` | Geist | 14 / 500 | 1 | navegação |
| `Footer/Mono` | JetBrains Mono | 13 / 400 | 1.4 | links e © do rodapé |
| Logo | Inter | 18 / 600 | 1 · -1% | wordmark |

**Regras**: serif só em títulos e leitura; Geist em UI; mono em metadados/numerais; Inter só no logo. Não invente pesos (700/800) nem itálicos fora de citações.

## 5. Espaço, raio, sombra, layout

- **Espaço** (px): `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128`.
- **Raio**: `xs 4 · sm 6 · md 8 · lg 12 · xl 16 · full 9999`.
- **Sombras**:
  - `xs`: `0 1px 2px rgb(9 9 11 / .05)`
  - `sm`: `0 1px 3px rgb(9 9 11 / .06), 0 1px 2px rgb(9 9 11 / .04)`
  - `md`: `0 4px 12px rgb(9 9 11 / .08), 0 1px 2px rgb(9 9 11 / .04)`
- **Layout**: container de 1440px com padding lateral 24px (mobile), 48px (≥768px) e 128px (≥1280px); largura de leitura 720px; cabeçalho 72px; controles 40/48px (inputs 44px); capas em 16:9 (1200×675).

## 6. Iconografia e grafismos

Ícones desenhados em grade 24px, traço 2px, cantos arredondados (links para os SVGs em `public/icons/`): `sparkle` (20, laranja — marca), `mail` (18, ink-400 — formulário), `clock` (14, ink-400 — tempo de leitura), `arrow-right` (16/20, ink-950), `arrow-right-accent` (branco — uso pontual), `linkedin` (16, ink-950 a 65%), `linkedin-share`, `whatsapp` e `x` (18, ink-500 — compartilhar), `rss` (18, ink-500).

Grafismos da marca:
- **Estrela/sparkle**: `public/brand/icon.svg` — assinatura da marca; aparece no logo, no herói do e-mail e como selo.
- **Marca-texto (highlight)**: `public/images/highlight.svg` — faixa laranja levemente torta (−1,2°) aplicada **apenas** sobre "sem exagero." no H1 da home, com animação de "pincelada".

## 7. Imagens e capas (direção de arte para IA)

As imagens da marca são **abstratas e geométricas**, nunca fotográficas. Elas parecem recortes de um caderno de engenharia: grades, órbitas, arcos e linhas de sinal, com um único ponto laranja.

**Regras**
- Proporção 16:9 (1200×675 para o site; 2400×1350 para impressão). OG/redes: 1200×630 (o arquivo padrão é `public/images/og-default.png`).
- Dois fundos possíveis: escuro `#0B0B0C` (padrão) ou claro `#F9F9FB`.
- Traços finos (1–2px) em cinzas `#1F1F23`, `#33333A`, `#4B4B55` (escuro) ou `#C9C9D1`, `#E4E4E9` (claro).
- Exatamente **1–2 elementos laranja** `#F6821F` (um traço, um ponto, uma órbita). Nada mais colorido.
- Muito espaço negativo; composição assimétrica; sem enquadramento centralizado "de banco de imagens".
- **Sem texto** dentro da imagem, sem logos de terceiros, sem molduras ou marcas d'água.

**Evite (negative prompt)**: robôs, cérebros, engrenagens, circuitos neon, código verde de Matrix, hologramas, cidades futuristas, 3D brilhante, ícones de lâmpada, pessoas, mãos, apertos de mão, reuniões, fotos de stock, gradientes coloridos, arco-íris, estética "cyberpunk".

**As três figuras oficiais** (use ou derive delas; SVG em `public/brand/`, mesmas formas em `src/components/Cover.astro`):
- `fig-01 — grade + órbita`: fundo `#0B0B0C`, grade fina de 3×2 colunas, uma órbita laranja com um ponto no centro (à direita), cruzetas e um ponto cinza. (Capa padrão do site e OG.)
- `fig-02 — arcos`: fundo `#F9F9FB`, três arcos concêntricos cinza à direita com ponto central, uma diagonal e uma estrela laranja à esquerda.
- `fig-03 — sinal`: fundo `#0B0B0C`, três linhas onduladas de sinal em cinzas diferentes, um ponto laranja brilhante à direita e um ponto cinza pequeno.

**Prompts prontos** (para geradores de imagem; resultado deve ser reaproveitável como capa):

1. *Grade e órbita*: "Minimal editorial abstract tech cover, pure #0B0B0C background, thin 1px technical grid lines in #1F1F23, one large geometric circle outline in #F6821F, a single orange dot at its center, asymmetric composition, generous negative space, flat vector aesthetic, no text, no gradients, 16:9".
2. *Arcos concêntricos claros*: "Minimal editorial abstract tech cover, #F9F9FB background, three concentric thin gray circles (#C9C9D1) with a small black dot at the center, one thin diagonal line, a small four-pointed orange star outline (#F6821F) on the left, lots of white space, flat vector aesthetic, no text, no photos, 16:9".
3. *Sinal*: "Minimal editorial abstract tech cover, #0B0B0C background, three horizontal overlapping sine-wave lines in dark grays (#1F1F23, #33333A, #4B4B55), one glowing orange dot (#F6821F) offset to the top right, one tiny gray dot, flat vector aesthetic, quiet and precise, no text, no 3D, 16:9".
4. *Sem capa própria*: se a edição não tiver imagem, use as figuras `fig-01/02/03` (elas já são o padrão). Não gere pessoas nem cenas.

**Não use** imagens geradas para simular capturas de tela, pessoas reais ou marcas.

## 8. Componentes do site

No Figma: página **Componentes** → `Biblioteca de Componentes` (primitivas: ícones, grafismos, Button, Input, Consentimento, Avatar) e `Biblioteca B — Site` (componentes compostos). No código, cada componente Astro vive em `src/components/` e as views em `src/views/`.

| Componente | Variantes/estados | Onde |
| --- | --- | --- |
| `Button` | `accent` (CTA laranja, 40/48px), `secondary` (contorno), `submit` (48px, ready/disabled) e `*-hover` | Figma + `SiteHeader`, home, rodapé e formulários |
| `Input` (e-mail) | `default`/`focus`; 320×44px, ícone `mail`, foco com borda `ring` | `SubscribeForm.astro` |
| `ConsentCheckbox` | `unchecked`/`checked`; 16px, raio 4 | `SubscribeForm.astro` |
| `SubscribeForm` | `layout=default` (320+48) / `layout=compact` (260+40); `state=success` | Home, post, arquivo |
| `Cover` / `PostCover` | `fig-01`/`fig-02`/`fig-03` (16:9) ou imagem enviada pelo CMS | `Cover.astro` |
| `PostCard` | cartão 384px com capa, data, título e tempo de leitura | Home (continue lendo), arquivo |
| `PostCardFeatured` | destaque 1200px: título, lead, byline e link | Home |
| `PostRow` | `default`/`hover`; 56px, data + título + resumo + seta | Arquivo |
| `FaqItem` | `closed`/`open` | Home |
| `AuthorByline` | avatar (foto ou iniciais) + nome + LinkedIn + tempo | Post e destaque |
| `ShareGroup` | rótulo "COMPARTILHE" + WhatsApp, LinkedIn, X | Post |
| `SubscribeBand` | `layout=archive` (raio 16, H2) / `layout=post` (raio 12, H3) | Arquivo e post |
| `SiteHeader` / `SiteFooter` | 72px / 4 colunas; bordas `border` | Todas as páginas |

**Regras de interação**: botão laranja só para a ação principal da tela; hover do accent escurece para `accent/600` com `shadow-sm`; o botão do formulário fica cinza (`ink/200` sobre `ink/600`) até o e-mail ser válido; foco visível sempre com `ring` de 2px.

## 9. E-mail

- Layout em tabelas, CSS inline e fontes de sistema (`scripts/email-template.mjs`) — não reaproveita o HTML do site.
- Largura 560px; fundo `#F9F9FB`; cartão branco com borda `#E4E4E9` e raio 16.
- Logo em PNG (`/images/brand/sparkle.png`, porque clientes de e-mail não renderizam SVG) + wordmark em Inter 600 com fallback.
- Data em mono laranja-escuro (`#A63E0A`), título em Source Serif 600 e lead em serif cinza.
- CTA: botão laranja `#F6821F` com texto `#0B0B0C` (com fallback VML no Outlook).
- Assinatura: foto (ou iniciais em `accent-soft`) + nome + cargo de quem assina a edição.
- Rodapé: estrela + "introducing.news", aviso de inscrição e link "cancelar inscrição" (para `/descadastrar`).

## 10. Assets prontos para uso (IA)

| Asset | Arquivo local | URL pública |
| --- | --- | --- |
| Logo (claro/escuro) | `public/brand/logo.svg` · `logo-dark.svg` · `logo.png` | `https://introducing.news/brand/logo.svg` (+ `-dark`, `.png`) |
| Ícone/estrela | `public/brand/icon.svg` · `icon.png` | `https://introducing.news/brand/icon.svg` · `/brand/icon.png` |
| Favicon | `public/favicon.svg` | `https://introducing.news/favicon.svg` |
| Capas | `public/brand/cover-fig-01.svg` · `.png` (idem 02, 03) | `https://introducing.news/brand/cover-fig-01.png` |
| Marca-texto | `public/images/highlight.svg` | `https://introducing.news/images/highlight.svg` |
| Ícones de UI | `public/icons/*.svg` | `https://introducing.news/icons/<nome>.svg` |
| OG padrão | `public/images/og-default.png` (1200×630) | `https://introducing.news/images/og-default.png` |
| Fontes | `design/fonts/*.ttf` (+ OFL) | não publicadas — usar do repositório |
| Tokens | `design/tokens.json` · `src/styles/tokens.css` | não publicado (usar do repositório) |

> Obs.: `design/` não entra no site; use os caminhos locais. Para ferramentas que só acessam URLs, prefira os assets de `public/`.

## 11. Não faça

- Não use cores, fontes ou raios fora deste guia.
- Não use o laranja em mais de 1–2 elementos por tela; nunca como fundo de grandes áreas (exceto o logo).
- Não escreva texto dentro de imagens geradas; a tipografia é sempre aplicada em HTML/Figma.
- Não use fotos de pessoas ou clichês de IA nas capas; a marca é abstrata.
- Não altere o logotipo (cores, proporções, tipografia) nem o use sem a estrela no lockup horizontal.
- Não reintroduza elementos de versões antigas do design (badges/tags nas capas, "rabiscos" estilo Notion, selo "IA", LinkedIn no rodapé): o site atual não os usa.
- Este repositório é público: nunca coloque segredos, tokens ou dados de assinantes em assets, exemplos ou prompts.
