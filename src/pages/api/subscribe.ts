export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { DEFAULT_LOCALE, isLocale, type Locale } from '../../i18n/config';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  let email = '';
  let locale: Locale = DEFAULT_LOCALE;
  try {
    const data = (await request.json()) as { email?: unknown; locale?: unknown };
    email = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : '';
    if (typeof data?.locale === 'string' && isLocale(data.locale)) locale = data.locale;
  } catch {
    return json({ error: 'Requisição inválida.' }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return json({ error: 'Digite um e-mail válido.' }, 400);
  }

  const apiKey = env.RESEND_API_KEY;
  const segmentId = locale === 'pt' ? env.RESEND_SEGMENT_PT : env.RESEND_SEGMENT_EN;
  if (!apiKey || !segmentId) {
    console.error('subscribe: RESEND_API_KEY ou segmento do Resend ausente');
    return json({ error: 'Serviço de inscrição não configurado.' }, 500);
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const payload = {
    email,
    unsubscribed: false,
    properties: { locale },
    segments: [{ id: segmentId }],
  };

  let response = await fetch('https://api.resend.com/contacts', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  // Contato já existe: atualiza idioma/segmento em vez de falhar.
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
