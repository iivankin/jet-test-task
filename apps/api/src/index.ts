import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { db } from './db/index.js';
import { faqsTable } from './db/schema.js';
import faqsRoute from './faqs.js';

const app = new Hono().route('/faqs', faqsRoute);

const port = 3000;

async function main() {
  const count = await db.$count(faqsTable);
  if (count === 0) {
    console.log('Seeding database...');
    for (let i = 0; i < 10; i++) {
      await db.insert(faqsTable).values({
        question: `Question ${i + 1}`,
        answer: `Answer ${i + 1}`,
      });
    }
  }

  console.log(`Server is running on http://localhost:${port}`);
  serve({
    fetch: app.fetch,
    port,
  });
}

export type AppType = typeof app;

main();
