#!/usr/bin/env node
/**
 * Configura o bot de aprovação no Telegram.
 *
 * Uso (com segredos: doppler run -p introducing-news -c dev_personal -- …):
 *   node scripts/telegram-setup.mjs            # registra o webhook e os comandos do bot
 *   node scripts/telegram-setup.mjs --chats    # lista quem escreveu ao bot (só sem webhook)
 *   node scripts/telegram-setup.mjs --notify   # pede ao site que reenvie as prévias pendentes
 *   node scripts/telegram-setup.mjs --status   # mostra o estado do webhook
 *
 * Requer: TELEGRAM_BOT_TOKEN e TELEGRAM_WEBHOOK_SECRET (opcional: SITE_URL).
 * O webhook aponta para `<SITE_URL>/api/telegram/webhook` e só aceita
 * requisições com o segredo no cabeçalho `X-Telegram-Bot-Api-Secret-Token`.
 */
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const SITE = (process.env.SITE_URL ?? 'https://introducing.news').replace(/\/$/, '');
const args = process.argv.slice(2);

if (!TOKEN || !SECRET) {
  console.error('✖ Faltam TELEGRAM_BOT_TOKEN e/ou TELEGRAM_WEBHOOK_SECRET no ambiente.');
  process.exit(1);
}

async function telegram(method, payload = {}) {
  const response = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!body.ok) throw new Error(`Telegram ${method} → ${response.status}: ${body.description ?? 'erro'}`);
  return body.result;
}

async function status() {
  const info = await telegram('getWebhookInfo');
  console.log(`webhook: ${info.url || '(nenhum)'}`);
  console.log(`pendentes: ${info.pending_update_count}`);
  if (info.last_error_message) {
    console.log(`último erro: ${info.last_error_message} (${new Date(info.last_error_date * 1000).toISOString()})`);
  }
}

if (args.includes('--status')) {
  await status();
} else if (args.includes('--chats')) {
  // getUpdates só funciona sem webhook; com webhook, mande /start ao bot.
  const updates = await telegram('getUpdates');
  const chats = new Map();
  for (const update of updates) {
    const chat = (update.message ?? update.callback_query?.message)?.chat;
    if (chat) chats.set(chat.id, [chat.first_name, chat.last_name, chat.username && `@${chat.username}`].filter(Boolean).join(' '));
  }
  if (chats.size === 0) console.log('Ninguém escreveu ao bot ainda: mande /start para ele e rode de novo.');
  for (const [id, name] of chats) console.log(`${id}\t${name}`);
} else if (args.includes('--notify')) {
  const response = await fetch(`${SITE}/api/telegram/notify?force`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SECRET}` },
  });
  console.log(`${response.status} ${await response.text()}`);
  if (!response.ok) process.exit(1);
} else {
  const url = `${SITE}/api/telegram/webhook`;
  await telegram('setWebhook', {
    url,
    secret_token: SECRET,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
  });
  await telegram('setMyCommands', {
    commands: [
      { command: 'pendentes', description: 'Reenviar as prévias que esperam aprovação' },
      { command: 'ajuda', description: 'Como o bot funciona' },
    ],
  });
  console.log(`✔ Webhook registrado em ${url}.`);
  await status();
}
