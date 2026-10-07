import { DEFAULT_LOCALE, type Category, type Locale } from './config';

export const ui = {
  pt: {
    'nav.list': 'Arquivo',
    'nav.language': 'Idioma',
    'nav.subscribe': 'Assinar',
    'home.eyebrow': 'Curadoria de tecnologia',
    'home.title': 'O que importa em tecnologia, sem exagero.',
    'home.sub':
      'Novos modelos de IA, ferramentas recém-lançadas e as discussões que movem a área. Curadoria de professores e profissionais com anos de experiência. Em português, também os eventos que vêm por aí.',
    'home.micro': 'Grátis, sem spam, cancele quando quiser.',
    'home.latest.kicker': 'Última edição',
    'home.latest.title': 'Recém-publicado',
    'home.latest.link': 'Ler edição completa',
    'home.seeAll': 'Ver todas as edições',
    'home.cta.kicker': 'Vamos conversar',
    'home.cta.title': 'A conversa continua no LinkedIn.',
    'home.cta.body': 'Publico notas, fontes e o que estou lendo entre as edições.',
    'home.cta.linkedin': 'Seguir no LinkedIn',
    'home.cta.browse': 'Ver arquivo',
    'archive.eyebrow': 'Arquivo',
    'archive.title': 'Todas as edições',
    'archive.sub':
      'Todas as edições publicadas, com fontes e referências. Curadoria de professores e profissionais de tecnologia.',
    'archive.empty': 'Nada por aqui ainda.',
    'archive.band.title': 'Não perca a próxima edição',
    'archive.band.body': 'Um e-mail a cada dois dias, grátis e sem spam. Cancele quando quiser.',
    'post.back': '← Voltar ao arquivo',
    'post.readOther': 'Read in English',
    'post.minRead': 'min de leitura',
    'post.like': 'Gostou? Compartilhe esta edição.',
    'post.copy': 'Copiar link',
    'post.copied': 'Link copiado ',
    'post.share': 'Compartilhar',
    'post.subscribe.title': 'Receba a próxima edição',
    'post.subscribe.body': 'Um e-mail a cada dois dias, grátis e sem spam.',
    'post.continue': 'Continue lendo',
    'form.placeholder': 'seu@email.com',
    'form.button': 'Assinar',
    'form.sending': 'Enviando…',
    'form.success': 'Inscrição confirmada. Até a próxima edição.',
    'form.error': 'Não foi possível concluir. Tente de novo.',
    'form.invalid': 'Digite um e-mail válido.',
    'form.network': 'Falha de rede. Tente de novo.',
    'form.lang.legend': 'Idioma dos e-mails',
    'form.langRequired': 'Escolha o idioma dos e-mails.',
    'form.consent': 'Aceito receber os e-mails da introducing.news e sei que posso cancelar quando quiser.',
    'form.consentError': 'É preciso aceitar para continuar.',
    'footer.blurb':
      'Novidades de tecnologia com curadoria de professores e profissionais. Uma edição a cada dois dias, direto no seu e-mail.',
    'footer.madeBy': 'Feito por',
    'category.ia': 'IA',
    'category.ferramentas': 'Ferramentas',
    'category.dados': 'Dados',
    'category.ensaio': 'Ensaio',
    'category.carreira': 'Carreira',
    'meta.home.title': 'introducing.news — O que importa em tecnologia',
    'meta.home.description':
      'Newsletter sobre o que acontece em tecnologia: novos modelos de IA, ferramentas recém-lançadas e as discussões da área. Curadoria de professores e profissionais.',
    'meta.archive.title': 'Arquivo — introducing.news',
    'meta.archive.description': 'Todas as edições, com fontes e referências.',
    'meta.rss.description': 'Novidades de tecnologia, curadas por professores e profissionais.',
  },
  en: {
    'nav.list': 'Essays',
    'nav.language': 'Language',
    'nav.subscribe': 'Subscribe',
    'home.eyebrow': 'Technology, curated',
    'home.title': 'What matters in technology, without the hype.',
    'home.sub':
      'New AI models, new tools and the debates happening across tech. Curated by professors and professionals with years of experience. The Portuguese edition also covers upcoming events.',
    'home.micro': 'Free, no spam, unsubscribe anytime.',
    'home.latest.kicker': 'Latest edition',
    'home.latest.title': 'Just published',
    'home.latest.link': 'Read the full edition',
    'home.seeAll': 'See all editions',
    'home.cta.kicker': "Let's talk",
    'home.cta.title': 'The conversation continues on LinkedIn.',
    'home.cta.body': 'I post notes, sources and what I am reading between editions.',
    'home.cta.linkedin': 'Follow on LinkedIn',
    'home.cta.browse': 'Browse essays',
    'archive.eyebrow': 'Essays',
    'archive.title': 'All essays',
    'archive.sub':
      'Every edition published so far, with sources and references. Curated by professors and technology professionals.',
    'archive.empty': 'Nothing here yet.',
    'archive.band.title': "Don't miss the next edition",
    'archive.band.body': 'One email every two days, free and without spam. Unsubscribe anytime.',
    'post.back': '← Back to the essays',
    'post.readOther': 'Ler em português',
    'post.minRead': 'min read',
    'post.like': 'Enjoyed it? Share this edition.',
    'post.copy': 'Copy link',
    'post.copied': 'Link copied ',
    'post.share': 'Share',
    'post.subscribe.title': 'Get the next edition',
    'post.subscribe.body': 'One email every two days, free and without spam.',
    'post.continue': 'Keep reading',
    'form.placeholder': 'you@email.com',
    'form.button': 'Subscribe',
    'form.sending': 'Sending…',
    'form.success': 'You are in. See you in the next edition.',
    'form.error': 'Something went wrong. Try again.',
    'form.invalid': 'Enter a valid email.',
    'form.network': 'Network error. Please try again.',
    'form.lang.legend': 'Email language',
    'form.langRequired': 'Choose the email language.',
    'form.consent': 'I agree to receive emails from introducing.news and understand I can unsubscribe anytime.',
    'form.consentError': 'Please accept to continue.',
    'footer.blurb':
      'Technology news curated by professors and professionals. One edition every two days, straight to your inbox.',
    'footer.madeBy': 'Made by',
    'category.ia': 'AI',
    'category.ferramentas': 'Tools',
    'category.dados': 'Data',
    'category.ensaio': 'Essay',
    'category.carreira': 'Career',
    'meta.home.title': 'introducing.news — What matters in technology',
    'meta.home.description':
      'A newsletter about what is happening in tech: new AI models, new tools and the debates of the field. Curated by professors and professionals.',
    'meta.archive.title': 'Essays — introducing.news',
    'meta.archive.description': 'All editions, with sources and references.',
    'meta.rss.description': 'Technology news curated by professors and professionals.',
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
