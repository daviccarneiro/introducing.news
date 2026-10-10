import * as Sentry from '@sentry/astro';

Sentry.init({
  dsn: import.meta.env.PUBLIC_SENTRY_DSN,
  // Só builds (produção/staging) reportam; o `astro dev` local não polui o projeto.
  enabled: import.meta.env.PROD,
  environment: import.meta.env.PUBLIC_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
});
