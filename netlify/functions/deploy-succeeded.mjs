/**
 * Função de evento da Netlify: roda quando um deploy é publicado.
 *
 * Em produção, pede ao site (`/api/telegram/notify`) que mande para o
 * Telegram a prévia das edições em rascunho que mudaram neste deploy. A
 * prévia só sai depois do deploy porque os links dela abrem o site no ar.
 * Sem as variáveis do Telegram (dev, staging), não faz nada.
 */
export const handler = async (event) => {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || !process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    return { statusCode: 204 };
  }

  let deploy = {};
  try {
    deploy = JSON.parse(event.body || '{}').payload ?? {};
  } catch {
    /* payload ilegível: segue com a URL do site */
  }
  if (deploy.context && deploy.context !== 'production') return { statusCode: 204 };

  const site = (deploy.ssl_url || process.env.URL || 'https://introducing.news').replace(/\/$/, '');
  try {
    const response = await fetch(`${site}/api/telegram/notify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
    });
    console.log(`[deploy-succeeded] prévias: ${response.status} ${await response.text()}`);
    return { statusCode: response.ok ? 200 : 502 };
  } catch (error) {
    console.error('[deploy-succeeded] falha ao chamar /api/telegram/notify:', error);
    return { statusCode: 502 };
  }
};
