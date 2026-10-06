# AGENTS.md — introducing.news

> Guia para agentes de código e para o mantenedor. Leia antes de mexer no projeto.
> **Este repositório é público.** Nunca inclua segredos, chaves, tokens, cookies ou dados de assinantes em arquivos versionados, commits, issues, PRs, logs ou mensagens.

## Visão geral

Newsletter bilíngue (PT/EN) sobre tecnologia. Cada edição é publicada como página na web e enviada por e-mail **no idioma escolhido pelo leitor**. Domínio: `https://introducing.news` (Cloudflare Workers). Repositório: `daviccarneiro/introducing.news`.

## Stack

| Camada | Ferramenta | Observações |
| --- | --- | --- |
| Site | Astro 7 (`output: 'static'`) | conteúdo em content collections + MDX |
| i18n | Nativo do Astro (`routing: 'manual'`) | `/pt/...` e `/en/...`, detecção por IP no Worker |
| CMS | Keystatic (`@keystatic/core` 0.6 / `@keystatic/astro` 6) | modo local em dev; modo GitHub em produção |
| Hospedagem | Cloudflare Workers (`@astrojs/cloudflare` 14) | `nodejs_compat`; saída em `dist/client` + `dist/server` |
| E-mail | Resend (Contacts + Segments + Broadcasts) | domínio `introducing.news` verificado |
| Anti-bot | Cloudflare Turnstile | widget no formulário + `siteverify` no Worker |
| Segredos | Doppler (`introducing-news/dev_personal`) + GitHub secrets + Worker secrets | nunca em arquivo versionado |
| CI/CD | GitHub Actions → `wrangler deploy` | deploy automático a cada push na `main` |
| Design | Figma "introducing.news — Design" | tokens espelhados em `src/styles/tokens.css` |

## Estrutura

