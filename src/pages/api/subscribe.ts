export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { clientIp, isRateLimited, json, verifyTurnstile } from '../../lib/api';

const RATE_LIMIT = { scope: 'subscribe', max: 5, windowSeconds: 600 };

export const POST: APIRoute = async ({ request }) => {
  let email = '';
  let consent = false;
  let turnstileToken = '';

  try {
    const data = (await request.json()) as {
      email?: unknown;
      consent?: unknown;
      turnstileToken?: unknown;
    };
    email = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : '';
    consent = data?.consent === true;
    turnstileToken = typeof data?.turnstileToken === 'string' ? data.turnstileToken : '';
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
  if (await isRateLimited(request, ip, RATE_LIMIT.scope, RATE_LIMIT.max, RATE_LIMIT.windowSeconds)) {
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

  const apiKey = env.RESEND_API_KEY;
  const segmentId = env.RESEND_SEGMENT_ID;
  if (!apiKey || !segmentId) {
    console.error('subscribe: RESEND_API_KEY ou RESEND_SEGMENT_ID ausente');
    return json({ error: 'Serviço de inscrição não configurado.' }, 500);
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const payload = {
    email,
    unsubscribed: false,
    properties: {
      locale: 'pt',
      consent_at: new Date().toISOString(),
    },
    segments: [{ id: segmentId }],
  };

  let response = await fetch('https://api.resend.com/contacts', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  // Contato já existe: atualiza consentimento/segmento em vez de falhar.
  if (response.status === 409) {
    const found = await fetch(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
      headers,
    });
    if (found.ok) {
      const contact = (await found.json()) as { id?: string };
      if (contact.id) {
        response = await fetch(`https://api.resend.com/contacts/${contact.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload),
        });
      }
    }
  }

  if (!response.ok) {
    console.error('subscribe: falha no Resend', response.status, await response.text());
    return json({ error: 'Não foi possível concluir a inscrição. Tente de novo.' }, 502);
  }

  return json({ ok: true }, 200);
};

export const ALL: APIRoute = () => json({ error: 'Método não permitido.' }, 405);
