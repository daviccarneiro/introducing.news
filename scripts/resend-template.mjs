#!/usr/bin/env node
/**
 * Cria/atualiza e publica o template da newsletter no Resend.
 *
 * O HTML canônico vive em `scripts/email-template.mjs`; este script apenas o
 * espelha no painel do Resend, onde pode ser pré-visualizado e testado.
 * O envio dos broadcasts continua usando o HTML do repositório.
 *
 * Uso: node scripts/resend-template.mjs [--dry-run]
 *
 * Requer: RESEND_API_KEY.
 */
import {
  TEMPLATE_ALIAS,
  TEMPLATE_NAME,
  TEMPLATE_SUBJECT,
  templateHtml,
  templateVariables,
} from './email-template.mjs';

const API_KEY = process.env.RESEND_API_KEY;
const dryRun = process.argv.includes('--dry-run');

if (!dryRun && !API_KEY) {
  console.error('✖ Falta RESEND_API_KEY no ambiente.');
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

const summary = `"${TEMPLATE_NAME}" (alias: ${TEMPLATE_ALIAS}) com ${templateVariables.length} variáveis e ${templateHtml.length} bytes.`;

if (dryRun) {
  console.log(`◌ [dry-run] publicaria o template ${summary}`);
  process.exit(0);
}

const payload = {
  name: TEMPLATE_NAME,
  alias: TEMPLATE_ALIAS,
  subject: TEMPLATE_SUBJECT,
  html: templateHtml,
  variables: templateVariables,
};

const list = await api('/templates?limit=100');
const existing = (list.data ?? []).find(
  (template) => template.alias === TEMPLATE_ALIAS || template.name === TEMPLATE_NAME,
);

let id;
if (existing) {
  await api(`/templates/${existing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  id = existing.id;
  console.log(`↻ Template ${summary} atualizado (id: ${id}).`);
} else {
  const created = await api('/templates', { method: 'POST', body: JSON.stringify(payload) });
  id = created.id;
  console.log(`＋ Template ${summary} criado (id: ${id}).`);
}

await api(`/templates/${id}/publish`, { method: 'POST' });

const published = await api(`/templates/${encodeURIComponent(TEMPLATE_ALIAS)}`);
if (published.html !== templateHtml) {
  throw new Error('✖ HTML do template no Resend não bate com `scripts/email-template.mjs`.');
}
const remoteKeys = (published.variables ?? []).map((variable) => variable.key).sort().join(',');
const localKeys = templateVariables.map((variable) => variable.key).sort().join(',');
if (remoteKeys !== localKeys) {
  throw new Error(`✖ Variáveis divergentes — Resend: [${remoteKeys}] vs repo: [${localKeys}].`);
}
console.log(`✔ Verificado: HTML idêntico e ${templateVariables.length} variáveis em sincronia (inclui BODY).`);
console.log('✔ Template publicado — confira em https://resend.com/templates.');
