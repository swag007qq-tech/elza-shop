import React from 'react';
import {CartIcon, ChevronRightIcon, StarFilledIcon} from './ElzaIcons';

interface FloatingControlsProps {
  cartCount: number;
  favoritesCount: number;
  onCartClick: () => void;
  onFavoritesClick: () => void;
}

export const FloatingControls: React.FC<FloatingControlsProps> = ({
  cartCount,
  favoritesCount,
  onCartClick,
  onFavoritesClick,
}) => {
  return (
    <>
      {/* Bottom-Left Floating Cart Circle */}
      <button
        type="button"
        onClick={onCartClick}
        aria-label={`Корзина, товаров: ${cartCount}`}
        className="elza-dark-pill-shadow fixed bottom-3.5 left-3.5 sm:bottom-6 sm:left-6 xl:bottom-[34px] xl:left-[34px] z-30 w-[58px] h-[58px] sm:w-[76px] sm:h-[76px] xl:w-[98px] xl:h-[98px] rounded-full bg-[#83645B] hover:bg-[#775950] border-[2.5px] sm:border-[3px] border-white flex items-center justify-center text-white cursor-pointer transition-all duration-150 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7D5E55]/40"
      >
        <CartIcon className="w-[26px] h-[26px] sm:w-[34px] sm:h-[34px] xl:w-[44px] xl:h-[44px] -ml-0.5" />

        {/* Pink Counter Badge */}
        <span className="absolute -top-1.5 -right-1.5 sm:-right-2 min-w-[26px] h-[26px] sm:min-w-[34px] sm:h-[34px] xl:min-w-[42px] xl:h-[42px] px-1 sm:px-1.5 rounded-full bg-[#F1A3BB] border-[2px] sm:border-[2.5px] border-white flex items-center justify-center text-white font-extrabold text-[13px] sm:text-[17px] xl:text-[21px] leading-none shadow-sm tabular-nums">
          {cartCount}
        </span>
      </button>

      {/* Bottom-Right Floating Favorites Pill */}
      <button
        type="button"
        onClick={onFavoritesClick}
        aria-label={`Избранное (${favoritesCount})`}
        className="elza-dark-pill-shadow fixed bottom-4 right-3.5 sm:bottom-6 sm:right-5 xl:bottom-[32px] xl:right-[20px] z-30 h-[48px] sm:h-[58px] xl:h-[68px] pl-4 pr-3 sm:pl-5 sm:pr-4 xl:pl-6 xl:pr-5 rounded-full bg-[#83645B] hover:bg-[#775950] border border-white/25 flex items-center gap-2 sm:gap-2.5 xl:gap-3 text-white font-bold text-[15px] sm:text-[18px] xl:text-[20px] cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.97] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7D5E55]/40"
      >
        <StarFilledIcon className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] xl:w-[25px] xl:h-[25px] text-white shrink-0" />
        <span className="whitespace-nowrap">Избранное</span>
        {favoritesCount > 0 && (
          <span className="ml-0.5 text-[13px] sm:text-[15px] font-extrabold text-[#FADCE0] tabular-nums">
            ({favoritesCount})
          </span>
        )}
        <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white/95 shrink-0" />
      </button>
    </>
  );
};
