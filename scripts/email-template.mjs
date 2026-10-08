#!/usr/bin/env node
/**
 * Template da newsletter — fonte de verdade do e-mail.
 *
 * O HTML abaixo é usado de duas formas:
 * 1. `buildEmail()` renderiza o e-mail de cada edição (send-newsletter.mjs).
 * 2. `resend-template.mjs` publica este mesmo HTML como template no Resend,
 *    para preview e edição visual no painel.
 *
 * Layout em tabelas, CSS inline e fontes de sistema: renderiza em Gmail,
 * Apple Mail, Outlook (com fallback VML no botão) e demais clientes.
 * Cores e tipografia espelham `src/styles/tokens.css`.
 */
export const SANS = "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
export const SERIF = "'Source Serif 4', Georgia, 'Times New Roman', Times, serif";
export const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Courier New', monospace";

/** Logo em PNG (clientes de e-mail não renderizam SVG); servido de `public/`. */
const LOGO = '{{{SITE_URL}}}/images/brand/sparkle.png';

export const TEMPLATE_NAME = 'introducing.news — nova edição';
export const TEMPLATE_ALIAS = 'introducing-news-nova-edicao';
export const TEMPLATE_SUBJECT = 'Nova edição da introducing.news';

const COPY = {
  lang: 'pt-BR',
  tagline: 'Novidades de tecnologia, curadas por professores e profissionais.',
  cta: 'Ler a edição completa',
  signOff: 'Um abraço,',
  foot: 'Você recebe este e-mail porque assinou a introducing.news.',
  unsubscribe: 'cancelar inscrição',
};

