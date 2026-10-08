#!/usr/bin/env node
/**
 * Snapshot de analytics — lê o Resend e grava métricas agregadas num Google
 * Sheet, que alimenta o dashboard no Looker Studio.
 *
 * Uso:
 *   node scripts/analytics-snapshot.mjs            # sincroniza com o Sheet
 *   node scripts/analytics-snapshot.mjs --dry-run  # gera CSVs locais, sem Google
 *
 * Requer: RESEND_API_KEY e RESEND_SEGMENT_ID (segmento de produção).
 * Com Google: GOOGLE_SHEET_ID e GOOGLE_SERVICE_ACCOUNT_JSON (JSON da conta de
 * serviço, com a planilha compartilhada como Editor).
 *
 * Abas geradas:
 *   crescimento — novos e churn por dia
 *   resumo      — totais atuais do segmento
 *   edicoes     — métricas de e-mail por edição (broadcast)
 *   links       — cliques por link em cada edição
 *
 * Privacidade: só métricas agregadas — nenhum e-mail de assinante sai daqui.
 * O Resend retém dados de e-mail por 30 dias; o snapshot semanal mantém o
 * histórico no Sheet. A churn por dia vem dos descadastros ligados a
 * broadcast (`emails/metrics`); descadastros feitos direto na página entram
 * nos totais, mas sem data retroativa.
 *
 * Rodado pelo workflow "Analytics" (segundas, após o batch) ou manualmente.
 * Local: `doppler run -p introducing-news -c dev_personal -- npm run analytics:sync`
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { syncSheets } from './google-sheets.mjs';

const POSTS_DIR = new URL('../src/content/posts/', import.meta.url);
const API_KEY = process.env.RESEND_API_KEY;
const SEGMENT_ID = process.env.RESEND_SEGMENT_ID;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
const dryRun = process.argv.slice(2).includes('--dry-run');

if (!API_KEY || !SEGMENT_ID) {
  console.error('✖ Faltam RESEND_API_KEY e/ou RESEND_SEGMENT_ID no ambiente.');
  process.exit(1);
}
if (!dryRun && (!SHEET_ID || !SERVICE_ACCOUNT)) {
  console.error('✖ Faltam GOOGLE_SHEET_ID e/ou GOOGLE_SERVICE_ACCOUNT_JSON (use --dry-run para testar sem Google).');
  process.exit(1);
}

const api = async (path) => {
  const response = await fetch(`https://api.resend.com${path}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Resend ${path} → ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
};

const spDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Datas do Resend vêm como "2026-10-08 19:31:15.752186+00". */
const parseResendDate = (value) => {
  if (!value) return null;
  const normalized = String(value).replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00');
  const date = new Date(normalized);
  return Number.isNaN(date.valueOf()) ? null : date;
};

const dayOf = (value) => {
  const date = parseResendDate(value);
  return date ? spDate.format(date) : '';
};

/** Percorre TODAS as páginas de um endpoint com paginação por cursor. */
async function listAll(path) {
  const items = [];
  let after = '';
  for (;;) {
    const separator = path.includes('?') ? '&' : '?';
    const page = await api(`${path}${separator}limit=100${after ? `&after=${after}` : ''}`);
    items.push(...(page.data ?? []));
    if (!page.has_more || !(page.data ?? []).length) break;
    after = page.data[page.data.length - 1].id;
  }
  return items;
}

/** Frontmatter (sem dependências): pega `number` e `publishedAt` de cada edição. */
function frontmatterOf(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
  return match ? match[1] : null;
}

function valueOf(front, key) {
  const match = front.match(new RegExp(`^${key}:[ \\t]*['"]?([^'"\\r\\n]+?)['"]?[ \\t]*$`, 'm'));
  return match?.[1]?.trim() || '';
}

async function editionMeta() {
  const map = new Map();
  const files = (await readdir(POSTS_DIR)).filter((name) => name.endsWith('.mdx'));
  for (const name of files) {
    const raw = await readFile(new URL(name, POSTS_DIR), 'utf8');
    const front = frontmatterOf(raw);
    if (!front) continue;
    map.set(name.replace(/\.mdx$/, ''), {
      number: valueOf(front, 'number'),
      publishedAt: valueOf(front, 'publishedAt').slice(0, 10),
    });
  }
  return map;
}

const slugOf = (broadcast) => (broadcast.name ?? '').replace(/^edição-/, '') || broadcast.id;
const percent = (value, total) => (total > 0 ? Math.round((value / total) * 1000) / 10 : 0);

// --- Coleta -----------------------------------------------------------------

const contacts = await listAll(`/segments/${SEGMENT_ID}/contacts`);
const broadcasts = (await listAll('/broadcasts')).filter((item) => item.segment_id === SEGMENT_ID);
const meta = await editionMeta();

