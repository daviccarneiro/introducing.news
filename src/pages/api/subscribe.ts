export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  let email = '';
  try {
    const data = (await request.json()) as { email?: unknown };
    email = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : '';
  } catch {
    return json({ error: 'Requisição inválida.' }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return json({ error: 'Digite um e-mail válido.' }, 400);
  }

  const apiKey = env.RESEND_API_KEY;
  const audienceId = env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    console.error('subscribe: RESEND_API_KEY ou RESEND_AUDIENCE_ID ausente');
    return json({ error: 'Serviço de inscrição não configurado.' }, 500);
  }

  const response = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, unsubscribed: false }),
  });

  // 409: contato já existe — tratamos como sucesso idempotente.
  if (!response.ok && response.status !== 409) {
    console.error('subscribe: falha no Resend', response.status, await response.text());
    return json({ error: 'Não foi possível concluir a inscrição. Tente de novo.' }, 502);
  }

  return json({ ok: true }, 200);
};

export const ALL: APIRoute = () => json({ error: 'Método não permitido.' }, 405);
