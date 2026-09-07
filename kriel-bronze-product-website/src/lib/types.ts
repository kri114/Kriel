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
};

export type OrderItemPayload = {
  productId: number;
  name: string;
  code: string;
  price: number;
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
