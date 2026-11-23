import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AdminModal} from './components/AdminModal';
import {BrownHeartsBurst, generateHeartParticles} from './components/BrownHeartsBurst';
import {CartDrawer} from './components/CartDrawer';
import {FavoritesDrawer} from './components/FavoritesDrawer';
import {FloatingControls} from './components/FloatingControls';
import {ActiveTab, Header} from './components/Header';
import {MyPetView} from './components/MyPetView';
import {ProductCard} from './components/ProductCard';
import {ReviewsBlock} from './components/ReviewsBlock';
import {SplashLogoOverlay} from './components/SplashLogoOverlay';
import {DEFAULT_PRODUCTS, subscribeToPublishedProducts} from './lib/catalogService';
import {CartItem, ProductItem} from './types/shop';

const CART_STORAGE_KEY = 'elza_shop_cart_v1';
const FAVORITES_STORAGE_KEY = 'elza_shop_favorites_v1';

interface StoredCartEntry {
  productId: string;
  quantity: number;
}

function loadStoredFavorites(): string[] {
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function loadStoredCartEntries(): StoredCartEntry[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => {
        const productId = typeof entry?.productId === 'string' ? entry.productId : '';
        const qty = Number(entry?.quantity);
        if (!productId || !Number.isFinite(qty) || qty <= 0) return null;
        return {productId, quantity: Math.floor(qty)};
      })
      .filter((item): item is StoredCartEntry => item !== null);
  } catch {
    return [];
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('catalog');
  const [products, setProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS);
  const [isSeededInDb, setIsSeededInDb] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => loadStoredFavorites());
  const [cartEntries, setCartEntries] = useState<StoredCartEntry[]>(() => loadStoredCartEntries());

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [heartBurst, setHeartBurst] = useState<{
    key: number;
    particles: ReturnType<typeof generateHeartParticles>;
  }>({key: 0, particles: []});
  const [toast, setToast] = useState<{
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  const toastTimerRef = useRef<number | null>(null);
  const addedTimerRef = useRef<number | null>(null);
  const heartBurstTimerRef = useRef<number | null>(null);

  const showToast = useCallback(
    (message: string, actionLabel?: string, onAction?: () => void) => {
      setToast({message, actionLabel, onAction});
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
      }, 2800);
    },
    [],
  );

  useEffect(() => {
    const unsubscribe = subscribeToPublishedProducts(
      (liveProducts, seeded) => {
        setProducts(liveProducts);
        setIsSeededInDb(seeded);
      },
      () => {
        showToast('Не удалось загрузить обновления каталога');
      },
    );
    return () => unsubscribe();
  }, [showToast]);

  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [favoriteIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartEntries));
    } catch {
      // Ignore storage quota errors
    }
  }, [cartEntries]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
      if (addedTimerRef.current !== null) window.clearTimeout(addedTimerRef.current);
      if (heartBurstTimerRef.current !== null) window.clearTimeout(heartBurstTimerRef.current);
    };
  }, []);

  const cartItems: CartItem[] = useMemo(() => {
    return cartEntries
      .map((entry) => {
        const product = products.find((p) => p.id === entry.productId);
        if (!product) return null;
        return {product, quantity: entry.quantity};
      })
      .filter((item): item is CartItem => item !== null);
  }, [cartEntries, products]);

  const favoriteProducts = useMemo(
    () => products.filter((p) => favoriteIds.includes(p.id)),
    [products, favoriteIds],
  );

  const handleToggleFavorite = (id: string) => {
    const product = products.find((p) => p.id === id);
    const exists = favoriteIds.includes(id);
    setFavoriteIds((prev) => (exists ? prev.filter((item) => item !== id) : [...prev, id]));

    if (exists) {
      showToast(`${product?.title ?? 'Товар'} убран из избранного`);
    } else {
      setHeartBurst((prev) => ({
        key: prev.key + 1,
        particles: generateHeartParticles(),
      }));
      if (heartBurstTimerRef.current !== null) {
        window.clearTimeout(heartBurstTimerRef.current);
      }
      heartBurstTimerRef.current = window.setTimeout(() => {
        setHeartBurst((prev) => ({...prev, particles: []}));
        heartBurstTimerRef.current = null;
      }, 1150);

      showToast('Добавлено в избранное', 'Открыть', () => {
        setIsCartOpen(false);
        setIsFavoritesOpen(true);
        setToast(null);
      });
    }
  };

  const addProductToCart = (product: ProductItem) => {
    setCartEntries((prev) => {
      const existing = prev.find((entry) => entry.productId === product.id);
      if (existing) {
        return prev.map((entry) =>
          entry.productId === product.id ? {...entry, quantity: entry.quantity + 1} : entry,
        );
      }
      return [...prev, {productId: product.id, quantity: 1}];
    });
  };

  const handleBuy = (product: ProductItem) => {
    addProductToCart(product);
    setRecentlyAddedId(product.id);
    if (addedTimerRef.current !== null) {
      window.clearTimeout(addedTimerRef.current);
    }
    addedTimerRef.current = window.setTimeout(() => {
      setRecentlyAddedId(null);
      addedTimerRef.current = null;
    }, 900);

    showToast(`${product.title} добавлен в корзину`, 'Корзина', () => {
      setIsFavoritesOpen(false);
      setIsCartOpen(true);
      setToast(null);
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCartEntries((prev) =>
      prev
        .map((entry) =>
          entry.productId === productId ? {...entry, quantity: entry.quantity + delta} : entry,
        )
        .filter((entry) => entry.quantity > 0),
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartEntries((prev) => prev.filter((entry) => entry.productId !== productId));
  };

  const handleClearCart = () => {
    setCartEntries([]);
    showToast('Корзина очищена');
  };

  const handleAddAllFavoritesToCart = () => {
    if (favoriteProducts.length === 0) return;

    setCartEntries((prev) => {
      const next = [...prev];
      for (const product of favoriteProducts) {
        const idx = next.findIndex((entry) => entry.productId === product.id);
        if (idx >= 0) {
          next[idx] = {...next[idx], quantity: next[idx].quantity + 1};
        } else {
          next.push({productId: product.id, quantity: 1});
        }
      }
      return next;
    });

    setIsFavoritesOpen(false);
    setIsCartOpen(true);
    showToast(`Добавлено в корзину: ${favoriteProducts.length} шт.`);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="elza-wallpaper min-h-screen w-full max-w-full relative overflow-x-clip pb-24 sm:pb-28 lg:pb-16">
      {/* Top Navigation & Brand Area */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogoClick={() => setActiveTab('catalog')}
        onAdminClick={() => {
          setIsCartOpen(false);
          setIsFavoritesOpen(false);
          setIsAdminModalOpen(true);
        }}
        onPetClick={() => setActiveTab('pet')}
      />

      {/* Main Content Area */}
      <main className="w-full max-w-[1358px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-14 2xl:px-0 mt-5 sm:mt-7 lg:mt-[26px] 2xl:mt-[32px]">
        {activeTab === 'catalog' ? (
          products.length > 0 ? (
            <section
              aria-label="Каталог питомцев"
              className="grid grid-cols-1 min-[350px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 min-[420px]:gap-4 sm:gap-5 lg:gap-[20px] 2xl:gap-[24px] 2xl:gap-y-[26px]"
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavorite={favoriteIds.includes(product.id)}
                  justAdded={recentlyAddedId === product.id}
                  onToggleFavorite={handleToggleFavorite}
                  onBuy={handleBuy}
                />
              ))}
            </section>
          ) : (
            <div className="elza-card-shadow max-w-[460px] mx-auto bg-[#FCF3EF] border-2 border-[#9E6B56] rounded-[30px] p-8 text-center">
              <h2 className="text-[20px] font-extrabold text-[#6B4E45] mb-2">
                Каталог пока пуст
              </h2>
              <p className="text-[14.5px] font-semibold text-[#8A6D64]">
                Скоро здесь появятся новые милые питомцы Elza Shop!
              </p>
            </div>
          )
        ) : activeTab === 'reviews' ? (
          <ReviewsBlock />
        ) : (
          <MyPetView onBackToCatalog={() => setActiveTab('catalog')} />
        )}
      </main>

      {/* Bottom Floating Cart & Favorites Controls */}
      <FloatingControls
        cartCount={cartCount}
        favoritesCount={favoriteProducts.length}
        onCartClick={() => {
          setIsFavoritesOpen(false);
          setIsCartOpen(true);
        }}
        onFavoritesClick={() => {
          setIsCartOpen(false);
          setIsFavoritesOpen(true);
        }}
      />

      {/* Slide-over Cart & Telegram Checkout Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        items={cartItems}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      {/* Slide-over Favorites Drawer */}
      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        items={favoriteProducts}
        onClose={() => setIsFavoritesOpen(false)}
        onRemoveFavorite={(id) => {
          setFavoriteIds((prev) => prev.filter((item) => item !== id));
          showToast('Убрано из избранного');
        }}
        onClearFavorites={() => {
          setFavoriteIds([]);
          showToast('Избранное очищено');
        }}
        onAddToCart={(product) => {
          addProductToCart(product);
          showToast(`${product.title} добавлен в корзину`, 'Корзина', () => {
            setIsFavoritesOpen(false);
            setIsCartOpen(true);
            setToast(null);
          });
        }}
        onAddAllToCart={handleAddAllFavoritesToCart}
      />

      {/* Admin Management Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        products={products}
        isSeededInDb={isSeededInDb}
        adminToken={adminToken}
        onAdminTokenChange={setAdminToken}
        onClose={() => setIsAdminModalOpen(false)}
        onNotify={(msg) => showToast(msg)}
      />

      {/* Full-Screen 1-Second Brown Hearts Celebration on Adding Favorite */}
      <BrownHeartsBurst burstKey={heartBurst.key} particles={heartBurst.particles} />

      {/* Entry Logo Splash (~1s, no loading indicator) */}
      <SplashLogoOverlay />

      {/* Lightweight Toast Notification on Interaction */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="elza-dark-pill-shadow fixed bottom-[76px] sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-24px)] px-4 sm:px-5 py-2.5 rounded-full bg-[#7D5E55] text-white font-bold text-[13.5px] sm:text-[15.5px] flex items-center gap-3 border border-white/25"
        >
          <span className="truncate">{toast.message}</span>
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={toast.onAction}
              className="px-3 py-1 rounded-full bg-[#F1A3BB] hover:bg-[#EB92AE] text-white text-[12.5px] sm:text-[14px] font-extrabold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
