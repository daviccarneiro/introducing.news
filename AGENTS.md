# AGENTS.md — introducing.news

> Guia para agentes de código e para o mantenedor. Leia antes de mexer no projeto.
> **Este repositório é público.** Nunca inclua segredos, chaves, tokens, cookies ou dados de assinantes em arquivos versionados, commits, issues, PRs, logs ou mensagens.

## Visão geral

Newsletter em português sobre tecnologia, com curadoria de **professores e profissionais**. O foco editorial: novos modelos de IA, ferramentas recém-lançadas, as discussões da área e os eventos que vêm por aí. Cada edição é publicada como página na web e enviada por e-mail. Domínio: `https://introducing.news` (Cloudflare Workers). Repositório: `daviccarneiro/introducing.news`.

## Stack

| Camada | Ferramenta | Observações |
| --- | --- | --- |
| Site | Astro 7 (`output: 'static'`) | conteúdo em content collections + MDX |
| CMS | Keystatic (`@keystatic/core` 0.6 / `@keystatic/astro` 6) | modo local em dev; modo GitHub em produção |
| Hospedagem | Cloudflare Workers (`@astrojs/cloudflare` 14) | `nodejs_compat`; saída em `dist/client` + `dist/server` |
| E-mail | Resend (Contacts + Segments + Broadcasts) | domínio `introducing.news` verificado; segmento principal "Assinantes" (+ "staging" para testes) |
| Anti-bot | Cloudflare Turnstile | widget no formulário + `siteverify` no Worker |
| Segredos | Doppler (`introducing-news/dev_personal`) + GitHub secrets + Worker secrets | nunca em arquivo versionado |
| CI/CD | GitHub Actions → `wrangler deploy` | deploy automático a cada push na `main` |
| Design | Figma "introducing.news — Design" | tokens espelhados em `src/styles/tokens.css` |

## Estrutura

```
src/
  copy.ts                  # todo o texto da interface (PT), com t() e categoryLabel()
  content/posts/*.mdx      # edições
  content/authors/*.json   # autores (assinatura do e-mail: nome, cargo, foto)
  content.config.ts        # schemas das edições e dos autores (Astro)
  views/                   # HomeView, ArchiveView, PostView, rss
  pages/
    index.astro            # home (formulário de inscrição no hero)
    arquivo/index.astro    # todas as edições
    arquivo/[...slug].astro# página da edição
    rss.xml.ts             # feed RSS
    api/subscribe.ts       # inscrição (valida, rate-limit, Turnstile, Resend)
  components/              # SiteHeader, SiteFooter, PostCard, Cover, Badge, SubscribeForm
  lib/posts.ts             # consultas, autor da assinatura, readingTime, formatDate
  middleware.ts            # 301 de URLs antigas (/pt/*, /en/* → rotas atuais)
keystatic.config.ts        # CMS (coleções "Edições" e "Autores")
scripts/email-template.mjs # fonte de verdade do HTML/texto do e-mail
scripts/send-newsletter.mjs# disparo de Broadcast
scripts/resend-template.mjs# publica o template do e-mail no Resend
scripts/publish-batch.mjs  # publica edições programadas vencidas (batch)
public/_headers            # headers de segurança (CSP, HSTS, nosniff…)
wrangler.jsonc             # Worker (nome, compat, vars)
worker-configuration.d.ts  # tipos gerados (só nomes — pode ser commitado)
```

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | dev server (workerd via adapter). CMS local em `/keystatic` |
| `npm run check` | typecheck (`astro check`) — rode antes de commitar |
| `npm run build` | build de produção (`dist/client` + `dist/server`) |
| `npm run preview` | preview no runtime real do Workers — **é um daemon**: `npx astro preview stop\|status\|logs` |
| `npm run types` | regenera `worker-configuration.d.ts` — **rode após mudar `wrangler.jsonc` ou `.dev.vars`** |
| `npm run deploy` | build + `wrangler deploy` (uso local; em produção o CI faz) |
| `node scripts/send-newsletter.mjs <slug> [--dry-run]` | envia a edição por e-mail |
| `npm run template:sync` | publica/atualiza o template do e-mail no Resend (fonte: `scripts/email-template.mjs`) |
| `npm run publish:batch` | publica edições programadas vencidas e prontas (`--dry-run` simula; `--check` só informa) |

