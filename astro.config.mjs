// @ts-check
import { defineConfig, envField } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import keystatic from '@keystatic/astro';

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
      // Cloudflare Turnstile (CAPTCHA) na inscrição — o widget funciona em
      // qualquer hospedagem; só o `siteverify` é chamado pelo servidor.
      TURNSTILE_SECRET_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      PUBLIC_TURNSTILE_SITE_KEY: envField.string({ context: 'client', access: 'public', optional: true }),
      // Google Tag Manager (carrega Clarity e demais tags). Só em produção:
      // sem a variável nenhum script de terceiro é injetado (dev/staging).
      PUBLIC_GTM_ID: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
  // `middlewareMode: 'edge'` faz o middleware (redirects de /pt e /en) rodar em
  // todas as requisições, inclusive nas páginas pré-renderizadas.
  adapter: netlify({ middlewareMode: 'edge' }),
  integrations: [react(), mdx(), keystatic()],
});
