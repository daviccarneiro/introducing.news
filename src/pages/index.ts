export const prerender = false;

import type { APIRoute } from 'astro';
import { DEFAULT_LOCALE, PT_COUNTRIES, isLocale, paths, type Locale } from '../i18n/config';

const redirect = (locale: Locale) =>
  new Response(null, {
    status: 302,
    headers: {
      Location: paths.home(locale),
      'Cache-Control': 'private, no-store',
      Vary: 'Accept-Language, cf-ipcountry',
    },
  });

/**
 * Detecção de idioma na raiz:
 *   1. cookie `lang` (escolha explícita do visitante);
 *   2. país do IP (header `cf-ipcountry`);
 *   3. header `Accept-Language` (fallback, ex.: desenvolvimento local);
 *   4. padrão pt.
 */
export const GET: APIRoute = ({ request, cookies }) => {
  const saved = cookies.get('lang')?.value;
  if (isLocale(saved)) return redirect(saved);

  const country = (request.headers.get('cf-ipcountry') ?? '').toUpperCase();
  if (country && country !== 'XX' && country !== 'T1') {
    return redirect(PT_COUNTRIES.has(country) ? 'pt' : 'en');
  }

  const accept = request.headers.get('accept-language') ?? '';
  if (/(^|[,\s])pt(\b|[-;])/i.test(accept)) return redirect('pt');
  if (/(^|[,\s])en(\b|[-;])/i.test(accept)) return redirect('en');

  return redirect(DEFAULT_LOCALE);
};
