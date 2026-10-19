import { createHash } from 'node:crypto';
import { parseFrontmatter } from '../../scripts/frontmatter.mjs';
import { composeEmail, pickEmail } from '../../scripts/compose-email.mjs';
import { readingMinutes } from './reading-time.mjs';
import { batchDayFor, countVisuals, isoDay, placeholdersIn, saoPauloClock } from './editorial.mjs';

/**
 * Edições lidas do arquivo-fonte (frontmatter + MDX cru), como os scripts as
 * leem: a prévia do e-mail sai idêntica à do `send-newsletter.mjs`, e o
 * hash do arquivo bate com o que a API do GitHub devolve na aprovação.
 * Só para rotas do servidor (prévias e bot do Telegram).
 */
const postFiles = import.meta.glob<string>('/src/content/posts/*.mdx', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const emailFiles = import.meta.glob<string>('/src/content/emails/*.mdx', {
  query: '?raw',
  import: 'default',
  eager: true,
});
/** Pontos para o mantenedor revisar (sugestões, dúvidas, fonte única): vão pelo Telegram, nunca no texto. */
const noteFiles = import.meta.glob<string>('/editorial/notes/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const authorFiles = import.meta.glob<{ name?: string; role?: string; photo?: string }>(
  '/src/content/authors/*.json',
  { import: 'default', eager: true },
);

type Data = Record<string, any>;

export interface Edition {
  slug: string;
  data: Data;
  content: string;
  status: string;
  /** `publishedAt` em AAAA-MM-DD (null se faltar). */
  day: string | null;
  minutes: number;
  /** Gráficos e imagens no corpo. */
  visuals: number;
  /** Trechos de placeholder na edição ou no e-mail (deveria ser vazio). */
  placeholders: string[];
  /** Pontos de revisão de `editorial/notes/<slug>.md`, um por item. */
  notes: string[];
  /** Hash do arquivo da edição sem a linha de status (aprovar não muda a versão). */
  postHash: string;
  /** Hash da edição + e-mail: muda quando qualquer um dos dois é editado. */
  version: string;
}

/** Itens de uma lista Markdown (`- ...`), com as linhas de continuação juntadas. */
export function noteItems(markdown: string): string[] {
  const items: string[] = [];
  for (const line of String(markdown).split(/\r?\n/)) {
    const item = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/);
    if (item) items.push(item[1].trim());
    else if (line.trim() && items.length > 0 && !line.startsWith('#')) items[items.length - 1] += ` ${line.trim()}`;
  }
  return items.filter(Boolean);
}

const baseName = (path: string) => path.slice(path.lastIndexOf('/') + 1).replace(/\.(mdx|json)$/, '');
const sha = (value: string) => createHash('sha256').update(value).digest('hex');

/** Hash do arquivo-fonte sem a linha `status:` do frontmatter. */
export function postHashOf(raw: string): string {
  const source = String(raw).replace(/\r\n/g, '\n');
  const match = source.match(/^---\n([\s\S]*?)\n---(\n|$)/);
  const stripped = match
    ? source.replace(match[1], match[1].replace(/^status:.*(\n|$)/m, ''))
    : source;
  return sha(stripped).slice(0, 16);
}

const emails = Object.entries(emailFiles)
  .map(([path, raw]) => ({ name: `${baseName(path)}.mdx`, raw, ...parseFrontmatter(raw) }))
  .sort((a, b) => a.name.localeCompare(b.name));

const editions: Edition[] = Object.entries(postFiles).map(([path, raw]) => {
  const slug = baseName(path);
  const { data, content } = parseFrontmatter(raw);
  const postHash = postHashOf(raw);
  const emailRaw = emails
    .filter((email) => email.data?.edition === slug)
    .map((email) => email.raw)
    .join('\n');
  const notesRaw = Object.entries(noteFiles).find(([notePath]) => baseName(notePath) === slug)?.[1] ?? '';
  return {
    slug,
    data,
    content,
    status: typeof data.status === 'string' ? data.status : 'draft',
    day: isoDay(data.publishedAt),
    minutes: readingMinutes(content),
    visuals: countVisuals(content),
    placeholders: [...new Set([...placeholdersIn(raw), ...placeholdersIn(emailRaw)])],
    notes: noteItems(notesRaw),
    postHash,
    version: sha(`${postHash}\n${emailRaw}\n${notesRaw}`).slice(0, 16),
  };
});

export function getEdition(slug: string): Edition | null {
  return editions.find((edition) => edition.slug === slug) ?? null;
}

export function findByPostHash(hash: string): Edition | null {
  return editions.find((edition) => edition.postHash === hash) ?? null;
}

/** Esperando aprovação: rascunho ou em revisão, com batch de hoje em diante. */
export function pendingEditions(clock = saoPauloClock()): Edition[] {
  return editions
    .filter((edition) => edition.status === 'draft' || edition.status === 'review')
    .filter((edition) => edition.day !== null && batchDayFor(edition.day) >= clock.today)
    .sort((a, b) => (a.day ?? '').localeCompare(b.day ?? ''));
}

/** Campos que o batch exige para publicar (mesma regra do `publish-batch.mjs`). */
export function missingFields(data: Data): string[] {
  const missing = ['title', 'description', 'signature'].filter((key) => !data[key]);
  if (!isoDay(data.publishedAt)) missing.push('publishedAt');
  return missing;
}

export function authorOf(edition: Edition) {
  const signature = edition.data.signature;
  if (!signature) return null;
  const author = Object.entries(authorFiles).find(([path]) => baseName(path) === signature)?.[1];
  return author?.name ? { name: author.name, role: author.role ?? '', photo: author.photo } : null;
}

/** E-mail da edição exatamente como o envio monta (ou null sem assinatura). */
export function editionEmail(edition: Edition, site: string) {
  const author = authorOf(edition);
  if (!author || !edition.data.title || !edition.data.description) return null;
  const { email, warnings } = pickEmail(emails, edition.slug);
  const composed = composeEmail({ slug: edition.slug, post: edition.data, email, author, site });
  return { ...composed, emailName: email?.name ?? null, warnings: [...warnings, ...composed.warnings] };
}
