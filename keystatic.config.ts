import { config, fields, collection } from '@keystatic/core';

const hasGitHubCredentials =
  typeof process !== 'undefined' &&
  Boolean(process.env?.KEYSTATIC_GITHUB_CLIENT_ID && process.env?.KEYSTATIC_GITHUB_CLIENT_SECRET);

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
  publishedAt: fields.date({ label: 'Data de publicação' }),
  cover: fields.select({
    label: 'Capa',
    options: [
      { label: 'Fig. 01 — grade + órbita', value: 'fig-01' },
      { label: 'Fig. 02 — arcos', value: 'fig-02' },
      { label: 'Fig. 03 — sinal', value: 'fig-03' },
    ],
    defaultValue: 'fig-01',
  }),
  translation: fields.text({
    label: 'Slug da tradução',
    description: 'Slug do arquivo equivalente no outro idioma (sem extensão).',
  }),
  draft: fields.checkbox({
    label: 'Rascunho',
    description: 'Rascunhos não aparecem no site.',
  }),
  content: fields.mdx({ label: 'Conteúdo' }),
};

export default config({
  storage: hasGitHubCredentials
    ? { kind: 'github', repo: 'daviccarneiro/introducing.news' }
    : { kind: 'local' },
  ui: {
    brand: { name: 'introducing.news' },
    navigation: {
      'Português': ['postsPt'],
      'English': ['postsEn'],
    },
  },
  collections: {
    postsPt: collection({
      label: 'Edições · PT',
      slugField: 'title',
      path: 'src/content/posts/pt/*',
      entryLayout: 'content',
      format: { contentField: 'content' },
      columns: ['title', 'publishedAt'],
      schema: postSchema,
    }),
    postsEn: collection({
      label: 'Editions · EN',
      slugField: 'title',
      path: 'src/content/posts/en/*',
      entryLayout: 'content',
      format: { contentField: 'content' },
      columns: ['title', 'publishedAt'],
      schema: postSchema,
    }),
  },
});
