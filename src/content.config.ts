import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { productSchema } from './schemas/product';
import { applicationSchema } from './schemas/application';
import { newsSchema } from './schemas/news';

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  // image comes from Astro's SchemaContext and resolves paths relative to the entry file.
  schema: ({ image }) => productSchema({ reference, image }),
});

const applications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/applications' }),
  schema: applicationSchema(reference),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: ({ image }) => newsSchema({ reference, image }),
});

export const collections = { products, applications, news };
