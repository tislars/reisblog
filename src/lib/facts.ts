import { z } from 'astro/zod';

export const MAX_FACTS = 6;
export const MAX_LABEL = 20;
export const MAX_VALUE = 30;

// YAML reads `value: 740` as a number; a fact is always text.
const text = (schema: z.ZodString) => z.preprocess((v) => (typeof v === 'number' ? String(v) : v), schema);

/** A few short facts for the fact row under a post's title, in the writer's own words and order. */
export const factsSchema = z
  .array(
    z.object({
      label: text(z.string().trim().min(1, 'Een feit heeft een label nodig.').max(MAX_LABEL, `Het label van een feit mag maximaal ${MAX_LABEL} tekens zijn.`)),
      value: text(z.string().trim().min(1, 'Een feit heeft een waarde nodig.').max(MAX_VALUE, `De waarde van een feit mag maximaal ${MAX_VALUE} tekens zijn.`)),
    }),
  )
  .max(MAX_FACTS, `Maximaal ${MAX_FACTS} feiten per post.`)
  // The CMS may write an empty list as null.
  .nullish()
  .transform((facts) => facts ?? []);

export type Fact = z.infer<typeof factsSchema>[number];
