import React, {useEffect, useState} from 'react';
import {
  ImagePlus,
  KeyRound,
  LogOut,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  createProductInFirestore,
  deleteProductInFirestore,
  sanitizeImageUrl,
  seedDefaultProductsIfEmpty,
  updateProductInFirestore,
} from '../lib/catalogService';
import {PET_RARITY_OPTIONS, PetRarityBadge, ProductItem} from '../types/shop';
import {CrownIcon} from './ElzaIcons';

interface AdminModalProps {
  isOpen: boolean;
  products: ProductItem[];
  isSeededInDb: boolean;
  adminToken: string | null;
  onAdminTokenChange: (token: string | null) => void;
  onClose: () => void;
  onNotify: (message: string) => void;
}

interface EditableDraft {
  title: string;
  price: string;
  currency: string;
  image: string;
  rarities: PetRarityBadge[];
}

function toggleRarityList(list: PetRarityBadge[], badge: PetRarityBadge): PetRarityBadge[] {
  if (list.includes(badge)) {
    return list.filter((item) => item !== badge);
  }
  const next = new Set<PetRarityBadge>([...list, badge]);
  return PET_RARITY_OPTIONS.map((opt) => opt.id).filter((id) => next.has(id));
}

function formatFriendlyFirestoreError(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;
  let rawMessage = err.message;
  try {
    const parsed = JSON.parse(err.message) as {error?: string};
    if (typeof parsed?.error === 'string') {
      rawMessage = parsed.error;
    }
  } catch {
    // Not JSON
  }
  const lower = rawMessage.toLowerCase();
  if (lower.includes('permission') || lower.includes('insufficient')) {
    return 'Нет прав на запись в Firestore: проверьте переменные VITE_FIREBASE_* и правила доступа к коллекции products.';
  }
  return rawMessage || fallback;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  products,
  isSeededInDb,
  adminToken,
  onAdminTokenChange,
  onClose,
  onNotify,
}) => {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Draft map for editing existing products
  const [drafts, setDrafts] = useState<Record<string, EditableDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // New product form
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('299');
  const [newCurrency, setNewCurrency] = useState('грн');
  const [newImage, setNewImage] = useState('');
  const [newRarities, setNewRarities] = useState<PetRarityBadge[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const headers: Record<string, string> = {};
    if (adminToken) headers.Authorization = `Bearer ${adminToken}`;

    fetch('/api/admin/status', {headers})
      .then((res) => res.json())
      .then((data: {configured?: boolean; authenticated?: boolean}) => {
        if (!active) return;
        setIsConfigured(Boolean(data.configured));
        if (!data.authenticated && adminToken) {
          onAdminTokenChange(null);
        }
      })
      .catch(() => {
        if (active) setIsConfigured(true);
      });

    return () => {
      active = false;
    };
  }, [isOpen, adminToken, onAdminTokenChange]);

  // Sync editable drafts when products list updates
  useEffect(() => {
    setDrafts((prev) => {
      const next: Record<string, EditableDraft> = {};
      products.forEach((p) => {
        next[p.id] = prev[p.id] || {
          title: p.title,
          price: String(p.price),
          currency: p.currency,
          image: p.image,
          rarities: p.rarities ?? [],
        };
      });
      return next;
    });
  }, [products]);

  if (!isOpen) return null;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = passwordInput.trim();
    if (!trimmed) {
      setAuthError('Введите пароль администратора');
      return;
    }

    setIsSubmittingAuth(true);
    setAuthError(null);
    try {
      const endpoint = isConfigured === false ? '/api/admin/claim' : '/api/admin/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({password: trimmed}),
      });
      const data = (await res.json()) as {token?: string; error?: string};
      if (!res.ok || !data.token) {
        setAuthError(data.error || 'Не удалось войти');
        return;
      }
      onAdminTokenChange(data.token);
      setIsConfigured(true);
      setPasswordInput('');
      setActionError(null);
      onNotify('Вход администратора выполнен');
    } catch {
      setAuthError('Ошибка соединения с сервером');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleFileUpload = async (file: File, targetId: 'new' | string) => {
    if (!adminToken) return;
    if (file.size > 4 * 1024 * 1024) {
      onNotify('Файл слишком большой (максимум 4 МБ)');
      return;
    }

    setUploadingTarget(targetId);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({dataUrl}),
      });
      const data = (await res.json()) as {url?: string; error?: string};
      if (!res.ok || !data.url) {
        onNotify(data.error || 'Ошибка загрузки изображения');
        return;
      }

      if (targetId === 'new') {
        setNewImage(data.url);
      } else {
        setDrafts((prev) => ({
          ...prev,
          [targetId]: {
            ...(prev[targetId] || {
              title: '',
              price: '299',
              currency: 'грн',
              image: '',
              rarities: [],
            }),
            image: data.url!,
          },
        }));
      }
      onNotify('Фотография загружена');
    } catch {
      onNotify('Ошибка при загрузке фотографии');
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    if (!newTitle.trim()) {
      onNotify('Введите название товара');
      return;
    }
    const parsedPrice = Number(newPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      onNotify('Укажите корректную цену');
      return;
    }

    setIsCreating(true);
    setActionError(null);
    try {
      if (!isSeededInDb) {
        await seedDefaultProductsIfEmpty();
      }
      await createProductInFirestore({
        title: newTitle,
        price: parsedPrice,
        currency: newCurrency || 'грн',
        image: newImage,
        rarities: newRarities,
        sortOrder: products.length,
      });
      setNewTitle('');
      setNewPrice('299');
      setNewCurrency('грн');
      setNewImage('');
      setNewRarities([]);
      onNotify('Новый товар опубликован для всех посетителей!');
    } catch (err) {
      const msg = formatFriendlyFirestoreError(err, 'Не удалось опубликовать товар');
      setActionError(msg);
      onNotify(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveProduct = async (product: ProductItem, index: number) => {
    if (!adminToken) return;
    const draft = drafts[product.id];
    if (!draft) return;
    const parsedPrice = Number(draft.price);
    if (!draft.title.trim() || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      onNotify('Проверьте название и цену товара');
      return;
    }

    setSavingId(product.id);
    setActionError(null);
    try {
      if (!isSeededInDb) {
        await seedDefaultProductsIfEmpty();
      }
      await updateProductInFirestore(product.id, {
        title: draft.title,
        subtitle: product.subtitle,
        price: parsedPrice,
        currency: draft.currency || 'грн',
        image: draft.image,
        rarities: draft.rarities,
        sortOrder: product.sortOrder ?? index,
      });
      onNotify(`Сохранено: «${draft.title.trim()}»`);
    } catch (err) {
      const msg = formatFriendlyFirestoreError(err, 'Ошибка сохранения товара');
      setActionError(msg);
      onNotify(msg);
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteProduct = async (product: ProductItem) => {
    if (!adminToken) return;
    setDeletingId(product.id);
    setActionError(null);
    try {
      if (!isSeededInDb) {
        await seedDefaultProductsIfEmpty();
      }
      await deleteProductInFirestore(product.id);
      onNotify(`Товар «${product.title}» удалён`);
    } catch (err) {
      const msg = formatFriendlyFirestoreError(err, 'Ошибка удаления товара');
      setActionError(msg);
      onNotify(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSeedStarterProducts = async () => {
    if (!adminToken) return;
    setIsSeeding(true);
    setActionError(null);
    try {
      await seedDefaultProductsIfEmpty();
      onNotify('Стартовые товары сохранены в Firestore!');
    } catch (err) {
      const msg = formatFriendlyFirestoreError(err, 'Не удалось сохранить стартовые товары');
      setActionError(msg);
      onNotify(msg);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleLogoutAdmin = () => {
    onAdminTokenChange(null);
    setActionError(null);
    onNotify('Вы вышли из режима администратора');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Панель администратора"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#4A322C]/45 backdrop-blur-[2px]"
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-[820px] max-h-[92dvh] bg-[#FCF3EF] border-2 border-[#9E6B56] shadow-[0_0_30px_rgba(142,84,58,0.5),0_18px_48px_rgba(74,44,36,0.34)] rounded-[28px] sm:rounded-[34px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 bg-[#FAF0EB] border-b border-[#EAD6CE]">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-[#7D5E55] text-white flex items-center justify-center shrink-0">
              <CrownIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-[19px] sm:text-[22px] font-extrabold text-[#6B4E45] leading-tight">
                Панель администратора
              </h2>
              <p className="text-[12.5px] sm:text-[13.5px] font-semibold text-[#8A6D64]">
                Управление товарами, ценами и фотографиями в Firestore
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {adminToken && (
              <button
                type="button"
                onClick={handleLogoutAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#F5E7E2] border border-[#EBD8D1] text-[13px] font-bold text-[#7D5E55] cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Выйти</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть окно"
              className="w-9 h-9 rounded-full bg-white hover:bg-[#F5E7E2] border border-[#EBD8D1] flex items-center justify-center text-[#7D5E55] cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-6">
          {!adminToken ? (
            <form
              onSubmit={handlePasswordSubmit}
              className="max-w-[420px] mx-auto bg-white/95 border-2 border-[#9E6B56] shadow-[0_0_20px_rgba(148,90,66,0.34)] rounded-[26px] p-5 sm:p-7 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-[#FADCE0] text-[#7D5E55] flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-7 h-7" />
              </div>

              <h3 className="text-[20px] font-extrabold text-[#6B4E45] mb-1.5">
                {isConfigured === false
                  ? 'Активация пароля администратора'
                  : 'Вход для администратора'}
              </h3>
              <p className="text-[13.5px] font-semibold text-[#8A6D64] mb-5 leading-snug">
                {isConfigured === false
                  ? 'Задайте секретный пароль для входа в управление магазином (он сохранится в защищённом хеше на сервере).'
                  : 'Введите специальный пароль администратора для редактирования каталога.'}
              </p>

              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Введите пароль"
                autoFocus
                className="w-full h-[48px] px-4 rounded-[16px] bg-[#FCF3EF] border border-[#DFC7BE] text-[#6B4E45] font-bold text-[15.5px] placeholder:text-[#B69D95] focus:outline-none focus:border-[#7D5E55] mb-3"
              />

              {authError && (
                <div className="mb-3 px-4 py-2 rounded-[14px] bg-[#FADCE0] text-[#7A3E4A] text-[13.5px] font-bold">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="elza-buy-btn w-full h-[50px] rounded-full text-white font-bold text-[17px] cursor-pointer transition-all duration-150 hover:brightness-[1.03] active:scale-[0.98] disabled:opacity-60"
              >
                {isSubmittingAuth
                  ? 'Проверка...'
                  : isConfigured === false
                    ? 'Сохранить пароль и войти'
                    : 'Войти'}
              </button>
            </form>
          ) : (
            <>
              {actionError && (
                <div className="bg-[#FADCE0]/85 border-2 border-[#C47C8E] rounded-[22px] p-4 text-[#7A3E4A] text-[13.5px] font-bold leading-snug">
                  {actionError}
                </div>
              )}

              {/* Add New Product Section */}
              <form
                onSubmit={handleCreateProduct}
                className="bg-white/95 border-2 border-[#9E6B56] shadow-[0_0_20px_rgba(148,90,66,0.32)] rounded-[24px] p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
                  <h3 className="text-[17px] sm:text-[18.5px] font-extrabold text-[#6B4E45] flex items-center gap-2">
                    <Plus className="w-5 h-5 text-[#E789A4]" />
                    <span>Опубликовать новый товар</span>
                  </h3>

                  {!isSeededInDb && (
                    <button
                      type="button"
                      onClick={() => void handleSeedStarterProducts()}
                      disabled={isSeeding}
                      className="inline-flex items-center gap-1.5 px-3.5 h-[34px] rounded-full bg-[#FADCE0] hover:bg-[#F5C5CE] text-[#6B4E45] text-[12.5px] font-extrabold cursor-pointer transition-colors disabled:opacity-60"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isSeeding ? 'Сохранение...' : 'Сохранить стартовые товары в БД'}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                  {/* Preview & Photo Controls */}
                  <div className="sm:col-span-4 flex flex-col items-center gap-2 bg-[#FCF3EF] border border-[#EAD6CE] rounded-[18px] p-3">
                    <div className="w-24 h-24 rounded-[14px] bg-white border border-[#EFE0DA] flex flex-col items-center justify-center overflow-hidden p-1">
                      {newImage.trim() ? (
                        <img
                          src={sanitizeImageUrl(newImage)}
                          alt="Предпросмотр"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-[#B5988F] gap-1">
                          <ImagePlus className="w-7 h-7" />
                          <span className="text-[11px] font-bold">Без фото</span>
                        </div>
                      )}
                    </div>

                    <label className="w-full h-[36px] rounded-full bg-[#7D5E55] hover:bg-[#6E5148] text-white text-[13px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {uploadingTarget === 'new' ? 'Загрузка...' : 'Загрузить фото'}
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleFileUpload(f, 'new');
                          e.target.value = '';
                        }}
                      />
                    </label>

                    {newImage.trim() && (
                      <button
                        type="button"
                        onClick={() => setNewImage('')}
                        className="text-[11.5px] font-bold text-[#8A6D64] hover:text-[#6B4E45] cursor-pointer"
                      >
                        Убрать фото
                      </button>
                    )}
                  </div>

                  {/* Fields */}
                  <div className="sm:col-span-8 space-y-2.5">
                    <div>
                      <label className="block text-[12.5px] font-bold text-[#7A5C53] mb-1">
                        Название товара
                      </label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Например, Корова"
                        maxLength={80}
                        className="w-full h-[42px] px-3.5 rounded-[14px] bg-[#FCF3EF] border border-[#E5CFC7] text-[#6B4E45] font-bold text-[14.5px] focus:outline-none focus:border-[#7D5E55]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[12.5px] font-bold text-[#7A5C53] mb-1">
                          Цена
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={1000000}
                          step="1"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          className="w-full h-[42px] px-3.5 rounded-[14px] bg-[#FCF3EF] border border-[#E5CFC7] text-[#6B4E45] font-extrabold text-[15px] tabular-nums focus:outline-none focus:border-[#7D5E55]"
                        />
                      </div>
                      <div>
                        <label className="block text-[12.5px] font-bold text-[#7A5C53] mb-1">
                          Валюта
                        </label>
                        <input
                          type="text"
                          value={newCurrency}
                          onChange={(e) => setNewCurrency(e.target.value)}
                          maxLength={16}
                          className="w-full h-[42px] px-3.5 rounded-[14px] bg-[#FCF3EF] border border-[#E5CFC7] text-[#6B4E45] font-bold text-[14.5px] focus:outline-none focus:border-[#7D5E55]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12.5px] font-bold text-[#7A5C53] mb-1">
                        Ссылка на фотографию (URL, необязательно)
                      </label>
                      <input
                        type="text"
                        value={newImage}
                        onChange={(e) => setNewImage(e.target.value)}
                        placeholder="Необязательно: https://..."
                        maxLength={2048}
                        className="w-full h-[40px] px-3.5 rounded-[14px] bg-[#FCF3EF] border border-[#E5CFC7] text-[#6B4E45] font-semibold text-[13.5px] focus:outline-none focus:border-[#7D5E55]"
                      />
                    </div>

                    <div>
                      <span className="block text-[12.5px] font-bold text-[#7A5C53] mb-1.5">
                        Редкость / значки (необязательно)
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {PET_RARITY_OPTIONS.map((opt) => {
                          const selected = newRarities.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setNewRarities((prev) => toggleRarityList(prev, opt.id))}
                              aria-pressed={selected}
                              title={opt.label}
                              className={`h-[38px] px-2.5 rounded-[12px] border-2 inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                                selected
                                  ? 'bg-[#FADCE0]/75 border-[#85523D] shadow-[0_2px_8px_rgba(138,77,52,0.28)] scale-[1.03]'
                                  : 'bg-[#FCF3EF] border-[#E5CFC7] opacity-65 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={opt.icon}
                                alt={opt.label}
                                className="w-6 h-6 object-contain"
                              />
                              <span className="text-[12.5px] font-extrabold text-[#6B4E45]">
                                {opt.id}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isCreating}
                      className="elza-buy-btn w-full h-[46px] rounded-full text-white font-bold text-[16px] flex items-center justify-center gap-2 cursor-pointer transition-all hover:brightness-[1.03] active:scale-[0.98] disabled:opacity-60"
                    >
                      <ImagePlus className="w-4 h-4" />
                      <span>{isCreating ? 'Публикация...' : 'Опубликовать товар'}</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Existing Products List */}
              <div>
                <h3 className="text-[17px] sm:text-[18.5px] font-extrabold text-[#6B4E45] mb-3">
                  Все товары в каталоге ({products.length})
                </h3>

                <div className="space-y-3">
                  {products.map((product, index) => {
                    const draft = drafts[product.id] || {
                      title: product.title,
                      price: String(product.price),
                      currency: product.currency,
                      image: product.image,
                      rarities: product.rarities ?? [],
                    };
                    const isSaving = savingId === product.id;
                    const isDeleting = deletingId === product.id;

                    return (
                      <div
                        key={product.id}
                        className="bg-white/95 border-2 border-[#9E6B56] shadow-[0_0_16px_rgba(148,90,66,0.26)] rounded-[22px] p-3.5 sm:p-4 flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center"
                      >
                        {/* Thumbnail + Upload */}
                        <div className="flex sm:flex-col items-center gap-2.5 sm:gap-1.5 shrink-0">
                          <div className="w-20 h-20 rounded-[14px] bg-[#FCF3EF] border border-[#EAD6CE] flex items-center justify-center overflow-hidden p-1">
                            <img
                              src={sanitizeImageUrl(draft.image)}
                              alt={draft.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <label className="px-3 h-[30px] rounded-full bg-[#FAF0EB] hover:bg-[#FADCE0] border border-[#DFC7BE] text-[#6B4E45] text-[12px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors">
                            <Upload className="w-3 h-3" />
                            <span>
                              {uploadingTarget === product.id ? '...' : 'Фото'}
                            </span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              className="sr-only"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) void handleFileUpload(f, product.id);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>

                        {/* Editable Fields */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <input
                              type="text"
                              value={draft.title}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [product.id]: {...draft, title: e.target.value},
                                }))
                              }
                              placeholder="Название товара"
                              maxLength={80}
                              className="sm:col-span-6 h-[40px] px-3 rounded-[12px] bg-[#FCF3EF] border border-[#E5CFC7] text-[#6B4E45] font-bold text-[14px] focus:outline-none focus:border-[#7D5E55]"
                            />
                            <input
                              type="number"
                              min={0}
                              max={1000000}
                              value={draft.price}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [product.id]: {...draft, price: e.target.value},
                                }))
                              }
                              placeholder="Цена"
                              className="sm:col-span-3 h-[40px] px-3 rounded-[12px] bg-[#FCF3EF] border border-[#E5CFC7] text-[#6B4E45] font-extrabold text-[14px] tabular-nums focus:outline-none focus:border-[#7D5E55]"
                            />
                            <input
                              type="text"
                              value={draft.currency}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [product.id]: {...draft, currency: e.target.value},
                                }))
                              }
                              placeholder="Валюта"
                              maxLength={16}
                              className="sm:col-span-3 h-[40px] px-3 rounded-[12px] bg-[#FCF3EF] border border-[#E5CFC7] text-[#6B4E45] font-bold text-[14px] focus:outline-none focus:border-[#7D5E55]"
                            />
                          </div>

                          <input
                            type="text"
                            value={draft.image}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [product.id]: {...draft, image: e.target.value},
                              }))
                            }
                            placeholder="Ссылка на фото (URL)"
                            maxLength={2048}
                            className="w-full h-[36px] px-3 rounded-[12px] bg-[#FCF3EF] border border-[#E5CFC7] text-[#7A5C53] font-semibold text-[12.5px] focus:outline-none focus:border-[#7D5E55]"
                          />

                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="text-[11.5px] font-bold text-[#8A6D64] mr-0.5">
                              Значки:
                            </span>
                            {PET_RARITY_OPTIONS.map((opt) => {
                              const selected = draft.rarities.includes(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() =>
                                    setDrafts((prev) => ({
                                      ...prev,
                                      [product.id]: {
                                        ...draft,
                                        rarities: toggleRarityList(draft.rarities, opt.id),
                                      },
                                    }))
                                  }
                                  aria-pressed={selected}
                                  title={opt.label}
                                  className={`h-[32px] px-2 rounded-[10px] border inline-flex items-center gap-1 cursor-pointer transition-all ${
                                    selected
                                      ? 'bg-[#FADCE0]/80 border-[#85523D] shadow-[0_1px_5px_rgba(138,77,52,0.24)]'
                                      : 'bg-[#FCF3EF] border-[#E5CFC7] opacity-60 hover:opacity-100'
                                  }`}
                                >
                                  <img
                                    src={opt.icon}
                                    alt={opt.label}
                                    className="w-[18px] h-[18px] object-contain"
                                  />
                                  <span className="text-[11.5px] font-extrabold text-[#6B4E45]">
                                    {opt.id}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex sm:flex-col gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => void handleSaveProduct(product, index)}
                            disabled={isSaving || isDeleting}
                            className="flex-1 sm:flex-initial h-[38px] px-4 rounded-full bg-[#7D5E55] hover:bg-[#6E5148] text-white text-[13.5px] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{isSaving ? '...' : 'Сохранить'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDeleteProduct(product)}
                            disabled={isSaving || isDeleting}
                            className="flex-1 sm:flex-initial h-[38px] px-4 rounded-full bg-[#FADCE0] hover:bg-[#F5C5CE] text-[#7A3E4A] text-[13.5px] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{isDeleting ? '...' : 'Удалить'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
