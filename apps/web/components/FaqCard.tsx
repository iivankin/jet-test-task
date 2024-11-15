'use client';
import { useState } from 'react';
import { FaqModal } from './FaqModal';

type Faq = {
  likes: number;
  dislikes: number;
  user_state: string;
  id: number;
  question: string;
  answer: string;
};

export function FaqCard({
  faq,
  likeAction,
  dislikeAction,
}: {
  faq: Faq;
  likeAction: (id: number) => Promise<void>;
  dislikeAction: (id: number, comment: string) => Promise<void>;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-6 border rounded-lg shadow">
      <h2 className="text-xl font-semibold">{faq.question}</h2>
      <p className="mt-2 text-gray-600">{faq.answer}</p>
      <div className="flex items-center space-x-4 mt-4">
        <form action={() => likeAction(faq.id)}>
          <button
            className={`px-4 py-2 rounded ${
              faq.user_state === 'liked'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200'
            }`}
          >
            👍 {faq.likes}
          </button>
        </form>
        <button
          className={`px-4 py-2 rounded ${
            faq.user_state === 'disliked'
              ? 'bg-red-500 text-white'
              : 'bg-gray-200'
          }`}
          onClick={() => {
            if (faq.user_state === 'disliked') {
              dislikeAction(faq.id, 'removed');
            } else {
              setIsModalOpen(true);
            }
          }}
        >
          👎 {faq.dislikes}
        </button>
      </div>
      <FaqModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dislikeAction={dislikeAction}
        id={faq.id}
      />
    </div>
  );
}
