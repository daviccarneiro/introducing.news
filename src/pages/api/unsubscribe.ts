export const prerender = false;

import type { APIRoute } from 'astro';
import { RESEND_API_KEY } from 'astro:env/server';
import { clientIp, isRateLimited, json, verifyTurnstile } from '../../lib/api';

const RATE_LIMIT = { scope: 'unsubscribe', max: 5, windowSeconds: 600 };

/**
 * Remove (marca como unsubscribed) um contato no Resend.
 * A resposta é sempre `{ ok: true }` quando o e-mail não existe, para não
 * revelar quem está ou não na lista (anti-enumeração).
 */
export const POST: APIRoute = async ({ request }) => {
  let email = '';
  let turnstileToken = '';

  try {
    const data = (await request.json()) as { email?: unknown; turnstileToken?: unknown };
    email = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : '';
    turnstileToken = typeof data?.turnstileToken === 'string' ? data.turnstileToken : '';
  } catch {
    return json({ error: 'Requisição inválida.' }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return json({ error: 'Digite um e-mail válido.' }, 400);
  }

  const ip = clientIp(request);
  if (await isRateLimited(ip, RATE_LIMIT.scope, RATE_LIMIT.max, RATE_LIMIT.windowSeconds)) {
    return json(
      { error: 'Muitas tentativas. Tente de novo em alguns minutos.' },
      429,
      { 'Retry-After': String(RATE_LIMIT.windowSeconds) },
    );
  }

  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return json({ error: 'Falha na verificação anti-bot. Recarregue e tente de novo.' }, 400);
  }

  const apiKey = RESEND_API_KEY;
  if (!apiKey) {
    console.error('unsubscribe: RESEND_API_KEY ausente');
    return json({ error: 'Serviço de descadastro não configurado.' }, 500);
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const found = await fetch(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
    headers,
  });
  if (found.status === 404) {
    return json({ ok: true }, 200);
  }
  if (!found.ok) {
    console.error('unsubscribe: falha ao buscar contato', found.status, await found.text());
    return json({ error: 'Não foi possível concluir. Tente de novo.' }, 502);
  }

  const contact = (await found.json()) as { id?: string };
  if (!contact.id) {
    return json({ ok: true }, 200);
  }

  const response = await fetch(`https://api.resend.com/contacts/${contact.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ unsubscribed: true }),
  });
  if (!response.ok) {
    console.error('unsubscribe: falha no Resend', response.status, await response.text());
    return json({ error: 'Não foi possível concluir. Tente de novo.' }, 502);
  }

  return json({ ok: true }, 200);
};

export const ALL: APIRoute = () => json({ error: 'Método não permitido.' }, 405);
