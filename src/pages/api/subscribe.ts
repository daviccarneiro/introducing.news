export const prerender = false;

import type { APIRoute } from 'astro';
import { RESEND_API_KEY, RESEND_SEGMENT_ID } from 'astro:env/server';
import { clientIp, isRateLimited, json, verifyTurnstile } from '../../lib/api';

const RATE_LIMIT = { scope: 'subscribe', max: 5, windowSeconds: 600 };

/** Texto de origem da inscrição, sem caracteres de controle e com limite. */
const cleanText = (value: unknown, max: number) =>
  typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max) : '';

export const POST: APIRoute = async ({ request }) => {
  let email = '';
  let consent = false;
  let turnstileToken = '';
  let referrer = '';
  let utm = '';

  try {
    const data = (await request.json()) as {
      email?: unknown;
      consent?: unknown;
      turnstileToken?: unknown;
      referrer?: unknown;
      utm?: unknown;
    };
    email = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : '';
    consent = data?.consent === true;
    turnstileToken = typeof data?.turnstileToken === 'string' ? data.turnstileToken : '';
    referrer = cleanText(data?.referrer, 200);
    utm = cleanText(data?.utm, 300);
  } catch {
    return json({ error: 'Requisição inválida.' }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return json({ error: 'Digite um e-mail válido.' }, 400);
  }

  if (!consent) {
    return json({ error: 'É preciso aceitar receber os e-mails para continuar.' }, 400);
  }

  const ip = clientIp(request);
  if (await isRateLimited(ip, RATE_LIMIT.scope, RATE_LIMIT.max, RATE_LIMIT.windowSeconds)) {
    return json(
      { error: 'Muitas tentativas. Tente de novo em alguns minutos.' },
      429,
      { 'Retry-After': String(RATE_LIMIT.windowSeconds) },
    );
  }

  // CAPTCHA (quando configurado). Bloqueia bots sem exigir duplo opt-in.
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return json({ error: 'Falha na verificação anti-bot. Recarregue e tente de novo.' }, 400);
  }

  const apiKey = RESEND_API_KEY;
  const segmentId = RESEND_SEGMENT_ID;
  if (!apiKey || !segmentId) {
    console.error('subscribe: RESEND_API_KEY ou RESEND_SEGMENT_ID ausente');
    return json({ error: 'Serviço de inscrição não configurado.' }, 500);
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const properties: Record<string, string | null> = {
    locale: 'pt',
    consent_at: new Date().toISOString(),
  };
  // Origem da primeira inscrição (atribuição sem cookie): guardada só se vier.
  if (referrer) properties.signup_referrer = referrer;
  if (utm) properties.signup_utm = utm;

  const payload = {
    email,
    unsubscribed: false,
    properties,
    segments: [{ id: segmentId }],
  };

  // O POST /contacts do Resend é upsert: retorna 201 tanto para contato novo
  // quanto para existente. Consultamos antes para saber se é a primeira
  // inscrição — é isso que decide se a automação de boas-vindas dispara.
  const existing = await fetch(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
    headers,
  });

  if (existing.status !== 404 && !existing.ok) {
    console.error('subscribe: falha ao consultar contato', existing.status, await existing.text());
    return json({ error: 'Não foi possível concluir a inscrição. Tente de novo.' }, 502);
  }

  const isNewContact = existing.status === 404;

  let response: Response;
  if (isNewContact) {
    response = await fetch('https://api.resend.com/contacts', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } else {
    // Reinscrição: atualiza consentimento/segmento e reativa o contato.
    const contact = (await existing.json()) as { id?: string };
    if (!contact.id) {
      console.error('subscribe: contato existente sem id');
      return json({ error: 'Não foi possível concluir a inscrição. Tente de novo.' }, 502);
    }
    response = await fetch(`https://api.resend.com/contacts/${contact.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        unsubscribed: payload.unsubscribed,
        // Reinscrição: limpa a data de descadastro anterior (churn) e atualiza
        // o consentimento; a origem original (signup_*) é preservada.
        properties: {
          locale: payload.properties.locale,
          consent_at: payload.properties.consent_at,
          unsubscribed_at: null,
        },
        segments: payload.segments,
      }),
    });
  }

  if (!response.ok) {
    console.error('subscribe: falha no Resend', response.status, await response.text());
    return json({ error: 'Não foi possível concluir a inscrição. Tente de novo.' }, 502);
  }

  // Só na primeira inscrição: dispara a automação de boas-vindas do Resend
  // (evento definido em `scripts/welcome-email.mjs`). Reinscrições não
  // disparam de novo, e falha aqui não derruba a inscrição.
  if (isNewContact) {
    try {
      const event = await fetch('https://api.resend.com/events/send', {
        method: 'POST',
        headers,
        body: JSON.stringify({ event: 'newsletter.subscribed', email }),
      });
      if (!event.ok) {
        console.error('subscribe: falha ao disparar boas-vindas', event.status, await event.text());
      }
    } catch (error) {
      console.error('subscribe: erro ao disparar boas-vindas', error);
    }
  }

  return json({ ok: true }, 200);
};

export const ALL: APIRoute = () => json({ error: 'Método não permitido.' }, 405);
