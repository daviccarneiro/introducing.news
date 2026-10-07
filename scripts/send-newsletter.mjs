#!/usr/bin/env node
/**
 * Envia a edição para a audiência do Resend via Broadcast.
 *
 * Uso: node scripts/send-newsletter.mjs <slug> [--dry-run]
 *
 * O HTML/texto vêm de `email-template.mjs` (fonte de verdade do e-mail) e a
 * assinatura, de `src/content/authors/davi-carneiro.json`.
 *
 * Requer: RESEND_API_KEY + RESEND_SEGMENT_ID (opcionais: NEWSLETTER_FROM, SITE_URL).
 *
 * Anti-duplicidade: o nome do broadcast é `edição-<slug>` e é verificado antes
 * de criar um novo envio.
 */
import { readFile } from 'node:fs/promises';
import matter from 'gray-matter';
import { buildEmail } from './email-template.mjs';

const POSTS_DIR = new URL('../src/content/posts/', import.meta.url);
const AUTHORS_DIR = new URL('../src/content/authors/', import.meta.url);
const SITE = (process.env.SITE_URL ?? 'https://introducing.news').replace(/\/$/, '');
const FROM = process.env.NEWSLETTER_FROM ?? 'introducing.news <oi@introducing.news>';
const API_KEY = process.env.RESEND_API_KEY;
const SEGMENT_ID = process.env.RESEND_SEGMENT_ID;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const slug = (args.find((arg) => !arg.startsWith('--')) ?? '').trim();

if (!slug) {
  console.error('✖ Informe o slug da edição: node scripts/send-newsletter.mjs <slug>');
  process.exit(1);
}
if (!/^[a-z0-9-]+$/i.test(slug)) {
  console.error('✖ Slug inválido (use apenas letras, números e hífens).');
  process.exit(1);
}
if (!dryRun && (!API_KEY || !SEGMENT_ID)) {
  console.error('✖ Faltam RESEND_API_KEY e/ou RESEND_SEGMENT_ID no ambiente.');
  process.exit(1);
}

const api = async (path, options = {}) => {
  const response = await fetch(`https://api.resend.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Resend ${path} → ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
};

async function loadAuthor() {
  try {
    const raw = await readFile(new URL('davi-carneiro.json', AUTHORS_DIR), 'utf8');
    const author = JSON.parse(raw);
    if (author?.name) return { name: author.name, role: author.role ?? '', photo: author.photo };
  } catch {
    /* usa o fallback abaixo */
  }
  return { name: 'Davi Carneiro', role: '' };
}

const file = new URL(`${slug}.mdx`, POSTS_DIR);
let raw;
try {
  raw = await readFile(file, 'utf8');
} catch {
  console.error(`✖ Arquivo não encontrado: src/content/posts/${slug}.mdx`);
  process.exit(1);
}

const { data } = matter(raw);
if (data.draft === true) {
  console.error('✖ Esta edição está marcada como rascunho (draft: true). Publique antes de enviar.');
  process.exit(1);
}
if (!data.title || !data.description) {
  console.error('✖ Frontmatter sem title/description.');
  process.exit(1);
}

const name = `edição-${slug}`;

if (dryRun) {
  console.log(`◌ [dry-run] enviaria "${name}" para o segmento ${SEGMENT_ID ?? 'não configurado'}.`);
  process.exit(0);
}

const existing = await api('/broadcasts?limit=100');
if ((existing.data ?? []).some((broadcast) => broadcast.name === name)) {
  console.log(`✔ Broadcast "${name}" já existe — nada a fazer (anti-duplicidade).`);
  process.exit(0);
}

const author = await loadAuthor();
const url = `${SITE}/arquivo/${slug}/`;
const { html, text } = buildEmail({
  title: data.title,
  description: data.description,
  url,
  site: SITE,
  author,
});

const broadcast = await api('/broadcasts', {
  method: 'POST',
  body: JSON.stringify({
    segment_id: SEGMENT_ID,
    from: FROM,
    subject: data.title,
    name,
    preview_text: data.description,
    html,
    text,
    send: true,
  }),
});

console.log(`✔ "${name}" enviado para o segmento ${SEGMENT_ID} (id: ${broadcast.id}).`);
