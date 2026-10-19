export const prerender = false;

import type { APIRoute } from 'astro';
import { editionEmail, getEdition } from '../../../lib/editions';
import { SITE, validPreviewToken } from '../../../lib/telegram';

/**
 * Prévia do e-mail da edição, com o mesmo HTML que o envio monta
 * (`scripts/compose-email.mjs`). Só abre com `?t=<token>` do próprio slug.
 */
export const GET: APIRoute = ({ params, url }) => {
  const slug = params.slug ?? '';
  if (!validPreviewToken(slug, url.searchParams.get('t'))) return new Response('Not found', { status: 404 });
  const edition = getEdition(slug);
  if (!edition) return new Response('Not found', { status: 404 });

  const headers = {
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex, nofollow',
    'Referrer-Policy': 'no-referrer',
  };
  const email = editionEmail(edition, SITE);
  if (!email) {
    return new Response('A edição está sem título, resumo ou assinatura: o e-mail não pode ser montado.', {
      status: 422,
      headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  return new Response(email.html, { headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' } });
};
