import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_WEBHOOK_SECRET } from 'astro:env/server';
import { BATCH_TIME, MIN_VISUALS, batchDayFor, isDue, saoPauloClock } from './editorial.mjs';
import { MAX_READING_MINUTES } from './reading-time.mjs';
import { editionEmail, missingFields, pendingEditions, type Edition } from './editions';

/**
 * Bot de aprovação no Telegram: manda a prévia (página + e-mail) de cada
 * edição em rascunho e recebe o "Aprovar" pelo webhook (`/api/telegram/webhook`).
 * Só o chat de `TELEGRAM_CHAT_ID` recebe prévias e pode aprovar.
 */
export const SITE = (import.meta.env.SITE ?? 'https://introducing.news').replace(/\/$/, '');

type Clock = ReturnType<typeof saoPauloClock>;
type Keyboard = { inline_keyboard: Array<Array<Record<string, string>>> };

export const telegramConfigured = () => Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_WEBHOOK_SECRET);
export const isOwnerChat = (chatId: unknown) =>
  Boolean(TELEGRAM_CHAT_ID) && String(chatId) === String(TELEGRAM_CHAT_ID).trim();

const digest = (value: string) => createHash('sha256').update(value).digest();
/** Compara segredos em tempo constante. */
export const sameSecret = (given: string, expected: string | undefined) =>
  Boolean(expected) && timingSafeEqual(digest(given), digest(expected as string));

export async function telegram<T = any>(method: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = (await response.json().catch(() => ({}))) as { ok?: boolean; result?: T; description?: string };
  if (!body.ok) throw new Error(`Telegram ${method} → ${response.status}: ${body.description ?? 'erro'}`);
  return body.result as T;
}

/** Token das prévias: HMAC do slug, então o link só abre a edição para a qual foi gerado. */
export function previewToken(slug: string): string {
  return createHmac('sha256', TELEGRAM_WEBHOOK_SECRET ?? '')
    .update(`previa:${slug}`)
    .digest('base64url')
    .slice(0, 32);
}

export const validPreviewToken = (slug: string, token: string | null) =>
  Boolean(TELEGRAM_WEBHOOK_SECRET && token) && sameSecret(token as string, previewToken(slug));

export function previewLinks(slug: string) {
  const token = previewToken(slug);
  return {
    page: `${SITE}/previa/${slug}?t=${token}`,
    email: `${SITE}/previa/${slug}/email?t=${token}`,
    cms: `${SITE}/keystatic/branch/main/collection/posts/item/${slug}`,
  };
}

const escape = (value: unknown) =>
  String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const longDay = (day: string) =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(`${day}T12:00:00Z`),
  );

export const nowLabel = (clock: Clock) =>
  `${clock.today.slice(8, 10)}/${clock.today.slice(5, 7)} às ${clock.time}`;

/** Quando a edição sai, se for (ou já tiver sido) aprovada agora. */
export function whenLine(edition: Edition, clock: Clock): string {
  if (!edition.day) return '⚠️ Sem data (publishedAt): o batch não publica.';
  if (isDue(edition.day, clock)) return '⚡ Já passou do horário do batch: aprovada, a edição é publicada e o e-mail sai em seguida.';
  return `🗓 Sai ${longDay(batchDayFor(edition.day))}, às ${BATCH_TIME}.`;
}

/** Semanais (a partir da #2) seguem as regras de tamanho e de imagens. */
const isWeekly = (edition: Edition) => !Number.isInteger(edition.data.number) || edition.data.number >= 2;

/** Markdown simples (negrito, código, links) → HTML do Telegram, já escapado. */
function inlineHtml(markdown: string): string {
  return escape(markdown)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_match, text, url) => `<a href="${url.replace(/"/g, '&quot;')}">${text}</a>`);
}

