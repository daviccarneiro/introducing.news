# introducing.news

Newsletter bilíngue (PT/EN) sobre tecnologia, sem o ruído do hype — site estático com edições publicadas na web e enviadas por e-mail no idioma escolhido pelo leitor.

## Stack

| Camada | Ferramenta |
| --- | --- |
| Site | [Astro 7](https://astro.build) (content collections + MDX) |
| i18n | Nativo do Astro (`/pt/` e `/en/`) + detecção por IP no Worker |
| CMS | [Keystatic](https://keystatic.com) — uma coleção por idioma; modo local no dia a dia, GitHub opcional |
| Hospedagem | [Cloudflare Workers](https://developers.cloudflare.com/workers/) (`@astrojs/cloudflare`) |
| E-mail | [Resend](https://resend.com) — Contacts + Segments (PT/EN) + Broadcasts |
| Segredos | [Doppler](https://doppler.com) (local) + GitHub Actions secrets (CI) |
| Deploy | GitHub Actions → `wrangler deploy` |

Design: arquivo `introducing.news — Design` no Figma. Os tokens (cores, tipografia, espaçamento, raios) estão espelhados em `src/styles/tokens.css`.

### Idiomas

- Rotas com prefixo: `/pt/...` (padrão) e `/en/...` (arquivo em `/en/essays/`).
- A raiz `/` redireciona automaticamente, nesta ordem: cookie `lang` → país do IP (`cf-ipcountry`) → `Accept-Language` → `pt`.
- O seletor PT/EN no header grava a preferência em cookie via `/api/lang` (vale para a navegação, não só para o e-mail).
- Cada página publica `hreflang` (pt-BR, en, x-default) e canonical próprios.
- **Não usamos Weglot nem tradução automática de DOM**: cada idioma tem conteúdo próprio (arquivos e dicionário de UI em `src/i18n/`), o que é melhor para SEO, performance e qualidade editorial.

## Estrutura

```
src/
  i18n/                    # locales, dicionário de UI e utilitários
  content/posts/pt/*.mdx   # edições em português
  content/posts/en/*.mdx   # edições em inglês
  views/                   # HomeView, ArchiveView, PostView, rss
  pages/
    index.ts               # / → redirect por IP/cookie/idioma
    pt/…  en/…             # home, arquivo e posts por idioma
    api/subscribe.ts       # inscrição (Resend: segmento + propriedade locale)
    api/lang.ts            # troca de idioma (cookie + redirect)
keystatic.config.ts        # CMS: coleções "Edições · PT" e "Editions · EN"
scripts/send-newsletter.mjs# Broadcast por idioma, com par de traduções
wrangler.jsonc             # configuração do Worker
```

Cada edição pode ter uma tradução: o campo `translation` no frontmatter aponta para o slug do arquivo equivalente no outro idioma (e vice-versa). Sem tradução, a edição aparece só no idioma em que existe.

## Desenvolvimento

```bash
# segredos via Doppler (projeto introducing-news, config dev_personal)
doppler run -- npm run dev

# ou, sem Doppler, crie um .dev.vars (gitignored) a partir de .env.example
npm run dev
```

O CMS fica em `http://127.0.0.1:4321/keystatic` (modo local: salva direto em `src/content/posts/{pt,en}/`).

```bash
npm run check    # typecheck
npm run build    # build de produção
npm run preview  # preview no runtime do Workers (workerd, roda como daemon: `astro preview stop`)
```

## Segredos

Nunca commite valores. O repositório é público.

- **Local**: Doppler (`doppler.yaml` aponta para `introducing-news/dev_personal`) ou `.dev.vars`.
- **GitHub Actions** (Settings → Secrets and variables → Actions):
  - `RESEND_API_KEY`
  - `RESEND_SEGMENT_PT` / `RESEND_SEGMENT_EN`
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
- **Runtime do Worker** (produção): `npx wrangler secret put RESEND_API_KEY`, `RESEND_SEGMENT_PT`, `RESEND_SEGMENT_EN`.
  Depois de definir/alterar segredos manualmente, rode `npx wrangler deploy` novamente — o `secret put` sozinho publica uma versão sem a configuração de assets gerada pelo adapter.

No Resend, a audiência é dividida em dois **segments** (`PT` e `EN`) e cada contato recebe a propriedade `locale`. O formulário de inscrição permite escolher o idioma dos e-mails e a API inscreve o contato no segmento correspondente.

## Enviar uma edição por e-mail

1. Publique a edição (no CMS ou criando o `.mdx` em `src/content/posts/{pt,en}/`) e faça push.
2. Rode o workflow **Newsletter** no GitHub (Actions → Newsletter → Run workflow) informando o slug — pode ser o slug em qualquer um dos idiomas.
   - Localmente: `doppler run -- node scripts/send-newsletter.mjs <slug>` (use `--dry-run` para simular).
3. O script descobre o par de traduções, envia um Broadcast por idioma (segmentos PT/EN) e é idempotente: não envia a mesma edição duas vezes (nome `edição-<locale>-<slug>`).

O Resend gerencia o link de descadastro automaticamente em cada Broadcast.

## Pendências de infraestrutura

- [x] **DNS do domínio de envio**: registros adicionados e verificados no Resend — `introducing.news` está `verified` e envia por `introducing.news <oi@introducing.news>`.
- [x] **Segredos de deploy**: `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` configurados; o workflow Deploy publica automaticamente no push para `main`.
- [ ] **Domínio customizado** (opcional): anexar `introducing.news` ao Worker (Cloudflare → Workers → introducing-news → Settings → Domains & Routes).
- [ ] **Keystatic em produção (opcional)**: criar um GitHub OAuth App, definir `KEYSTATIC_GITHUB_CLIENT_ID`/`KEYSTATIC_GITHUB_CLIENT_SECRET` no Worker e criar um KV namespace `SESSION` para editar pela web.
- [ ] **Double opt-in** (opcional): habilitar confirmação por e-mail na inscrição.
