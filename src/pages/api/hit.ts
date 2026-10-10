export const prerender = false;

import type { APIRoute } from 'astro';
import { bumpDay, sourceOf } from '../../lib/metrics';

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor/i;

/**
 * Beacon de página vista (enviado por `Base.astro` via `sendBeacon`).
 * Sem cookie e sem IP gravado: só soma contadores do dia. Uma "entrada"
 * (visita) é a página vista que chega de fora do site ou sem referrer.
 */
export const POST: APIRoute = async ({ request, url }) => {
  if (BOT.test(request.headers.get('user-agent') ?? '')) return new Response(null, { status: 204 });

  let referrer = '';
  let utmSource = '';
  let entry = false;
  try {
    const data = JSON.parse((await request.text()).slice(0, 2000)) as {
      r?: unknown;
      u?: unknown;
      e?: unknown;
    };
    referrer = typeof data?.r === 'string' ? data.r.slice(0, 200) : '';
    utmSource = typeof data?.u === 'string' ? data.u.slice(0, 60) : '';
    entry = data?.e === true;
  } catch {
    return new Response(null, { status: 400 });
  }

  await bumpDay({
    views: 1,
    ...(entry ? { visits: 1, source: sourceOf(referrer, utmSource, url.hostname) } : {}),
  });
  return new Response(null, { status: 204 });
};

export const ALL: APIRoute = () => new Response(null, { status: 405 });
