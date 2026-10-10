# EDITORIAL.md — introducing.news

> Guia de pesquisa, voz e estrutura das edições, para pessoas e **agentes de IA**. Complementa o `DESIGN.md` (marca e visual) e o `AGENTS.md` (técnica). Modelo de referência: a edição `a-ia-saiu-do-chat` (página em `src/content/posts/`, e-mail em `src/content/emails/obrigado-por-estar-aqui.mdx`).

## 1. Para quem escrevemos

- **Leitor principal**: quem usa tecnologia e IA no trabalho sem ser especialista. Gente de marketing, direito, RH, finanças, vendas, educação, gestão. Também programadores, que gostam de contexto bem feito.
- **O que essa pessoa quer**: entender o que mudou na semana, por que importa para ela e o que fazer com isso, sem precisar ler dez sites em inglês.
- **Multidisciplinar no texto inteiro, não em seções.** Não crie seções por profissão ("Para quem é de marketing", "Para quem é de direito"). Cada seção precisa funcionar para todo mundo: os exemplos práticos misturam áreas no mesmo parágrafo ("a coordenação de marketing acompanha a campanha, o financeiro olha o caixa, o RH vê as contratações"). Uma pessoa de marketing tem que gostar da edição inteira, não só de um trecho.
- **Funcionalidade antes de modelo.** O que o leitor pode usar (um recurso novo no Claude, no ChatGPT, no Gemini, no Gmail) vem antes e ganha mais espaço do que o modelo por trás dele. Modelos entram "sem tecniquês", com comparativos e gráficos que provam o que se diz.
- **Teste de cada parágrafo**: "alguém de marketing, do jurídico ou do RH entende isso sem abrir outra aba e enxerga um uso no próprio trabalho?" Se não, explique o termo numa frase, troque o exemplo ou corte.

## 2. Processo de pesquisa

### 2.1 Janela e pauta

1. **Janela**: da segunda anterior até o domingo antes do envio. Um assunto mais antigo pode entrar se ainda for relevante, mas com a data certa no texto ("saiu em 22 de setembro"), nunca como se fosse da semana.
2. **Pauta fixa** (buscar todas as semanas, nesta ordem de prioridade):
   - **funcionalidades novas** que qualquer pessoa pode usar: recursos do Claude, ChatGPT, Gemini, Copilot, Google Workspace, Microsoft 365, Notion, Canva e apps do dia a dia (ex.: Claude Dashboards, Intelligent UI do GPT-6, agente do Gemini). Confira plano (grátis ou pago), disponibilidade no Brasil e se está em teste;
   - lançamentos de modelos (Anthropic, OpenAI, Google, Meta, xAI, DeepSeek, Alibaba/Qwen, Moonshot/Kimi, Mistral), com destaque para o que muda no plano gratuito;
   - o que viralizou entre programadores, explicado para quem não programa (ex.: Jev);
   - regras, golpes e responsabilidade no Brasil (Marco Legal da IA, ANPD/LGPD, Senacon, OAB, CNJ, Conar), contados de um jeito que sirva para qualquer área;
   - anúncios, plataformas, busca e imagem/vídeo gerados por IA;
   - eventos e prazos dos próximos 60 dias.
3. **Pauta pedida pelo mantenedor**: entra sempre, mesmo que precise de contexto (ex.: um modelo lançado há algumas semanas). Se um nome vier ambíguo (ex.: "JEV"), pesquise antes de perguntar; se continuar ambíguo, pergunte.

### 2.2 Como buscar

- Comece com buscas amplas por semana ("AI news this week <mês> <ano>", "inteligência artificial notícias semana <mês> <ano>") e depois uma busca específica por item.
- Para cada item, procure **a fonte primária** (blog oficial, página do modelo, documentação de preços, portaria no gov.br, decisão no tribunal) e **uma fonte independente** (imprensa de tecnologia, análise de especialista).
- Fontes que funcionaram bem:
  - **Primárias**: páginas de modelos e de preços (`anthropic.com/claude/*`, `api-docs.deepseek.com/quick_start/pricing`), relatórios técnicos no arXiv, `gov.br`.
  - **Funcionalidades**: anúncios oficiais (blogs e newsrooms da Anthropic, OpenAI, Google, Microsoft) e cobertura da Reuters e do Unite.AI; confira plano, país e status (teste ou geral).
  - **Benchmarks independentes**: Artificial Analysis (`artificialanalysis.ai/leaderboards/models`), com data de consulta.
  - **Análise técnica confiável**: Simon Willison, VentureBeat, SiliconANGLE.
  - **Brasil**: Conjur e Migalhas (direito), TechTudo e InfoMoney (consumo), CNN Brasil, Agência Pública, sites dos ministérios.
  - **Opinião crítica**: posts longos com testes próprios (ex.: o blog do Fabio Akita sobre o Jev). Registre conflitos de interesse declarados pelo autor.
