import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/config';

export type Post = CollectionEntry<'posts'>;

/** Slug sem o prefixo de idioma (`pt/` ou `en/`). */
export function slugOf(post: Post): string {
  return post.id.replace(/^(pt|en)\//, '');
}

export async function getPosts(locale: Locale, { includeDrafts = false } = {}): Promise<Post[]> {
  const prefix = `${locale}/`;
  const posts = await getCollection(
    'posts',
    ({ id, data }) => id.startsWith(prefix) && (includeDrafts || !data.draft),
  );
  return posts.sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

/** Edição equivalente no outro idioma, quando houver (`translation` no frontmatter). */
export async function getTranslation(post: Post, locale: Locale): Promise<Post | null> {
  const slug = post.data.translation;
  if (!slug) return null;
  const other: Locale = locale === 'pt' ? 'en' : 'pt';
  const all = await getCollection('posts');
  return (
    all.find((entry) => entry.id === `${other}/${slug}` && !entry.data.draft) ?? null
  );
}

export function readingTime(post: Post): number {
  const words = (post.body ?? '').trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(date)
    .replace(/\./g, '')
    .toUpperCase();
}
