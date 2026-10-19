export const prerender = false;

import type { APIRoute } from 'astro';
import { TELEGRAM_WEBHOOK_SECRET } from 'astro:env/server';
import { json } from '../../../lib/api';
import { notifyPending, sameSecret, telegramConfigured } from '../../../lib/telegram';

/**
 * Manda para o Telegram as prévias das edições em rascunho que mudaram.
 * Chamado pela função `deploy-succeeded` (netlify/functions) depois de cada
 * deploy de produção, com `Authorization: Bearer <TELEGRAM_WEBHOOK_SECRET>`.
 * `?force` reenvia mesmo sem mudança (`npm run telegram:setup -- --notify`).
 */
export const POST: APIRoute = async ({ request, url }) => {
  if (!telegramConfigured()) return new Response('Not found', { status: 404 });
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!sameSecret(token, TELEGRAM_WEBHOOK_SECRET)) return new Response('Forbidden', { status: 403 });

  try {
    return json(await notifyPending({ force: url.searchParams.has('force') }));
  } catch (error) {
    console.error('[telegram] prévias não enviadas:', error);
    return json({ error: 'Falha ao enviar as prévias.' }, 502);
  }
};
