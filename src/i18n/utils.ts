import { DEFAULT_LOCALE, LOCALES, OTHER, type Locale } from './config';

/** Descobre o locale a partir do caminho da URL (`/pt/...` ou `/en/...`). */
export function getLocale(url: URL): Locale {
  const segment = url.pathname.split('/')[1];
  return (LOCALES as readonly string[]).includes(segment)
    ? (segment as Locale)
    : DEFAULT_LOCALE;
}

/**
 * Caminho equivalente no outro idioma.
 * Passe `alternate` quando as rotas não forem simétricas (posts traduzidos).
 */
export function otherLocalePath(url: URL, alternate?: string): string {
  const locale = getLocale(url);
  const other = OTHER[locale];
  if (alternate) return alternate;
  const rest = url.pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '') || '/';
  return `/${other}${rest}`;
}

/** Link para trocar de idioma, salvando a preferência em cookie. */
export function languageSwitchHref(target: Locale, nextPath: string): string {
  return `/api/lang?to=${target}&next=${encodeURIComponent(nextPath)}`;
}
