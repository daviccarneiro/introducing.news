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
  'home.faq.title': 'Perguntas frequentes',
  'home.faq.q1': 'É de graça mesmo?',
  'home.faq.a1': 'É. A assinatura é gratuita, sem cartão e sem versão paga escondida. Se um dia mudar, avisamos antes.',
  'home.faq.q2': 'Não gosto de spam.',
  'home.faq.a2': 'Nós também. Um e-mail por semana, toda segunda, com o que realmente importa — e descadastro em um clique.',
  'home.faq.q3': 'Se todas as edições estão aqui, por que assinar?',
  'home.faq.a3':
    'Porque nem tudo vai para o site. Assinantes recebem um TLDR com notas, bastidores, fontes extras e avisos de eventos que não entram no arquivo público.',
  'home.faq.q4': 'Quando chegam os e-mails?',
  'home.faq.a4': 'Toda segunda-feira, às 07:45 (horário de Brasília).',
  'home.faq.q5': 'Posso cancelar quando quiser?',
  'home.faq.a5': 'Sim. Todo e-mail tem um link de cancelamento; é um clique e não perguntamos nada.',
  'archive.title': 'Todas as edições',
  'archive.sub':
    'Todas as edições publicadas, com fontes e referências. Curadoria de professores e profissionais de tecnologia.',
  'archive.empty': 'Nada por aqui ainda.',
  'archive.band.title': 'Não perca a próxima edição',
  'archive.band.body': 'Toda segunda, às 07:45, grátis e sem spam.',
  'post.back': '← Voltar ao arquivo',
  'post.minRead': 'min de leitura',
  'post.share.whatsapp': 'Compartilhar no WhatsApp',
  'post.share.linkedin': 'Compartilhar no LinkedIn',
  'post.share.x': 'Compartilhar no X',
  'post.subscribe.title': 'Receba a próxima edição',
  'post.subscribe.body': 'Toda segunda, às 07:45, grátis e sem spam.',
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
    'Novidades de tecnologia com curadoria de professores e profissionais. Toda segunda, às 07:45, direto no seu e-mail.',
  'footer.madeBy': 'Feito por',
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
