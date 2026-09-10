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
  sizes: string[];
  colors: string[];
  variants: ProductVariant[];
  sortOrder: number;
  featured: boolean;
  featuredOrder: number;
  customizable: boolean;
  active: boolean;
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
