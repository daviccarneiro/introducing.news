#!/usr/bin/env node
/**
 * Envia uma edição para a audiência do Resend via Broadcasts — um envio por idioma.
 *
 * Uso: node scripts/send-newsletter.mjs <slug> [--dry-run]
 *
 * O par de traduções é descoberto pelo campo `translation` no frontmatter:
 * a edição em pt aponta para o slug em en (e vice-versa). Se não houver
 * tradução, somente o idioma existente é enviado.
 *
 * Requer: RESEND_API_KEY + RESEND_SEGMENT_PT / RESEND_SEGMENT_EN
 * (opcionais: NEWSLETTER_FROM, SITE_URL).
 *
 * Anti-duplicidade: o nome do broadcast é `edição-<locale>-<slug>` e é
 * verificado antes de criar um novo envio.
 */
import { readFile } from 'node:fs/promises';
import matter from 'gray-matter';

const POSTS_DIR = new URL('../src/content/posts/', import.meta.url);
const SITE = (process.env.SITE_URL ?? 'https://introducing.news').replace(/\/$/, '');
const FROM = process.env.NEWSLETTER_FROM ?? 'introducing.news <oi@introducing.news>';
const API_KEY = process.env.RESEND_API_KEY;
const SEGMENTS = {
  pt: process.env.RESEND_SEGMENT_PT,
  en: process.env.RESEND_SEGMENT_EN,
};

const LOCALES = ['pt', 'en'];

const COPY = {
  pt: {
    kicker: 'Nova edição',
    cta: 'Ler a edição completa',
    foot: 'Você recebe este e-mail porque assinou a introducing.news.',
    unsubscribe: 'cancelar inscrição',
  },
  en: {
    kicker: 'New edition',
    cta: 'Read the full edition',
    foot: 'You are receiving this email because you subscribed to introducing.news.',
    unsubscribe: 'unsubscribe',
  },
};

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
if (!dryRun && (!API_KEY || !SEGMENTS.pt || !SEGMENTS.en)) {
  console.error('✖ Faltam RESEND_API_KEY e/ou RESEND_SEGMENT_PT/EN no ambiente.');
  process.exit(1);
}

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

async function readPost(locale, postSlug) {
  const raw = await readFile(new URL(`${locale}/${postSlug}.mdx`, POSTS_DIR), 'utf8');
  return matter(raw).data;
}

async function findStart() {
  for (const locale of LOCALES) {
    try {
      const data = await readPost(locale, slug);
      return { locale, slug, data };
    } catch {
      /* tenta o próximo idioma */
    }
  }
  throw new Error(`Arquivo não encontrado: src/content/posts/{pt,en}/${slug}.mdx`);
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

function emailHtml(locale, post) {
  const copy = COPY[locale];
  const url = `${SITE}/${locale}/${locale === 'pt' ? 'ensaios' : 'essays'}/${post.slug}/`;
  const title = escapeHtml(post.title);
  const description = escapeHtml(post.description);

  return `<!doctype html>
<html lang="${locale === 'pt' ? 'pt-BR' : 'en'}">
  <body style="margin:0;padding:0;background:#F9F9FB;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9F9FB;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#FFFFFF;border:1px solid #E4E4E9;border-radius:16px;">
            <tr>
              <td style="padding:40px 40px 8px;">
                <p style="margin:0 0 24px;font:600 16px/1.2 -apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:-0.01em;color:#0B0B0C;">
                  introducing<span style="color:#6B6B76;">.news</span>
                </p>
                <p style="margin:0 0 12px;font:500 11px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;text-transform:uppercase;color:#A63E0A;">
                  ${copy.kicker}
                </p>
                <h1 style="margin:0 0 16px;font:600 28px/1.2 -apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:-0.02em;color:#0B0B0C;">
                  ${title}
                </h1>
                <p style="margin:0 0 28px;font:400 18px/1.6 Georgia,serif;color:#4B4B55;">
                  ${description}
                </p>
                <a href="${url}" style="display:inline-block;background:#F6821F;color:#0B0B0C;text-decoration:none;font:500 15px/1 -apple-system,Segoe UI,Roboto,sans-serif;padding:14px 24px;border-radius:8px;">
                  ${copy.cta}
                </a>
                <p style="margin:28px 0 0;font:400 13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#9A9AA4;">
                  ${copy.foot}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 40px;">
                <p style="margin:0;font:400 12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;color:#9A9AA4;">
                  <a href="${SITE}" style="color:#6B6B76;text-decoration:none;">introducing.news</a>
                  · <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#6B6B76;text-decoration:none;">${copy.unsubscribe}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const start = await findStart();
const editions = [{ locale: start.locale, slug: start.slug, data: start.data }];

if (start.data.translation) {
  const other = start.locale === 'pt' ? 'en' : 'pt';
  try {
    editions.push({ locale: other, slug: start.data.translation, data: await readPost(other, start.data.translation) });
  } catch {
    console.warn(`⚠ Tradução "${start.data.translation}" (${other}) não encontrada — enviando apenas ${start.locale}.`);
  }
}

let sent = 0;
for (const edition of editions) {
  const { locale, slug: editionSlug, data } = edition;

  if (data.draft === true) {
    console.warn(`⚠ ${locale}/${editionSlug} está marcada como rascunho — pulando.`);
    continue;
  }
  if (!data.title || !data.description) {
    throw new Error(`✖ ${locale}/${editionSlug}: frontmatter sem title/description.`);
  }

  const name = `edição-${locale}-${editionSlug}`;
  if (dryRun) {
    console.log(`◌ [dry-run] enviaria "${name}" para o segmento ${locale.toUpperCase()} (${SEGMENTS[locale] ?? 'não configurado'}).`);
    continue;
  }

  const existing = await api('/broadcasts?limit=100');
  if ((existing.data ?? []).some((broadcast) => broadcast.name === name)) {
    console.log(`✔ Broadcast "${name}" já existe — nada a fazer (anti-duplicidade).`);
    continue;
  }

  const broadcast = await api('/broadcasts', {
    method: 'POST',
    body: JSON.stringify({
      segment_id: SEGMENTS[locale],
      from: FROM,
      subject: data.title,
      name,
      preview_text: data.description,
      html: emailHtml(locale, edition),
      send: true,
    }),
  });

  sent += 1;
  console.log(`✔ [${locale}] "${name}" enviado (id: ${broadcast.id}).`);
}

console.log(sent > 0 ? `\n${sent} envio(s) disparado(s).` : '\nNada a enviar.');
