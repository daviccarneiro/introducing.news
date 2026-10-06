// @ts-check
import { defineConfig } from 'astro/config';
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
  adapter: cloudflare(),
  integrations: [react(), mdx(), keystatic()],
});
