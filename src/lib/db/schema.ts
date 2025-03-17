import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { type InferModel } from "drizzle-orm";

// Определение таблицы категорий
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  parentId: integer("parent_id"),
  icon: varchar("icon", { length: 255 }),
});

// Определение отношений для категорий
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
}));

// Определение таблицы продуктов
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  categoryId: integer("category_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  brand: varchar("brand", { length: 255 }).notNull(),
  image: varchar("image", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Определение отношений для продуктов
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  characteristics: many(productCharacteristics),
}));

// Определение типов характеристик
export const characteristicsTypes = pgTable("characteristics_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
});

// Определение характеристик продуктов
export const productCharacteristics = pgTable("product_characteristics", {
  id: serial("id").primaryKey(),
  product_id: integer("product_id").notNull(),
  characteristic_type_id: integer("characteristic_type_id").notNull(),
  value: text("value").notNull(),
});

export const categoryFilterCharacteristics = pgTable(
  "category_filter_characteristics",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id").notNull(),
    characteristicTypeId: integer("characteristic_type_id").notNull(),
    position: integer("position"),
  }
);

// Определение отношений для характеристик продуктов
export const productCharacteristicsRelations = relations(
  productCharacteristics,
  ({ one }) => ({
    product: one(products, {
      fields: [productCharacteristics.product_id],
      references: [products.id],
    }),
    characteristicType: one(characteristicsTypes, {
      fields: [productCharacteristics.characteristic_type_id],
      references: [characteristicsTypes.id],
    }),
  })
);

// Таблица ролей
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
});

// Таблица пользователей
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  roleId: integer("role_id").references(() => roles.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Таблица профилей пользователей
export const userProfiles = pgTable(
  "user_profiles",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .unique(),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    phoneNumber: varchar("phone_number", { length: 20 }),
    city: varchar("city", { length: 100 }),
  },
  (table) => ({
    uniqueUserId: unique().on(table.userId),
  })
);

// Определение связей
export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

// Таблица избранного
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [favorites.productId],
    references: [products.id],
  }),
}));

// Типы для использования в приложении
export type Category = InferModel<typeof categories>;
export type Product = InferModel<typeof products>;
export type CharacteristicType = InferModel<typeof characteristicsTypes>;
export type ProductCharacteristic = InferModel<typeof productCharacteristics>;
export type Role = InferModel<typeof roles>;
export type User = InferModel<typeof users>;
export type UserProfile = InferModel<typeof userProfiles>;

// Типы для вставки
export type NewCategory = InferModel<typeof categories, "insert">;
export type NewProduct = InferModel<typeof products, "insert">;
export type NewCharacteristicType = InferModel<
  typeof characteristicsTypes,
  "insert"
>;
export type NewProductCharacteristic = InferModel<
  typeof productCharacteristics,
  "insert"
>;
export type NewRole = InferModel<typeof roles, "insert">;
export type NewUser = InferModel<typeof users, "insert">;
export type NewUserProfile = InferModel<typeof userProfiles, "insert">;
