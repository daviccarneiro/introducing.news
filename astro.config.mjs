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
  adapter: cloudflare(),
  integrations: [react(), mdx(), keystatic()],
});
