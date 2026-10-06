import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

export const CATEGORY_LABELS: Record<Post['data']['category'], string> = {
  ia: 'IA',
  ferramentas: 'Ferramentas',
  dados: 'Dados',
  ensaio: 'Ensaio',
  carreira: 'Carreira',
};

export async function getPosts({ includeDrafts = false } = {}): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => includeDrafts || !data.draft);
  return posts.sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

export function readingTime(post: Post): number {
  const words = (post.body ?? '').trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(date)
    .replace(/\./g, '')
    .toUpperCase();
}
