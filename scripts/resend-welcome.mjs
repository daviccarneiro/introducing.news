#!/usr/bin/env node
/**
 * Cria/atualiza a automação de boas-vindas no Resend.
 *
 * O que este script garante (idempotente):
 * 1. O evento customizado `newsletter.subscribed` existe.
 * 2. O template publicado `introducing-news-boas-vindas` bate com a fonte
 *    (`scripts/welcome-email.mjs` + o layout de `scripts/email-template.mjs`).
 * 3. A automação `introducing.news · boas-vindas` está ativa:
 *    evento → espera 5 minutos → envia o template.
 *
 * O evento é disparado pela API de inscrição (`POST /api/subscribe`) apenas
 * quando o contato é criado pela primeira vez. Reinscrições (PATCH) não
 * disparam de novo, e contatos descadastrados são ignorados pelo Resend.
 *
 * Uso: node scripts/resend-welcome.mjs [--dry-run]
 *
 * Requer: RESEND_API_KEY.
 */
import { templateHtml } from './email-template.mjs';
import {
  WELCOME_AUTOMATION_NAME,
  WELCOME_DELAY,
  WELCOME_EVENT_NAME,
  WELCOME_FROM,
  WELCOME_TEMPLATE_ALIAS,
  WELCOME_TEMPLATE_NAME,
  WELCOME_TEMPLATE_SUBJECT,
  welcomeTemplateVariables,
} from './welcome-email.mjs';

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

const automationPayload = {
  name: WELCOME_AUTOMATION_NAME,
  status: 'enabled',
  steps: [
    { key: 'start', type: 'trigger', config: { event_name: WELCOME_EVENT_NAME } },
    { key: 'wait', type: 'delay', config: { duration: WELCOME_DELAY } },
    {
      key: 'welcome',
      type: 'send_email',
      config: {
        template: { id: WELCOME_TEMPLATE_ALIAS },
        from: WELCOME_FROM,
        subject: WELCOME_TEMPLATE_SUBJECT,
      },
    },
  ],
  connections: [
    { from: 'start', to: 'wait' },
    { from: 'wait', to: 'welcome' },
  ],
};

const templatePayload = {
  name: WELCOME_TEMPLATE_NAME,
  alias: WELCOME_TEMPLATE_ALIAS,
  subject: WELCOME_TEMPLATE_SUBJECT,
  html: templateHtml,
  variables: welcomeTemplateVariables,
};

if (dryRun) {
  console.log('◌ [dry-run] Evento:', WELCOME_EVENT_NAME);
  console.log(
    `◌ [dry-run] Template "${WELCOME_TEMPLATE_NAME}" (${WELCOME_TEMPLATE_ALIAS}) com ${welcomeTemplateVariables.length} variáveis.`,
  );
  console.log(
    `◌ [dry-run] Automação "${WELCOME_AUTOMATION_NAME}": evento → espera ${WELCOME_DELAY} → envia o template.`,
  );
  process.exit(0);
}

// 1. Evento
const events = await api('/events?limit=100');
const eventExists = (events.data ?? []).some((event) => event.name === WELCOME_EVENT_NAME);
if (eventExists) {
  console.log(`✔ Evento "${WELCOME_EVENT_NAME}" já existe.`);
} else {
  await api('/events', { method: 'POST', body: JSON.stringify({ name: WELCOME_EVENT_NAME }) });
  console.log(`＋ Evento "${WELCOME_EVENT_NAME}" criado.`);
}

// 2. Template
const templates = await api('/templates?limit=100');
const existingTemplate = (templates.data ?? []).find(
  (template) => template.alias === WELCOME_TEMPLATE_ALIAS || template.name === WELCOME_TEMPLATE_NAME,
);
let templateId;
if (existingTemplate) {
  await api(`/templates/${existingTemplate.id}`, {
    method: 'PATCH',
    body: JSON.stringify(templatePayload),
  });
  templateId = existingTemplate.id;
  console.log(`↻ Template "${WELCOME_TEMPLATE_NAME}" atualizado.`);
} else {
  const created = await api('/templates', { method: 'POST', body: JSON.stringify(templatePayload) });
  templateId = created.id;
  console.log(`＋ Template "${WELCOME_TEMPLATE_NAME}" criado.`);
}
await api(`/templates/${templateId}/publish`, { method: 'POST' });

const published = await api(`/templates/${encodeURIComponent(WELCOME_TEMPLATE_ALIAS)}`);
if (published.html !== templateHtml) {
  throw new Error('✖ HTML do template de boas-vindas no Resend não bate com a fonte.');
}
const remoteKeys = (published.variables ?? []).map((variable) => variable.key).sort().join(',');
const localKeys = welcomeTemplateVariables.map((variable) => variable.key).sort().join(',');
if (remoteKeys !== localKeys) {
  throw new Error(`✖ Variáveis divergentes — Resend: [${remoteKeys}] vs repo: [${localKeys}].`);
}
console.log(`✔ Template publicado e verificado (${welcomeTemplateVariables.length} variáveis).`);

// 3. Automação
const automations = await api('/automations?limit=100');
const existingAutomation = (automations.data ?? []).find(
  (automation) => automation.name === WELCOME_AUTOMATION_NAME,
);
let automationId;
if (existingAutomation) {
  automationId = existingAutomation.id;
  if (existingAutomation.status === 'enabled') {
    await api(`/automations/${automationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'disabled' }),
    });
  }
  await api(`/automations/${automationId}`, {
    method: 'PATCH',
    body: JSON.stringify(automationPayload),
  });
  console.log(`↻ Automação "${WELCOME_AUTOMATION_NAME}" atualizada.`);
} else {
  const created = await api('/automations', {
    method: 'POST',
    body: JSON.stringify(automationPayload),
  });
  automationId = created.id;
  console.log(`＋ Automação "${WELCOME_AUTOMATION_NAME}" criada.`);
}

const automation = await api(`/automations/${automationId}`);
if (automation.status !== 'enabled') {
  await api(`/automations/${automationId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'enabled' }),
  });
}
console.log(
  `✔ Automação ativa (status: enabled) — evento → ${WELCOME_DELAY} → template "${WELCOME_TEMPLATE_ALIAS}".`,
);
console.log('✔ Tudo em sincronia — confira em https://resend.com/automations.');
