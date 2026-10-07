import { config, fields, collection } from '@keystatic/core';

// Decisão em TEMPO DE BUILD, inlined igualmente nos bundles do cliente e do
// servidor. Não use `process.env` aqui: no browser ele não existe e a UI
// ficaria em modo local enquanto o Worker roda em modo GitHub.
const useGitHub = Boolean(import.meta.env.PUBLIC_KEYSTATIC_GITHUB_APP_SLUG);

const postSchema = {
  title: fields.slug({ name: { label: 'Título' } }),
  description: fields.text({
    label: 'Resumo',
    multiline: true,
    description: 'Aparece no card, no RSS e no e-mail.',
  }),
  category: fields.select({
    label: 'Categoria',
    options: [
      { label: 'IA', value: 'ia' },
      { label: 'Ferramentas', value: 'ferramentas' },
      { label: 'Dados', value: 'dados' },
      { label: 'Ensaio', value: 'ensaio' },
      { label: 'Carreira', value: 'carreira' },
    ],
    defaultValue: 'ensaio',
  }),
  publishedAt: fields.date({
    label: 'Data de publicação',
    description: 'Para posts programados, use uma segunda ou uma quinta (dia do batch).',
  }),
  cover: fields.select({
    label: 'Capa',
    options: [
      { label: 'Fig. 01 — grade + órbita', value: 'fig-01' },
      { label: 'Fig. 02 — arcos', value: 'fig-02' },
      { label: 'Fig. 03 — sinal', value: 'fig-03' },
    ],
    defaultValue: 'fig-01',
  }),
  coverImage: fields.image({
    label: 'Imagem de capa (opcional)',
    description: 'Quando preenchida, substitui a figura abstrata acima. Aceita JPG, PNG, WebP ou SVG.',
    directory: 'public/images/covers',
    publicPath: '/images/covers/',
  }),
  signature: fields.relationship({
    label: 'Assinatura do e-mail',
    description: 'Quem assina o e-mail que anuncia esta edição. Cadastre a pessoa em Autores.',
    collection: 'authors',
    validation: { isRequired: true },
  }),
  status: fields.select({
    label: 'Status',
    description: 'Rascunho → Em revisão → Programada (entra no batch) → Publicada (no site).',
    options: [
      { label: 'Rascunho', value: 'draft' },
      { label: 'Em revisão', value: 'review' },
      { label: 'Programada', value: 'scheduled' },
      { label: 'Publicada', value: 'published' },
    ],
    defaultValue: 'draft',
  }),
  content: fields.mdx({ label: 'Conteúdo' }),
};

const authorSchema = {
  name: fields.slug({ name: { label: 'Nome' } }),
  role: fields.text({
    label: 'Cargo / linha de assinatura',
    description: 'Aparece abaixo do nome na assinatura do e-mail (opcional).',
  }),
  photo: fields.image({
    label: 'Foto',
    description: 'Usada no e-mail e no site. Prefira uma imagem quadrada com fundo neutro.',
    directory: 'public/images/authors',
    publicPath: '/images/authors/',
  }),
};

export default config({
  storage: useGitHub
    ? { kind: 'github', repo: 'daviccarneiro/introducing.news' }
    : { kind: 'local' },
  ui: {
    brand: { name: 'introducing.news' },
    navigation: {
      'Edições': ['posts'],
      'Autores': ['authors'],
    },
  },
  collections: {
    posts: collection({
      label: 'Edições',
      slugField: 'title',
      path: 'src/content/posts/*',
      entryLayout: 'content',
      format: { contentField: 'content' },
      columns: ['title', 'status', 'publishedAt'],
      schema: postSchema,
    }),
    authors: collection({
      label: 'Autores',
      slugField: 'name',
      path: 'src/content/authors/*',
      format: { data: 'json' },
      columns: ['name', 'role'],
      schema: authorSchema,
    }),
  },
});
