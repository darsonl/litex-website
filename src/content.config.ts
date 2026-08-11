import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { productSchema } from './schemas/product';
import { applicationSchema } from './schemas/application';

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  // image comes from Astro's SchemaContext and resolves paths relative to the entry file.
  schema: ({ image }) => productSchema({ reference, image }),
});

const applications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/applications' }),
  schema: applicationSchema(reference),
});

export const collections = { products, applications };
