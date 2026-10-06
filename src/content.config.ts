import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['ia', 'ferramentas', 'dados', 'ensaio', 'carreira']).default('ensaio'),
    publishedAt: z.coerce.date(),
    cover: z.enum(['fig-01', 'fig-02', 'fig-03']).default('fig-01'),
    /** Imagem de capa enviada pelo CMS; sobrepõe a figura abstrata. */
    coverImage: z.string().optional(),
    /** Slug da edição equivalente no outro idioma (opcional). */
    translation: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
