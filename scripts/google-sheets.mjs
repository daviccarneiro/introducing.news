/**
 * Cliente mínimo do Google Sheets (service account), sem dependências:
 * assina o JWT RS256 com `node:crypto`, troca por access token e escreve
 * valores nas abas. Usado por `analytics-snapshot.mjs`.
 */
import { createSign } from 'node:crypto';

export function parseServiceAccount(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON inválido (não é JSON).');
  }
  if (!parsed?.client_email || !parsed?.private_key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON sem client_email/private_key.');
  }
  return { email: parsed.client_email, privateKey: parsed.private_key };
}

async function accessToken({ email, privateKey }) {
  const now = Math.floor(Date.now() / 1000);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    iss: email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  const assertion = `${unsigned}.${signer.sign(privateKey, 'base64url')}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Google OAuth → ${response.status}: ${JSON.stringify(body)}`);
  }
  return body.access_token;
}

async function api(token, sheetId, path, options = {}) {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Sheets ${path} → ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

/**
 * Garante que as abas existam e reescreve cada uma a partir de A1.
 * `tabs` é um mapa { nomeDaAba: [[...cabeçalho], [...linhas]] }.
 */
export async function syncSheets({ sheetId, serviceAccountJson, tabs }) {
  const credentials = parseServiceAccount(serviceAccountJson);
  const token = await accessToken(credentials);

  const spreadsheet = await api(token, sheetId, '');
  const existing = new Set((spreadsheet.sheets ?? []).map((sheet) => sheet.properties?.title));
  const missing = Object.keys(tabs).filter((title) => !existing.has(title));
  if (missing.length > 0) {
    await api(token, sheetId, ':batchUpdate', {
      method: 'POST',
      body: JSON.stringify({
        requests: missing.map((title) => ({ addSheet: { properties: { title } } })),
      }),
    });
  }

  for (const [title, rows] of Object.entries(tabs)) {
    const range = encodeURIComponent(`${title}!A1`);
    await api(token, sheetId, `/values/${range}:clear`, { method: 'POST', body: '{}' });
    await api(token, sheetId, `/values/${range}?valueInputOption=RAW`, {
      method: 'PUT',
      body: JSON.stringify({ values: rows }),
    });
  }
}
