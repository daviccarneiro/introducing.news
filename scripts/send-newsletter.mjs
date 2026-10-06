#!/usr/bin/env node
/**
 * Envia a edição indicada para a audiência do Resend via Broadcasts.
 *
 * Uso: node scripts/send-newsletter.mjs <slug>
 * Requer: RESEND_API_KEY, RESEND_AUDIENCE_ID (e opcionalmente NEWSLETTER_FROM, SITE_URL).
 *
 * Segurança: nunca envia duas vezes a mesma edição — o nome do broadcast é
 * `edição-<slug>` e é verificado antes de criar um novo.
 */
import { readFile, readdir } from 'node:fs/promises';
import matter from 'gray-matter';

const POSTS_DIR = new URL('../src/content/posts/', import.meta.url);
const SITE = (process.env.SITE_URL ?? 'https://introducing.news').replace(/\/$/, '');
const FROM = process.env.NEWSLETTER_FROM ?? 'introducing.news <oi@introducing.news>';
const API_KEY = process.env.RESEND_API_KEY;
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
const slug = (process.argv[2] ?? process.env.SLUG ?? '').trim();

if (!API_KEY || !AUDIENCE_ID) {
  console.error('✖ Faltam RESEND_API_KEY e/ou RESEND_AUDIENCE_ID no ambiente.');
  process.exit(1);
}
if (!slug) {
  console.error('✖ Informe o slug da edição: node scripts/send-newsletter.mjs <slug>');
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

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const files = await readdir(POSTS_DIR);
const file = files.find((name) => name === `${slug}.mdx`);
if (!file) {
  console.error(`✖ Arquivo não encontrado: src/content/posts/${slug}.mdx`);
  process.exit(1);
}

const { data } = matter(await readFile(new URL(file, POSTS_DIR), 'utf8'));
if (data.draft === true) {
  console.error('✖ Esta edição está marcada como rascunho (draft: true). Publique antes de enviar.');
  process.exit(1);
}

const broadcastName = `edição-${slug}`;
const existing = await api('/broadcasts?limit=100');
if ((existing.data ?? []).some((broadcast) => broadcast.name === broadcastName)) {
  console.log(`✔ Broadcast "${broadcastName}" já existe — nada a fazer (anti-duplicidade).`);
  process.exit(0);
}

const url = `${SITE}/ensaios/${slug}/`;
const title = escapeHtml(data.title);
const description = escapeHtml(data.description);

const html = `<!doctype html>
<html lang="pt-BR">
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
                  Nova edição
                </p>
                <h1 style="margin:0 0 16px;font:600 28px/1.2 -apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:-0.02em;color:#0B0B0C;">
                  ${title}
                </h1>
                <p style="margin:0 0 28px;font:400 18px/1.6 Georgia,serif;color:#4B4B55;">
                  ${description}
                </p>
                <a href="${url}" style="display:inline-block;background:#F6821F;color:#0B0B0C;text-decoration:none;font:500 15px/1 -apple-system,Segoe UI,Roboto,sans-serif;padding:14px 24px;border-radius:8px;">
                  Ler a edição completa
                </a>
                <p style="margin:28px 0 0;font:400 13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#9A9AA4;">
                  Você recebe este e-mail porque assinou a introducing.news.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 40px;">
                <p style="margin:0;font:400 12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;color:#9A9AA4;">
                  <a href="${SITE}" style="color:#6B6B76;text-decoration:none;">introducing.news</a>
                  · <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#6B6B76;text-decoration:none;">cancelar inscrição</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const broadcast = await api('/broadcasts', {
  method: 'POST',
  body: JSON.stringify({
    audience_id: AUDIENCE_ID,
    from: FROM,
    subject: data.title,
    name: broadcastName,
    preview_text: data.description,
    html,
  }),
});

await api(`/broadcasts/${broadcast.id}/send`, { method: 'POST' });

console.log(`✔ Broadcast "${broadcastName}" enviado para a audiência ${AUDIENCE_ID} (id: ${broadcast.id}).`);
