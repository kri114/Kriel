import { boolean, integer, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

// ── Kategoritë e produkteve (të menaxhueshme nga paneli i adminit) ──
export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  cover: text("cover").notNull().default(""),
  sort: integer("sort").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Produktet e katalogut ──
export const products = pgTable("products", {
  id: text("id").primaryKey(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: text("code").notNull().default(""),
  price: real("price").notNull().default(0),
  dims: text("dims").notNull().default(""),
  mat: text("mat").notNull().default(""),
  img: text("img").notNull().default(""),
  // "Më të pëlqyerat" — shfaqen në krye të faqes
  featured: boolean("featured").notNull().default(false),
  featuredOrder: integer("featured_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
