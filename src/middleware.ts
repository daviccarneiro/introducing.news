import { defineMiddleware } from 'astro:middleware';

/**
 * Roteamento de idioma é manual e a detecção fica em `src/pages/index.ts`
 * (cookie → IP → Accept-Language). Este middleware existe apenas para
 * satisfazer o requisito do Astro no modo `i18n.routing: 'manual'`.
 */
export const onRequest = defineMiddleware((_context, next) => next());
