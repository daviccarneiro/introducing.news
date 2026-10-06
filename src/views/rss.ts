import { paths, type Locale } from '../i18n/config';
import { useTranslations } from '../i18n/ui';
import { getPosts, slugOf } from '../lib/posts';

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export async function buildRss(locale: Locale, site: URL | undefined): Promise<Response> {
  const posts = await getPosts(locale);
  const base = site ?? new URL('https://introducing.news');
  const t = useTranslations(locale);

  const items = posts
    .map((post) => {
      const url = new URL(paths.post(locale, slugOf(post)), base).href;
      return `    <item>
      <title>${escapeXml(post.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.data.description)}</description>
      <pubDate>${post.data.publishedAt.toUTCString()}</pubDate>
      <category>${escapeXml(post.data.category)}</category>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>introducing.news</title>
    <link>${new URL(paths.home(locale), base).href}</link>
    <description>${escapeXml(t('meta.rss.description'))}</description>
    <language>${locale === 'pt' ? 'pt-BR' : 'en'}</language>
    <atom:link href="${new URL(paths.rss(locale), base).href}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