- **Agregadores** (sites de "AI news", comparadores de preço, revendas de API) servem para descobrir pauta, nunca como fonte única de um número.

### 2.3 Como checar

- **Todo número tem duas origens** ou uma origem primária. Se as fontes divergem (datas, nomes de modelo, preços), use a primária e, se a divergência for relevante, diga no texto.
- **Separe o que é da empresa do que é independente.** Benchmarks divulgados pela fabricante sempre levam "segundo a empresa" ou "números divulgados pela própria empresa".
- **Extração de tabelas**: ao ler tabelas de páginas (benchmarks, preços), extraia duas vezes de formas diferentes e compare. Ferramentas de leitura de página resumem e podem errar.
- **Nomes mudam rápido** (ex.: GPT-6 Sol no ChatGPT e GPT-6.1 Sol no ranking). Use o nome da fonte do dado que você está citando.
- **Datas**: converta "quarta-feira" em data e confira o dia da semana. Horários de serviços estrangeiros vão para o horário de Brasília (ex.: pico da DeepSeek em UTC virou "22h à 1h e 3h às 7h").
- **O que não deu para confirmar fica de fora** ou entra com a ressalva explícita. Melhor uma edição menor do que um erro.
- **Privacidade e LGPD**: ao recomendar uma ferramenta, diga onde os dados são processados e se o contrato cita a LGPD.

### 2.4 O ângulo de cada notícia

Para cada item, responda nesta ordem:

1. **O que é** (uma ou duas frases, sem jargão).
2. **Por que importa** (dinheiro, tempo, risco, oportunidade).
3. **O que isso muda para você**, com exemplos de áreas diferentes no mesmo parágrafo (marketing, jurídico, RH, financeiro, vendas, educação, código).
4. **Um aviso honesto / Onde ter cuidado** (limites, números da própria empresa, privacidade).

Procure um **fio condutor** da semana para o título (na edição de referência: "a IA saiu do chat"), que amarre os destaques.

## 3. Estrutura da edição (página no site)

Coleção **Edições** (`src/content/posts/<slug>.mdx`). Ordem que funcionou:

1. **Abertura** (2 a 3 parágrafos curtos, em primeira pessoa): recado ao leitor e o fio condutor da semana. Termine com uma frase de transição curta ("Bora ver o que já dá para usar.").
2. **Em 30 segundos**: 5 a 6 bullets, cada um com a frase-chave em negrito.
3. **Funcionalidades** (2 a 3 seções `##`): o que dá para usar, em que plano e o que muda no trabalho, com o ângulo da seção 2.4. Use os rótulos em negrito no começo do parágrafo: **O que isso muda para você.**, **O que você precisa saber antes.**, **Um aviso honesto.**, **Onde ter cuidado.**
4. **Os modelos, sem tecniquês**: lançamentos explicados pelo que permitem fazer; tabela de benchmark com a coluna "O que mede, em português claro".
5. **O assunto que viralizou** (quando houver), explicado com exemplos de várias áreas e com as críticas.
6. **Comparativo** (quando houver dado): gráfico + tabela com os mesmos números + "Como usar esse placar".
7. **Minha recomendação**: uma ferramenta ou modelo que o mantenedor usa de verdade, em primeira pessoa, com três motivos em bullets, "Como eu uso" e "O cuidado que eu tomo".
8. **Golpes, regras e responsabilidade**: 2 a 3 bullets sobre regulação, golpes e uso responsável, cada um com a consequência para quem consome e para quem trabalha com aquilo.
9. **Datas para anotar**: data em negrito, nome, lugar e uma frase do porquê (eventos, prazos de regras, mudanças de produto).
10. **Fechamento**: o que vem nas próximas edições + convite para responder o e-mail + "Até segunda que vem."
11. **Fontes**: lista com veículo e link, na ordem em que aparecem.

