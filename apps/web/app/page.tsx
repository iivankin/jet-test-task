import { hc } from 'hono/client';
import type { AppType } from 'api/src/index';
import { FaqCard } from '../components/FaqCard';
import { revalidatePath } from 'next/cache';
const client = hc<AppType>('http://localhost:3000/');

export const dynamic = 'force-dynamic';

const likeAction = async (id: number) => {
  'use server';
  await client.faqs[':id'].like.$post({ param: { id: id.toString() } });
  revalidatePath('/');
};

const dislikeAction = async (id: number, comment: string) => {
  'use server';
  await client.faqs[':id'].dislike.$post({
    param: { id: id.toString() },
    json: { comment },
  });
  revalidatePath('/');
};

export default async function Home() {
  const response = await client.faqs.$get();
  const data = (await response.json()).data;

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-2xl font-bold mb-8">FAQs</h1>
      <div className="w-full max-w-4xl space-y-6">
        {data.map((faq) => (
          <FaqCard
            key={faq.id}
            faq={faq}
            likeAction={likeAction}
            dislikeAction={dislikeAction}
          />
        ))}
      </div>
    </main>
  );
}
