# TODO — introducing.news

> Lista viva de pendências e melhorias. Itens concluídos ficam no fim, para histórico.
> Arquitetura, convenções e armadilhas: [AGENTS.md](./AGENTS.md).

## Segurança

- [ ] **Rate limiting no WAF do Cloudflare** para `POST /api/subscribe` (defesa em profundidade no edge).
      O token de deploy atual não tem permissão de WAF — criar a regra pelo painel (Security → WAF → Rate limiting rules).
      No Worker já existem: rate limit 5/10 min por IP (Cache API) + Turnstile + consentimento obrigatório.
- [ ] (Opcional) **Pinar GitHub Actions por SHA** em vez de tags de major (`@v7`), endurecendo a cadeia de suprimentos.
- [ ] (Opcional) **CSP sem `'unsafe-inline'`** — usar nonces/hashes para os scripts inline do Astro/Keystatic.
- [ ] **`npm audit`**: 9 vulnerabilidades (5 high) em tooling de build (`wrangler`, `miniflare`, `sharp`). Não afetam o runtime; acompanhar via Dependabot (`npm audit fix --force` faria upgrades major e quebraria os pares compatíveis).

## Produto

- [ ] **Double opt-in** (adiado de propósito: priorizar conversão). Consentimento explícito + Turnstile cobrem o essencial hoje; se bounces/reclamações subirem, implementar confirmação por e-mail com token.
- [ ] **`og:image` por edição** para compartilhamento (LinkedIn/WhatsApp), usando a capa (figura abstrata ou `coverImage`).
- [ ] **Otimização das imagens de capa** enviadas pelo CMS (converter para WebP/AVIF e gerar tamanhos responsivos).
- [ ] (Opcional) Página "Sobre" — removida por decisão de escopo (registro para não ser re-adicionada por engano).

## Operação e manutenção

- [ ] **Revisar PRs do Dependabot** semanalmente (npm + GitHub Actions).
      Regra: `typescript` major está **bloqueado** no `dependabot.yml` (TS 7 quebra o `@astrojs/check`, cujo peer é `^5 || ^6`).
- [ ] (Opcional) Callback do **GitHub App do Keystatic** para o domínio `*.workers.dev`, caso queira usar o CMS por lá (hoje só o domínio customizado).
- [ ] (Opcional) Limpar broadcasts de teste no histórico do Resend.

## Concluídos (histórico)

- [x] Segmento legado "General" removido do Resend (ficaram só `PT` e `EN`).
- [x] Headers de segurança em `public/_headers` (CSP, HSTS, `nosniff`, `frame-ancestors 'none'`, `Permissions-Policy`, `Referrer-Policy`).
- [x] Rate limit por IP no `/api/subscribe` (5/10 min, Cache API).
- [x] Dependabot com alertas de vulnerabilidade + correções automáticas habilitados.
- [x] Workflows com permissões mínimas (`contents: read`) e sem injeção de expressão (`inputs` via `env`).
- [x] `AGENTS.md` com arquitetura, segredos, armadilhas e checklist de upgrade.
