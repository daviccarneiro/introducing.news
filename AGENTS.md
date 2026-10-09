# AGENTS.md — introducing.news

> Guia para agentes de código e para o mantenedor. Leia antes de mexer no projeto.
> **Este repositório é público.** Nunca inclua segredos, chaves, tokens, cookies ou dados de assinantes em arquivos versionados, commits, issues, PRs, logs ou mensagens.

## Visão geral

Newsletter em português sobre tecnologia, com curadoria de **profissionais de tecnologia e de pesquisadores da área**. O foco editorial: novos modelos de IA, ferramentas recém-lançadas, as discussões da área e os eventos que vêm por aí. Cada edição é publicada como página na web e enviada por e-mail. Domínio: `https://introducing.news` (Netlify). Repositório: `daviccarneiro/introducing.news`.

## Stack

| Camada | Ferramenta | Observações |
| --- | --- | --- |
| Site | Astro 7 (`output: 'static'`) | conteúdo em content collections + MDX |
| CMS | Keystatic (`@keystatic/core` 0.6 / `@keystatic/astro` 6) | modo local em dev; modo GitHub em produção |
| Hospedagem | Netlify (`@astrojs/netlify` 8) | SSR Function + Middleware Edge Function; saída em `dist/` |
| E-mail | Resend (Contacts + Segments + Broadcasts) | domínio `introducing.news` verificado; segmento principal "Assinantes" (+ "staging" para testes) |
| Anti-bot | Cloudflare Turnstile | widget no formulário + `siteverify` no servidor (independente de onde o site roda) |
| Segredos | Doppler (`introducing-news/dev_personal`) + Netlify env vars + GitHub secrets | nunca em arquivo versionado |
| CI/CD | Netlify Git integration | build/deploy automático a cada push na `main` |
| Analytics | GTM (+ Clarity), tracking do Resend e snapshot p/ Google Sheets | dashboard no Looker Studio; heatmap no Clarity |
| Erros | Sentry (`@sentry/astro` 11) | DSN/ambiente por env; source maps no build; sem DSN nada é enviado |
| Design | Figma "introducing.news — Design" | tokens espelhados em `src/styles/tokens.css`; guia para IA em `DESIGN.md` (+ `design/` e assets em `public/brand/`) |

## Estrutura

