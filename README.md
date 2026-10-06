# introducing.news

Newsletter sobre tecnologia, sem o ruído do hype — site estático com edições publicadas na web e enviadas por e-mail.

## Stack

| Camada | Ferramenta |
| --- | --- |
| Site | [Astro 7](https://astro.build) (content collections + MDX) |
| CMS | [Keystatic](https://keystatic.com) — modo local no dia a dia; modo GitHub opcional |
| Hospedagem | [Cloudflare Workers](https://developers.cloudflare.com/workers/) (`@astrojs/cloudflare`) |
| E-mail | [Resend](https://resend.com) — Audiences (contatos) + Broadcasts (envios) |
| Segredos | [Doppler](https://doppler.com) (local) + GitHub Actions secrets (CI) |
| Deploy | GitHub Actions → `wrangler deploy` |

Design: arquivo `introducing.news — Design` no Figma. Os tokens (cores, tipografia, espaçamento, raios) estão espelhados em `src/styles/tokens.css`.

## Estrutura

```
src/
  content.config.ts        # schema das edições (Astro content collections)
  content/posts/*.mdx      # as edições em si
  pages/
    index.astro            # home
    ensaios/index.astro    # arquivo de todas as edições
    ensaios/[...slug].astro# página da edição
    rss.xml.ts             # feed RSS
    api/subscribe.ts       # inscrição (Resend Audience) — on-demand
keystatic.config.ts        # CMS (schema dos campos do editor)
scripts/send-newsletter.mjs# disparo do Broadcast via Resend
wrangler.jsonc             # configuração do Worker
```

## Desenvolvimento

```bash
# segredos via Doppler (projeto introducing-news, config dev_personal)
doppler run -- npm run dev

# ou, sem Doppler, crie um .dev.vars (gitignored) a partir de .env.example
npm run dev
```

O CMS fica em `http://127.0.0.1:4321/keystatic` (modo local: salva direto em `src/content/posts/`).

```bash
npm run check    # typecheck
npm run build    # build de produção
npm run preview  # preview no runtime do Workers (workerd)
```

## Segredos

Nunca commite valores. O repositório é público.

- **Local**: Doppler (`doppler.yaml` aponta para `introducing-news/dev_personal`) ou `.dev.vars`.
- **GitHub Actions** (Settings → Secrets and variables → Actions):
  - `RESEND_API_KEY`
  - `RESEND_AUDIENCE_ID`
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`
- **Runtime do Worker** (produção): `npx wrangler secret put RESEND_API_KEY` e `npx wrangler secret put RESEND_AUDIENCE_ID`.
  Depois de definir/alterar segredos manualmente, rode `npx wrangler deploy` novamente — o `secret put` sozinho publica uma versão sem a configuração de assets gerada pelo adapter.

## Enviar uma edição por e-mail

1. Publique a edição (crie o `.mdx` no CMS e faça push).
2. Rode o workflow **Newsletter** no GitHub (Actions → Newsletter → Run workflow) informando o slug.
   - Localmente: `doppler run -- node scripts/send-newsletter.mjs <slug>`.
3. O script usa Broadcasts do Resend e é idempotente: não envia a mesma edição duas vezes (nome `edição-<slug>`).

O Resend gerencia o link de descadastro automaticamente em cada Broadcast.

## Pendências de infraestrutura

- [ ] **DNS do domínio de envio**: adicionar no Cloudflare os registros do domínio `introducing.news` criado no Resend (DKIM, SPF e return-path). Enquanto não verificar, os envios usam o domínio `davi.cc`.
- [ ] **Segredos de deploy**: criar `CLOUDFLARE_API_TOKEN` (permissão Workers Scripts:Edit) e `CLOUDFLARE_ACCOUNT_ID` e salvar nos secrets do repositório.
- [ ] **Domínio customizado** (opcional): anexar `introducing.news` ao Worker (Cloudflare → Workers → introducing-news → Settings → Domains & Routes).
- [ ] **Keystatic em produção (opcional)**: criar um GitHub OAuth App, definir `KEYSTATIC_GITHUB_CLIENT_ID`/`KEYSTATIC_GITHUB_CLIENT_SECRET` no Worker e criar um KV namespace `SESSION` para editar pela web.
- [ ] **Double opt-in** (opcional): habilitar confirmação por e-mail na inscrição.
