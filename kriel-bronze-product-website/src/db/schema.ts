import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull().default(""),
  image: text("image").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 200 }).notNull(),
  code: varchar("code", { length: 100 }).notNull().default(""),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  dims: varchar("dims", { length: 120 }).notNull().default(""),
  material: varchar("material", { length: 200 }).notNull().default(""),
  description: text("description").notNull().default(""),
  image: text("image").notNull().default(""),
  images: jsonb("images").notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  featuredOrder: integer("featured_order").notNull().default(0),
  customizable: boolean("customizable").notNull().default(false),
  active: boolean("active").notNull().default(true),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }), // "Ulje" % — null/0 = no discount
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Color/size options for a product — see supabase/setup.sql for the
// authoritative schema + RLS policies actually used at runtime (this file
// is kept only as a Drizzle-shaped reference of the data model).
export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  color: varchar("color", { length: 100 }).notNull().default(""),
  size: varchar("size", { length: 100 }).notNull().default(""),
  price: numeric("price", { precision: 10, scale: 2 }), // null = inherit product's price
  image: text("image").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 60 }).notNull(),
  address: text("address").notNull(),
  notes: text("notes").notNull().default(""),
  items: jsonb("items").notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 40 }).notNull().default("e_re"),
  emailSent: boolean("email_sent").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
