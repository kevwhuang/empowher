import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const CATEGORIES = ['Accessories', 'Apparel', 'Prints'] as const;
const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL'] as const;

const store = defineCollection({
    loader: glob({ base: './src/content/store', pattern: '**/*.json' }),
    schema: z.object({
        category: z.enum(CATEGORIES),
        description: z.string(),
        name: z.string(),
        price: z.number().int().positive(),
        sizes: z.array(z.enum(SIZES)).min(1).optional(),
    }),
});

export const collections = { store };
