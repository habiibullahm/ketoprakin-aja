import { pgTable, serial, text, integer, decimal, timestamp, boolean, varchar } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Users table (merchant/admin)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: text("password").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("merchant").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Menu items
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // ketoprak, topping, minuman
  image: text("image"),
  available: boolean("available").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).unique().notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }),
  orderType: varchar("order_type", { length: 20 }).notNull(), // dine-in, pickup
  status: varchar("status", { length: 50 }).default("menunggu").notNull(), // menunggu, nguleg, siap-diambil, selesai
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // qris, gopay, ovo, dana, cash
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending").notNull(), // pending, paid, failed
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Order items (many-to-many with menu)
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  menuId: integer("menu_id").references(() => menuItems.id).notNull(),
  quantity: integer("quantity").notNull(),
  spiceLevel: integer("spice_level").default(5).notNull(), // 0-20
  garlicAmount: varchar("garlic_amount", { length: 20 }).default("normal").notNull(), // sedikit, normal, banyak
  sauceConsistency: varchar("sauce_consistency", { length: 20 }).default("pas").notNull(), // encer, pas, kental
  toppings: text("toppings"), // JSON string of topping names
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Expenses
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 50 }).notNull(), // bahan-baku, gas, plastik, lainnya
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Debts (kasbon)
export const debts = pgTable("debts", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paid: boolean("paid").default(false).notNull(),
  note: text("note"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type MenuItem = typeof menuItems.$inferSelect
export type NewMenuItem = typeof menuItems.$inferInsert
export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert
export type Expense = typeof expenses.$inferSelect
export type NewExpense = typeof expenses.$inferInsert
export type Debt = typeof debts.$inferSelect
export type NewDebt = typeof debts.$inferInsert

// Relations
export const ordersRelations = relations(orders, ({ many }) => ({
  orderItems: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuId],
    references: [menuItems.id],
  }),
}))

export const menuItemsRelations = relations(menuItems, ({ many }) => ({
  orderItems: many(orderItems),
}))
