// @ts-check
import { defineConfig, envField } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import keystatic from '@keystatic/astro';
import sentry from '@sentry/astro';

export default defineConfig({
  site: 'https://introducing.news',
  output: 'static',
  session: false,
  env: {
    schema: {
      // Keystatic em modo GitHub (edição pela web). Opcionais: sem eles o CMS
      // roda em modo local no desenvolvimento.
      KEYSTATIC_GITHUB_CLIENT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      KEYSTATIC_GITHUB_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      KEYSTATIC_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      PUBLIC_KEYSTATIC_GITHUB_APP_SLUG: envField.string({ context: 'client', access: 'public', optional: true }),
      // Resend (inscrição/descadastro no site).
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      RESEND_SEGMENT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Senha do painel de métricas (/painel, Basic Auth). Sem ela, o painel
      // responde 404.
      DASHBOARD_PASSWORD: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Cloudflare Turnstile (CAPTCHA) na inscrição — o widget funciona em
      // qualquer hospedagem; só o `siteverify` é chamado pelo servidor.
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', optional: true }),
      // Google Tag Manager (carrega Clarity e demais tags). Só em produção:
      // sem a variável nenhum script de terceiro é injetado (dev/staging).
      PUBLIC_GTM_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      // Sentry (erros no navegador e nas funções). O DSN é público por
      // natureza; sem ele nada é enviado. O token só existe no build.
      PUBLIC_SENTRY_DSN: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_SENTRY_ENVIRONMENT: envField.string({ context: 'client', access: 'public', optional: true }),
      SENTRY_AUTH_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  // `middlewareMode: 'edge'` faz o middleware (redirects de /pt e /en) rodar em
  // todas as requisições, inclusive nas páginas pré-renderizadas.
  adapter: netlify({ middlewareMode: 'edge' }),
  integrations: [
    react(),
    mdx(),
    keystatic(),
    sentry({
      // Source maps: o token vem do ambiente e sem ele o upload é pulado.
      org: 'davi-carneiro',
      project: 'introducing-news',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
      // Os maps são gerados como `hidden`, sobem com debug IDs e não devem
      // ficar publicados em `dist/`.
      sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
      // O middleware do Sentry depende do `@sentry/node`, que não roda na
      // Edge Function do Netlify (middlewareMode: 'edge' — ver AGENTS.md).
      autoInstrumentation: { requestHandler: false },
    }),
  ],
});
