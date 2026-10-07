import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export type Author = CollectionEntry<'authors'>;

export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => data.status === 'published');
  return posts.sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

/** Autor que assina a edição, quando cadastrado (`signature` no frontmatter). */
export async function getAuthor(post: Post): Promise<Author | null> {
  const slug = post.data.signature;
  if (!slug) return null;
  return (await getEntry('authors', slug)) ?? null;
}

/** Iniciais para o avatar sem foto (ex.: "Davi Carneiro" → "DC"). */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function readingTime(post: Post): number {
  const words = (post.body ?? '').trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatDate(date: Date): string {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(date)
    .replace(/\./g, '');
  return formatted.replace(/\s+de\s+/g, ' ').toLowerCase();
}
