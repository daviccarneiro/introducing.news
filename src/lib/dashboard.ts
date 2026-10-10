import { getStore } from '@netlify/blobs';
import { RESEND_API_KEY, RESEND_SEGMENT_ID } from 'astro:env/server';
import { dayOf, emptyDay, firstTrackedDay, readDays, type DayCounters } from './metrics';

/**
 * Dados do painel (`/painel`): agregados do Resend (cacheados no Blobs por
 * alguns minutos, para respeitar o rate limit) + contadores diários próprios.
 * Nada aqui guarda e-mail de assinante — o cache tem só números por dia.
 */

const CACHE_KEY = 'dashboard/resend';
const CACHE_TTL_MS = 10 * 60 * 1000;

export type Edition = {
  id: string;
  slug: string;
  sentAt: string;
  sent: number;
  delivered: number;
  bounced: number;
  complained: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
};

export type ResendSnapshot = {
  fetchedAt: string;
  total: number;
  active: number;
  unsubscribed: number;
  /** Contatos criados por dia (fuso de São Paulo). */
  createdByDay: Record<string, number>;
  /** Descadastros ligados a broadcast, por dia. */
  broadcastUnsubByDay: Record<string, number>;
  editions: Edition[];
  /** Links mais clicados da última edição enviada. */
  topLinks: { url: string; clicks: number; unique: number }[];
};

const resend = async <T>(path: string): Promise<T> => {
  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(`https://api.resend.com${path}`, {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
    });
    // Rate limit do Resend: espera e tenta de novo algumas vezes.
    if (response.status === 429 && attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
      continue;
    }
    if (!response.ok) throw new Error(`Resend ${path} → ${response.status}`);
    return (await response.json()) as T;
  }
};

type Page<T> = { data?: T[]; has_more?: boolean };

const listAll = async <T extends { id: string }>(path: string): Promise<T[]> => {
  const items: T[] = [];
  let after = '';
  for (;;) {
    const separator = path.includes('?') ? '&' : '?';
    const page = await resend<Page<T>>(`${path}${separator}limit=100${after ? `&after=${after}` : ''}`);
    const data = page.data ?? [];
    items.push(...data);
    if (!page.has_more || !data.length) break;
    after = data[data.length - 1]!.id;
  }
  return items;
};

/** Datas do Resend vêm como "2026-10-08 19:31:15.752186+00". */
const parseResendDate = (value: unknown): Date | null => {
  if (!value) return null;
  const normalized = String(value).replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00');
  const date = new Date(normalized);
  return Number.isNaN(date.valueOf()) ? null : date;
};

const bump = (map: Record<string, number>, key: string, by = 1) => {
  if (key && by) map[key] = (map[key] ?? 0) + by;
};

async function fetchResend(): Promise<ResendSnapshot> {
  const segmentId = RESEND_SEGMENT_ID!;
  type Contact = { id: string; created_at?: string; unsubscribed?: boolean };
  type Broadcast = { id: string; name?: string; segment_id?: string; sent_at?: string | null };
  type MetricRow = Partial<Record<keyof Omit<Edition, 'id' | 'slug' | 'sentAt'>, number>> & {
    broadcast_id?: string;
    period?: string;
    unique_opened?: number;
    unique_clicked?: number;
  };

  const contacts = await listAll<Contact>(`/segments/${segmentId}/contacts`);
  const broadcasts = (await listAll<Broadcast>('/broadcasts')).filter(
    (item) => item.segment_id === segmentId && item.sent_at,
  );

  const createdByDay: Record<string, number> = {};
  let active = 0;
  for (const contact of contacts) {
    const created = parseResendDate(contact.created_at);
    if (created) bump(createdByDay, dayOf(created));
    if (!contact.unsubscribed) active += 1;
  }

  // Com `broadcast_id` a retenção de 30 dias do Resend não se aplica.
  const rows: MetricRow[] = [];
  for (let index = 0; index < broadcasts.length; index += 100) {
    const query = new URLSearchParams({
      broadcast_id: broadcasts
        .slice(index, index + 100)
        .map((item) => item.id)
        .join(','),
      dimensions: 'period,broadcast',
      metrics: 'sent,delivered,bounced,complained,unique_opened,unique_clicked,unsubscribed',
      start_date: '2023-01-01',
      end_date: dayOf(),
    });
    rows.push(...((await resend<Page<MetricRow>>(`/emails/metrics?${query}`)).data ?? []));
  }

  const broadcastUnsubByDay: Record<string, number> = {};
  const byId = new Map<string, Edition>();
  for (const broadcast of broadcasts) {
    byId.set(broadcast.id, {
      id: broadcast.id,
      slug: (broadcast.name ?? '').replace(/^edição-/, '') || broadcast.id,
      sentAt: parseResendDate(broadcast.sent_at)?.toISOString() ?? '',
      sent: 0,
      delivered: 0,
      bounced: 0,
      complained: 0,
      opened: 0,
      clicked: 0,
      unsubscribed: 0,
    });
  }
  for (const row of rows) {
    const edition = row.broadcast_id ? byId.get(row.broadcast_id) : undefined;
    if (!edition) continue;
    if (row.period) bump(broadcastUnsubByDay, row.period, row.unsubscribed ?? 0);
    edition.sent += row.sent ?? 0;
    edition.delivered += row.delivered ?? 0;
    edition.bounced += row.bounced ?? 0;
    edition.complained += row.complained ?? 0;
    edition.opened += row.unique_opened ?? 0;
    edition.clicked += row.unique_clicked ?? 0;
    edition.unsubscribed += row.unsubscribed ?? 0;
  }
  const editions = [...byId.values()].sort((a, b) => b.sentAt.localeCompare(a.sentAt));

  let topLinks: ResendSnapshot['topLinks'] = [];
  const latest = editions[0];
  if (latest) {
    type Link = { id: string; url: string; clicks?: number; unique_clicks?: number };
    const links = await listAll<Link>(`/broadcasts/${latest.id}/clicked-links`).catch(() => []);
    topLinks = links
      .map((link) => ({ url: link.url, clicks: link.clicks ?? 0, unique: link.unique_clicks ?? 0 }))
      .sort((a, b) => b.unique - a.unique || b.clicks - a.clicks)
      .slice(0, 5);
  }

  return {
    fetchedAt: new Date().toISOString(),
    total: contacts.length,
    active,
    unsubscribed: contacts.length - active,
    createdByDay,
    broadcastUnsubByDay,
    editions,
    topLinks,
  };
}

