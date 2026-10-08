export const prerender = false;

import type { APIRoute } from 'astro';
import { getPosts } from '../lib/posts';

/** Redireciona para a edição publicada mais recente (ou para o arquivo, se não houver nenhuma). */
export const GET: APIRoute = async ({ redirect }) => {
  const [latest] = await getPosts();
  return redirect(latest ? `/arquivo/${latest.id}/` : '/arquivo/', 302);
};
