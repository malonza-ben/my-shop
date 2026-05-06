import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  cartItems,
  categories,
  InsertCartItem,
  InsertCategory,
  InsertMpesaTransaction,
  InsertOrder,
  InsertOrderItem,
  InsertProduct,
  InsertUser,
  mpesaTransactions,
  orderItems,
  orders,
  products,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod", "phone"] as const;
  for (const field of textFields) {
    const value = user[field as keyof InsertUser];
    if (value === undefined) continue;
    const normalized = value ?? null;
    (values as Record<string, unknown>)[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Categories ───────────────────────────────────────────────────────────────
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.name);
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result[0];
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(categories).values(data);
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.delete(categories).where(eq(categories.id, id));
}

// ─── Products ─────────────────────────────────────────────────────────────────
export async function getProducts(opts?: {
  categoryId?: number;
  search?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(products.active, true)];
  if (opts?.categoryId) conditions.push(eq(products.categoryId, opts.categoryId));
  if (opts?.featured !== undefined) conditions.push(eq(products.featured, opts.featured));
  if (opts?.search) {
    const searchCond = or(
      like(products.name, `%${opts.search}%`),
      like(products.description, `%${opts.search}%`)
    );
    if (searchCond) conditions.push(searchCond);
  }

  return db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.createdAt))
    .limit(opts?.limit ?? 50)
    .offset(opts?.offset ?? 0);
}

export async function getAllProductsAdmin(opts?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt))
    .limit(opts?.limit ?? 100)
    .offset(opts?.offset ?? 0);
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return result[0];
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(products).values(data);
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(products).set({ active: false }).where(eq(products.id, id));
}

export async function countProducts() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(products);
  return Number(result[0]?.count ?? 0);
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: cartItems.id,
      userId: cartItems.userId,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      createdAt: cartItems.createdAt,
      updatedAt: cartItems.updatedAt,
      product: products,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, userId));
}

export async function upsertCartItem(data: InsertCartItem) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, data.userId!), eq(cartItems.productId, data.productId!)))
    .limit(1);

  if (existing[0]) {
    return db
      .update(cartItems)
      .set({ quantity: existing[0].quantity + (data.quantity ?? 1) })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    return db.insert(cartItems).values(data);
  }
}

export async function updateCartItem(id: number, userId: number, quantity: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db
    .update(cartItems)
    .set({ quantity })
    .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
}

export async function removeCartItem(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(orders).values(data);
}

export async function createOrderItems(items: InsertOrderItem[]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(orderItems).values(items);
}

export async function getOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
}

export async function getOrderByNumber(orderNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  return result[0];
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function updateOrderStatus(
  id: number,
  status: "pending" | "payment_initiated" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(orders).set({ status }).where(eq(orders.id, id));
}

export async function getAllOrders(opts?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(opts?.limit ?? 100)
    .offset(opts?.offset ?? 0);
}

export async function countOrders() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(orders);
  return Number(result[0]?.count ?? 0);
}

// ─── M-Pesa Transactions ──────────────────────────────────────────────────────
export async function createMpesaTransaction(data: InsertMpesaTransaction) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(mpesaTransactions).values(data);
}

export async function getMpesaTransactionByCheckoutId(checkoutRequestId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(mpesaTransactions)
    .where(eq(mpesaTransactions.checkoutRequestId, checkoutRequestId))
    .limit(1);
  return result[0];
}

export async function getMpesaTransactionByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(mpesaTransactions)
    .where(eq(mpesaTransactions.orderId, orderId))
    .orderBy(desc(mpesaTransactions.createdAt))
    .limit(1);
  return result[0];
}

export async function updateMpesaTransaction(
  checkoutRequestId: string,
  data: Partial<InsertMpesaTransaction>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db
    .update(mpesaTransactions)
    .set(data)
    .where(eq(mpesaTransactions.checkoutRequestId, checkoutRequestId));
}