```
src/
  copy.ts                  # todo o texto da interface (PT), com t() e categoryLabel()
  content/posts/*.mdx      # edições
  content/authors/*.json   # autores (assinatura do e-mail: nome, cargo, foto)
  content/emails/*.mdx     # e-mails da newsletter (versão reduzida, ligados à edição)
  content.config.ts        # schemas das edições e dos autores (Astro)
  views/                   # HomeView, ArchiveView, PostView, rss
  pages/
    index.astro            # home (formulário de inscrição no hero)
    arquivo/index.astro    # todas as edições
    arquivo/[...slug].astro# página da edição
    descadastrar.astro     # confirmação de descadastro (link do e-mail)
    rss.xml.ts             # feed RSS
    ultima.ts              # 302 para a edição publicada mais recente
    api/subscribe.ts       # inscrição (valida, rate-limit, Turnstile, Resend)
    api/unsubscribe.ts     # descadastro (mesmas defesas; PATCH unsubscribed no Resend)
  components/              # SiteHeader, SiteFooter, PostCard, Cover, Badge, SubscribeForm
  lib/posts.ts             # consultas, autor da assinatura, readingTime, formatDate
  lib/api.ts               # json/clientIp/rate-limit/Turnstile compartilhados pelas APIs
  middleware.ts            # 301 de URLs antigas (/pt/*) + noindex do staging (host)
keystatic.config.ts        # CMS (coleções "Edições", "Autores" e "E-mails")
sentry.client.config.js    # init do Sentry no navegador (só erros)
sentry.server.config.js    # init do Sentry nas páginas SSR (só erros)
scripts/email-template.mjs # fonte de verdade do layout do e-mail
scripts/email-body.mjs     # converte o MDX do e-mail em HTML de e-mail
scripts/welcome-email.mjs  # texto do e-mail de boas-vindas (5 min após inscrever)
scripts/resend-welcome.mjs # publica template + evento + automação de boas-vindas
scripts/send-newsletter.mjs# disparo de Broadcast
scripts/resend-template.mjs# publica o template do e-mail no Resend
scripts/publish-batch.mjs  # publica edições programadas vencidas (batch)
scripts/analytics-snapshot.mjs # métricas do Resend → Google Sheets (Looker)
scripts/google-sheets.mjs  # cliente mínimo do Sheets (service account/JWT)
public/_headers            # headers de segurança (CSP, HSTS, nosniff…)
public/images/brand/       # logo em PNG para o e-mail (clientes não renderizam SVG)
netlify.toml               # build + redirects (www→apex 301, cms→/keystatic 302)
```

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | dev server (emula funções/Blobs/Image CDN da Netlify). CMS local em `/keystatic` |
| `npm run check` | typecheck (`astro check`) — rode antes de commitar |
| `npm run build` | build de produção (`dist/` + `.netlify/`) |
| `npm run preview` | preview do build |
| `npm run deploy` | `netlify deploy --prod` (build local + deploy; em produção o Git integration faz) |
| `node scripts/send-newsletter.mjs <slug> [--dry-run] [--preview]` | envia a edição por e-mail (`--preview` gera o HTML real no diretório temporário) |
| `npm run template:sync` | publica/atualiza o template do e-mail no Resend (fonte: `scripts/email-template.mjs`) |
| `npm run welcome:sync` | publica/atualiza template, evento e automação de boas-vindas no Resend |
| `npm run publish:batch` | publica edições programadas vencidas e prontas (`--dry-run` simula; `--check` só informa) |
| `npm run analytics:sync` | grava o snapshot de métricas (Resend → Google Sheets); `--dry-run` gera CSVs no temporário sem tocar no Google |

Com segredos: `doppler run -p introducing-news -c dev_personal -- <comando>` (o `doppler.yaml` do repo já aponta para lá; nunca dependa do perfil global).

## Segredos e ambiente

Nunca commite valores. O repositório é público.

