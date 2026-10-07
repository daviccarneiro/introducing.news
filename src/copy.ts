export const CATEGORIES = ['ia', 'ferramentas', 'dados', 'ensaio', 'carreira'] as const;
export type Category = (typeof CATEGORIES)[number];

export const copy = {
  'nav.list': 'Arquivo',
  'nav.subscribe': 'Assinar',
  'home.title.line1': 'O que importa em tecnologia,',
  'home.title.line2': 'sem exagero.',
  'home.sub':
    'Novos modelos de IA, ferramentas recém-lançadas e as discussões que movem a área. Curadoria de professores e profissionais com anos de experiência. E os eventos que vêm por aí.',
  'home.micro': 'Grátis, sem spam, cancele quando quiser.',
  'home.latest.title': 'Última edição',
  'home.latest.link': 'Ler edição completa',
  'home.seeAll': 'Ver todas as edições',
  'home.cta.title': 'A conversa continua no LinkedIn.',
  'home.cta.body': 'Publico notas, fontes e o que estou lendo entre as edições.',
  'home.cta.linkedin': 'Seguir no LinkedIn',
  'home.cta.browse': 'Ver arquivo',
  'archive.title': 'Todas as edições',
  'archive.sub':
    'Todas as edições publicadas, com fontes e referências. Curadoria de professores e profissionais de tecnologia.',
  'archive.filter.label': 'Filtrar por categoria',
  'archive.filter.all': 'Todas as categorias',
  'archive.empty': 'Nada por aqui ainda.',
  'archive.band.title': 'Não perca a próxima edição',
  'archive.band.body': 'Toda segunda e quinta, às 07:45, grátis e sem spam.',
  'post.back': '← Voltar ao arquivo',
  'post.minRead': 'min de leitura',
  'post.share.whatsapp': 'Compartilhar no WhatsApp',
  'post.share.linkedin': 'Compartilhar no LinkedIn',
  'post.share.x': 'Compartilhar no X',
  'post.subscribe.title': 'Receba a próxima edição',
  'post.subscribe.body': 'Toda segunda e quinta, às 07:45, grátis e sem spam.',
  'post.continue': 'Continue lendo',
  'form.placeholder': 'seu@email.com',
  'form.button': 'Assinar',
  'form.sending': 'Enviando…',
  'form.success': 'Inscrição confirmada. Até a próxima edição.',
  'form.error': 'Não foi possível concluir. Tente de novo.',
  'form.invalid': 'Digite um e-mail válido.',
  'form.network': 'Falha de rede. Tente de novo.',
  'form.consent': 'Aceito receber os e-mails da introducing.news e sei que posso cancelar quando quiser.',
  'form.consentError': 'É preciso aceitar para continuar.',
  'footer.blurb':
    'Novidades de tecnologia com curadoria de professores e profissionais. Toda segunda e quinta, às 07:45, direto no seu e-mail.',
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
} as const;

export type CopyKey = keyof typeof copy;

export function t(key: CopyKey, params?: Record<string, string | number>): string {
  let value: string = copy[key] ?? key;
  if (params) {
    for (const [name, replacement] of Object.entries(params)) {
      value = value.replace(`{${name}}`, String(replacement));
    }
  }
  return value;
}

export function categoryLabel(category: Category): string {
  return copy[`category.${category}` as CopyKey] ?? category;
}
