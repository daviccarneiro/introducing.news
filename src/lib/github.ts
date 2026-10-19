import { GITHUB_CONTENTS_TOKEN } from 'astro:env/server';
import { parseFrontmatter } from '../../scripts/frontmatter.mjs';
import { replaceStatus } from './editorial.mjs';
import { missingFields, postHashOf } from './editions';

/**
 * Troca o status de uma edição com um commit na `main` pela API do GitHub
 * (o mesmo efeito de mudar o status no Keystatic). O push dispara o workflow
 * "Publicar batch" e o build da Netlify, como qualquer commit de conteúdo.
 */
const REPO = 'daviccarneiro/introducing.news';
const BRANCH = 'main';

export type StatusChange =
  | { ok: true; commitUrl: string }
  | { ok: false; reason: 'no-token' | 'changed' | 'status' | 'incomplete' | 'error'; detail?: string };

const github = (path: string, init: RequestInit = {}) =>
  fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GITHUB_CONTENTS_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'introducing.news-telegram',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });

export async function changeStatus({
  slug,
  postHash,
  from,
  to,
  message,
}: {
  slug: string;
  /** Versão aprovada na prévia: se o arquivo mudou desde então, nada é commitado. */
  postHash: string;
  from: string[];
  to: string;
  message: string;
}): Promise<StatusChange> {
  if (!GITHUB_CONTENTS_TOKEN) return { ok: false, reason: 'no-token' };
  const path = `src/content/posts/${slug}.mdx`;
  try {
    const current = await github(`/contents/${path}?ref=${BRANCH}`);
    if (!current.ok) return { ok: false, reason: 'error', detail: `GET ${current.status}` };
    const file = (await current.json()) as { content: string; sha: string };
    const raw = Buffer.from(file.content, 'base64').toString('utf8');

    if (postHashOf(raw) !== postHash) return { ok: false, reason: 'changed' };
    const { data } = parseFrontmatter(raw);
    const status = typeof data.status === 'string' ? data.status : 'draft';
    if (to === 'scheduled') {
      const missing = missingFields(data);
      if (missing.length > 0) return { ok: false, reason: 'incomplete', detail: missing.join(', ') };
    }
    const next = replaceStatus(raw, from, to);
    if (next === null) return { ok: false, reason: 'status', detail: status };

    const update = await github(`/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content: Buffer.from(next, 'utf8').toString('base64'),
        sha: file.sha,
        branch: BRANCH,
      }),
    });
    // 409: alguém commitou o arquivo entre a leitura e a escrita.
    if (update.status === 409) return { ok: false, reason: 'changed' };
    if (!update.ok) return { ok: false, reason: 'error', detail: `PUT ${update.status}` };
    const result = (await update.json()) as { commit?: { html_url?: string } };
    return { ok: true, commitUrl: result.commit?.html_url ?? '' };
  } catch (error) {
    return { ok: false, reason: 'error', detail: error instanceof Error ? error.message : String(error) };
  }
}
