// @ts-check
import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import keystatic from '@keystatic/astro';

export default defineConfig({
  site: 'https://introducing.news',
  output: 'static',
  session: false,
  i18n: {
    defaultLocale: 'pt',
    locales: ['pt', 'en'],
    // Roteamento manual: nós mesmos redirecionamos a raiz com base em IP/idioma.
    // Mantém /keystatic e /api funcionando sem prefixo de locale.
    routing: 'manual',
  },
  env: {
    schema: {
      // Keystatic em modo GitHub (edição pela web). Opcionais: sem eles o CMS
      // roda em modo local no desenvolvimento.
      KEYSTATIC_GITHUB_CLIENT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      KEYSTATIC_GITHUB_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      KEYSTATIC_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      PUBLIC_KEYSTATIC_GITHUB_APP_SLUG: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
  adapter: cloudflare(),
  integrations: [react(), mdx(), keystatic()],
});
