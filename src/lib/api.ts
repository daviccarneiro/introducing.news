import { env } from 'cloudflare:workers';

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

export const clientIp = (request: Request): string | null => request.headers.get('cf-connecting-ip');

/**
 * Rate limit simples por IP usando a Cache API (por colo, aproximado).
 * Nunca bloqueia por falha do limitador — é uma camada extra além do Turnstile.
 */
export const isRateLimited = async (
  request: Request,
  ip: string | null,
  scope: string,
  max = 5,
  windowSeconds = 600,
): Promise<boolean> => {
  if (!ip) return false;
  try {
    const cache = (caches as unknown as { default: Cache }).default;
    const key = new Request(
      new URL(`/.internal/rate-limit/${scope}/${encodeURIComponent(ip)}`, request.url).toString(),
      { method: 'GET' },
    );
    const cached = await cache.match(key);
    const count = cached ? Number(await cached.text()) || 0 : 0;
    if (count >= max) return true;
    await cache.put(
      key,
      new Response(String(count + 1), {
        headers: { 'Cache-Control': `max-age=${windowSeconds}` },
      }),
    );
    return false;
  } catch {
    return false;
  }
};

/** Verifica o Turnstile; sem segredo configurado, não bloqueia. */
export const verifyTurnstile = async (token: string, ip: string | null): Promise<boolean> => {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new FormData();
    body.append('secret', secret);
    body.append('response', token);
    if (ip) body.append('remoteip', ip);
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  }
};
