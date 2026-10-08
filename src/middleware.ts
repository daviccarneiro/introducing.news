import { defineMiddleware } from 'astro:middleware';

/**
 * Redireciona URLs antigas do período bilíngue (prefixo `/pt`) para as rotas atuais.
 * O prefixo `/en` não é mais tratado — o site nunca foi divulgado em inglês.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // /pt/ensaios/<slug> e /pt/arquivo/<slug> → /arquivo/<slug>
  if (pathname.startsWith('/pt/ensaios/') || pathname.startsWith('/pt/arquivo/')) {
    const rest = pathname.replace(/^\/pt\/(?:ensaios|arquivo)\/?/, '');
    return context.redirect(rest ? `/arquivo/${rest}` : '/arquivo/', 301);
  }

  // Listas antigas → /arquivo/
  if (
    pathname === '/pt/ensaios' ||
    pathname === '/pt/ensaios/' ||
    pathname === '/pt/arquivo' ||
    pathname === '/pt/arquivo/'
  ) {
    return context.redirect('/arquivo/', 301);
  }

  // Feed antigo → /rss.xml
  if (pathname === '/pt/rss.xml') {
    return context.redirect('/rss.xml', 301);
  }

  // Qualquer outra rota antiga com prefixo /pt → home
  if (pathname === '/pt' || pathname.startsWith('/pt/')) {
    return context.redirect('/', 301);
  }

  // Staging não deve ser indexado (substitui a regra de resposta do Cloudflare).
  const response = await next();
  if (context.url.hostname === 'staging.introducing.news') {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
});
