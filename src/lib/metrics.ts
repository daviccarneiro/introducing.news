import { getStore } from '@netlify/blobs';

/**
 * Contadores diários próprios (Netlify Blobs), sem cookie e sem dado pessoal:
 * só números por dia e o host de origem. Alimentam o painel (`/painel`) com o
 * que o Resend não guarda — visitas, descadastros com data e origem das
 * inscrições.
 */
export type DayCounters = {
  /** Páginas vistas (beacon de `Base.astro`). */
  views: number;
  /** Entradas no site: página vista com referrer externo ou vazio. */
  visits: number;
  /** Inscrições novas (contato criado). */
  signups: number;
  /** Reinscrições (contato existente reativado). */
  resubscribes: number;
  /** Descadastros pela página `/descadastrar`. */
  unsubscribes: number;
  /** Origem das entradas (utm_source ou host do referrer). */
  sources: Record<string, number>;
  /** Origem das inscrições novas. */
  signupSources: Record<string, number>;
};

type Bump = Partial<Record<'views' | 'visits' | 'signups' | 'resubscribes' | 'unsubscribes', number>> & {
  source?: string;
  signupSource?: string;
};

/** Limite de origens distintas por dia; o excedente vira "outros". */
const MAX_SOURCES = 40;
const DAY_PREFIX = 'day/';

const spDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Dia no fuso de São Paulo (`YYYY-MM-DD`). */
export const dayOf = (date: Date = new Date()) => spDay.format(date);

const store = () => getStore({ name: 'metrics', consistency: 'strong' });

export const emptyDay = (): DayCounters => ({
  views: 0,
  visits: 0,
  signups: 0,
  resubscribes: 0,
  unsubscribes: 0,
  sources: {},
  signupSources: {},
});

const addSource = (map: Record<string, number>, source: string) => {
  const key = source in map || Object.keys(map).length < MAX_SOURCES ? source : 'outros';
  map[key] = (map[key] ?? 0) + 1;
};

/**
 * Normaliza a origem: `utm_source` quando houver; senão o host do referrer
 * (sem `www.`); referrer do próprio site vira "site" e ausente, "direto".
 */
export const sourceOf = (referrer: string, utmSource = '', ownHost = 'introducing.news') => {
  const utm = utmSource.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 40);
  if (utm) return utm;
  if (!referrer) return 'direto';
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
    if (!host) return 'direto';
    if (host === ownHost || host.endsWith(`.${ownHost}`)) return 'site';
    return host.slice(0, 60);
  } catch {
    return 'direto';
  }
};

/**
 * Incrementa os contadores do dia com escrita condicional (ETag) e algumas
 * tentativas em caso de conflito. Nunca lança: métrica não pode derrubar a
 * inscrição nem a página.
 */
export const bumpDay = async (bump: Bump, date: Date = new Date()): Promise<void> => {
  try {
    const blobs = store();
    const key = `${DAY_PREFIX}${dayOf(date)}`;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const current = await blobs.getWithMetadata(key, { type: 'json' });
      const day: DayCounters = { ...emptyDay(), ...((current?.data as Partial<DayCounters>) ?? {}) };
      for (const field of ['views', 'visits', 'signups', 'resubscribes', 'unsubscribes'] as const) {
        day[field] += bump[field] ?? 0;
      }
      if (bump.source) addSource(day.sources, bump.source);
      if (bump.signupSource) addSource(day.signupSources, bump.signupSource);
      const result = current?.etag
        ? await blobs.setJSON(key, day, { onlyIfMatch: current.etag })
        : await blobs.setJSON(key, day, { onlyIfNew: true });
      if (result.modified) return;
    }
  } catch (error) {
    console.error('metrics: falha ao gravar contador', error);
  }
};

/** Lê os contadores de uma lista de dias (`YYYY-MM-DD`); dias sem dado voltam vazios. */
export const readDays = async (days: string[]): Promise<Map<string, DayCounters>> => {
  const result = new Map<string, DayCounters>();
  try {
    const blobs = store();
    const entries = await Promise.all(
      days.map(async (day) => [day, await blobs.get(`${DAY_PREFIX}${day}`, { type: 'json' })] as const),
    );
    for (const [day, data] of entries) {
      if (data) result.set(day, { ...emptyDay(), ...(data as Partial<DayCounters>) });
    }
  } catch (error) {
    console.error('metrics: falha ao ler contadores', error);
  }
  return result;
};

/** Primeiro dia com contadores gravados (início da medição de visitas). */
export const firstTrackedDay = async (): Promise<string | null> => {
  try {
    const { blobs } = await store().list({ prefix: DAY_PREFIX });
    const days = blobs.map((blob) => blob.key.slice(DAY_PREFIX.length)).sort();
    return days[0] ?? null;
  } catch {
    return null;
  }
};
