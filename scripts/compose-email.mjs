/**
 * Monta o e-mail de uma edição (assunto, preheader, HTML e texto) a partir do
 * frontmatter da edição, da entrada da coleção "E-mails" e do autor da
 * assinatura. Uma única montagem para o envio (`send-newsletter.mjs`) e para
 * a prévia que o bot do Telegram manda para aprovação (`/previa/<slug>/email`).
 */
import { buildEmail } from './email-template.mjs';
import { renderEmailBody } from './email-body.mjs';

/**
 * E-mail da coleção "E-mails" associado à edição (`edition: <slug>`).
 * `emails`: lista de `{ name, data, content }`, em ordem de nome de arquivo.
 */
export function pickEmail(emails, edition) {
  const matches = emails.filter((email) => email.data?.edition === edition);
  const warnings =
    matches.length > 1
      ? [`${matches.length} e-mails apontam para "${edition}" — usando ${matches[0].name}.`]
      : [];
  return { email: matches[0] ?? null, warnings };
}

/**
 * @param {{
 *   slug: string,
 *   post: Record<string, any>,
 *   email: { name: string, data: Record<string, any>, content: string } | null,
 *   author: { name: string, role?: string, photo?: string },
 *   site: string,
 * }} input
 */
export function composeEmail({ slug, post, email, author, site }) {
  const warnings = [];
  // UTM no CTA: atribui a origem das inscrições feitas a partir do e-mail
  // (o formulário guarda signup_utm no contato — ver "Analytics" no AGENTS.md).
  const url = `${site}/arquivo/${slug}/?utm_source=newsletter&utm_medium=email&utm_campaign=edicao-${slug}`;
  const dateLabel = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(post.publishedAt));

  let body = { html: '', text: '' };
  let subjectBase = post.title;
  let preview = post.description;

  if (email) {
    body = renderEmailBody(email.content, site);
    subjectBase = email.data.subject || post.title;
    preview = email.data.previewText || post.description;
    if (!body.html) {
      warnings.push(`E-mail "${email.name}" está sem conteúdo — enviando só o resumo da edição.`);
    }
  } else {
    warnings.push('Nenhum e-mail na coleção "E-mails" para esta edição — enviando a versão automática (título + resumo).');
  }

  const editionNumber = Number.isInteger(post.number) ? post.number : null;
  if (!editionNumber) {
    warnings.push('Frontmatter sem "number" — o assunto sairá sem o número da edição.');
  }
  const subject = editionNumber ? `#${editionNumber} - ${subjectBase}` : subjectBase;
  const { html, text } = buildEmail({
    title: post.title,
    description: post.description,
    url,
    site,
    author,
    body,
    date: dateLabel,
    cover: post.coverImage,
  });

  const missing = html.match(/\{\{\{(?!RESEND_UNSUBSCRIBE_URL\})[A-Z0-9_]+\}\}\}/g) ?? [];
  return { subject, preview, html, text, warnings, missing };
}
