/**
 * Calendário e status das edições: uma única conta para o batch
 * (`scripts/publish-batch.mjs`) e para o bot de aprovação no Telegram.
 *
 * Sem dependências de propósito: o workflow "Publicar batch" roda
 * `publish-batch.mjs --check` antes do `npm ci`.
 */
export const BATCH_WEEKDAYS = new Set([1]); // segunda-feira
export const BATCH_TIME = '12:00'; // horário da newsletter (Brasília)
export const TIME_ZONE = 'America/Sao_Paulo';

/** Data (AAAA-MM-DD) e hora (HH:MM) em Brasília. */
export function saoPauloClock(now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);
  return { today, time };
}

/** `publishedAt` (string ou Date) → AAAA-MM-DD, ou null se não for data. */
export function isoDay(value) {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString().slice(0, 10);
}

/** Próximo dia de batch (ou o próprio dia, se já for segunda). */
export function batchDayFor(day) {
  const date = new Date(`${day}T00:00:00Z`);
  for (let i = 0; i < 7; i += 1) {
    if (BATCH_WEEKDAYS.has(date.getUTCDay())) return date.toISOString().slice(0, 10);
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return day;
}

/**
 * Uma edição programada para `day` já venceu? No dia do batch, só a partir
 * das 12:00 (Brasília): programar na segunda de manhã não publica antes.
 */
export function isDue(day, clock = saoPauloClock()) {
  const batchDay = batchDayFor(day);
  return batchDay < clock.today || (batchDay === clock.today && clock.time >= BATCH_TIME);
}

/**
 * Troca o `status` no frontmatter de um arquivo de edição, sem mexer no resto.
 * Devolve o texto novo, ou null se o status atual não estiver em `from`.
 */
export function replaceStatus(raw, from, to) {
  const match = String(raw).match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  if (!match) return null;
  const front = match[1];
  const line = /^status:[ \t]*['"]?([a-z]+)['"]?[ \t]*$/m;
  const current = front.match(line)?.[1] ?? 'draft';
  if (!from.includes(current)) return null;
  const nextFront = line.test(front)
    ? front.replace(line, `status: ${to}`)
    : `${front}\nstatus: ${to}`;
  const start = raw.indexOf(front);
  return raw.slice(0, start) + nextFront + raw.slice(start + front.length);
}
