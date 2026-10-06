import { DEFAULT_LOCALE, type Category, type Locale } from './config';

export const ui = {
  pt: {
    'nav.essays': 'Ensaios',
    'nav.about': 'Sobre',
    'nav.archive': 'Arquivo',
    'nav.subscribe': 'Assinar',
    'nav.language': 'Idioma',
    'home.eyebrow': 'Newsletter · Tecnologia & ideias',
    'home.title': 'Notas curtas sobre tecnologia, sem o ruído do hype.',
    'home.sub':
      'Uma edição a cada dois dias: ferramentas, ideias e o que realmente vale a sua atenção — sem review patrocinado, sem hype.',
    'home.micro': 'Grátis. Sem spam. Cancele quando quiser.',
    'home.latest.kicker': 'Última edição',
    'home.latest.title': 'Recém-publicado',
    'home.latest.link': 'Ler edição completa',
    'home.recent.kicker': 'Edições anteriores',
    'home.recent.title': 'Para ler no café',
    'home.seeAll': 'Ver todas as edições',
    'home.cta.kicker': 'Vamos conversar',
    'home.cta.title': 'Receba os bastidores antes de todo mundo.',
    'home.cta.body': 'Publico notas, fontes e rascunhos no LinkedIn entre as edições.',
    'home.cta.linkedin': 'Seguir no LinkedIn',
    'home.cta.essays': 'Ver ensaios',
    'archive.eyebrow': 'Arquivo',
    'archive.title': 'Todas as edições',
    'archive.sub': '{count} edições sobre ferramentas, dados e ideias — em português.',
    'archive.empty': 'Nada por aqui ainda.',
    'archive.band.title': 'Não perca a próxima edição',
    'archive.band.body': 'Um e-mail a cada dois dias. Grátis, sem spam. Cancele quando quiser.',
    'post.back': '← Voltar ao arquivo',
    'post.readOther': 'Read in English',
    'post.minRead': 'min de leitura',
    'post.like': 'Gostou? Compartilhe esta edição.',
    'post.copy': 'Copiar link',
    'post.copied': 'Link copiado ',
    'post.share': 'Compartilhar',
    'post.subscribe.title': 'Receba a próxima edição',
    'post.subscribe.body': 'Um e-mail a cada dois dias. Grátis, sem spam.',
    'post.continue': 'Continue lendo',
    'form.placeholder': 'seu@email.com',
    'form.button': 'Assinar',
    'form.sending': 'Enviando…',
    'form.success': 'Inscrição confirmada. Até a próxima edição!',
    'form.error': 'Não foi possível concluir. Tente de novo.',
    'form.invalid': 'Digite um e-mail válido.',
    'form.network': 'Falha de rede. Tente de novo.',
    'form.lang.legend': 'Idioma dos e-mails',
    'form.consent': 'Aceito receber e-mails da introducing.news. Sem spam; posso cancelar quando quiser.',
    'form.consentError': 'É preciso aceitar para continuar.',
    'footer.blurb':
      'Notas curtas sobre tecnologia, sem o hype. Publicadas a cada dois dias, direto no seu e-mail.',
    'footer.navigate': 'Navegar',
    'footer.subscribe': 'Assine',
    'footer.note': 'Um e-mail a cada dois dias. Grátis, sem spam.',
    'footer.built': 'Feito com Astro · Cloudflare · Resend',
    'category.ia': 'IA',
    'category.ferramentas': 'Ferramentas',
    'category.dados': 'Dados',
    'category.ensaio': 'Ensaio',
    'category.carreira': 'Carreira',
    'meta.home.title': 'introducing.news — Notas curtas sobre tecnologia',
    'meta.home.description':
      'Newsletter sobre tecnologia, sem o ruído do hype. Ferramentas, dados e ideias, uma edição a cada dois dias.',
    'meta.archive.title': 'Arquivo — introducing.news',
    'meta.archive.description': 'Todas as edições sobre ferramentas, dados e ideias.',
    'meta.rss.description': 'Notas curtas sobre tecnologia, sem o ruído do hype.',
  },
  en: {
    'nav.essays': 'Essays',
    'nav.about': 'About',
    'nav.archive': 'Archive',
    'nav.subscribe': 'Subscribe',
    'nav.language': 'Language',
    'home.eyebrow': 'Newsletter · Technology & ideas',
    'home.title': 'Short notes on technology, without the hype.',
    'home.sub':
      'One edition every two days: tools, ideas and what actually deserves your attention — no sponsored reviews, no hype.',
    'home.micro': 'Free. No spam. Unsubscribe anytime.',
    'home.latest.kicker': 'Latest edition',
    'home.latest.title': 'Just published',
    'home.latest.link': 'Read the full edition',
    'home.recent.kicker': 'Previous editions',
    'home.recent.title': 'Worth a coffee break',
    'home.seeAll': 'See all editions',
    'home.cta.kicker': "Let's talk",
    'home.cta.title': 'Get the behind-the-scenes first.',
    'home.cta.body': 'I share notes, sources and drafts on LinkedIn between editions.',
    'home.cta.linkedin': 'Follow on LinkedIn',
    'home.cta.essays': 'Browse essays',
    'archive.eyebrow': 'Archive',
    'archive.title': 'All editions',
    'archive.sub': '{count} editions on tools, data and ideas — in English.',
    'archive.empty': 'Nothing here yet.',
    'archive.band.title': "Don't miss the next edition",
    'archive.band.body': 'One email every two days. Free, no spam. Unsubscribe anytime.',
    'post.back': '← Back to the archive',
    'post.readOther': 'Ler em português',
    'post.minRead': 'min read',
    'post.like': 'Enjoyed it? Share this edition.',
    'post.copy': 'Copy link',
    'post.copied': 'Link copied ',
    'post.share': 'Share',
    'post.subscribe.title': 'Get the next edition',
    'post.subscribe.body': 'One email every two days. Free, no spam.',
    'post.continue': 'Keep reading',
    'form.placeholder': 'you@email.com',
    'form.button': 'Subscribe',
    'form.sending': 'Sending…',
    'form.success': 'You are in. See you in the next edition!',
    'form.error': 'Something went wrong. Try again.',
    'form.invalid': 'Enter a valid email.',
    'form.network': 'Network error. Please try again.',
    'form.lang.legend': 'Email language',
    'form.consent': 'I agree to receive emails from introducing.news. No spam; I can unsubscribe anytime.',
    'form.consentError': 'Please accept to continue.',
    'footer.blurb':
      'Short notes on technology, without the hype. Published every two days, straight to your inbox.',
    'footer.navigate': 'Browse',
    'footer.subscribe': 'Subscribe',
    'footer.note': 'One email every two days. Free, no spam.',
    'footer.built': 'Built with Astro · Cloudflare · Resend',
    'category.ia': 'AI',
    'category.ferramentas': 'Tools',
    'category.dados': 'Data',
    'category.ensaio': 'Essay',
    'category.carreira': 'Career',
    'meta.home.title': 'introducing.news — Short notes on technology',
    'meta.home.description':
      'A newsletter about technology, without the hype. Tools, data and ideas, one edition every two days.',
    'meta.archive.title': 'Archive — introducing.news',
    'meta.archive.description': 'All editions on tools, data and ideas.',
    'meta.rss.description': 'Short notes on technology, without the hype.',
  },
} as const;

export type UIKey = keyof (typeof ui)[typeof DEFAULT_LOCALE];
export type Translator = (key: UIKey, params?: Record<string, string | number>) => string;

export function useTranslations(locale: Locale): Translator {
  return (key, params) => {
    const dictionary = ui[locale] ?? ui[DEFAULT_LOCALE];
    let value: string = dictionary[key] ?? ui[DEFAULT_LOCALE][key] ?? key;
    if (params) {
      for (const [name, replacement] of Object.entries(params)) {
        value = value.replace(`{${name}}`, String(replacement));
      }
    }
    return value;
  };
}

export function categoryLabel(t: Translator, category: Category): string {
  return t(`category.${category}` as UIKey);
}
