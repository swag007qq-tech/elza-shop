import React from 'react';
import {CartIcon, HeartIcon} from './ElzaIcons';
import {PET_RARITY_OPTIONS, ProductItem} from '../types/shop';

interface ProductCardProps {
  product: ProductItem;
  isFavorite: boolean;
  justAdded?: boolean;
  onToggleFavorite: (id: string) => void;
  onBuy: (product: ProductItem) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isFavorite,
  justAdded = false,
  onToggleFavorite,
  onBuy,
}) => {
  const activeBadges = (product.rarities ?? [])
    .map((id) => PET_RARITY_OPTIONS.find((opt) => opt.id === id))
    .filter((opt): opt is (typeof PET_RARITY_OPTIONS)[number] => Boolean(opt));

  return (
    <article className="relative flex flex-col items-center justify-between bg-[#FCF3EF] border-2 border-[#9E6B56] shadow-[0_0_24px_rgba(148,90,66,0.52),0_12px_26px_rgba(105,64,48,0.26)] hover:border-[#85523D] hover:shadow-[0_0_32px_rgba(138,77,52,0.7),0_14px_30px_rgba(95,56,40,0.34)] rounded-[22px] sm:rounded-[28px] lg:rounded-[34px] pt-8 sm:pt-10 lg:pt-[42px] pb-3.5 sm:pb-4 px-3 sm:px-5 lg:px-6 min-h-[290px] sm:min-h-[385px] lg:min-h-[415px] 2xl:min-h-[445px] min-w-0 transition-all duration-150 hover:-translate-y-0.5">
      {/* Top-Left Optional Rarity Badges */}
      {activeBadges.length > 0 && (
        <div
          className="absolute top-3 left-3 sm:top-4 sm:left-4 lg:top-[18px] lg:left-[18px] z-10 flex items-center gap-1 sm:gap-1.5 pointer-events-none select-none"
          aria-label={`Свойства: ${activeBadges.map((b) => b.id).join(', ')}`}
        >
          {activeBadges.map((badge) => (
            <img
              key={badge.id}
              src={badge.icon}
              alt={badge.label}
              draggable={false}
              className="w-[24px] h-[24px] sm:w-[28px] sm:h-[28px] lg:w-[30px] lg:h-[30px] object-contain drop-shadow-[0_2px_4px_rgba(95,56,40,0.28)]"
            />
          ))}
        </div>
      )}

      {/* Top-Right Favorite Heart Button */}
      <button
        type="button"
        onClick={() => onToggleFavorite(product.id)}
        aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
        aria-pressed={isFavorite}
        className={`absolute top-2.5 right-2.5 sm:top-4 sm:right-4 lg:top-[18px] lg:right-[18px] z-10 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full cursor-pointer transition-all duration-150 hover:scale-110 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7D5E55] ${
          isFavorite ? 'text-[#E789A4] scale-105' : 'text-[#7D5E55] hover:text-[#6B4E45]'
        }`}
      >
        <HeartIcon
          className="w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] lg:w-[29px] lg:h-[29px]"
          filled={isFavorite}
        />
      </button>

      {/* Center Product Photo */}
      <div className="w-full flex-1 flex items-center justify-center pt-1 pb-2">
        <div className="w-[115px] min-[420px]:w-[135px] sm:w-[180px] lg:w-[205px] xl:w-[225px] aspect-square flex items-center justify-center overflow-hidden rounded-[20px]">
          <img
            src={product.image}
            alt={product.title}
            draggable={false}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain select-none pointer-events-none"
          />
        </div>
      </div>

      {/* Product Name, Price & Buy Button */}
      <div className="w-full flex flex-col items-center gap-1.5 sm:gap-2 mt-1">
        <h2 className="w-full text-center text-[14.5px] sm:text-[17px] lg:text-[18.5px] font-extrabold text-[#6B4E45] leading-snug line-clamp-2 min-h-[2.4em] flex items-center justify-center">
          {product.title}
        </h2>

        <div className="flex items-baseline justify-center gap-1 sm:gap-1.5 text-[#6B4E45] leading-none tabular-nums">
          <span className="text-[20px] sm:text-[26px] lg:text-[28px] 2xl:text-[30px] font-extrabold tracking-[-0.01em]">
            {product.price}
          </span>
          <span className="text-[15px] sm:text-[20px] lg:text-[21px] 2xl:text-[23px] font-bold text-[#7A5C53]">
            {product.currency}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onBuy(product)}
          className={`w-full max-w-[244px] h-[40px] sm:h-[48px] lg:h-[52px] 2xl:h-[54px] rounded-full flex items-center justify-center gap-1.5 sm:gap-2.5 text-white font-bold text-[15px] sm:text-[18px] lg:text-[20px] 2xl:text-[21px] whitespace-nowrap cursor-pointer transition-all duration-150 hover:brightness-[1.03] active:scale-[0.97] focus:outline-none focus-visible:ring-3 focus-visible:ring-[#7D5E55]/40 ${
            justAdded ? 'bg-[#7D5E55] shadow-[0_4px_12px_rgba(105,74,65,0.3)]' : 'elza-buy-btn'
          }`}
        >
          <CartIcon className="w-[18px] h-[18px] sm:w-[21px] sm:h-[21px] 2xl:w-[24px] 2xl:h-[24px] stroke-[2.2] shrink-0" />
          <span>{justAdded ? 'Добавлено!' : 'Купить'}</span>
        </button>
      </div>
    </article>
  );
};