Com segredos: `doppler run -p introducing-news -c dev_personal -- <comando>` (o `doppler.yaml` do repo já aponta para lá; nunca dependa do perfil global).

## Segredos e ambiente

Nunca commite valores. O repositório é público.

| Nome | Onde vive | Para que serve |
| --- | --- | --- |
| `RESEND_API_KEY` | Doppler, `.dev.vars`, Worker secret, GitHub secret | API do Resend (contatos + broadcasts). **Full-access** |
| `RESEND_SEGMENT_ID` | idem | segmento único da audiência no Resend |
| `KEYSTATIC_GITHUB_CLIENT_ID` / `KEYSTATIC_GITHUB_CLIENT_SECRET` | Doppler, `.dev.vars`, Worker secret, GitHub secret | OAuth do GitHub App do CMS |
| `KEYSTATIC_SECRET` | idem | assinatura de sessão do Keystatic (32+ caracteres) |
| `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | Doppler, `.dev.vars`, GitHub **variable** | liga o modo GitHub do Keystatic (vai inline no bundle; é público) |
| `TURNSTILE_SECRET_KEY` | Doppler, `.dev.vars`, Worker secret | `siteverify` do Turnstile |
| `PUBLIC_TURNSTILE_SITE_KEY` | Doppler, `.dev.vars`, GitHub **variable** | widget no navegador (público) |
| `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` | Doppler + GitHub secrets | deploy via CI |

- Local: `.dev.vars` (gitignored) ou `doppler run --`.
- Ao definir/alterar Worker secrets manualmente, **rode `npx wrangler deploy` depois** — `wrangler secret put` sozinho publica uma versão sem a config de assets do adapter.
- Vazou? Rotacione: Resend/Cloudflare/GitHub → atualize Doppler → `wrangler secret put` → `gh secret set` → redeploy.

## Como funciona

### Conteúdo

- `src/content/posts/*.mdx`; schema em `src/content.config.ts`; no CMS, coleção `posts` ("Edições").
- Campos: `title`, `description`, `category`, `publishedAt`, `cover` (fig-01..03), `coverImage` (upload opcional → `public/images/covers/`), `signature` (relação com Autores), `status`.
- `src/content/authors/*.json`: nome, cargo/linha de assinatura e foto (upload → `public/images/authors/`). No CMS, coleção "Autores".
- `signature` define **quem assina o e-mail** que anuncia a edição — pode ser diferente de quem escreveu o conteúdo. O e-mail usa nome + cargo + foto (ou iniciais) do autor. Obrigatório no CMS; o envio recusa edição sem assinatura.
- **Status editorial**: `draft` (rascunho) → `review` (em revisão) → `scheduled` (programada) → `published` (publicada). **Só `published` aparece no site, no RSS e no envio.**
- Em "Programada", `publishedAt` é a data do batch; a data é normalizada para o próximo dia de batch (uma edição marcada para quarta é publicada na quinta).
- **Batch**: o workflow **Publicar batch** (`.github/workflows/publish.yml`) é acionado por mudanças em `src/content/posts/**` (o commit do Keystatic ao programar) e por cron nas segundas e quintas às 09:00 BRT. Antes de tudo, um job de triagem roda `scripts/publish-batch.mjs --check` (sem dependências externas): se não houver edição `scheduled`, vencida e com `title`/`description`/`signature`/`publishedAt`, **nada mais roda** — sem `npm ci`, sem commit, sem deploy. Quando há, o script troca `scheduled` → `published`, commita e aciona o Deploy.
- Imagem de capa preenchida sobrepõe a figura abstrata em todos os lugares (card, destaque, post).
- Todo o texto da interface vive em `src/copy.ts` (funções `t()` e `categoryLabel()`).

### Inscrição (`POST /api/subscribe`)

1. Valida JSON, e-mail (regex + 254) e consentimento explícito.
2. Rate limit por IP (5/10 min, Cache API) e Turnstile `siteverify`.
3. Cria/atualiza contato no Resend com `properties: { locale: 'pt', consent_at }` no segmento único. 409 → PATCH.

O formulário (`SubscribeForm.astro`) tem o fluxo e-mail + consentimento → Assinar; o botão fica cinza até um e-mail válido ser digitado (aí vira laranja) e, no clique, mostra helptext laranja se faltar e-mail válido ou consentimento.

### Newsletter

- `scripts/email-template.mjs` é a fonte de verdade do e-mail: HTML em tabelas, CSS inline, fontes de sistema e tokens de `tokens.css`, com fallback VML no botão (Gmail, Apple Mail, Outlook). `buildEmail()` gera o e-mail curto (título + resumo + CTA + assinatura).
- `npm run template:sync` espelha esse HTML como template publicado no Resend (preview/teste no painel). O envio **não** depende do painel: usa o HTML do repositório.
- `scripts/send-newsletter.mjs <slug> [--dry-run]`: monta o e-mail a partir do frontmatter (assinatura via `signature`) e cria um Broadcast com `send: true`. Só edições com `status: published` podem ser enviadas. Anti-duplicidade pelo nome `edição-<slug>`.
- Workflow **Newsletter** (Actions → Run workflow, input `slug`) roda o script. O slug é validado (`^[a-z0-9-]+$`) e passado por env (nunca interpolado direto em `run:`).
- Remetente: `introducing.news <oi@introducing.news>`. Unsubscribe gerenciado pelo Resend.

### Deploy

- Push na `main` → workflow **Deploy**: `npm ci` → build (com envs do Keystatic) → `wrangler deploy`.
- Workflow **Publicar batch**: acionado por commits em `src/content/posts/**` e por cron (segundas e quintas, 09:00 BRT); só age quando há edição programada, vencida e completa (ver "Conteúdo").
- Domínio customizado `introducing.news` anexado ao Worker `introducing-news`; assets servidos de `dist/client`.
- **Staging**: `npm run deploy:staging` publica o build local no Worker `introducing-news-staging`, servido em `https://staging.introducing.news` (domínio customizado; regra de resposta `X-Robots-Tag: noindex, nofollow` no Cloudflare impede indexação). O staging tem `RESEND_API_KEY`, `RESEND_SEGMENT_ID` (segmento **staging** no Resend — contatos de teste não entram na audiência real) e `TURNSTILE_SECRET_KEY` próprios; sem `KEYSTATIC_*` o CMS não funciona lá. O hostname do staging está liberado no widget do Turnstile.
- **CMS**: `https://cms.introducing.news` → 302 para `https://introducing.news/keystatic` (Redirect Rule da zona + DNS `cms` proxied, ambos configurados fora do repo, em Cloudflare › Rules › Redirect Rules). O login do GitHub continua no domínio principal — por isso é redirect, e não um domínio próprio no Worker.
- URLs antigas de quando o site era bilíngue redirecionam 301 pelo `src/middleware.ts` (`/pt/*`, `/en/*` → rotas atuais). Preferimos middleware a `_redirects` porque o casamento com splat do `_redirects` se mostrou imprevisível para caminhos compostos.

## Armadilhas conhecidas (aprendidas na prática)

1. **Keystatic — modo de storage é decisão de build.** Use `import.meta.env.PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` no `keystatic.config.ts`. Se usar `process.env`, o browser não tem `process` → UI em modo local enquanto a API roda em modo GitHub → erro `"Not Found" is not valid JSON` ao abrir coleção.
2. **`astro preview` é daemon** (Astro 7): use `stop`/`status`/`logs`. Um preview antigo pode responder no lugar do build novo.
3. **Adapter v14**: assets em `dist/client`, worker em `dist/server`. `dist/server/.dev.vars` existe no build local (gitignored) e **não** é servido (404), mas nunca comite `dist/`.
4. **Tipos**: rode `npm run types` após alterar `wrangler.jsonc`/`.dev.vars`, senão o `astro check` acusa `env.X` inexistente.
5. **Resend pós-nov/2025**: Audiences viraram Segments; Broadcast usa `segment_id`; propriedades de contato só gravam se a chave existir (`locale` e `consent_at` foram criadas via API).
6. **Verificação de domínio** pode precisar de novo ciclo ("Restart verification") por cache de resolvedor. O CNAME `rsend` precisa estar **DNS only** no Cloudflare.
7. **Actions**: nunca interpole `${{ inputs.* }}` diretamente em `run:` (injeção de shell) — passe por `env`.
8. **Doppler**: o perfil global desta máquina aponta para outro projeto; sempre use `-p introducing-news -c dev_personal` (ou o `doppler.yaml` do repo).
9. **Batch → Deploy**: push feito com `GITHUB_TOKEN` dentro do Actions não dispara outros workflows. O `publish.yml` aciona o Deploy explicitamente (`gh workflow run deploy.yml`), o que exige a permissão `actions: write`.

## Decisões de escopo

- **Só em português.** O projeto nasceu bilíngue e foi simplificado: sem i18n, sem seletor de idioma, sem subpastas de locale. Não reintroduza `src/i18n/` sem decisão explícita.
- **Sem página "Sobre"** (o CTA de LinkedIn no rodapé cobre o objetivo) e **sem grade de "edições anteriores"** na home — só a última edição + botão para o arquivo.
- **Pendências e melhorias vivem em issues** (labels `security`, `produto`, `infra`, `opcional`), não em arquivo no repo.
- **Sem double opt-in por ora** (prioridade em conversão): consentimento explícito + Turnstile + rate limit cobrem o essencial — ver issue correspondente.

## Segurança

- Antes de commitar: `git diff --cached | grep -E "re_[A-Za-z0-9]{20,}|0x4AAAAA|ghp_|dp\."` (deve ser vazio).
- `.dev.vars`, `.env*`, `dist/`, `.wrangler/` são gitignored — mantenha assim.
- `worker-configuration.d.ts` contém apenas **nomes** de variáveis; pode ser versionado.
- Formulário: e-mail validado, consentimento obrigatório, Turnstile e rate limit por IP; a API **não** expõe nenhum endpoint de leitura de contatos.
- `public/_headers` aplica CSP, HSTS, `nosniff`, `Referrer-Policy` e `frame-ancestors 'none'`. Ao adicionar scripts/iframes/fontes externas, atualize a CSP junto.
- A `RESEND_API_KEY` é full-access (precisa escrever contatos). Mantenha-a somente em segredos; se vazar, rotacione imediatamente.
- Keystatic em produção exige login GitHub com acesso de escrita ao repositório (GitHub App com `Contents: Read and write`).

## Upgrades

1. `npm outdated` → atualize com parcimônia, mantendo os pares compatíveis: `@astrojs/cloudflare` 14 ↔ Astro 7; `@keystatic/astro` 6 ↔ Astro 5/6/7; React 19 (usado só pelo CMS).
2. `npm run check` → `npm run build` → smoke test com `npm run preview` (home, arquivo, post, RSS, `/keystatic`, `POST /api/subscribe` com e-mail inválido).
3. `npm run types` se `wrangler.jsonc`/`.dev.vars` mudarem.
4. `npm audit` — vulnerabilidades em `wrangler`/`miniflare`/`sharp` são tooling de build; avalie antes de forçar correções.
5. Deploy via push na `main` e confira o workflow.

## Referências

- Pendências e melhorias: [issues do repositório](https://github.com/daviccarneiro/introducing.news/issues).
- Figma: arquivo "introducing.news — Design" (Fundações/Componentes/Telas; tokens espelhados no CSS).
- Painéis: Resend (Domains/Contacts/Segments), Cloudflare (Worker `introducing-news`, Turnstile, DNS), Doppler (projeto `introducing-news`).
- Rotas de API: `POST /api/subscribe` (inscrição), `/api/keystatic/*` (CMS), `/keystatic` (admin).
