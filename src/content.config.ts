import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const collection = defineCollection({
    loader: file('src/content/collection.json'),
    schema: z.object({}),
});

export const collections = { collection };
