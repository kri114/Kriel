export type Category = {
  id: number;
  slug: string;
  name: string;
  description: string;
  image: string;
  sortOrder: number;
};

export type Product = {
  id: number;
  categoryId: number | null;
  name: string;
  code: string;
  price: number;
  dims: string;
  material: string;
  description: string;
  image: string;
  images: string[];
  sortOrder: number;
  featured: boolean;
  featuredOrder: number;
  customizable: boolean;
  active: boolean;
  /** Sale/"Ulje" percentage (0-100). null/0 = no discount, not on offer. */
  discountPercent: number | null;
};

/**
 * A single color/size option for a product. `price` overrides the
 * product's base price when set (null = inherit the base price).
 * A product can have any combination of variants: only sizes, only
 * colors, or both (each color can have its own set of sizes).
 */
export type ProductVariant = {
  id: number;
  productId: number;
  color: string;
  size: string;
  price: number | null;
  image: string;
  sortOrder: number;
};

export type CartItem = {
  key: string;
  productId: number;
  name: string;
  code: string;
  price: number;
  image: string;
  color: string;
  size: string;
  qty: number;
  customText: string;
};

export type OrderItemPayload = {
  productId: number;
  name: string;
  code: string;
  price: number;
  color: string;
  size: string;
  qty: number;
  customText: string;
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