Não use seções separadas por profissão: o leitor de qualquer área precisa encontrar exemplos para si ao longo de todo o texto.

Frontmatter: `number` é a última edição + 1 (a #0 é a introdução do projeto; as semanais começam na #1); `title` com o fio condutor + os nomes principais; `description` em uma frase que liste os destaques (ela aparece no card, no RSS e no topo do e-mail); `publishedAt` na segunda do envio; `status: draft` até a revisão.

**Tamanho**: a página pode ser longa (15 a 20 minutos de leitura) desde que cada seção se sustente sozinha; quem quer o resumo tem o "Em 30 segundos" e o e-mail.

## 4. Estrutura do e-mail

Coleção **E-mails** (`src/content/emails/<slug>.mdx`, campo `edition` apontando para a edição). O template já coloca data, título, resumo, botão "Ler a edição completa" e a assinatura; o conteúdo do e-mail é só o miolo:

1. **Abertura pessoal** (1 parágrafo): agradecimento, recado ou contexto.
2. **Um ou dois parágrafos** sobre o projeto e o fio da semana.
3. **"O que tem nesta edição:"** em negrito + 5 a 6 bullets no formato `**Assunto:** frase curta com o gancho`, começando pelas funcionalidades e sem bullets por profissão.
4. **Fechamento** (1 a 2 parágrafos): o que vem por aí e convite para responder.

- **Assunto**: até ~55 caracteres; o envio acrescenta `#N - ` na frente. Combine gancho humano + gancho de conteúdo (ex.: "Obrigado por estar aqui (e a IA saiu do chat)").
- **Preheader**: até ~110 caracteres, complementando o assunto (não repita).
- **Tom**: um grau mais coloquial que a página ("pra", "tô", "logo, logo").
- Sem imagens pesadas: gráfico fica na página. Se precisar de imagem no e-mail, use PNG (clientes de e-mail não mostram SVG).
- Revise com `node scripts/send-newsletter.mjs <slug> --preview` (funciona com rascunho).

## 5. Voz e escolha de palavras

**Tom**: popular, próximo e cuidadoso. Fala como alguém que estudou o assunto a fundo e está explicando para um amigo inteligente que não é da área. Mostra carinho com o leitor e com a informação, sem bajular e sem hype.

**Regras da marca** (também no `DESIGN.md`):

- Frases curtas. Um assunto por parágrafo.
- **Sem exclamação.** O entusiasmo vem das palavras ("tô muito empolgado", "o que me ganhou foi"), não da pontuação.
- **Sem travessão** (—) no conteúdo. Use vírgula, dois-pontos ou parênteses.
- Sem jargão de marketing: evite "revolucionário", "incrível", "disruptivo", "game changer", "o futuro chegou", "não fique para trás".

**Expressões que funcionam**: "a gente", "de verdade", "sem enrolação", "sem tecniquês", "bora", "vale conhecer", "o recado é direto", "o teste que vale é o seu", "Escolher a opção errada, ele escolhe." (frase curta de efeito no fim do parágrafo).

**Página × e-mail**: na página, "para"; no e-mail, "pra" é bem-vindo. Na página, "eu" para opinião e recomendação, "usamos/mostramos" para escolhas da curadoria.

**Explique o jargão na primeira vez**, em uma linha, de preferência num bloco de citação:

> Token é o pedacinho de texto que o modelo lê e escreve. Um milhão de tokens equivale, grosso modo, a mais de mil páginas de texto.

Glossário de referência:

| Termo | Como explicar |
| --- | --- |
| benchmark | prova padronizada: todos os modelos fazem as mesmas tarefas e recebem uma nota |
| token | pedacinho de texto que o modelo lê e escreve |
| contexto (janela de) | quanto texto o modelo consegue ler de uma vez |
| pesos abertos | o modelo pode ser baixado e rodado em servidores próprios |
| alucinação | quando o modelo inventa uma informação com cara de verdade |
| agente | IA que executa tarefas em sequência, usando ferramentas, em vez de só responder |
| "pensar" / esforço | tempo de raciocínio antes da resposta; mais esforço costuma dar nota maior e custar mais |

**Números e datas** (padrão brasileiro): `US$ 0,30`, `R$ 2 mil`, `66,4%`, `1.846`, `1 milhão`, "22 de setembro", "na quarta (7)". Preço de modelo sempre "por milhão de tokens de entrada/saída". Em comparações, prefira razões fáceis ("um décimo do preço", "mais de oito vezes") ao lado do número exato.

## 6. Gráficos, tabelas e imagens

- **Quando usar**: comparativos (nota, preço, velocidade), conceitos que ficam mais claros desenhados (ex.: "chat × Jev"). Não use gráfico para um número só.
- **Formato**: SVG em `public/images/posts/<slug>/` (mesma pasta que o upload do CMS usa), referenciado no MDX como `![texto alternativo](/images/posts/<slug>/arquivo.svg)`. Use os SVGs da edição `a-ia-saiu-do-chat` como modelo.
- **Especificação visual** (segue `DESIGN.md` e boas práticas de dataviz):
  - largura 600 (`width="600"` + `viewBox`), fundo branco, fonte `Geist, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` (o SVG em `<img>` não carrega fonte da web);
  - título dentro do gráfico (22, peso 600) + subtítulo em cinza `#6B6B76` explicando como ler;
  - marcas em cinza `#9A9AA4`/`#6B6B76` e **um único destaque** em laranja `#F6821F` (o item que a edição quer mostrar);
  - barras finas (12px) com ponta arredondada de 4px; pontos com anel branco de 2px; grade em linha fina sólida `#F2F2F5`;
  - texto nunca na cor da marca de dado; valores em `#0B0B0C`;
  - rodapé com fonte e **data de consulta**;
  - textos com 13px ou mais (no celular o SVG encolhe para ~57%); confira se nada encosta ou vaza renderizando o SVG antes de publicar.
- **Acessibilidade**: `<title>` e `<desc>` no SVG; texto alternativo no MDX descrevendo o que o gráfico mostra **com os números principais**; logo depois do gráfico, uma tabela com os mesmos dados.
- **Tabelas**: markdown simples; no site elas rolam na horizontal no celular. Embaixo, uma linha em itálico com a fonte (`*Fonte: ...*`).
- **Imagens geradas por IA**: só na linha do `DESIGN.md` (abstratas, sem texto, sem pessoas). Capa: use `fig-01/02/03` se não houver imagem própria.

## 7. Checklist antes de mudar para "Programada"

- [ ] Cada número tem fonte linkada e data de consulta quando for ranking ou preço.
- [ ] Nada da semana foi apresentado com data errada; notícias antigas estão marcadas como tal.
- [ ] Funcionalidades vêm antes dos modelos e dizem em que plano estão (grátis, pago, em teste).
- [ ] Nenhuma seção por profissão; cada destaque traz exemplos de pelo menos duas ou três áreas diferentes.
- [ ] "O que isso muda para você" e "aviso honesto" presentes nos destaques.
- [ ] Gráficos e comparativos que sustentam as afirmações estão na página, com fonte.
- [ ] Recomendação com motivos concretos e com o cuidado de privacidade.
- [ ] Sem exclamação, sem travessão, sem jargão sem explicação (`grep -nE '—|!([^[]|$)' src/content/posts/<slug>.mdx`).
- [ ] Gráficos conferidos no desktop e no celular; texto alternativo e tabela presentes.
- [ ] E-mail na coleção **E-mails** ligado à edição; assunto e preheader revisados; preview gerado com `--preview`.
- [ ] `npm run check` sem erros.
- [ ] Nenhum dado pessoal de assinante ou segredo no texto (o repositório é público).

## 8. Prompt para gerar a próxima edição (agentes)

> Leia `AGENTS.md`, `DESIGN.md` e `EDITORIAL.md`. Pesquise as notícias de tecnologia e IA de <data inicial> a <data final> seguindo a seção 2, priorizando funcionalidades que pessoas de qualquer área possam usar (pauta fixa + estes pedidos: <pedidos do mantenedor>). Monte a edição na coleção Edições com `status: draft` e `publishedAt: <segunda>`, seguindo a estrutura da seção 3, e o e-mail na coleção E-mails seguindo a seção 4. Recomendação da semana: <ferramenta e motivos do mantenedor>. Crie gráficos conforme a seção 6 quando houver comparativo. Rode o checklist da seção 7, gere o preview do e-mail e mostre a página renderizada antes de qualquer commit.