```
src/
  i18n/config.ts           # locales, paths localizados, categorias
  i18n/ui.ts               # dicionário PT/EN de toda a interface
  i18n/utils.ts            # locale da URL, troca de idioma, cookie
  content/posts/pt/*.mdx   # edições em português
  content/posts/en/*.mdx   # edições em inglês
  content.config.ts        # schema das edições (Astro)
  views/                   # HomeView, ArchiveView, PostView, rss
  pages/
    index.ts               # / → redirect por cookie/IP/Accept-Language
    pt/…  en/…             # home, arquivo, posts e RSS por idioma
    api/subscribe.ts       # inscrição (valida, rate-limit, Turnstile, Resend)
    api/lang.ts            # troca de idioma (cookie + redirect)
  components/              # SiteHeader, SiteFooter, PostCard, Cover, Badge,
                           # SubscribeForm, LanguageSwitch
  lib/posts.ts             # consultas, readingTime, formatDate
keystatic.config.ts        # CMS (coleções "Edições · PT" e "Editions · EN")
scripts/send-newsletter.mjs# disparo de Broadcast por idioma
public/_headers            # headers de segurança (CSP, HSTS, nosniff…)
public/_redirects          # 301 de /pt/ensaios/* → /pt/arquivo/*
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
| `node scripts/send-newsletter.mjs <slug> [--dry-run]` | envia a edição por e-mail (PT e/ou EN) |

Com segredos: `doppler run -p introducing-news -c dev_personal -- <comando>` (o `doppler.yaml` do repo já aponta para lá; nunca dependa do perfil global).

## Segredos e ambiente

Nunca commite valores. O repositório é público.

| Nome | Onde vive | Para que serve |
| --- | --- | --- |
| `RESEND_API_KEY` | Doppler, `.dev.vars`, Worker secret, GitHub secret | API do Resend (contatos + broadcasts). **Full-access** |
| `RESEND_SEGMENT_PT` / `RESEND_SEGMENT_EN` | idem | segmentos de idioma no Resend |
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

### i18n e detecção de idioma

- Rotas: `/pt/arquivo/…` (PT) e `/en/essays/…` (EN). `/pt/ensaios/*` redireciona 301 via `public/_redirects`.
- A raiz `/` (`src/pages/index.ts`) decide o idioma: cookie `lang` → `cf-ipcountry` (IP) → `Accept-Language` → `pt`.
- Troca de idioma: `/api/lang?to=&next=` grava cookie (1 ano) e redireciona. O seletor fica no **rodapé** (`LanguageSwitch.astro`).
- `src/i18n/ui.ts` concentra **todo** o texto da interface. Novos textos entram nos dois idiomas.
- Posts traduzidos se apontam pelo campo `translation` (slug do par no outro idioma); `Base.astro` emite hreflang/canonical/og:locale e recebe `alternate` para a troca exata.
- `i18n.routing: 'manual'` exige `src/middleware.ts` (passthrough) — não remova.

### Conteúdo

- `src/content/posts/{pt,en}/*.mdx`; schema em `src/content.config.ts`; no CMS, coleções `postsPt` e `postsEn`.
- Campos: `title`, `description`, `category`, `publishedAt`, `cover` (fig-01..03), `coverImage` (upload opcional → `public/images/covers/`), `translation`, `draft`.
- `draft: true` não aparece no site, RSS nem no envio.
- Imagem de capa preenchida sobrepõe a figura abstrata em todos os lugares (card, destaque, post).

### Inscrição (`POST /api/subscribe`)

1. Valida JSON, e-mail (regex + 254), consentimento explícito e idioma (obrigatório — o formulário não pré-seleciona).
2. Rate limit por IP (5/10 min, Cache API) e Turnstile `siteverify`.
3. Cria/atualiza contato no Resend com `properties: { locale, consent_at }` e segmento PT/EN. 409 → PATCH.

O formulário (`SubscribeForm.astro`) tem o fluxo e-mail → idioma → Assinar; o botão fica cinza até um idioma ser escolhido.

### Newsletter

- `scripts/send-newsletter.mjs <slug> [--dry-run]`: acha o par de traduções pelo campo `translation`, monta o e-mail (assunto/CTA localizados) e cria um Broadcast por segmento com `send: true`. Anti-duplicidade pelo nome `edição-<locale>-<slug>`.
- Workflow **Newsletter** (Actions → Run workflow, input `slug`) roda o script. O slug é validado (`^[a-z0-9-]+$`) e passado por env (nunca interpolado direto em `run:`).
- Remetente: `introducing.news <oi@introducing.news>`. Unsubscribe gerenciado pelo Resend.

### Deploy

- Push na `main` → workflow **Deploy**: `npm ci` → build (com envs do Keystatic) → `wrangler deploy`.
- Domínio customizado `introducing.news` anexado ao Worker `introducing-news`; assets servidos de `dist/client`.

## Armadilhas conhecidas (aprendidas na prática)

1. **Keystatic — modo de storage é decisão de build.** Use `import.meta.env.PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` no `keystatic.config.ts`. Se usar `process.env`, o browser não tem `process` → UI em modo local enquanto a API roda em modo GitHub → erro `"Not Found" is not valid JSON` ao abrir coleção.
2. **`astro preview` é daemon** (Astro 7): use `stop`/`status`/`logs`. Um preview antigo pode responder no lugar do build novo.
3. **Adapter v14**: assets em `dist/client`, worker em `dist/server`. `dist/server/.dev.vars` existe no build local (gitignored) e **não** é servido (404), mas nunca comite `dist/`.
4. **Tipos**: rode `npm run types` após alterar `wrangler.jsonc`/`.dev.vars`, senão o `astro check` acusa `env.X` inexistente.
5. **Resend pós-nov/2025**: Audiences viraram Segments; Broadcast usa `segment_id`; propriedades de contato só gravam se a chave existir (`locale` e `consent_at` foram criadas via API).
6. **Verificação de domínio** pode precisar de novo ciclo ("Restart verification") por cache de resolvedor — foi o que resolveu o par SPF. O CNAME `rsend` precisa estar **DNS only** no Cloudflare.
7. **Actions**: nunca interpole `${{ inputs.* }}` diretamente em `run:` (injeção de shell) — passe por `env`.
8. **Doppler**: o perfil global desta máquina aponta para outro projeto; sempre use `-p introducing-news -c dev_personal` (ou o `doppler.yaml` do repo).

## Segurança

- Antes de commitar: `git diff --cached | grep -E "re_[A-Za-z0-9]{20,}|0x4AAAAA|ghp_|dp\."` (deve ser vazio).
- `.dev.vars`, `.env*`, `dist/`, `.wrangler/` são gitignored — mantenha assim.
- `worker-configuration.d.ts` contém apenas **nomes** de variáveis; pode ser versionado.
- Formulário: e-mail validado, consentimento obrigatório, Turnstile e rate limit por IP; a API **não** expõe nenhum endpoint de leitura de contatos.
- Defesa em profundidade (opcional): criar uma regra de **rate limiting no WAF do Cloudflare** para `/api/subscribe` (o token de deploy atual não tem permissão de WAF; faça pelo painel).
- Dependabot ativo (`.github/dependabot.yml`): atualizações semanais de npm e GitHub Actions, com alertas de vulnerabilidade habilitados no repositório.
- `public/_headers` aplica CSP, HSTS, `nosniff`, `Referrer-Policy` e `frame-ancestors 'none'`. Ao adicionar scripts/iframes/fontes externas, atualize a CSP junto.
- A `RESEND_API_KEY` é full-access (precisa escrever contatos). Mantenha-a somente em segredos; se vazar, rotacione imediatamente.
- Keystatic em produção exige login GitHub com acesso de escrita ao repositório (GitHub App com `Contents: Read and write`).

## Upgrades

1. `npm outdated` → atualize com parcimônia, mantendo os pares compatíveis: `@astrojs/cloudflare` 14 ↔ Astro 7; `@keystatic/astro` 6 ↔ Astro 5/6/7; React 19 (usado só pelo CMS).
2. `npm run check` → `npm run build` → smoke test com `npm run preview` (home PT/EN, arquivo, post, RSS, `/keystatic`, `POST /api/subscribe` com e-mail inválido).
3. `npm run types` se `wrangler.jsonc`/`.dev.vars` mudarem.
4. `npm audit` — vulnerabilidades em `wrangler`/`miniflare`/`sharp` são tooling de build; avalie antes de forçar correções.
5. Deploy via push na `main` e confira o workflow.

## Referências

- Figma: arquivo "introducing.news — Design" (Fundações/Componentes/Telas; tokens espelhados no CSS).
- Painéis: Resend (Domains/Contacts/Segments), Cloudflare (Worker `introducing-news`, Turnstile, DNS), Doppler (projeto `introducing-news`).
- Rotas de API: `POST /api/subscribe` (inscrição), `GET /api/lang` (troca de idioma), `/api/keystatic/*` (CMS), `/keystatic` (admin).
