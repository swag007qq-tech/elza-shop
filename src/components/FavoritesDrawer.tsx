import React, {useEffect} from 'react';
import {Trash2, X} from 'lucide-react';
import {CartIcon, HeartIcon, StarFilledIcon} from './ElzaIcons';
import {ProductItem} from '../types/shop';

interface FavoritesDrawerProps {
  isOpen: boolean;
  items: ProductItem[];
  onClose: () => void;
  onRemoveFavorite: (productId: string) => void;
  onClearFavorites: () => void;
  onAddToCart: (product: ProductItem) => void;
  onAddAllToCart: () => void;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  items,
  onClose,
  onRemoveFavorite,
  onClearFavorites,
  onAddToCart,
  onAddAllToCart,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Избранное"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#4A322C]/40 backdrop-blur-[2px] transition-opacity"
      />

      {/* Drawer Panel */}
      <aside className="relative z-10 w-full max-w-[440px] h-dvh bg-[#FCF3EF] border-l-2 border-[#9E6B56] shadow-[-10px_0_38px_rgba(132,74,50,0.42)] flex flex-col sm:rounded-l-[32px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-[#EAD6CE] bg-[#FAF0EB]">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-[#83645B] text-white flex items-center justify-center">
              <StarFilledIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-[20px] sm:text-[22px] font-extrabold text-[#6B4E45] leading-tight">
                Избранное
              </h2>
              {items.length > 0 && (
                <p className="text-[13px] font-semibold text-[#8A6D64] tabular-nums">
                  Сохранено: {items.length} шт.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={onClearFavorites}
                className="px-3 py-1.5 rounded-full text-[13px] font-bold text-[#8A6D64] hover:text-[#6B4E45] hover:bg-[#F2E2DC] cursor-pointer transition-colors"
              >
                Очистить
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть избранное"
              className="w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-[#EBD8D1] flex items-center justify-center text-[#7D5E55] cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8 px-4">
              <div className="w-24 h-24 rounded-[28px] bg-[#FADCE0]/60 border border-white flex items-center justify-center text-[#E089A2] mb-4">
                <HeartIcon className="w-11 h-11" filled />
              </div>
              <h3 className="text-[21px] font-extrabold text-[#6B4E45] mb-2">
                В избранном пока пусто
              </h3>
              <p className="text-[15px] font-semibold text-[#8A6D64] mb-6 max-w-[270px]">
                Нажмите на сердечко в углу любой карточки, чтобы сохранить понравившегося питомца.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="elza-buy-btn px-7 h-[50px] rounded-full text-white font-bold text-[17px] cursor-pointer transition-all duration-150 hover:brightness-[1.03] active:scale-[0.98]"
              >
                Вернуться в каталог
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center gap-3.5 p-3 sm:p-3.5 bg-white/95 border-2 border-[#9E6B56] rounded-[22px] shadow-[0_0_16px_rgba(148,90,66,0.34),0_6px_14px_rgba(110,68,50,0.14)]"
                >
                  <div className="w-[68px] h-[68px] rounded-[16px] bg-[#FAF0EB] border border-[#EFE0DA] flex items-center justify-center shrink-0 p-1.5">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-contain select-none pointer-events-none"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15.5px] font-extrabold text-[#6B4E45] truncate">
                      {product.title}
                    </h3>
                    <p className="text-[16px] font-extrabold text-[#7D5E55] tabular-nums mb-2">
                      {product.price} {product.currency}
                    </p>

                    <button
                      type="button"
                      onClick={() => onAddToCart(product)}
                      className="elza-buy-btn h-[36px] px-4 rounded-full inline-flex items-center gap-1.5 text-white font-bold text-[14px] cursor-pointer transition-all duration-150 hover:brightness-[1.03] active:scale-[0.97]"
                    >
                      <CartIcon className="w-4 h-4" />
                      <span>В корзину</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveFavorite(product.id)}
                    aria-label={`Убрать ${product.title} из избранного`}
                    className="self-start w-8 h-8 rounded-full flex items-center justify-center text-[#A0847B] hover:text-[#B95D74] hover:bg-[#FCEEEF] cursor-pointer transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 sm:px-6 py-4 sm:py-5 border-t border-[#EAD6CE] bg-[#FAF0EB]">
            <button
              type="button"
              onClick={onAddAllToCart}
              className="elza-buy-btn w-full h-[54px] rounded-full text-white font-bold text-[18px] sm:text-[19px] flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 hover:brightness-[1.03] active:scale-[0.98]"
            >
              <CartIcon className="w-5 h-5" />
              <span>Добавить все в корзину ({items.length})</span>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};
