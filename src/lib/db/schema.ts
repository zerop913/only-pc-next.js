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
  name: text("name").notNull(),
  slug: text("slug").notNull(),
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
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }),
  lastLoginAt: timestamp("last_login_at", {
    withTimezone: true,
    mode: "string",
  }),
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

// Таблица сборок ПК
export const pcBuilds = pgTable("pc_builds", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  components: text("components").notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Добавляем отношения для сборок
export const pcBuildsRelations = relations(pcBuilds, ({ one }) => ({
  user: one(users, {
    fields: [pcBuilds.userId],
    references: [users.id],
  }),
}));

// Таблица несовместимостей компонентов
export const componentIncompatibility = pgTable("component_incompatibility", {
  id: serial("id").primaryKey(),
  component1_id: integer("component1_id")
    .notNull()
    .references(() => products.id),
  component2_id: integer("component2_id")
    .notNull()
    .references(() => products.id),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Таблица правил совместимости
export const compatibilityRules = pgTable("compatibility_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Таблица категорий правил совместимости
export const compatibilityRuleCategories = pgTable(
  "compatibility_rule_categories",
  {
    id: serial("id").primaryKey(),
    ruleId: integer("rule_id")
      .references(() => compatibilityRules.id, { onDelete: "cascade" })
      .notNull(),
    primaryCategoryId: integer("primary_category_id")
      .references(() => categories.id, { onDelete: "cascade" })
      .notNull(),
    secondaryCategoryId: integer("secondary_category_id")
      .references(() => categories.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }
);

// Таблица правил характеристик для совместимости
export const compatibilityRuleCharacteristics = pgTable(
  "compatibility_rule_characteristics",
  {
    id: serial("id").primaryKey(),
    ruleId: integer("rule_id")
      .references(() => compatibilityRules.id, { onDelete: "cascade" })
      .notNull(),
    primaryCharacteristicId: integer("primary_characteristic_id")
      .references(() => characteristicsTypes.id, { onDelete: "cascade" })
      .notNull(),
    secondaryCharacteristicId: integer("secondary_characteristic_id")
      .references(() => characteristicsTypes.id, { onDelete: "cascade" })
      .notNull(),
    comparisonType: varchar("comparison_type", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }
);

// Таблица значений для проверки совместимости
export const compatibilityValues = pgTable("compatibility_values", {
  id: serial("id").primaryKey(),
  ruleCharacteristicId: integer("rule_characteristic_id")
    .references(() => compatibilityRuleCharacteristics.id, {
      onDelete: "cascade",
    })
    .notNull(),
  primaryValue: text("primary_value").notNull(),
  secondaryValue: text("secondary_value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Таблица результатов проверки совместимости сборки
export const compatibilityCheckResults = pgTable(
  "compatibility_check_results",
  {
    id: serial("id").primaryKey(),
    buildId: integer("build_id")
      .notNull()
      .references(() => pcBuilds.id),
    isCompatible: boolean("is_compatible").default(true),
    issues: text("issues"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }
);

export const compatibilityCheckResultsRelations = relations(
  compatibilityCheckResults,
  ({ one }) => ({
    build: one(pcBuilds, {
      fields: [compatibilityCheckResults.buildId],
      references: [pcBuilds.id],
    }),
  })
);

// Типы для использования в приложении
export type Category = InferModel<typeof categories>;
export type Product = InferModel<typeof products>;
export type CharacteristicType = InferModel<typeof characteristicsTypes>;
export type ProductCharacteristic = InferModel<typeof productCharacteristics>;
export type Role = InferModel<typeof roles>;
export type User = InferModel<typeof users>;
export type UserProfile = InferModel<typeof userProfiles>;
export type PcBuild = InferModel<typeof pcBuilds>;
export type CompatibilityRule = InferModel<typeof compatibilityRules>;
export type CompatibilityCheckResult = InferModel<
  typeof compatibilityCheckResults
>;

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
export type NewPcBuild = InferModel<typeof pcBuilds, "insert">;
export type NewCompatibilityRule = InferModel<
  typeof compatibilityRules,
  "insert"
>;
export type NewCompatibilityCheckResult = InferModel<
  typeof compatibilityCheckResults,
  "insert"
>;
