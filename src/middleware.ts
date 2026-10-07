import { defineMiddleware } from 'astro:middleware';

/**
 * Redireciona URLs antigas do período bilíngue para as rotas atuais.
 * Fica no middleware (e não em `_redirects`) porque o casamento com splat do
 * `_redirects` se mostrou imprevisível para caminhos compostos.
 */
export const onRequest = defineMiddleware((context, next) => {
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
    pathname === '/pt/arquivo/' ||
    pathname === '/en/essays' ||
    pathname === '/en/essays/' ||
    pathname.startsWith('/en/essays/')
  ) {
    return context.redirect('/arquivo/', 301);
  }

  // Feeds antigos → /rss.xml
  if (pathname === '/pt/rss.xml' || pathname === '/en/rss.xml') {
    return context.redirect('/rss.xml', 301);
  }

  // Qualquer outra rota antiga com prefixo de idioma → home
  if (pathname === '/pt' || pathname === '/en' || pathname.startsWith('/pt/') || pathname.startsWith('/en/')) {
    return context.redirect('/', 301);
  }

  return next();
});
