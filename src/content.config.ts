import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    /** Número da edição (aparece no assunto do e-mail e na página). */
    number: z.number().int().optional(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    cover: z.enum(['fig-01', 'fig-02', 'fig-03']).default('fig-01'),
    /** Imagem de capa enviada pelo CMS; sobrepõe a figura abstrata. */
    coverImage: z.string().optional(),
    /** Slug do autor (coleção `authors`) que assina o e-mail da edição. */
    signature: z.string().optional(),
    /** Fluxo editorial: rascunho → revisão → programada → publicada. */
    status: z.enum(['draft', 'review', 'scheduled', 'published']).default('draft'),
  }),
});

const authors = defineCollection({
  loader: glob({ base: './src/content/authors', pattern: '**/*.json' }),
  schema: z.object({
    name: z.string(),
    /** Linha exibida abaixo do nome na assinatura do e-mail. */
    role: z.string().optional(),
    /** Caminho público da foto (ex.: `/images/authors/foo.jpg`). */
    photo: z.string().optional(),
  }),
});

export const collections = { posts, authors };
