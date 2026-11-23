import React from 'react';

const TELEGRAM_PROOFS_URL = 'https://t.me/proofelza';

export const ReviewsBlock: React.FC = () => {
  return (
    <section
      aria-label="Отзывы и пруфы выдачи"
      className="w-full max-w-[1140px] mx-auto pt-1 sm:pt-3 lg:pt-2 pb-4 flex items-center justify-center"
    >
      <div className="relative w-full overflow-hidden rounded-[22px] sm:rounded-[30px] lg:rounded-[36px] border-2 border-[#9E6B56] shadow-[0_0_26px_rgba(142,84,58,0.52),0_14px_30px_rgba(105,64,48,0.28)] select-none">
        {/* Exact Original Reviews Banner Illustration */}
        <img
          src="/assets/aistudio/_____________________________________8ca59db1.png"
          alt="Все пруфы выдачи и отзывы от клиентов вы можете посмотреть тут"
          draggable={false}
          className="w-full h-auto block pointer-events-none"
        />

        {/* Interactive "ТЫК ♡" Telegram Channel Link Aligned Directly Over the Pill Button */}
        <a
          href={TELEGRAM_PROOFS_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Перейти в Telegram-канал с отзывами и пруфами @proofelza"
          style={{
            left: '46.2919%',
            top: '63.4431%',
            width: '32.8947%',
            height: '16.7906%',
          }}
          className="absolute block rounded-full cursor-pointer transition-all duration-150 hover:bg-white/15 hover:shadow-[0_0_26px_rgba(244,132,175,0.62)] active:bg-[#E46B96]/20 active:scale-[0.985] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#E789A4]/70"
        />
      </div>
    </section>
  );
};
