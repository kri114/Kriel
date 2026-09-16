import * as actions from "./actions";
import type {
  Category,
  Order,
  OrderItemPayload,
  OrderStatus,
  Product,
  ProductVariant,
} from "./types";

export const fetchCategories = actions.fetchCategories;
export const fetchProducts = actions.fetchProducts;
export const fetchOrders = actions.fetchOrders;

export type CategoryInput = any;
export const createCategory = actions.createCategory;
export const updateCategory = actions.updateCategory;
export const deleteCategory = actions.deleteCategory;

export type ProductInput = any;
export const createProduct = actions.createProduct;
export const updateProduct = actions.updateProduct;
export const deleteProduct = actions.deleteProduct;
export const deleteProducts = actions.deleteProducts;

export type NewOrderPayload = any;
export const createOrder = actions.createOrder;
export const updateOrderStatus = actions.updateOrderStatus;
export const deleteOrder = actions.deleteOrder;

export const getAdminSession = actions.getAdminSession;
export const signInAdmin = actions.signInAdmin;
export const signOutAdmin = actions.signOutAdmin;

export function onAdminAuthChange(
  callback: (session: any) => void
): () => void {
  actions.getAdminSession().then(callback);
  return () => {};
}
