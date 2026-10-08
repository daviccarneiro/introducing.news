import type { APIRoute } from 'astro';
import { getPosts } from '../lib/posts';

export const prerender = true;

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL('https://introducing.news')).origin;
  const posts = await getPosts();

  const entries = [
    `<url><loc>${escapeXml(`${base}/`)}</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${escapeXml(`${base}/arquivo/`)}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    ...posts.map((post) => {
      const loc = escapeXml(`${base}/arquivo/${post.id}/`);
      const lastmod = post.data.publishedAt.toISOString().slice(0, 10);
      return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`;
    }),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