// Uma chamada cobre período e broadcast; com `broadcast_id` a retenção de
// 30 dias não se aplica, então o histórico completo é reconstruído a cada run.
const metrics = [];
for (let index = 0; index < broadcasts.length; index += 100) {
  const ids = broadcasts.slice(index, index + 100).map((item) => item.id);
  const query = new URLSearchParams({
    broadcast_id: ids.join(','),
    dimensions: 'period,broadcast',
    metrics: 'sent,delivered,bounced,complained,unique_opened,unique_clicked,unsubscribed',
    start_date: '2023-01-01',
    end_date: spDate.format(new Date()),
  });
  const page = await api(`/emails/metrics?${query}`);
  metrics.push(...(page.data ?? []));
}

// --- Agregações -------------------------------------------------------------

const newByDay = new Map();
let active = 0;
let churned = 0;
for (const contact of contacts) {
  const day = dayOf(contact.created_at);
  if (day) newByDay.set(day, (newByDay.get(day) ?? 0) + 1);
  if (contact.unsubscribed) churned += 1;
  else active += 1;
}

const churnByDay = new Map();
const byBroadcast = new Map();
for (const row of metrics) {
  if (!row.broadcast_id) continue;
  if (row.period) {
    churnByDay.set(row.period, (churnByDay.get(row.period) ?? 0) + (row.unsubscribed ?? 0));
  }
  const aggregate = byBroadcast.get(row.broadcast_id) ?? {
    sent: 0,
    delivered: 0,
    bounced: 0,
    complained: 0,
    unique_opened: 0,
    unique_clicked: 0,
    unsubscribed: 0,
  };
  for (const key of Object.keys(aggregate)) aggregate[key] += row[key] ?? 0;
  byBroadcast.set(row.broadcast_id, aggregate);
}

const days = [...new Set([...newByDay.keys(), ...churnByDay.keys()])].sort();
const crescimento = [
  ['data', 'novos', 'churn'],
  ...days.map((day) => [day, newByDay.get(day) ?? 0, churnByDay.get(day) ?? 0]),
];

const resumo = [
  ['metrica', 'valor'],
  ['total_contatos', contacts.length],
  ['ativos', active],
  ['descadastrados', churned],
  ['gerado_em', new Date().toISOString()],
];

const ordenados = [...broadcasts].sort((a, b) =>
  String(a.sent_at ?? '').localeCompare(String(b.sent_at ?? '')),
);
const edicoes = [
  [
    'slug',
    'numero',
    'data',
    'broadcast',
    'enviados',
    'entregues',
    'bounces',
    'reclamacoes',
    'aberturas_unicas',
    'cliques_unicos',
    'descadastros',
    'taxa_abertura',
    'taxa_clique',
  ],
  ...ordenados.map((broadcast) => {
    const slug = slugOf(broadcast);
    const edition = meta.get(slug) ?? { number: '', publishedAt: '' };
    const aggregate = byBroadcast.get(broadcast.id) ?? {};
    const delivered = aggregate.delivered ?? 0;
    return [
      slug,
      edition.number,
      edition.publishedAt || String(broadcast.sent_at ?? '').slice(0, 10),
      broadcast.name ?? '',
      aggregate.sent ?? 0,
      delivered,
      aggregate.bounced ?? 0,
      aggregate.complained ?? 0,
      aggregate.unique_opened ?? 0,
      aggregate.unique_clicked ?? 0,
      aggregate.unsubscribed ?? 0,
      percent(aggregate.unique_opened ?? 0, delivered),
      percent(aggregate.unique_clicked ?? 0, delivered),
    ];
  }),
];

const links = [['slug', 'link', 'cliques', 'cliques_unicos']];
for (const broadcast of ordenados) {
  const clicked = await listAll(`/broadcasts/${broadcast.id}/clicked-links`);
  for (const link of clicked) {
    links.push([slugOf(broadcast), link.url, link.clicks, link.unique_clicks]);
  }
}

const tabs = { crescimento, resumo, edicoes, links };

// --- Saída ------------------------------------------------------------------

if (dryRun) {
  const dir = join(tmpdir(), 'introducing-news-analytics');
  await mkdir(dir, { recursive: true });
  const csvCell = (value) => {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  for (const [name, rows] of Object.entries(tabs)) {
    const path = join(dir, `${name}.csv`);
    await writeFile(path, `${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`, 'utf8');
    console.log(`◌ [dry-run] ${name}: ${Math.max(rows.length - 1, 0)} linha(s) → ${path}`);
  }
  console.log(`   contatos no segmento: ${contacts.length} (ativos ${active}, descadastrados ${churned})`);
  console.log(`   broadcasts no segmento: ${broadcasts.length} | links clicados: ${links.length - 1}`);
  process.exit(0);
}

await syncSheets({ sheetId: SHEET_ID, serviceAccountJson: SERVICE_ACCOUNT, tabs });
console.log(
  `✔ Snapshot gravado no Sheet: ${days.length} dia(s), ${ordenados.length} edição(ões), ${links.length - 1} link(s).`,
);
