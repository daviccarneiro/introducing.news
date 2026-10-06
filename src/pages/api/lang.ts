export const prerender = false;

import type { APIRoute } from 'astro';
import { isLocale } from '../../i18n/config';

/** Troca de idioma: grava a preferência em cookie e redireciona. */
export const GET: APIRoute = ({ request, cookies, url }) => {
  const to = url.searchParams.get('to');
  const next = url.searchParams.get('next') ?? '/';

  if (!isLocale(to)) {
    return new Response('Invalid locale', { status: 400 });
  }

  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : `/${to}/`;

  cookies.set('lang', to, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    httpOnly: true,
  });

  void request;
  return new Response(null, {
    status: 302,
    headers: { Location: safeNext, 'Cache-Control': 'private, no-store' },
  });
};
