export type Category = {
  id: number;
  slug: string;
  name: string;
  description: string;
  image: string;
  sortOrder: number;
};

/** A priced color×size combination. Empty string = "standard" dimension. */
export type ProductVariant = {
  color: string;
  size: string;
  price: number;
  code?: string;
  /** Price per character for custom text (Feature 1). 0 = no per-char pricing */
  pricePerChar?: number;
};

/**
 * Color-specific image set (Feature 3).
 * colorImages maps color name → array of image URLs.
 */
export type Product = {
  id: number;
  categoryId: number | null;
  name: string;
  code: string;
  colorCodes?: Record<string, string>;
  /** colorImages: { "Black": ["url1","url2"], "Gold": ["url3"] } */
  colorImages?: Record<string, string[]>;
  price: number;
  dims: string;
  material: string;
  description: string;
  image: string;
  images: string[];
  sizes: string[];
  colors: string[];
  variants: ProductVariant[];
  salePct: number;
  sortOrder: number;
  featured: boolean;
  featuredOrder: number;
  customizable: boolean;
  /** Price per character for products without variants (Feature 1). 0 = no per-char pricing */
  pricePerChar?: number;
  active: boolean;
  setName?: string | null;
  setNames: string[];
};

export type CartItem = {
  productId: number;
  name: string;
  code: string;
  price: number;
  image: string;
  qty: number;
  customText: string;
  size: string;
  color: string;
};

export type OrderItemPayload = {
  productId: number;
  name: string;
  code: string;
  price: number;
  qty: number;
  customText: string;
  size: string;
  color: string;
};

export type OrderStatus = "e_re" | "konfirmuar" | "perfunduar" | "anulluar";

export type Order = {
  id: number;
  customerName: string;
  phone: string;
  address: string;
  notes: string;
  items: OrderItemPayload[];
  total: number;
  status: OrderStatus;
  emailSent: boolean;
  createdAt: string;
};