export const templateHtml = `<!doctype html>
<html lang="{{{LANG}}}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>introducing.news</title>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#F9F9FB;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">{{{DESCRIPTION}}}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F9F9FB">
<tr>
<td align="center" style="padding:32px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="width:100%;max-width:560px;background-color:#FFFFFF;border:1px solid #E4E4E9;border-radius:16px;">
<tr>
<td style="padding:40px 40px 0 40px;font-family:${SANS};">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="24" valign="middle" style="width:24px;padding:0 8px 0 0;"><img src="${LOGO}" width="24" height="24" alt="" style="display:block;width:24px;height:24px;border:0;outline:none;text-decoration:none;" /></td>
<td valign="middle" style="font-family:'Inter',${SANS};font-size:18px;font-weight:600;line-height:1.2;letter-spacing:-0.01em;color:#0B0B0C;">introducing<span style="color:#6B6B76;">.news</span></td>
</tr></table>
<p style="margin:8px 0 28px 0;font-family:${SANS};font-size:13px;line-height:1.5;color:#9A9AA4;">{{{TAGLINE}}}</p>
<p style="margin:0 0 12px 0;font-family:${MONO};font-size:11px;font-weight:500;line-height:1.4;letter-spacing:0.08em;text-transform:uppercase;color:#A63E0A;">{{{DATE}}}</p>
<h1 style="margin:0 0 16px 0;font-family:${SERIF};font-size:27px;font-weight:600;line-height:1.22;letter-spacing:-0.015em;color:#0B0B0C;">{{{TITLE}}}</h1>
<p style="margin:0 0 28px 0;font-family:${SERIF};font-size:18px;line-height:1.65;color:#6B6B76;">{{{DESCRIPTION}}}</p>
{{{BODY}}}
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{{CTA_URL}}}" style="height:44px;v-text-anchor:middle;width:240px;" arcsize="18%" stroke="f" fillcolor="#F6821F">
<w:anchorlock/>
<center style="color:#0B0B0C;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;">{{{CTA_LABEL}}}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="{{{CTA_URL}}}" style="display:inline-block;background-color:#F6821F;border-radius:8px;color:#0B0B0C;font-family:${SANS};font-size:15px;font-weight:600;line-height:1.2;padding:14px 24px;text-decoration:none;">{{{CTA_LABEL}}}</a>
<!--<![endif]-->
</td>
</tr>
<tr>
<td style="padding:36px 40px 0 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td height="1" bgcolor="#E4E4E9" style="height:1px;line-height:1px;font-size:0;">&nbsp;</td></tr>
</table>
</td>
</tr>
<tr>
<td style="padding:24px 40px 0 40px;font-family:${SANS};">
<p style="margin:0 0 10px 0;font-family:${SANS};font-size:13px;line-height:1.5;color:#6B6B76;">{{{SIGN_OFF}}}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td width="40" valign="top" style="width:40px;">{{{SIGNATURE_AVATAR}}}</td>
<td valign="middle" style="padding-left:12px;font-family:${SANS};">
<p style="margin:0;font-family:${SANS};font-size:15px;font-weight:600;line-height:1.4;color:#0B0B0C;">{{{SIGNATURE_NAME}}}</p>
{{{SIGNATURE_ROLE_LINE}}}
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:32px 40px 40px 40px;font-family:${SANS};">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px 0;"><tr>
<td width="16" valign="middle" style="width:16px;padding:0 6px 0 0;"><img src="${LOGO}" width="16" height="16" alt="" style="display:block;width:16px;height:16px;border:0;outline:none;text-decoration:none;" /></td>
<td valign="middle" style="font-family:'Inter',${SANS};font-size:13px;font-weight:600;line-height:1.2;letter-spacing:-0.01em;color:#6B6B76;">introducing<span style="color:#9A9AA4;">.news</span></td>
</tr></table>
<p style="margin:0 0 12px 0;font-family:${SANS};font-size:12px;line-height:1.6;color:#9A9AA4;">{{{FOOT_MESSAGE}}}</p>
<p style="margin:0;font-family:${MONO};font-size:12px;line-height:1.6;color:#9A9AA4;"><a href="{{{SITE_URL}}}" style="color:#6B6B76;text-decoration:none;">introducing.news</a><span style="color:#C9C9D1;">&nbsp;·&nbsp;</span><a href="{{{UNSUBSCRIBE_URL}}}" style="color:#6B6B76;text-decoration:none;">{{{UNSUBSCRIBE_LABEL}}}</a></p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Variáveis que recebem HTML já pronto (avatar, corpo do e-mail, linha de cargo, URL de descadastro). */
const RAW_KEYS = new Set(['BODY', 'SIGNATURE_AVATAR', 'SIGNATURE_ROLE_LINE', 'UNSUBSCRIBE_URL']);

function initialsOf(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function avatarHtml(author, site) {
  if (author.photo) {
    const src = /^https?:\/\//.test(author.photo) ? author.photo : `${site}${author.photo}`;
    return `<img src="${escapeHtml(src)}" width="40" height="40" alt="" style="display:block;width:40px;height:40px;border:0;border-radius:9999px;object-fit:cover;" />`;
  }
  return `<table role="presentation" width="40" height="40" cellpadding="0" cellspacing="0" border="0" style="width:40px;height:40px;background-color:#FFF6ED;border-radius:9999px;"><tr><td align="center" valign="middle" style="font-family:${MONO};font-size:11px;font-weight:500;letter-spacing:0.08em;color:#A63E0A;">${escapeHtml(initialsOf(author.name))}</td></tr></table>`;
}

export function renderEmail(values) {
  return templateHtml.replace(/\{\{\{([A-Z0-9_]+)\}\}\}/g, (_, key) => {
    const value = values[key];
    if (value === undefined) return `{{{${key}}}}`;
    return RAW_KEYS.has(key) ? String(value) : escapeHtml(value);
  });
}

export function renderText(values) {
  return [
    values.TITLE,
    '',
    values.DESCRIPTION,
    ...(values.BODY_TEXT ? ['', values.BODY_TEXT] : []),
    '',
    `${values.CTA_LABEL}: ${values.CTA_URL}`,
    '',
    `${values.SIGN_OFF} ${values.SIGNATURE_NAME}${values.SIGNATURE_ROLE_TEXT ? ` — ${values.SIGNATURE_ROLE_TEXT}` : ''}`,
    '',
    values.FOOT_MESSAGE,
    `introducing.news · ${values.UNSUBSCRIBE_LABEL}: ${values.UNSUBSCRIBE_URL}`,
  ].join('\n');
}

/** Monta HTML e texto do e-mail de uma edição. */
export function buildEmail({ title, description, url, site, author, body = { html: '', text: '' }, date = '' }) {
  const variables = {
    LANG: COPY.lang,
    TAGLINE: COPY.tagline,
    DATE: date,
    TITLE: title,
    DESCRIPTION: description,
    BODY: body.html,
    BODY_TEXT: body.text,
    CTA_LABEL: COPY.cta,
    CTA_URL: url,
    SIGN_OFF: COPY.signOff,
    SIGNATURE_AVATAR: avatarHtml(author, site),
    SIGNATURE_NAME: author.name,
    SIGNATURE_ROLE_LINE: author.role
      ? `<p style="margin:2px 0 0 0;font-family:${SANS};font-size:13px;line-height:1.5;color:#9A9AA4;">${escapeHtml(author.role)}</p>`
      : '',
    SIGNATURE_ROLE_TEXT: author.role ?? '',
    FOOT_MESSAGE: COPY.foot,
    UNSUBSCRIBE_LABEL: COPY.unsubscribe,
    UNSUBSCRIBE_URL: `${site}/descadastrar`,
    SITE_URL: site,
  };
  return { html: renderEmail(variables), text: renderText(variables) };
}

const fallbackVariables = {
  LANG: COPY.lang,
  TAGLINE: COPY.tagline,
  DATE: '5 de outubro de 2026',
  TITLE: 'Título da edição',
  DESCRIPTION: 'Resumo curto da edição, direto no e-mail.',
  BODY: [
    `<p style="margin:0 0 16px 0;font-family:${SERIF};font-size:18px;line-height:1.7;color:#0B0B0C;">Esta é a versão reduzida da edição: um TLDR com os destaques, escrito no CMS na coleção <strong>E-mails</strong>.</p>`,
    '<ul style="margin:0 0 16px 0;padding:0 0 0 20px;">',
    `<li style="margin:0 0 6px 0;font-family:${SERIF};font-size:18px;line-height:1.65;color:#0B0B0C;">O que muda nos modelos de linguagem em 2026</li>`,
    `<li style="margin:0 0 6px 0;font-family:${SERIF};font-size:18px;line-height:1.65;color:#0B0B0C;">A ferramenta que substituiu três assinaturas do time</li>`,
    `<li style="margin:0 0 6px 0;font-family:${SERIF};font-size:18px;line-height:1.65;color:#0B0B0C;">O evento de tecnologia que vale a pena acompanhar</li>`,
    '</ul>',
  ].join(''),
  CTA_LABEL: COPY.cta,
  CTA_URL: 'https://introducing.news/arquivo/',
  SIGN_OFF: COPY.signOff,
  SIGNATURE_AVATAR: avatarHtml({ name: 'Davi Carneiro' }, 'https://introducing.news'),
  SIGNATURE_NAME: 'Davi Carneiro',
  SIGNATURE_ROLE_LINE:
    '<p style="margin:2px 0 0 0;font-family:' + SANS + ';font-size:13px;line-height:1.5;color:#9A9AA4;">Cargo ou linha de assinatura</p>',
  FOOT_MESSAGE: COPY.foot,
  UNSUBSCRIBE_LABEL: COPY.unsubscribe,
  UNSUBSCRIBE_URL: 'https://introducing.news/descadastrar',
  SITE_URL: 'https://introducing.news',
};

export const templateVariables = Object.entries(fallbackVariables).map(([key, fallback_value]) => ({
  key,
  type: 'string',
  fallback_value,
}));
