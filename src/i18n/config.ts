export const LOCALES = ['pt', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'pt';
export const OTHER: Record<Locale, Locale> = { pt: 'en', en: 'pt' };
export const LOCALE_LABELS: Record<Locale, string> = { pt: 'Português', en: 'English' };
export const HTML_LANG: Record<Locale, string> = { pt: 'pt-BR', en: 'en' };
export const OG_LOCALE: Record<Locale, string> = { pt: 'pt_BR', en: 'en_US' };

/** Países cujo idioma padrão é português (detecção por IP/geo). */
export const PT_COUNTRIES = new Set(['BR', 'PT', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL']);

export const CATEGORIES = ['ia', 'ferramentas', 'dados', 'ensaio', 'carreira'] as const;
export type Category = (typeof CATEGORIES)[number];

export const paths = {
  home: (locale: Locale) => `/${locale}/`,
  archive: (locale: Locale) => (locale === 'pt' ? '/pt/ensaios/' : '/en/essays/'),
  post: (locale: Locale, slug: string) =>
    locale === 'pt' ? `/pt/ensaios/${slug}/` : `/en/essays/${slug}/`,
  rss: (locale: Locale) => (locale === 'pt' ? '/pt/rss.xml' : '/en/rss.xml'),
};

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'pt' || value === 'en';
}