/** Mensagem com os pontos de revisão da edição (null se não houver). */
export function notesMessage(edition: Edition): string | null {
  if (edition.notes.length === 0) return null;
  const lines = [`🔎 <b>Pontos para você revisar</b> (${escape(edition.data.title)})`, ''];
  for (const note of edition.notes) {
    const line = `• ${inlineHtml(note)}`;
    if (lines.join('\n').length + line.length > 3800) {
      lines.push('…e mais pontos em editorial/notes no repositório.');
      break;
    }
    lines.push(line);
  }
  return lines.join('\n');
}

/** Legenda da prévia (HTML do Telegram). */
export function captionFor(edition: Edition, clock: Clock, approved = false): string {
  const { data } = edition;
  const email = editionEmail(edition, SITE);
  const warnings = [
    ...missingFields(data).map((field) => `falta "${field}" no frontmatter`),
    ...(email?.warnings ?? []),
    ...(email?.missing?.length ? [`variáveis sem valor no e-mail: ${email.missing.join(', ')}`] : []),
    ...(edition.minutes > MAX_READING_MINUTES ? [`${edition.minutes} min de leitura (limite: ${MAX_READING_MINUTES})`] : []),
    ...edition.placeholders.map((text) => `texto de rascunho no conteúdo: "${text}"`),
    ...(isWeekly(edition) && edition.visuals < MIN_VISUALS
      ? [`${edition.visuals} gráfico(s)/imagem(ns) no corpo (mínimo: ${MIN_VISUALS})`]
      : []),
  ];
  const number = Number.isInteger(data.number) ? ` #${data.number}` : '';
  const lines = [
    approved ? `✅ <b>Edição${number} aprovada</b>` : `📝 <b>Edição${number} para aprovar</b>`,
    `<b>${escape(data.title)}</b>`,
    '',
    `✉️ <b>Assunto:</b> ${escape(email?.subject ?? data.title)}`,
    `👀 <b>Preheader:</b> ${escape(email?.preview ?? data.description)}`,
    `⏱ ${edition.minutes} min de leitura · 🖼 ${edition.visuals} gráfico(s)/imagem(ns)`,
    whenLine(edition, clock),
    ...warnings.map((warning) => `⚠️ ${escape(warning)}`),
    ...(edition.notes.length > 0 ? [`🔎 <b>${edition.notes.length} ponto(s) para você revisar</b> na mensagem abaixo.`] : []),
  ];
  return lines.join('\n');
}

export function keyboardFor(edition: Edition, state: 'pending' | 'approved' | 'links'): Keyboard {
  const links = previewLinks(edition.slug);
  const rows: Keyboard['inline_keyboard'] = [
    [
      { text: '📄 Página', url: links.page },
      { text: '✉️ E-mail', url: links.email },
    ],
  ];
  if (state === 'pending') {
    rows.push([{ text: '✅ Aprovar e programar', callback_data: `ok:${edition.postHash}` }]);
    rows.push([{ text: '✏️ Editar no Keystatic', url: links.cms }]);
  } else if (state === 'approved') {
    rows.push([{ text: '↩️ Desfazer aprovação', callback_data: `undo:${edition.postHash}` }]);
  }
  return { inline_keyboard: rows };
}

/** Texto visível de uma legenda HTML (o limite de 1.024 caracteres conta só ele). */
const visibleLength = (html: string) =>
  html.replace(/<[^>]+>/g, '').replace(/&(amp|lt|gt);/g, '_').length;

const coverUrl = (edition: Edition) => {
  const cover = edition.data.coverImage;
  if (typeof cover !== 'string' || !cover || /\.svg($|\?)/i.test(cover)) return null;
  // `?v=` muda a cada versão: o Telegram guarda imagens por URL.
  return `${/^https?:\/\//.test(cover) ? cover : `${SITE}${cover}`}?v=${edition.version.slice(0, 8)}`;
};

interface SentPreview {
  messageId: number;
  photo: boolean;
  caption: string;
}