| Nome | Onde vive | Para que serve |
| --- | --- | --- |
| `RESEND_API_KEY` | Doppler, Netlify env, `.env` local, GitHub secret | API do Resend (contatos + broadcasts). **Full-access** |
| `RESEND_SEGMENT_ID` | idem | segmento único da audiência no Resend |
| `KEYSTATIC_GITHUB_CLIENT_ID` / `KEYSTATIC_GITHUB_CLIENT_SECRET` | Doppler, Netlify env, `.env` local | OAuth do GitHub App do CMS |
| `KEYSTATIC_SECRET` | idem | assinatura de sessão do Keystatic (32+ caracteres) |
| `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | Doppler, Netlify env, `.env` local | liga o modo GitHub do Keystatic (vai inline no bundle; é público) |
| `TURNSTILE_SECRET_KEY` | Doppler, Netlify env, `.env` local | `siteverify` do Turnstile |
| `PUBLIC_TURNSTILE_SITE_KEY` | Doppler, Netlify env, `.env` local | widget no navegador (público) |
| `PUBLIC_GTM_ID` | Netlify env (produção), `.env` local | ID do contêiner do GTM (público); sem ela, nenhum script de terceiros é injetado |
| `PUBLIC_SENTRY_DSN` | Doppler, Netlify env, `.env` local | DSN do Sentry (público); sem ele, nada é enviado |
| `PUBLIC_SENTRY_ENVIRONMENT` | Netlify env (production/staging), `.env` local | ambiente nos eventos do Sentry (fallback: `MODE`) |
| `SENTRY_AUTH_TOKEN` | Doppler, Netlify env, `.env` local | upload de source maps no build (segredo; sem ele o upload é pulado) |
| `GOOGLE_SHEET_ID` | Doppler, GitHub secret | planilha do snapshot de analytics |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Doppler, GitHub secret | service account (JSON) com acesso de Editor à planilha |

- Schema tipado em `astro.config.mjs` (`envField`); o servidor lê de `astro:env/server`.
- Local: `.env` (gitignored) ou `doppler run --`.
- Na Netlify: Site configuration › Environment variables. **Mudança de env exige redeploy** (valores entram no build). Segredos usam escopo `builds,functions,runtime`, contexto `production`.
- Vazou? Rotacione: Resend/Cloudflare/GitHub → atualize Doppler → `doppler run -- netlify env:set …` → `gh secret set` → redeploy.

## Como funciona

### Conteúdo

- `src/content/posts/*.mdx`; schema em `src/content.config.ts`; no CMS, coleção `posts` ("Edições").
- Campos: `title`, `number` (número da edição), `description`, `publishedAt`, `cover` (fig-01..03), `coverImage` (upload opcional → `public/images/covers/`), `signature` (relação com Autores), `status`.
- `src/content/authors/*.json`: nome, cargo/linha de assinatura e foto (upload → `public/images/authors/`). No CMS, coleção "Autores".
- `src/content/emails/*.mdx`: e-mail da newsletter (versão reduzida), ligado a uma edição pelo campo `edition`; conteúdo em MDX (negrito, listas, links, imagens → upload em `public/images/emails/`). No CMS, coleção "E-mails".
- `signature` define **quem assina o e-mail** que anuncia a edição — pode ser diferente de quem escreveu o conteúdo. O e-mail usa nome + cargo + foto (ou iniciais) do autor. Obrigatório no CMS; o envio recusa edição sem assinatura.
- **Status editorial**: `draft` (rascunho) → `review` (em revisão) → `scheduled` (programada) → `published` (publicada). **Só `published` aparece no site, no RSS e no envio.**
- Em "Programada", `publishedAt` é a data do batch; a data é normalizada para o próximo dia de batch (uma edição marcada para quarta é publicada na segunda seguinte).
- **Batch**: o workflow **Publicar batch** (`.github/workflows/publish.yml`) é acionado por mudanças em `src/content/posts/**` (o commit do Keystatic ao programar) e por cron nas segundas às 07:45 BRT. Antes de tudo, um job de triagem roda `scripts/publish-batch.mjs --check` (sem dependências externas): se não houver edição `scheduled`, vencida e com `title`/`description`/`signature`/`publishedAt`, **nada mais roda** — sem `npm ci`, sem commit, sem deploy. Quando há, o script troca `scheduled` → `published`, commita e aciona o Deploy.
- Imagem de capa preenchida sobrepõe a figura abstrata em todos os lugares (card, destaque, post).
- Todo o texto da interface vive em `src/copy.ts` (funções `t()` e `categoryLabel()`).

### Inscrição (`POST /api/subscribe`)

1. Valida JSON, e-mail (regex + 254) e consentimento explícito.
2. Rate limit por IP (5/10 min, Netlify Blobs) e Turnstile `siteverify`.
3. Consulta o contato no Resend antes de gravar: se **não existe** (404), cria com `properties: { locale: 'pt', consent_at }` no segmento único e dispara a automação de boas-vindas; se **existe**, faz PATCH (reativa/atualiza consentimento e segmento, limpa `unsubscribed_at`) **sem** disparar. O `POST /contacts` do Resend é upsert (201 tanto para novo quanto para existente) — por isso a checagem prévia, que evita boas-vindas duplicadas. Quando o navegador envia, grava também a origem sem cookie: `signup_referrer` (document.referrer) e `signup_utm` (utm_source/medium/campaign).

O formulário (`SubscribeForm.astro`) tem o fluxo e-mail + consentimento → Assinar; o botão fica cinza até um e-mail válido ser digitado (aí vira laranja) e, no clique, mostra helptext laranja se faltar e-mail válido ou consentimento.

### Descadastro (`POST /api/unsubscribe`)

- Página `/descadastrar` (link "cancelar inscrição" do e-mail): lista o que a pessoa deixa de receber e pede confirmação do e-mail.
- A API valida e-mail, aplica rate limit + Turnstile (helpers em `src/lib/api.ts`), marca o contato como `unsubscribed: true` e grava `unsubscribed_at` (data do descadastro, usada nos totais do snapshot). Contato inexistente responde `ok` mesmo assim (anti-enumeração).
- O link visível do e-mail aponta para essa página (não usamos `{{{RESEND_UNSUBSCRIBE_URL}}}`); como o volume é baixo, abrimos mão do header `List-Unsubscribe` gerenciado pelo Resend. Se quiser o fluxo automático de volta, troque o link por `{{{RESEND_UNSUBSCRIBE_URL}}}`.

### Newsletter

- `scripts/email-template.mjs` é a fonte de verdade do layout do e-mail: HTML em tabelas, CSS inline, fontes de sistema e tokens de `tokens.css`, com fallback VML no botão (Gmail, Apple Mail, Outlook). `buildEmail()` monta o e-mail (cabeçalho + resumo + corpo + CTA + assinatura). É uma versão reduzida da página, com formatação própria — o HTML do site não é reutilizado.
- **O que editar onde**: o conteúdo do e-mail vem da coleção **E-mails** (associada à edição por `edition`), em MDX; `scripts/email-body.mjs` converte para HTML de e-mail (estilos inline, imagens em URL absoluta). Assunto e preheader vêm do e-mail, com fallback para `title`/`description` da edição. Sem entrada na coleção, o envio usa a versão automática (título + resumo + CTA). O layout geral vive em `scripts/email-template.mjs`.
- `npm run template:sync` espelha esse HTML como template publicado no Resend (preview/teste no painel). O envio **não** depende do painel: usa o HTML do repositório.
- **Boas-vindas**: quem se inscreve recebe um e-mail 5 minutos depois, uma única vez. O texto vive em `scripts/welcome-email.mjs` (mesmo layout do e-mail da edição) e `npm run welcome:sync` publica o template `introducing-news-boas-vindas` e garante o evento `newsletter.subscribed` e a automação no Resend (evento → 5 min → envio). O site dispara o evento em `POST /api/subscribe` **apenas quando o contato é criado**; reinscrições (PATCH) não reenviam e contatos descadastrados são ignorados pelo Resend. O CTA do e-mail aponta para `/ultima` (302 → edição mais recente) e o "cancelar inscrição" para `/descadastrar` — nunca use `{{{RESEND_UNSUBSCRIBE_URL}}}` como valor de variável (a substituição não é aninhada e o link fica quebrado).
- Para ver o e-mail real antes de enviar: `node scripts/send-newsletter.mjs <slug> --preview` grava o HTML no diretório temporário (sem enviar); o painel do Resend mostra o layout com os valores de fallback das variáveis.
- `scripts/send-newsletter.mjs <slug> [--dry-run]`: monta o e-mail a partir do frontmatter (assinatura via `signature`) e cria um Broadcast com `send: true`. Só edições com `status: published` podem ser enviadas. Anti-duplicidade pelo nome `edição-<slug>`.
- Assunto e kicker trazem a **data da edição** (`publishedAt`, ex.: "5 de outubro de 2026"); o assunto é `#N - assunto` (número da edição + assunto da coleção E-mails, com fallback no título).
- O rodapé aponta "cancelar inscrição" para `/descadastrar` (ver "Descadastro").
- Workflow **Newsletter** (Actions → Run workflow, input `slug`) roda o script. O slug é validado (`^[a-z0-9-]+$`) e passado por env (nunca interpolado direto em `run:`).
- Remetente: `introducing.news <oi@introducing.news>`. Unsubscribe gerenciado pelo Resend. Respostas caem em `oi@introducing.news` e são encaminhadas via Cloudflare Email Routing (ver "Deploy").

### Analytics

- **GTM + Clarity**: `PUBLIC_GTM_ID` (definida só na Netlify de produção) injeta o Google Tag Manager no `<head>` e o fallback `<noscript>` no `<body>`; o Clarity é carregado por uma tag dentro do GTM — não há snippet dele no código. Sem a env (dev e staging), nenhum script de terceiros é injetado, para não poluir os dados.
- **Tracking no Resend**: open + click tracking ligados no domínio `introducing.news`, com subdomínio `links.introducing.news` (CNAME **DNS only** → `links2.resend-dns.com`). O click tracking reescreve os links do e-mail para passar por esse subdomínio; aberturas vêm de um pixel 1×1 e são infladas por Apple Mail/Mail Privacy Protection — prefira a taxa de clique.
- **Properties de atribuição/churn**: `signup_referrer`, `signup_utm` e `unsubscribed_at` — criadas via API no Resend (propriedade só grava se a chave existir). O CTA do e-mail leva `utm_source=newsletter&utm_medium=email&utm_campaign=edicao-<slug>` (montado no `send-newsletter.mjs`), então a origem "newsletter" aparece no snapshot.
- **Snapshot semanal**: o workflow **Analytics** (`.github/workflows/analytics.yml`, segundas 08:30 BRT + dispatch manual) roda `scripts/analytics-snapshot.mjs`, que lê o segmento de produção (`RESEND_SEGMENT_ID`) e reconstrói o histórico via API (`/segments/:id/contacts`, `/emails/metrics` por broadcast, `/clicked-links`), reescrevendo quatro abas no Google Sheet: `crescimento` (novos/churn por dia), `resumo` (total/ativos/descadastrados), `edicoes` (enviados, entregues, abertos, cliques, bounces e taxas) e `links` (ranking de cliques por link/edição). Semanas sem novidade reescrevem os mesmos dados (idempotente).
- **Privacidade**: o Sheet recebe **só agregados** — nenhum e-mail de assinante. A retenção de dados de e-mail no Resend é de 30 dias (consultas por `broadcast_id` escapam); o snapshot semanal preserva o histórico. Descadastros feitos direto na página entram nos totais, mas não na série de churn por dia (que vem dos descadastros ligados a broadcast).
- **Looker Studio (setup manual, uma vez)**: criar a planilha; criar a service account no Google Cloud e baixar o JSON; **compartilhar a planilha com o e-mail da service account como Editor**; guardar `GOOGLE_SHEET_ID` e `GOOGLE_SERVICE_ACCOUNT_JSON` (Doppler + GitHub secrets); conectar o Sheet ao Looker (conector nativo) e montar as páginas (visão geral, edições, links). O heatmap fica no painel do Clarity — a API dele (10 req/dia, 3 dias) não serve como fonte do Looker.
- Local: `doppler run -p introducing-news -c dev_personal -- npm run analytics:sync`; para testar sem Google, `node scripts/analytics-snapshot.mjs --dry-run` (CSVs no temporário).

### Erros (Sentry)

- `sentry.client.config.js` (navegador) e `sentry.server.config.js` (SSR) inicializam o SDK só para erros (sem tracing/replay); o `environment` vem de `PUBLIC_SENTRY_ENVIRONMENT` (fallback: `MODE`). Sem `PUBLIC_SENTRY_DSN`, nada é enviado.
- **Source maps**: o `sentry()` do `astro.config.mjs` gera os maps (`hidden`) e sobe com debug IDs no build usando `SENTRY_AUTH_TOKEN`; sem o token o upload é pulado com aviso. O release é detectado do git.
- **`autoInstrumentation.requestHandler: false`**: o middleware automático do SDK importa `@sentry/node`, incompatível com a Edge Function (`middlewareMode: 'edge'`). Desligado, a Edge Function fica limpa; em troca, erros tratados nas APIs não são capturados (se precisar, chame `Sentry.captureException` na rota).
- CSP: o host de ingest (`*.ingest.us.sentry.io`) está no `connect-src` de `public/_headers`.
- Projeto: `davi-carneiro/introducing-news`; o staging reporta no mesmo projeto com `environment=staging`.

### Deploy

- Push na `main` → **Netlify Git integration**: build (`npm run build`) + deploy automáticos. Projeto `introducing-news` (site id `01f3f0c5-38b4-42da-8f75-bdf5fdbd5bb8`).
- Workflow **Publicar batch**: acionado por commits em `src/content/posts/**` e por cron (toda segunda, 07:45 BRT); só age quando há edição programada, vencida e completa (ver "Conteúdo"). O push na `main` dispara o build da Netlify.
- Workflow **Analytics**: cron semanal (segundas, 08:30 BRT) + dispatch manual; sem `GOOGLE_SHEET_ID`/`GOOGLE_SERVICE_ACCOUNT_JSON` configurados, encerra com aviso sem falhar.
- O site é servido por uma **SSR Function** (rotas de API e Keystatic) e uma **Middleware Edge Function** (redirects de `/pt` e `/en`).
- **DNS (Cloudflare, cinza/DNS-only — fora do repo)**: apex `introducing.news` → A `75.2.60.5` (load balancer da Netlify; **sem AAAA** — o LB não tem IPv6); `www` e `cms` → CNAME `introducing-news.netlify.app`; `staging` → CNAME `introducing-news-staging.netlify.app`. O domínio é registrado na Cloudflare Registrar (a zona **não** pode ser apagada nem usar nameservers externos). A Cloudflare guarda **apenas o DNS, o Turnstile e o Email Routing** deste projeto — os Workers e as regras de zona foram removidos.
- **Respostas de assinantes**: o apex tem MX do **Cloudflare Email Routing** (`route1/2/3.mx.cloudflare.net`) e SPF próprio, com a regra `oi@introducing.news` → e-mail pessoal do mantenedor (destino verificado). É por aí que chegam as respostas (o boas-vindas convida a responder); não remova esses MX/SPF do apex. O envio continua no Resend pelo subdomínio `send`.
- **Canônico / `www`**: o host canônico é o apex `https://introducing.news`; `www` → **301** para o apex (regra `[[redirects]]` no `netlify.toml`, preserva path e query).
- **CMS**: `https://cms.introducing.news` → 302 para `https://introducing.news/keystatic` (regra no `netlify.toml`). O login do GitHub fica no domínio principal — por isso é redirect, e não um domínio próprio.
- URLs antigas de quando o site era bilíngue redirecionam 301 pelo `src/middleware.ts` (`/pt/*`, `/en/*` → rotas atuais), que roda na Edge Function.
- **Staging**: site separado `introducing-news-staging` na Netlify (id `88aaba5f-7179-4921-b928-2d2f6f85c9e9`), em `https://staging.introducing.news` (DNS grey → `introducing-news-staging.netlify.app`). Tem `RESEND_API_KEY`, `RESEND_SEGMENT_ID` (segmento **staging** no Resend — contatos de teste não entram na audiência real) e `TURNSTILE_SECRET_KEY` próprios; sem `KEYSTATIC_*` o CMS não funciona lá. O `X-Robots-Tag: noindex, nofollow` é aplicado pelo `src/middleware.ts` (host `staging.introducing.news`). Deploy manual (MCP `deploy-site` ou `netlify deploy --site introducing-news-staging --prod`).

## Armadilhas conhecidas (aprendidas na prática)

1. **Keystatic — modo de storage é decisão de build.** Use `import.meta.env.PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` no `keystatic.config.ts`. Se usar `process.env`, o browser não tem `process` → UI em modo local enquanto a API roda em modo GitHub → erro `"Not Found" is not valid JSON` ao abrir coleção.
2. **`astro preview` é daemon** (Astro 7): use `stop`/`status`/`logs`. Um preview antigo pode responder no lugar do build novo.
3. **Adapter Netlify**: o build gera a SSR Function e a Middleware Edge Function em `.netlify/`; o publish é `dist/`. Nunca comite `dist/` nem `.netlify/`.
4. **Env na Netlify**: valores entram no **build** — mudança de env exige **redeploy**. Segredos não podem no escopo `post-processing`: use `--scope builds functions runtime --context production --secret`.
5. **Resend pós-nov/2025**: Audiences viraram Segments; Broadcast usa `segment_id`; propriedades de contato só gravam se a chave existir (`locale` e `consent_at` foram criadas via API).
6. **Verificação de domínio** pode precisar de novo ciclo ("Restart verification") por cache de resolvedor. O CNAME `rsend` precisa estar **DNS only** no Cloudflare.
7. **Actions**: nunca interpole `${{ inputs.* }}` diretamente em `run:` (injeção de shell) — passe por `env`.
8. **Doppler**: o perfil global desta máquina aponta para outro projeto; sempre use `-p introducing-news -c dev_personal` (ou o `doppler.yaml` do repo).
9. **`astro-typewriter`**: o pacote declara peer `astro ^5 || ^6`; usamos `overrides` no `package.json` para o Astro 7. Não remova o override sem rodar `npm ci` — sem ele o CI quebra no ERESOLVE.
10. **Batch → Deploy**: o push na `main` dispara o build da Netlify automaticamente (Git integration); não é mais preciso acionar workflow.
11. **Domínio na Netlify**: adicionar/alterar custom domain **só pela UI** — a API pública (`updateSite`) ignora `custom_domain`/`domain_aliases`. O apex usa A `75.2.60.5` e o LB **não tem IPv6**: não pode haver AAAA no apex, senão o certificado falha.
12. **Rate limit**: usa **Netlify Blobs** (`@netlify/blobs`, consistência forte). Em dev local funciona pelo emulador do adapter; sem contexto da Netlify, o limitador falha em silêncio (nunca bloqueia).
13. **Tracking do Resend**: o subdomínio `links.introducing.news` **não pode ser removido** (só trocado) e o click tracking reescreve os links de todos os e-mails do domínio, inclusive boas-vindas. O CNAME precisa ser **DNS only** no Cloudflare (sem nuvem laranja).
14. **Retenção do Resend**: 30 dias para dados de e-mail no plano padrão; o snapshot semanal é o que preserva o histórico do dashboard.
15. **Staging fora das métricas**: o GTM só é injetado com `PUBLIC_GTM_ID` (definida apenas na produção) e o snapshot filtra pelo segmento "Assinantes" (`RESEND_SEGMENT_ID`) — não remova esses filtros, ou os testes entram nos números.
16. **CSP + tags**: tags novas no GTM podem exigir domínios novos na CSP de `public/_headers` (ex.: Facebook/Meta, Hotjar); confira o console por erros de CSP depois de mudar o contêiner.
17. **Indexação de e-mails no Resend**: a lista de e-mails (painel e `GET /emails`) demora alguns minutos para mostrar envios de automação; o boas-vindas sai 5 min após o evento. Atraso não é falha — confira `last_event: delivered` antes de investigar.
18. **Sentry + Edge Function**: o middleware automático do `@sentry/astro` (que importa `@sentry/node`) não roda na Edge Function do Netlify (`middlewareMode: 'edge'`; o adapter empacota com esbuild `platform: 'neutral'` e só aceita imports `node:`). Mantemos `autoInstrumentation.requestHandler: false` — não reative sem testar os redirects (`/pt/*`) e o noindex do staging.
19. **`_headers` um deploy atrasado**: depois de mudar `public/_headers` (ex.: CSP), a Netlify pode continuar servindo os headers antigos mesmo com arquivos novos no ar — e `purge` de cache não resolve. Um novo build (ex.: commit vazio, como em `50d7f58`) aplica o arquivo novo. Sempre confira o header na produção depois de publicar: `curl -sI https://introducing.news/ | grep -i content-security-policy`.

## Decisões de escopo

- **Só em português.** O projeto nasceu bilíngue e foi simplificado: sem i18n, sem seletor de idioma, sem subpastas de locale. Não reintroduza `src/i18n/` sem decisão explícita.
- **Sem página "Sobre"** (o CTA de LinkedIn no rodapé cobre o objetivo) e **sem grade de "edições anteriores"** na home — só a última edição + botão para o arquivo.
- **Pendências e melhorias vivem em issues** (labels `security`, `produto`, `infra`, `opcional`), não em arquivo no repo.
- **Sem double opt-in por ora** (prioridade em conversão): consentimento explícito + Turnstile + rate limit cobrem o essencial — ver issue correspondente.

## Segurança

- Antes de commitar: `git diff --cached | grep -E "re_[A-Za-z0-9]{20,}|0x4AAAAA|ghp_|dp\.pt\.|sntry[su]_"` (deve ser vazio).
- `.env*`, `dist/`, `.netlify/` são gitignored — mantenha assim.
- Formulário: e-mail validado, consentimento obrigatório, Turnstile e rate limit por IP; a API **não** expõe nenhum endpoint de leitura de contatos.
- O snapshot de analytics grava **apenas métricas agregadas** no Google Sheet; nunca exporte e-mails de assinantes para planilhas, logs, issues ou mensagens.
- `public/_headers` aplica CSP, HSTS, `nosniff`, `Referrer-Policy` e `frame-ancestors 'none'`. Ao adicionar scripts/iframes/fontes externas, atualize a CSP junto.
- A `RESEND_API_KEY` é full-access (precisa escrever contatos). Mantenha-a somente em segredos; se vazar, rotacione imediatamente.
- Keystatic em produção exige login GitHub com acesso de escrita ao repositório (GitHub App com `Contents: Read and write`).

## Upgrades

1. `npm outdated` → atualize com parcimônia, mantendo os pares compatíveis: `@astrojs/netlify` 8 ↔ Astro 7; `@sentry/astro` 11 ↔ Astro 7 / `@astrojs/netlify` 8; `@keystatic/astro` 6 ↔ Astro 5/6/7; React 19 (usado só pelo CMS).
2. `npm run check` → `npm run build` → smoke test com `npm run dev` (home, arquivo, post, RSS, `/keystatic`, `POST /api/subscribe` com e-mail inválido).
3. `npm audit` — vulnerabilidades em tooling de build; avalie antes de forçar correções.
4. Deploy via push na `main` e confira o deploy na Netlify.

## Referências

- Pendências e melhorias: [issues do repositório](https://github.com/daviccarneiro/introducing.news/issues).
- Figma: arquivo "introducing.news — Design" (Fundações/Componentes/Telas; tokens espelhados no CSS).
- Marca e estilo para pessoas e agentes de IA: `DESIGN.md` (voz, cores, tipografia, imagens, prompts). Assets prontos: `public/brand/` (logo, ícone, capas), tokens legíveis por máquina em `design/tokens.json` e fontes OFL em `design/fonts/`.
- Painéis: Resend (Domains/Contacts/Segments/Broadcasts), Netlify (projeto `introducing-news`), Cloudflare (DNS da zona + Turnstile), Doppler (projeto `introducing-news`), Sentry (erros do site), Google Tag Manager (contêiner `GTM-TFKQKWHD`), Microsoft Clarity (heatmap do site) e Looker Studio (relatório do Sheet de analytics).
- Rotas de API: `POST /api/subscribe` (inscrição), `/api/keystatic/*` (CMS), `/keystatic` (admin).
