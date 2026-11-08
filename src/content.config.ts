import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { factsSchema } from './lib/facts';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    place: z.string().min(1),
    lat: z.number().min(-90).max(90).nullish(),
    lng: z.number().min(-180).max(180).nullish(),
    cover: z.string().nullish(),
    facts: factsSchema,
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