/** Edita a legenda (foto) ou o texto (mensagem sem capa) de uma prévia já enviada. */
export async function editPreview(
  message: { messageId: number; photo: boolean },
  text: string,
  reply_markup: Keyboard,
) {
  const base = { chat_id: TELEGRAM_CHAT_ID, message_id: message.messageId, parse_mode: 'HTML', reply_markup };
  return message.photo
    ? telegram('editMessageCaption', { ...base, caption: text })
    : telegram('editMessageText', { ...base, text, link_preview_options: { is_disabled: true } });
}

export async function sendPreview(edition: Edition, clock: Clock): Promise<SentPreview> {
  const sent = await sendPreviewMessage(edition, clock);
  const notes = notesMessage(edition);
  if (notes) {
    await telegram('sendMessage', {
      chat_id: TELEGRAM_CHAT_ID,
      text: notes,
      parse_mode: 'HTML',
      reply_parameters: { message_id: sent.messageId },
      link_preview_options: { is_disabled: true },
    }).catch((error) => console.error('[telegram] pontos de revisão não enviados:', error));
  }
  return sent;
}

async function sendPreviewMessage(edition: Edition, clock: Clock): Promise<SentPreview> {
  const caption = captionFor(edition, clock);
  const reply_markup = keyboardFor(edition, 'pending');
  const photo = coverUrl(edition);
  if (photo && visibleLength(caption) <= 1024) {
    try {
      const sent = await telegram<{ message_id: number }>('sendPhoto', {
        chat_id: TELEGRAM_CHAT_ID,
        photo,
        caption,
        parse_mode: 'HTML',
        reply_markup,
      });
      return { messageId: sent.message_id, photo: true, caption };
    } catch (error) {
      console.error('[telegram] capa não enviada, mandando só o texto:', error);
    }
  }
  const sent = await telegram<{ message_id: number }>('sendMessage', {
    chat_id: TELEGRAM_CHAT_ID,
    text: caption,
    parse_mode: 'HTML',
    reply_markup,
    link_preview_options: { is_disabled: true },
  });
  return { messageId: sent.message_id, photo: false, caption };
}

interface StoredPreview extends SentPreview {
  version: string;
  sentAt: string;
}

const previewStore = () => {
  try {
    return getStore({ name: 'telegram', consistency: 'strong' });
  } catch {
    return null; // fora da Netlify (sem Blobs): sem deduplicação
  }
};

/**
 * Manda a prévia de cada edição esperando aprovação que mudou desde a última
 * mensagem (ou de todas, com `force`). A prévia anterior da mesma edição perde
 * o botão de aprovar, para ninguém aprovar uma versão velha.
 */
export async function notifyPending({ force = false } = {}) {
  if (!telegramConfigured() || !TELEGRAM_CHAT_ID) return { sent: [], skipped: [], reason: 'not-configured' };
  const clock = saoPauloClock();
  const store = previewStore();
  const sent: string[] = [];
  const skipped: string[] = [];

  for (const edition of pendingEditions(clock)) {
    const key = `edition/${edition.slug}`;
    const previous = store
      ? ((await store.get(key, { type: 'json' }).catch(() => null)) as StoredPreview | null)
      : null;
    if (!force && previous?.version === edition.version) {
      skipped.push(edition.slug);
      continue;
    }

    const message = await sendPreview(edition, clock);
    if (previous?.messageId && previous.messageId !== message.messageId) {
      await editPreview(
        previous,
        `${previous.caption}\n\n🔄 <i>Substituída pela prévia mais nova.</i>`,
        keyboardFor(edition, 'links'),
      ).catch(() => {}); // mensagem apagada ou antiga demais: tudo bem
    }
    await store
      ?.setJSON(key, { ...message, version: edition.version, sentAt: new Date().toISOString() })
      .catch((error) => console.error('[telegram] estado não gravado:', error));
    sent.push(edition.slug);
  }

  return { sent, skipped };
}
