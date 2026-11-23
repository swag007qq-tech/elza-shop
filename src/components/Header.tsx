import React from 'react';
import {
  BurstAccentIcon,
  CatalogGridIcon,
  ChevronRightIcon,
  CrownIcon,
  PawIcon,
  StarOutlineIcon,
} from './ElzaIcons';

export type ActiveTab = 'catalog' | 'reviews' | 'pet';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onLogoClick: () => void;
  onAdminClick: () => void;
  onPetClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onLogoClick,
  onAdminClick,
  onPetClick,
}) => {
  return (
    <header className="w-full max-w-[1672px] mx-auto px-3.5 sm:px-6 lg:px-8 xl:px-14 2xl:pl-[118px] 2xl:pr-[56px] pt-2.5 sm:pt-3.5 lg:pt-[13px]">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3.5 sm:gap-5 lg:gap-4 min-w-0">
        {/* Left: Elza Shop Sticker Logo */}
        <div className="flex justify-center lg:justify-start shrink-0">
          <button
            type="button"
            onClick={onLogoClick}
            aria-label="Elza Shop — На главную"
            className="group relative cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#7D5E55]/30 rounded-3xl transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
          >
            <img
              src="/assets/elza-logo.png"
              alt="Elza Shop"
              draggable={false}
              className="w-[185px] min-[400px]:w-[215px] sm:w-[260px] lg:w-[235px] xl:w-[290px] 2xl:w-[336px] h-auto select-none drop-shadow-[0_8px_14px_rgba(116,78,68,0.28)]"
            />
          </button>
        </div>

        {/* Center: Каталог / Отзывы Segmented Switcher + Burst Accent */}
        <div className="flex items-center justify-center w-full lg:w-auto min-w-0 lg:mt-[105px] xl:mt-[126px] 2xl:mt-[143px] lg:mr-2 2xl:mr-[28px] order-3 lg:order-2">
          <div className="relative flex items-center justify-center w-full max-w-[360px] sm:max-w-none sm:w-auto">
            <nav
              aria-label="Основные разделы"
              className="elza-pill-shadow w-full sm:w-auto flex items-center bg-[#FCF3EF] border-2 border-[#9E6B56] rounded-full p-[5px] sm:p-[7px] xl:p-[8px] 2xl:p-[9px]"
            >
              <button
                type="button"
                onClick={() => onTabChange('catalog')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 sm:gap-2.5 xl:gap-3 rounded-full px-3.5 sm:px-6 lg:px-5 xl:px-7 2xl:px-8 h-[46px] sm:h-[58px] lg:h-[56px] xl:h-[64px] 2xl:h-[70px] text-[15px] sm:text-[18px] lg:text-[18px] xl:text-[21px] 2xl:text-[23px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7D5E55] ${
                  activeTab === 'catalog'
                    ? 'bg-[#7D5E55] text-white shadow-[0_3px_10px_rgba(105,74,65,0.28)]'
                    : 'bg-transparent text-[#7A5C53] hover:bg-[#F5E7E2]'
                }`}
              >
                <CatalogGridIcon className="w-[18px] h-[18px] sm:w-[21px] sm:h-[21px] xl:w-[24px] xl:h-[24px] shrink-0" />
                <span>Каталог</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange('reviews')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 sm:gap-2.5 xl:gap-3 rounded-full px-3.5 sm:px-6 lg:px-5 xl:px-7 2xl:px-8 h-[46px] sm:h-[58px] lg:h-[56px] xl:h-[64px] 2xl:h-[70px] text-[15px] sm:text-[18px] lg:text-[18px] xl:text-[21px] 2xl:text-[23px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7D5E55] ${
                  activeTab === 'reviews'
                    ? 'bg-[#7D5E55] text-white shadow-[0_3px_10px_rgba(105,74,65,0.28)]'
                    : 'bg-transparent text-[#7A5C53] hover:bg-[#F5E7E2]'
                }`}
              >
                <StarOutlineIcon className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] xl:w-[25px] xl:h-[25px] shrink-0" />
                <span>Отзывы</span>
              </button>
            </nav>

            {/* Decorative burst strokes matching screenshot */}
            <div className="hidden sm:flex items-center ml-2 xl:ml-2.5 pointer-events-none select-none shrink-0">
              <BurstAccentIcon className="w-[22px] h-[42px] xl:w-[26px] xl:h-[50px] 2xl:w-[28px] 2xl:h-[54px] opacity-90" />
            </div>
          </div>
        </div>

        {/* Right: Admin & My Pet Action Pills */}
        <div className="w-full max-w-[360px] sm:max-w-[560px] lg:max-w-none lg:w-auto mx-auto lg:mx-0 grid grid-cols-1 min-[520px]:grid-cols-2 lg:flex lg:flex-col items-stretch lg:items-end justify-center gap-2.5 sm:gap-3.5 lg:gap-[18px] xl:gap-[22px] 2xl:gap-[25px] lg:mt-[22px] xl:mt-[28px] 2xl:mt-[33px] shrink-0 order-2 lg:order-3">
          <button
            type="button"
            onClick={onAdminClick}
            className="elza-pill-shadow w-full lg:w-[265px] xl:w-[305px] 2xl:w-[330px] h-[54px] sm:h-[64px] lg:h-[66px] xl:h-[74px] 2xl:h-[79px] bg-[#FCF2EE] hover:bg-[#FFF7F4] border-2 border-[#9E6B56] rounded-full px-4 sm:px-5 2xl:px-6 flex items-center justify-between gap-2.5 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7D5E55]"
          >
            <span className="flex items-center gap-2.5 sm:gap-3 text-[#7B5D54] min-w-0">
              <CrownIcon className="w-[22px] h-[20px] sm:w-[25px] sm:h-[22px] 2xl:w-[28px] 2xl:h-[24px] shrink-0" />
              <span className="text-left text-[14px] sm:text-[15.5px] lg:text-[15.5px] xl:text-[17px] 2xl:text-[18.5px] font-bold leading-[1.15] text-[#6E5148] truncate sm:whitespace-normal">
                Войти
                <br />
                как администратор
              </span>
            </span>
            <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#7B5D54] shrink-0" />
          </button>

          <button
            type="button"
            onClick={onPetClick}
            aria-pressed={activeTab === 'pet'}
            className={`elza-pill-shadow w-full lg:w-[265px] xl:w-[305px] 2xl:w-[330px] h-[54px] sm:h-[64px] lg:h-[66px] xl:h-[74px] 2xl:h-[78px] rounded-full px-4 sm:px-5 2xl:px-6 flex items-center justify-between gap-2.5 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7D5E55] ${
              activeTab === 'pet'
                ? 'bg-[#F6CDD4] border-2 border-[#7D5E55]'
                : 'bg-[#FADCE0] hover:bg-[#FCE4E7] border-2 border-[#9E6B56]'
            }`}
          >
            <span className="flex items-center gap-2.5 sm:gap-3 text-[#7B5D54] min-w-0">
              <PawIcon className="w-[22px] h-[22px] sm:w-[25px] sm:h-[25px] 2xl:w-[28px] 2xl:h-[28px] shrink-0" />
              <span className="text-[15px] sm:text-[16.5px] lg:text-[17px] xl:text-[18.5px] 2xl:text-[20px] font-bold text-[#6E5148] whitespace-nowrap truncate">
                Мой питомец
              </span>
            </span>
            <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#7B5D54] shrink-0" />
          </button>
        </div>
      </div>
    </header>
  );
};
