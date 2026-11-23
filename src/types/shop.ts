export type PetRarityBadge = 'M' | 'N' | 'F' | 'R';

export const PET_RARITY_OPTIONS: {
  id: PetRarityBadge;
  label: string;
  icon: string;
}[] = [
  {id: 'M', label: 'Mega (M)', icon: '/assets/badges/m.png'},
  {id: 'N', label: 'Neon (N)', icon: '/assets/badges/n.png'},
  {id: 'F', label: 'Fly (F)', icon: '/assets/badges/f.png'},
  {id: 'R', label: 'Ride (R)', icon: '/assets/badges/r.png'},
];

export interface ProductItem {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  currency: string;
  image: string;
  rarities?: PetRarityBadge[];
  sortOrder?: number;
  isPublished?: boolean;
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
}