/** Snapshot do Resend com cache no Blobs (`refresh` ignora o cache). */
export async function resendSnapshot(refresh = false): Promise<ResendSnapshot> {
  const cache = getStore({ name: 'metrics', consistency: 'strong' });
  if (!refresh) {
    try {
      const cached = (await cache.get(CACHE_KEY, { type: 'json' })) as ResendSnapshot | null;
      if (cached && Date.now() - Date.parse(cached.fetchedAt) < CACHE_TTL_MS) return cached;
    } catch {
      // Sem cache: busca direto.
    }
  }
  const fresh = await fetchResend();
  await cache.setJSON(CACHE_KEY, fresh).catch(() => undefined);
  return fresh;
}

export type DayRow = {
  day: string;
  signups: number;
  unsubscribes: number;
  resubscribes: number;
  visits: number;
  views: number;
};

export type PeriodTotals = {
  signups: number;
  unsubscribes: number;
  visits: number;
  views: number;
  /** Inscrições ÷ visitas, só nos dias com visitas medidas. */
  conversion: number | null;
  /** Descadastros ÷ ativos no início do período. */
  churn: number | null;
  net: number;
};

/** Os `count` dias terminando em `end` (inclusive), do mais antigo ao mais novo. */
const lastDays = (count: number, end = new Date()) => {
  const days: string[] = [];
  const noon = new Date(`${dayOf(end)}T12:00:00-03:00`);
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    days.push(dayOf(new Date(noon.getTime() - offset * 86_400_000)));
  }
  return days;
};

const ratio = (value: number, total: number) => (total > 0 ? value / total : null);

const totalsOf = (rows: DayRow[], activeAtEnd: number): PeriodTotals => {
  const sum = (key: keyof Omit<DayRow, 'day'>) => rows.reduce((acc, row) => acc + row[key], 0);
  const signups = sum('signups');
  const unsubscribes = sum('unsubscribes');
  const resubscribes = sum('resubscribes');
  const visits = sum('visits');
  const tracked = rows.filter((row) => row.visits > 0);
  const activeAtStart = activeAtEnd - signups - resubscribes + unsubscribes;
  return {
    signups,
    unsubscribes,
    visits,
    views: sum('views'),
    conversion: ratio(
      tracked.reduce((acc, row) => acc + row.signups, 0),
      tracked.reduce((acc, row) => acc + row.visits, 0),
    ),
    churn: ratio(unsubscribes, activeAtStart),
    net: signups + resubscribes - unsubscribes,
  };
};

const mergeSources = (counters: DayCounters[], key: 'sources' | 'signupSources') => {
  const merged: Record<string, number> = {};
  for (const day of counters) for (const [name, count] of Object.entries(day[key])) bump(merged, name, count);
  return Object.entries(merged)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
};

export async function dashboardData(period: number, refresh = false) {
  const snapshot = await resendSnapshot(refresh);
  const days = lastDays(period * 2);
  const counters = await readDays(days);
  const trackedSince = await firstTrackedDay();

  const rows: DayRow[] = days.map((day) => {
    const own = counters.get(day) ?? emptyDay();
    return {
      day,
      signups: snapshot.createdByDay[day] ?? 0,
      unsubscribes: own.unsubscribes + (snapshot.broadcastUnsubByDay[day] ?? 0),
      resubscribes: own.resubscribes,
      visits: own.visits,
      views: own.views,
    };
  });
  const current = rows.slice(period);
  const previous = rows.slice(0, period);
  const currentTotals = totalsOf(current, snapshot.active);
  const previousTotals = totalsOf(previous, snapshot.active - currentTotals.net);
  const currentCounters = current.map((row) => counters.get(row.day) ?? emptyDay());

  return {
    snapshot,
    rows: current,
    totals: currentTotals,
    previous: previousTotals,
    trackedSince,
    sources: mergeSources(currentCounters, 'sources'),
    signupSources: mergeSources(currentCounters, 'signupSources'),
  };
}
