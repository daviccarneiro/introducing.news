#!/usr/bin/env node
/**
 * Renderiza o conteúdo do e-mail (coleção "E-mails") para envio:
 * Markdown → HTML com estilos inline e imagens em URL absoluta.
 *
 * O visual do e-mail é simples de propósito: parágrafos, negrito, itálico,
 * listas, links, citações, imagens e tabelas — o suficiente para um TLDR
 * caprichado, sem depender de CSS externo (que os clientes de e-mail ignoram).
 */
import { marked } from 'marked';
import { MONO, SANS, SERIF } from './email-template.mjs';

const TAG_STYLES = {
  p: `margin:0 0 16px 0;font-family:${SERIF};font-size:18px;line-height:1.7;color:#0B0B0C;`,
  h1: `margin:0 0 14px 0;font-family:${SERIF};font-size:24px;font-weight:600;line-height:1.2;letter-spacing:-0.015em;color:#0B0B0C;`,
  h2: `margin:28px 0 12px 0;font-family:${SERIF};font-size:22px;font-weight:600;line-height:1.25;letter-spacing:-0.01em;color:#0B0B0C;`,
  h3: `margin:24px 0 10px 0;font-family:${SERIF};font-size:19px;font-weight:600;line-height:1.3;letter-spacing:-0.005em;color:#0B0B0C;`,
  h4: `margin:20px 0 8px 0;font-family:${SERIF};font-size:17px;font-weight:600;line-height:1.35;color:#0B0B0C;`,
  ul: `margin:0 0 16px 0;padding:0 0 0 20px;`,
  ol: `margin:0 0 16px 0;padding:0 0 0 20px;`,
  li: `margin:0 0 6px 0;font-family:${SERIF};font-size:18px;line-height:1.65;color:#0B0B0C;`,
  a: `color:#A63E0A;text-decoration:underline;text-underline-offset:3px;`,
  strong: `font-weight:600;`,
  em: `font-style:italic;`,
  del: `text-decoration:line-through;`,
  blockquote: `margin:0 0 16px 0;padding:2px 0 2px 20px;border-left:2px solid #F6821F;font-family:${SERIF};font-style:italic;font-size:20px;line-height:1.5;letter-spacing:-0.005em;color:#0B0B0C;`,
  img: `display:block;max-width:100%;height:auto;border:0;border-radius:12px;`,
  code: `font-family:${MONO};font-size:15px;background-color:#F2F2F5;padding:1px 5px;border-radius:4px;color:#0B0B0C;`,
  pre: `margin:0 0 16px 0;padding:20px 22px;background-color:#0B0B0C;border-radius:8px;font-family:${MONO};font-size:13px;line-height:1.7;color:#F2F2F5;`,
  hr: `border:0;border-top:1px solid #E4E4E9;margin:24px 0;`,
  table: `width:100%;border-collapse:collapse;margin:0 0 16px 0;`,
  th: `padding:8px 10px;border:1px solid #E4E4E9;background-color:#F9F9FB;font-family:${SANS};font-size:14px;font-weight:600;text-align:left;color:#0B0B0C;`,
  td: `padding:8px 10px;border:1px solid #E4E4E9;font-family:${SANS};font-size:14px;line-height:1.5;color:#4B4B55;`,
};

function absoluteUrl(value, site) {
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('cid:')) {
    return value;
  }
  return `${site}${value.startsWith('/') ? '' : '/'}${value}`;
}

/** Aplica os estilos do design em cada tag; respeita estilos já definidos. */
function inlineStyles(html) {
  return html.replace(/<([a-z][a-z0-9]*)((?:\s+[^>]*)?)>/gi, (match, tag, attrs) => {
    const style = TAG_STYLES[tag.toLowerCase()];
    if (!style || /\sstyle=/i.test(attrs)) return match;
    return `<${tag}${attrs} style="${style}">`;
  });
}

function absoluteImages(html, site) {
  return html.replace(/<img([^>]*?)\ssrc="([^"]+)"/gi, (_match, before, src) => {
    return `<img${before} src="${absoluteUrl(src, site)}"`;
  });
}

function toPlainText(html) {
  return html
    .replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, (_match, alt) => (alt ? `[${alt}]` : ''))
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/(p|h[1-6]|ul|ol|blockquote|pre|table|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{2,}(?=• )/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** O `<code>` dentro de `<pre>` herda o bloco, sem fundo próprio. */
function normalizePreCode(html) {
  return html.replace(
    /(<pre[^>]*>)\s*<code[^>]*>/gi,
    '$1<code style="background:none;padding:0;color:inherit;font-family:inherit;font-size:inherit;">',
  );
}

/** Converte o Markdown do e-mail em { html, text } prontos para envio. */
export function renderEmailBody(markdown, site) {
  const source = String(markdown ?? '').trim();
  if (!source) return { html: '', text: '' };

  const raw = marked.parse(source);
  return {
    html: absoluteImages(normalizePreCode(inlineStyles(raw)), site),
    text: toPlainText(raw),
  };
}
