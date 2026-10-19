export const prerender = false;

import type { APIRoute } from 'astro';
import { TELEGRAM_CHAT_ID, TELEGRAM_WEBHOOK_SECRET } from 'astro:env/server';
import { saoPauloClock } from '../../../lib/editorial.mjs';
import { findByPostHash, type Edition } from '../../../lib/editions';
import { changeStatus } from '../../../lib/github';
import {
  captionFor,
  editPreview,
  isOwnerChat,
  keyboardFor,
  notifyPending,
  nowLabel,
  sameSecret,
  telegram,
  telegramConfigured,
} from '../../../lib/telegram';

/**
 * Webhook do bot (registrado por `npm run telegram:setup`). O Telegram manda
 * o cabeçalho `X-Telegram-Bot-Api-Secret-Token` com `TELEGRAM_WEBHOOK_SECRET`;
 * qualquer outra origem leva 403. Só o chat de `TELEGRAM_CHAT_ID` é atendido.
 *
 * - "Aprovar e programar" (`ok:<hash>`): draft/review → scheduled por commit.
 * - "Desfazer aprovação" (`undo:<hash>`): scheduled → draft, se ainda não saiu.
 * - `/pendentes`: reenvia as prévias de tudo que espera aprovação.
 *
 * Responde 200 mesmo com erro interno, para o Telegram não repetir o update.
 */
const HELP = [
  'Eu mando aqui a prévia (página + e-mail) de cada edição em rascunho, logo depois que ela entra no site.',
  '',
  '✅ <b>Aprovar e programar</b> muda a edição para "Programada": ela sai no batch de segunda, às 12:00 (ou na hora, se o batch do dia já passou).',
  '↩️ <b>Desfazer aprovação</b> volta para rascunho, enquanto ela não tiver saído.',
  '',
  '/pendentes reenvia as prévias que esperam aprovação.',
].join('\n');

const FAILURE: Record<string, string> = {
  'no-token': 'Falta GITHUB_CONTENTS_TOKEN na Netlify: não consigo commitar.',
  changed: 'A edição mudou depois desta prévia. Espere a prévia nova (ou mande /pendentes).',
  incomplete: 'Faltam campos para programar',
  error: 'Erro ao falar com o GitHub. Tente de novo em instantes.',
};

async function answer(id: string, text: string, alert = false) {
  await telegram('answerCallbackQuery', { callback_query_id: id, text, show_alert: alert }).catch(() => {});
}

async function onCallback(query: any) {
  const message = query.message;
  if (!isOwnerChat(message?.chat?.id)) {
    await answer(query.id, 'Sem permissão.');
    return;
  }
  const [action, hash] = String(query.data ?? '').split(':');
  const edition: Edition | null = hash ? findByPostHash(hash) : null;
  if (!edition || (action !== 'ok' && action !== 'undo')) {
    await answer(query.id, 'Prévia antiga: use a mensagem mais recente (ou mande /pendentes).', true);
    return;
  }

  const approving = action === 'ok';
  const number = Number.isInteger(edition.data.number) ? ` #${edition.data.number}` : '';
  const result = await changeStatus({
    slug: edition.slug,
    postHash: edition.postHash,
    from: approving ? ['draft', 'review'] : ['scheduled'],
    to: approving ? 'scheduled' : 'draft',
    message: approving
      ? `content: programa a edição${number} pelo Telegram`
      : `content: volta a edição${number} para rascunho pelo Telegram`,
  });

  if (!result.ok) {
    let text = FAILURE[result.reason] ?? 'Não deu certo.';
    if (result.reason === 'incomplete') text = `${text}: ${result.detail}.`;
    if (result.reason === 'status') {
      text =
        result.detail === 'published'
          ? 'Essa edição já foi publicada.'
          : approving
            ? 'Essa edição já estava programada.'
            : 'Essa edição não está programada.';
    }
    if (result.reason === 'error') console.error('[telegram] GitHub:', result.detail);
    await answer(query.id, text, true);
    return;
  }

  const clock = saoPauloClock();
  const footer = approving
    ? `<i>Aprovada em ${nowLabel(clock)}.</i>`
    : `<i>Aprovação desfeita em ${nowLabel(clock)}: voltou para rascunho.</i>`;
  await editPreview(
    { messageId: message.message_id, photo: Array.isArray(message.photo) },
    `${captionFor(edition, clock, approving)}\n\n${footer}`,
    keyboardFor(edition, approving ? 'approved' : 'pending'),
  ).catch((error) => console.error('[telegram] prévia não editada:', error));
  await answer(query.id, approving ? '✅ Programada.' : '↩️ Voltou para rascunho.');
}

async function onMessage(message: any) {
  const chatId = message.chat?.id;
  // Antes de configurar TELEGRAM_CHAT_ID, o bot só informa o chat ID de quem escreve.
  if (!TELEGRAM_CHAT_ID) {
    await telegram('sendMessage', {
      chat_id: chatId,
      text: `Chat ID: <code>${Number(chatId)}</code>\nGuarde em TELEGRAM_CHAT_ID (Doppler e Netlify) e refaça o deploy.`,
      parse_mode: 'HTML',
    });
    return;
  }
  if (!isOwnerChat(chatId)) return;

  const command = String(message.text ?? '').trim().split(/[\s@]/)[0];
  if (command === '/pendentes') {
    const { sent } = await notifyPending({ force: true });
    if (sent.length === 0) {
      await telegram('sendMessage', { chat_id: chatId, text: 'Nenhuma edição esperando aprovação.' });
    }
    return;
  }
  await telegram('sendMessage', { chat_id: chatId, text: HELP, parse_mode: 'HTML' });
}

export const POST: APIRoute = async ({ request }) => {
  if (!telegramConfigured()) return new Response('Not found', { status: 404 });
  const secret = request.headers.get('x-telegram-bot-api-secret-token') ?? '';
  if (!sameSecret(secret, TELEGRAM_WEBHOOK_SECRET)) return new Response('Forbidden', { status: 403 });

  try {
    const update = (await request.json()) as { callback_query?: unknown; message?: unknown };
    if (update.callback_query) await onCallback(update.callback_query);
    else if (update.message) await onMessage(update.message);
  } catch (error) {
    console.error('[telegram] update com erro:', error);
  }
  return new Response(null, { status: 200 });
};
