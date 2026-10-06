import type { APIRoute } from 'astro';
import { getPosts } from '../lib/posts';

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const GET: APIRoute = async ({ site }) => {
  const posts = await getPosts();
  const base = site ?? new URL('https://introducing.news');

  const items = posts
    .map((post) => {
      const url = new URL(`/ensaios/${post.id}/`, base).href;
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
    <link>${base.href}</link>
    <description>Notas curtas sobre tecnologia, sem o ruído do hype.</description>
    <language>pt-BR</language>
    <atom:link href="${new URL('/rss.xml', base).href}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
