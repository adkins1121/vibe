import { defineCollection, z } from 'astro:content';

// Field Notes — operator field notes, not thought leadership.
// Three pillars: Teardowns / AI that shipped / The KC angle.
const fieldNotes = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    pillar: z.enum(['Teardowns', 'AI that shipped', 'The KC angle']),
    summary: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { 'field-notes': fieldNotes };
