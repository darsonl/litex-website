import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { productSchema } from './schemas/product';
import { applicationSchema } from './schemas/application';

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: productSchema(reference),
});

const applications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/applications' }),
  schema: applicationSchema(reference),
});

export const collections = { products, applications };
