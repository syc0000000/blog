import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const locale = z.enum(['zh-cn', 'en']).default('zh-cn');

const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    locale,
    translationKey: z.string().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    order: z.number().default(0),
    seoTitle: z.string().optional(),
    canonical: z.url().optional(),
    ogImage: z.string().optional(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).default([]),
    column: z.string().optional(),
    columnOrder: z.number().optional(),
    minutes: z.number().positive().optional(),
    comments: z.boolean().default(false),
  }),
});

const columns = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/columns' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    locale,
    draft: z.boolean().default(false),
    order: z.number().default(0),
    slug: z.string().regex(/^[^/?#]+$/),
    book: z.string().optional(),
    bookUrl: z.url().optional(),
  }),
});

export const collections = { writing, columns };
