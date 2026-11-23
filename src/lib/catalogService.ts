import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {PET_RARITY_OPTIONS, PetRarityBadge, ProductItem} from '../types/shop';
import {
  OperationType,
  ensureAnonymousAuth,
  getCurrentUid,
  handleFirestoreError,
  resolveFirestoreContext,
} from './firebase';

const DEFAULT_PET_NAMES = [
  'Корова',
  'Единорог',
  'Котёнок',
  'Щенок',
  'Зайчик',
  'Панда',
  'Лисичка',
  'Дракончик',
];

export const DEFAULT_PRODUCTS: ProductItem[] = DEFAULT_PET_NAMES.map((title, index) => ({
  id: `pet-${index + 1}`,
  title,
  subtitle: 'Питомец Elza Shop',
  price: 299,
  currency: 'грн',
  image: '/assets/mystery-pet.png',
  rarities: [],
  sortOrder: index,
  isPublished: true,
}));

const VALID_RARITIES = new Set<PetRarityBadge>(PET_RARITY_OPTIONS.map((opt) => opt.id));
const SAFE_DATA_IMAGE_RE = /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/;
const MAX_DATA_IMAGE_LENGTH = 450000;

export function sanitizeRarities(raw: unknown): PetRarityBadge[] {
  if (!Array.isArray(raw)) return [];
  const picked = new Set<PetRarityBadge>();
  for (const item of raw) {
    if (typeof item === 'string' && VALID_RARITIES.has(item as PetRarityBadge)) {
      picked.add(item as PetRarityBadge);
    }
  }
  return PET_RARITY_OPTIONS.map((opt) => opt.id).filter((id) => picked.has(id));
}

export function sanitizeImageUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '/assets/mystery-pet.png';
  if (trimmed.startsWith('/assets/')) {
    return trimmed.slice(0, 2048);
  }
  if (trimmed.length <= MAX_DATA_IMAGE_LENGTH && SAFE_DATA_IMAGE_RE.test(trimmed)) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString().slice(0, 2048);
    }
  } catch {
    // Fallback below
  }
  return '/assets/mystery-pet.png';
}

function sanitizeProductId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
  return cleaned || `pet-${Date.now()}`;
}

export function subscribeToPublishedProducts(
  onData: (products: ProductItem[], isSeededInDb: boolean, usingCustomEnv: boolean) => void,
  onError?: (err: Error) => void,
): () => void {
  let isActive = true;
  let unsubscribeSnapshot: (() => void) | null = null;
  const path = 'products';

  void ensureAnonymousAuth()
    .catch(() => null)
    .then(() => {
      if (!isActive) return;
      const {db, usingCustomEnv} = resolveFirestoreContext();
      const productsRef = collection(db, path);
      const q = usingCustomEnv ? productsRef : query(productsRef, where('isPublished', '==', true));

      unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          if (!isActive) return;
          if (snapshot.empty) {
            onData(DEFAULT_PRODUCTS, false, usingCustomEnv);
            return;
          }
          const list: ProductItem[] = snapshot.docs
            .map((d, idx) => {
              const data = d.data();
              const numericPrice = Number(data.price);
              return {
                id: d.id,
                title: typeof data.title === 'string' && data.title.trim() ? data.title : 'Товар',
                subtitle: typeof data.subtitle === 'string' ? data.subtitle : '',
                price: Number.isFinite(numericPrice) && numericPrice >= 0 ? numericPrice : 299,
                currency:
                  typeof data.currency === 'string' && data.currency.trim()
                    ? data.currency
                    : 'грн',
                image: sanitizeImageUrl(typeof data.image === 'string' ? data.image : ''),
                rarities: sanitizeRarities(data.rarities),
                sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : idx,
                isPublished: data.isPublished !== false,
              };
            })
            .filter((item) => item.isPublished !== false);

          list.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
          onData(list, true, usingCustomEnv);
        },
        (error) => {
          if (!isActive) return;
          try {
            handleFirestoreError(error, OperationType.LIST, path);
          } catch (wrapped) {
            if (onError && wrapped instanceof Error) {
              onError(wrapped);
            }
          }
        },
      );
    });

  return () => {
    isActive = false;
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
    }
  };
}

export async function seedDefaultProductsIfEmpty(): Promise<void> {
  const path = 'products';
  try {
    await ensureAnonymousAuth().catch(() => null);
    const {db} = resolveFirestoreContext();
    const uid = getCurrentUid() || 'admin';
    const batch = writeBatch(db);
    DEFAULT_PRODUCTS.forEach((p, idx) => {
      const ref = doc(db, path, p.id);
      batch.set(ref, {
        title: p.title.slice(0, 80),
        subtitle: p.subtitle.slice(0, 140),
        price: Math.max(0, Math.min(1000000, Number(p.price) || 0)),
        currency: p.currency.slice(0, 16),
        image: sanitizeImageUrl(p.image),
        rarities: [],
        sortOrder: idx,
        isPublished: true,
        createdBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createProductInFirestore(input: {
  title: string;
  subtitle?: string;
  price: number;
  currency: string;
  image: string;
  rarities?: PetRarityBadge[];
  sortOrder: number;
}): Promise<string> {
  const id = sanitizeProductId(`pet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const path = `products/${id}`;
  try {
    await ensureAnonymousAuth().catch(() => null);
    const {db} = resolveFirestoreContext();
    const uid = getCurrentUid() || 'admin';
    await setDoc(doc(db, 'products', id), {
      title: input.title.trim().slice(0, 80) || 'Новый товар',
      subtitle: (input.subtitle || '').trim().slice(0, 140),
      price: Math.max(0, Math.min(1000000, Number(input.price) || 0)),
      currency: input.currency.trim().slice(0, 16) || 'грн',
      image: sanitizeImageUrl(input.image),
      rarities: sanitizeRarities(input.rarities),
      sortOrder: Math.max(0, Math.min(10000, Math.floor(input.sortOrder))),
      isPublished: true,
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProductInFirestore(
  id: string,
  updates: {
    title: string;
    subtitle?: string;
    price: number;
    currency: string;
    image: string;
    rarities?: PetRarityBadge[];
    sortOrder: number;
  },
): Promise<void> {
  const safeId = sanitizeProductId(id);
  const path = `products/${safeId}`;
  try {
    await ensureAnonymousAuth().catch(() => null);
    const {db} = resolveFirestoreContext();
    await updateDoc(doc(db, 'products', safeId), {
      title: updates.title.trim().slice(0, 80) || 'Товар',
      subtitle: (updates.subtitle || '').trim().slice(0, 140),
      price: Math.max(0, Math.min(1000000, Number(updates.price) || 0)),
      currency: updates.currency.trim().slice(0, 16) || 'грн',
      image: sanitizeImageUrl(updates.image),
      rarities: sanitizeRarities(updates.rarities),
      sortOrder: Math.max(0, Math.min(10000, Math.floor(updates.sortOrder))),
      isPublished: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProductInFirestore(id: string): Promise<void> {
  const safeId = sanitizeProductId(id);
  const path = `products/${safeId}`;
  try {
    await ensureAnonymousAuth().catch(() => null);
    const {db} = resolveFirestoreContext();
    await deleteDoc(doc(db, 'products', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
