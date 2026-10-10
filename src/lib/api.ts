import { getStore } from '@netlify/blobs';
import { TURNSTILE_SECRET_KEY } from 'astro:env/server';

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

/** IP do visitante. A Netlify injeta `x-nf-client-connection-ip`; `x-forwarded-for` é o fallback. */
export const clientIp = (request: Request): string | null => {
  const direct = request.headers.get('x-nf-client-connection-ip');
  if (direct) return direct;
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? (forwarded.split(',')[0]?.trim() ?? null) : null;
};

/**
 * Rate limit simples por IP usando Netlify Blobs (consistência forte).
 * Nunca bloqueia por falha do limitador — é uma camada extra além do Turnstile.
 */
export const isRateLimited = async (
  ip: string | null,
  scope: string,
  max = 5,
  windowSeconds = 600,
  /** Só consulta, sem contar esta requisição. */
  peek = false,
): Promise<boolean> => {
  if (!ip) return false;
  try {
    const store = getStore({ name: 'rate-limit', consistency: 'strong' });
    const key = `${scope}/${ip}`;
    const now = Date.now();
    const entry = (await store.get(key, { type: 'json' })) as
      | { count?: number; resetAt?: number }
      | null;
    const active = entry?.resetAt != null && entry.resetAt > now;
    if (active && (entry?.count ?? 0) >= max) return true;
    if (peek) return false;
    await store.setJSON(key, {
      count: active ? (entry?.count ?? 0) + 1 : 1,
      resetAt: active ? entry?.resetAt : now + windowSeconds * 1000,
    });
    return false;
  } catch {
    return false;
  }
};

/** Verifica o Turnstile; sem segredo configurado, não bloqueia. */
export const verifyTurnstile = async (token: string, ip: string | null): Promise<boolean> => {
  const secret = TURNSTILE_SECRET_KEY;
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
