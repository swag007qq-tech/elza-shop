import React, {useEffect} from 'react';
import {Minus, Plus, Trash2, X} from 'lucide-react';
import {CartIcon} from './ElzaIcons';
import {CartItem} from '../types/shop';

const TELEGRAM_SELLER_URL = 'https://t.me/Zozuliczka_Ua';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  items,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
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

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const orderSummaryText =
    items.length > 0
      ? `Здравствуйте! Хочу оформить покупку в Elza Shop:\n${items
          .map(
            (i) =>
              `• ${i.product.title} × ${i.quantity} = ${i.product.price * i.quantity} ${i.product.currency}`,
          )
          .join('\n')}\nИтого: ${totalPrice} грн`
      : 'Здравствуйте! Хочу оформить покупку в Elza Shop.';

  const telegramCheckoutHref = `${TELEGRAM_SELLER_URL}?text=${encodeURIComponent(orderSummaryText)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Корзина"
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
              <CartIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-[20px] sm:text-[22px] font-extrabold text-[#6B4E45] leading-tight">
                Корзина
              </h2>
              {totalCount > 0 && (
                <p className="text-[13px] font-semibold text-[#8A6D64] tabular-nums">
                  Товаров: {totalCount} шт.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="px-3 py-1.5 rounded-full text-[13px] font-bold text-[#8A6D64] hover:text-[#6B4E45] hover:bg-[#F2E2DC] cursor-pointer transition-colors"
              >
                Очистить
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть корзину"
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
              <div className="w-28 h-28 rounded-[28px] bg-[#F7EAE5] border border-white flex items-center justify-center mb-4">
                <img
                  src="/assets/mystery-pet.png"
                  alt=""
                  className="w-20 h-auto opacity-80 select-none pointer-events-none"
                />
              </div>
              <h3 className="text-[21px] font-extrabold text-[#6B4E45] mb-2">
                Корзина пока пуста
              </h3>
              <p className="text-[15px] font-semibold text-[#8A6D64] mb-6 max-w-[260px]">
                Нажмите «Купить» на любой карточке, чтобы добавить товар в корзину и перейти к покупке.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="elza-buy-btn px-7 h-[50px] rounded-full text-white font-bold text-[17px] cursor-pointer transition-all duration-150 hover:brightness-[1.03] active:scale-[0.98]"
              >
                Перейти в каталог
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map(({product, quantity}) => (
                <li
                  key={product.id}
                  className="flex items-center gap-3.5 p-3 sm:p-3.5 bg-white/95 border-2 border-[#9E6B56] rounded-[22px] shadow-[0_0_16px_rgba(148,90,66,0.34),0_6px_14px_rgba(110,68,50,0.14)]"
                >
                  <div className="w-[68px] h-[68px] rounded-[16px] bg-[#FAF0EB] border border-[#EFE0DA] flex items-center justify-center shrink-0 p-1.5 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain select-none pointer-events-none"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15.5px] font-extrabold text-[#6B4E45] truncate">
                      {product.title}
                    </h3>
                    <p className="text-[13.5px] font-bold text-[#8A6D64] tabular-nums mb-2">
                      {product.price} {product.currency} / шт.
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center bg-[#FAF0EB] border border-[#E8D5CD] rounded-full p-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(product.id, -1)}
                          aria-label="Уменьшить количество"
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[#6B4E45] hover:bg-white cursor-pointer transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="min-w-[28px] text-center text-[14.5px] font-extrabold text-[#6B4E45] tabular-nums">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(product.id, 1)}
                          aria-label="Увеличить количество"
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[#6B4E45] hover:bg-white cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-[16px] font-extrabold text-[#6B4E45] tabular-nums">
                        {product.price * quantity} {product.currency}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(product.id)}
                    aria-label={`Удалить ${product.title}`}
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
            <div className="flex items-baseline justify-between mb-3.5">
              <span className="text-[16px] font-bold text-[#8A6D64]">Итого:</span>
              <span className="text-[26px] font-extrabold text-[#6B4E45] tabular-nums">
                {totalPrice} грн
              </span>
            </div>

            <a
              href={telegramCheckoutHref}
              target="_blank"
              rel="noopener noreferrer"
              className="elza-buy-btn w-full h-[54px] rounded-full text-white font-bold text-[19px] flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 hover:brightness-[1.03] active:scale-[0.98]"
            >
              <CartIcon className="w-5 h-5" />
              <span>Купить</span>
            </a>

            <p className="text-[11.5px] font-semibold text-[#8A6D64] text-center leading-[1.3] mt-2.5">
              Нажмите на кнопку купить, чтобы оплатить и договориться о выдаче покупки
            </p>
          </div>
        )}
      </aside>
    </div>
  );
};
