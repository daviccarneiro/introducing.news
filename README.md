# introducing.news

Newsletter em português com curadoria de novidades de tecnologia: novos modelos de IA, ferramentas recém-lançadas, as discussões da área e os eventos que vêm por aí. Curadoria de professores e profissionais.

> Para agentes de código e manutenção (arquitetura, segredos, armadilhas e upgrades): veja [`AGENTS.md`](./AGENTS.md).

## Stack

| Camada | Ferramenta |
| --- | --- |
| Site | [Astro 7](https://astro.build) (content collections + MDX) |
| CMS | [Keystatic](https://keystatic.com) — modo local em dev; modo GitHub em produção |
| Hospedagem | [Cloudflare Workers](https://developers.cloudflare.com/workers/) (`@astrojs/cloudflare`) |
| E-mail | [Resend](https://resend.com) — Contacts + Segment + Broadcasts |
| Segredos | [Doppler](https://doppler.com) (local) + GitHub Actions secrets (CI) |
| Deploy | GitHub Actions → `wrangler deploy` |

Design: arquivo `introducing.news — Design` no Figma. Os tokens (cores, tipografia, espaçamento, raios) estão espelhados em `src/styles/tokens.css`.

## Estrutura

```
src/
  copy.ts                  # todo o texto da interface, com t()
  content/posts/*.mdx      # as edições
  views/                   # HomeView, ArchiveView, PostView, rss
  pages/
    index.astro            # home (com o formulário de inscrição)
    arquivo/index.astro    # arquivo de todas as edições
    arquivo/[...slug].astro# página da edição
    rss.xml.ts             # feed RSS
    api/subscribe.ts       # inscrição (Resend)
keystatic.config.ts        # CMS (coleção "Edições")
scripts/send-newsletter.mjs# disparo do Broadcast via Resend
wrangler.jsonc             # configuração do Worker
```

O site é **só em português**. URLs antigas de quando havia versão em inglês redirecionam 301 (`/pt/*`, `/en/*` → equivalentes em português).

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
npm run preview  # preview no runtime do Workers (workerd, roda como daemon: `astro preview stop`)
```

## Segredos

Nunca commite valores. O repositório é público.

- **Local**: Doppler (`doppler.yaml` aponta para `introducing-news/dev_personal`) ou `.dev.vars`.
- **GitHub Actions** (Settings → Secrets and variables → Actions):
  - Secrets: `RESEND_API_KEY`, `RESEND_SEGMENT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`
  - Variables: `KEYSTATIC_GITHUB_APP_SLUG`, `PUBLIC_TURNSTILE_SITE_KEY`
- **Runtime do Worker** (produção): `npx wrangler secret put RESEND_API_KEY`, `RESEND_SEGMENT_ID`, `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, `TURNSTILE_SECRET_KEY`.
  Depois de definir/alterar segredos manualmente, rode `npx wrangler deploy` novamente — o `secret put` sozinho publica uma versão sem a configuração de assets gerada pelo adapter.

No Resend, a audiência fica em um **segmento único** e cada contato recebe as propriedades `locale` e `consent_at`. O formulário exige **consentimento explícito** (checkbox) e passa pelo **Cloudflare Turnstile** (anti-bot) antes de inscrever o contato.

## Enviar uma edição por e-mail

1. Publique a edição (no CMS ou criando o `.mdx` em `src/content/posts/`) e faça push.
2. Rode o workflow **Newsletter** no GitHub (Actions → Newsletter → Run workflow) informando o slug.
   - Localmente: `doppler run -- node scripts/send-newsletter.mjs <slug>` (use `--dry-run` para simular).
3. O script é idempotente: não envia a mesma edição duas vezes (nome `edição-<slug>`).

O Resend gerencia o link de descadastro automaticamente em cada Broadcast.

## CMS em produção (Keystatic · modo GitHub) — opcional

Para editar pela web em `https://introducing.news/keystatic`:

1. Crie um **GitHub App** (Settings → Developer settings → GitHub Apps → New):
   - Homepage URL: `https://introducing.news`
   - Callback URLs: `https://introducing.news/api/keystatic/github/oauth/callback` e `http://127.0.0.1:4321/api/keystatic/github/oauth/callback`
   - Permissions → Repository permissions: **Contents: Read and write** (Metadata: Read vem por padrão)
   - Instale o app apenas no repositório `daviccarneiro/introducing.news`
2. Guarde o **Client ID**, um **Client Secret** e o **slug** do app.
3. Configure:
   - Doppler/Worker (runtime): `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET` (string aleatória com 32+ caracteres).
   - GitHub Actions: secrets `KEYSTATIC_GITHUB_CLIENT_ID` / `KEYSTATIC_GITHUB_CLIENT_SECRET` e a variable `KEYSTATIC_GITHUB_APP_SLUG`.
4. Faça deploy. O Keystatic passa a autenticar via GitHub e commita direto no repositório.

Sem essas credenciais o CMS roda em modo local (`npm run dev` → `/keystatic`), salvando arquivos no disco.

## Pendências

Pendências e melhorias são acompanhadas nas **[issues do repositório](https://github.com/daviccarneiro/introducing.news/issues)** — labels `security`, `produto`, `infra` e `opcional`.
