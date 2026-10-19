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
import { parseFrontmatter } from './frontmatter.mjs';
import { composeEmail, pickEmail } from './compose-email.mjs';

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

/** Entradas da coleção "E-mails" (`{ name, data, content }`), em ordem de arquivo. */
async function loadEmails() {
  let names;
  try {
    names = (await readdir(EMAILS_DIR)).filter((name) => name.endsWith('.mdx')).sort();
  } catch {
    return []; // coleção ainda não existe
  }
  const emails = [];
  for (const name of names) {
    const raw = await readFile(new URL(name, EMAILS_DIR), 'utf8');
    emails.push({ name, ...parseFrontmatter(raw) });
  }
  return emails;
}

const file = new URL(`${slug}.mdx`, POSTS_DIR);
let raw;
try {
  raw = await readFile(file, 'utf8');
} catch {
  console.error(`✖ Arquivo não encontrado: src/content/posts/${slug}.mdx`);
  process.exit(1);
}

const { data } = parseFrontmatter(raw);
// O preview serve justamente para revisar antes de publicar: aceita qualquer status.
if (showPreview && data.status !== 'published') {
  console.warn(`⚠ Status "${data.status ?? 'draft'}" — gerando só o preview (o envio exige "published").`);
} else if (data.status !== 'published') {
  console.error(`✖ Status "${data.status ?? 'draft'}" — só edições publicadas podem ser enviadas.`);
  process.exit(1);
}
if (!data.title || !data.description) {
  console.error('✖ Frontmatter sem title/description.');
  process.exit(1);
}

const author = await loadAuthor(data.signature);
const { email, warnings: pickWarnings } = pickEmail(await loadEmails(), slug);
const { subject, preview, html, text, warnings, missing } = composeEmail({
  slug,
  post: data,
  email,
  author,
  site: SITE,
});
for (const warning of [...pickWarnings, ...warnings]) console.warn(`⚠ ${warning}`);

if (missing.length > 0) {
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
