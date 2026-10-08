#!/usr/bin/env node
/**
 * Envia a edição para a audiência do Resend via Broadcast.
 *
 * Uso: node scripts/send-newsletter.mjs <slug> [--dry-run] [--preview]
 *
 * --preview renderiza o e-mail real (com o conteúdo da coleção "E-mails") e
 * grava um HTML no diretório temporário para abrir no navegador, sem enviar.
 *
 * O HTML/texto vêm de `email-template.mjs` (fonte de verdade do e-mail) e a
 * assinatura, do campo `signature` do frontmatter, que aponta para um autor
 * em `src/content/authors/`. O conteúdo do e-mail (versão reduzida da página)
 * vem da coleção "E-mails" (`src/content/emails/`), ligada à edição pelo
 * campo `edition`; sem essa entrada, envia a versão automática (título +
 * resumo + CTA + assinatura).
 *
 * Requer: RESEND_API_KEY + RESEND_SEGMENT_ID (opcionais: NEWSLETTER_FROM, SITE_URL).
 *
 * Anti-duplicidade: o nome do broadcast é `edição-<slug>` e é verificado antes
 * de criar um novo envio.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import matter from 'gray-matter';
import { buildEmail } from './email-template.mjs';
import { renderEmailBody } from './email-body.mjs';

const POSTS_DIR = new URL('../src/content/posts/', import.meta.url);
const AUTHORS_DIR = new URL('../src/content/authors/', import.meta.url);
const EMAILS_DIR = new URL('../src/content/emails/', import.meta.url);
const SITE = (process.env.SITE_URL ?? 'https://introducing.news').replace(/\/$/, '');
const FROM = process.env.NEWSLETTER_FROM ?? 'introducing.news <oi@introducing.news>';
const API_KEY = process.env.RESEND_API_KEY;
const SEGMENT_ID = process.env.RESEND_SEGMENT_ID;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const showPreview = args.includes('--preview');
const slug = (args.find((arg) => !arg.startsWith('--')) ?? '').trim();

if (!slug) {
  console.error('✖ Informe o slug da edição: node scripts/send-newsletter.mjs <slug>');
  process.exit(1);
}
if (!/^[a-z0-9-]+$/i.test(slug)) {
  console.error('✖ Slug inválido (use apenas letras, números e hífens).');
  process.exit(1);
}
if (!dryRun && !showPreview && (!API_KEY || !SEGMENT_ID)) {
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

async function loadAuthor(signature) {
  if (!signature) {
    console.error('✖ Frontmatter sem "signature": escolha a assinatura no CMS (coleção Autores).');
    process.exit(1);
  }
  try {
    const raw = await readFile(new URL(`${signature}.json`, AUTHORS_DIR), 'utf8');
    const author = JSON.parse(raw);
    if (author?.name) return { name: author.name, role: author.role ?? '', photo: author.photo };
  } catch {
    /* cai no erro abaixo */
  }
  console.error(`✖ Autor "${signature}" não encontrado (ou sem nome) em src/content/authors/.`);
  process.exit(1);
}

/** E-mail da coleção "E-mails" associado à edição (`edition: <slug>`). */
async function findEmailFor(edition) {
  let names;
  try {
    names = (await readdir(EMAILS_DIR)).filter((name) => name.endsWith('.mdx')).sort();
  } catch {
    return null; // coleção ainda não existe
  }
  const matches = [];
  for (const name of names) {
    const raw = await readFile(new URL(name, EMAILS_DIR), 'utf8');
    const email = matter(raw);
    if (email.data.edition === edition) matches.push({ name, ...email });
  }
  if (matches.length > 1) {
    console.warn(`⚠ ${matches.length} e-mails apontam para "${edition}" — usando ${matches[0].name}.`);
  }
  return matches[0] ?? null;
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
if (data.status !== 'published') {
  console.error(`✖ Status "${data.status ?? 'draft'}" — só edições publicadas podem ser enviadas.`);
  process.exit(1);
}
if (!data.title || !data.description) {
  console.error('✖ Frontmatter sem title/description.');
  process.exit(1);
}

const author = await loadAuthor(data.signature);
// UTM no CTA: atribui a origem das inscrições feitas a partir do e-mail
// (o formulário guarda signup_utm no contato — ver "Analytics" no AGENTS.md).
const url = `${SITE}/arquivo/${slug}/?utm_source=newsletter&utm_medium=email&utm_campaign=edicao-${slug}`;
const dateLabel = new Intl.DateTimeFormat('pt-BR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date(data.publishedAt));

const email = await findEmailFor(slug);
let body = { html: '', text: '' };
let subjectBase = data.title;
let preview = data.description;

if (email) {
  body = renderEmailBody(email.content, SITE);
  subjectBase = email.data.subject || data.title;
  preview = email.data.previewText || data.description;
  if (!body.html) {
    console.warn(`⚠ E-mail "${email.name}" está sem conteúdo — enviando só o resumo da edição.`);
  }
} else {
  console.warn('⚠ Nenhum e-mail na coleção "E-mails" para esta edição — enviando a versão automática (título + resumo).');
}

const editionNumber = Number.isInteger(data.number) ? data.number : null;
if (!editionNumber) {
  console.warn('⚠ Frontmatter sem "number" — o assunto sairá sem o número da edição.');
}
const subject = editionNumber ? `#${editionNumber} - ${subjectBase}` : subjectBase;
const { html, text } = buildEmail({ title: data.title, description: data.description, url, site: SITE, author, body, date: dateLabel });

const missing = html.match(/\{\{\{(?!RESEND_UNSUBSCRIBE_URL\})[A-Z0-9_]+\}\}\}/g);
if (missing) {
  console.error(`✖ Variáveis não preenchidas no e-mail: ${missing.join(', ')}.`);
  process.exit(1);
}

if (showPreview) {
  const path = join(tmpdir(), `introducing-news-${slug}.html`);
  await writeFile(path, html, 'utf8');
  console.log(`◌ Preview escrito em ${path}`);
  console.log(`   e-mail: ${email ? email.name : 'automático (sem entrada na coleção E-mails)'}`);
  console.log(`   assunto: ${subject}`);
  console.log(`   preheader: ${preview}`);
  console.log('   Abra no navegador; a renderização varia um pouco entre clientes de e-mail.');
  process.exit(0);
}

const name = `edição-${slug}`;

if (dryRun) {
  console.log(`◌ [dry-run] enviaria "${name}" para o segmento ${SEGMENT_ID ?? 'não configurado'}.`);
  console.log(`   e-mail: ${email ? email.name : 'automático (sem entrada na coleção E-mails)'}`);
  console.log(`   assunto: ${subject}`);
  console.log(`   assinatura: ${author.name}${author.role ? ` — ${author.role}` : ''}`);
  process.exit(0);
}

const existing = await api('/broadcasts?limit=100');
if ((existing.data ?? []).some((broadcast) => broadcast.name === name)) {
  console.log(`✔ Broadcast "${name}" já existe — nada a fazer (anti-duplicidade).`);
  process.exit(0);
}

const broadcast = await api('/broadcasts', {
  method: 'POST',
    body: JSON.stringify({
      segment_id: SEGMENT_ID,
      from: FROM,
      subject,
      name,
      preview_text: preview,
      html,
      text,
      send: true,
    }),
});

console.log(`✔ "${name}" enviado para o segmento ${SEGMENT_ID} (id: ${broadcast.id}).`);
