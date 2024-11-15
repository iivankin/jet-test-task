import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { db } from './db/index.js';
import { commentsTable, faqsTable, reviewsTable } from './db/schema.js';
import { and, asc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const addDislikeSchema = z.object({
  comment: z.string().min(1, 'Comment empty').max(500, 'Comment too long'),
});
const faqIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid faq id'),
});

const app = new Hono()
  .get('/faqs', async (c) => {
    const ipAddress =
      c.req.header('x-forwarded-for') ||
      c.req.header('remote-addr') ||
      '127.0.0.1';

    try {
      const faqs = await db
        .select({
          id: faqsTable.id,
          question: faqsTable.question,
          answer: faqsTable.answer,
          likes: sql`COUNT(CASE WHEN reviews.is_like = 1 THEN 1 ELSE NULL END)`,
          dislikes: sql`COUNT(CASE WHEN reviews.is_like = 0 THEN 1 ELSE NULL END)`,
        })
        .from(faqsTable)
        .leftJoin(reviewsTable, eq(reviewsTable.faq_id, faqsTable.id))
        .orderBy(asc(faqsTable.id))
        .groupBy(faqsTable.id);

      const userStates = await db
        .select()
        .from(reviewsTable)
        .where(eq(reviewsTable.ip_address, ipAddress));

      const faqWithState = faqs.map((faq) => {
        const userReview = userStates.find(
          (review) => review.faq_id === faq.id,
        );
        return {
          ...faq,
          likes: parseInt(faq.likes as string),
          dislikes: parseInt(faq.dislikes as string),
          user_state: userReview
            ? userReview.is_like === 1
              ? 'liked'
              : 'disliked'
            : 'none',
        };
      });

      return c.json({ success: true, data: faqWithState });
    } catch (err) {
      console.error(err);
      return c.json({ success: false, data: [] }, 500);
    }
  })
  .post('/faqs/:id/like', zValidator('param', faqIdParamSchema), async (c) => {
    const faqId = parseInt(c.req.valid('param').id);
    const ipAddress =
      c.req.header('x-forwarded-for') ||
      c.req.header('remote-addr') ||
      '127.0.0.1';

    try {
      const existing = await db
        .select()
        .from(reviewsTable)
        .where(
          and(
            eq(reviewsTable.faq_id, faqId),
            eq(reviewsTable.ip_address, ipAddress),
          ),
        )
        .limit(1);

      if (existing && existing.length > 0) {
        const ex = existing[0]!;
        if (ex.is_like === 1) {
          // Remove like
          await db.delete(reviewsTable).where(eq(reviewsTable.id, ex.id));
        } else {
          // Update dislike to like
          await db
            .update(reviewsTable)
            .set({ is_like: 1 })
            .where(eq(reviewsTable.id, ex.id));

          await db.delete(commentsTable).where(eq(commentsTable.id, ex.id));
        }
      } else {
        // Add new like
        await db
          .insert(reviewsTable)
          .values({ faq_id: faqId, ip_address: ipAddress, is_like: 1 });
      }

      return c.json({ success: true });
    } catch (err) {
      return c.json({ success: false }, 500);
    }
  })
  .post(
    '/faqs/:id/dislike',
    zValidator('param', faqIdParamSchema),
    zValidator('json', addDislikeSchema),
    async (c) => {
      const faqId = parseInt(c.req.valid('param').id);
      const ipAddress =
        c.req.header('x-forwarded-for') ||
        c.req.header('remote-addr') ||
        '127.0.0.1';
      const comment = c.req.valid('json').comment;

      try {
        const existing = await db
          .select()
          .from(reviewsTable)
          .where(
            and(
              eq(reviewsTable.faq_id, faqId),
              eq(reviewsTable.ip_address, ipAddress),
            ),
          )
          .limit(1);

        if (existing && existing.length > 0) {
          const ex = existing[0]!;
          if (ex.is_like === 1) {
            // Update like to dislike
            await db
              .update(reviewsTable)
              .set({ is_like: 0 })
              .where(eq(reviewsTable.id, ex.id));

            await db.insert(commentsTable).values({
              comment,
              review_id: ex.id,
            });
          } else {
            // Remove dislike and comment
            await db
              .delete(commentsTable)
              .where(eq(commentsTable.review_id, ex.id));
            await db.delete(reviewsTable).where(eq(reviewsTable.id, ex.id));
          }
        } else {
          // Add new dislike and comment
          const review = await db
            .insert(reviewsTable)
            .values({ faq_id: faqId, ip_address: ipAddress, is_like: 0 })
            .returning();
          await db
            .insert(commentsTable)
            .values({ review_id: review[0]!.id, comment });
        }

        return c.json({ success: true });
      } catch (err) {
        return c.json({ success: false }, 500);
      }
    },
  );

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
