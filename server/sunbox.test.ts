import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Test Helpers ──────────────────────────────────────────────────────────────

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createUserContext(overrides?: Partial<TrpcContext["user"]>): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-openid",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return createUserContext({ role: "admin", id: 99, openId: "admin-openid" });
}

// ─── Auth Tests ────────────────────────────────────────────────────────────────

describe("auth", () => {
  it("returns null user for unauthenticated request", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });

  it("returns user for authenticated request", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const user = await caller.auth.me();
    expect(user).not.toBeNull();
    expect(user?.email).toBe("test@example.com");
    expect(user?.role).toBe("user");
  });

  it("clears session cookie on logout", async () => {
    const clearedCookies: string[] = [];
    const ctx: TrpcContext = {
      user: createUserContext().user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string) => clearedCookies.push(name),
      } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies.length).toBeGreaterThan(0);
  });
});

// ─── Categories Tests ──────────────────────────────────────────────────────────

describe("categories", () => {
  it("returns a list of categories (public)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const cats = await caller.categories.list();
    // May be empty in test env but should be an array
    expect(Array.isArray(cats)).toBe(true);
  });
});

// ─── Products Tests ────────────────────────────────────────────────────────────

describe("products", () => {
  it("returns a list of products (public)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.products.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns featured products when filter applied", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.products.list({ featured: true });
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws NOT_FOUND for unknown product slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.products.bySlug({ slug: "this-product-does-not-exist-xyz" })
    ).rejects.toThrow();
  });

  it("blocks non-admin from accessing adminList", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.products.adminList({})).rejects.toThrow();
  });

  it("allows admin to access adminList", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.products.adminList({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("blocks non-admin from creating products", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.products.adminCreate({
        categoryId: 1,
        name: "Test Product",
        price: "1000",
        stock: 5,
      })
    ).rejects.toThrow();
  });

  it("returns admin stats for admin user", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const stats = await caller.products.adminStats();
    expect(stats).toHaveProperty("productCount");
    expect(stats).toHaveProperty("orderCount");
  });
});

// ─── Cart Tests ────────────────────────────────────────────────────────────────

describe("cart", () => {
  it("throws UNAUTHORIZED for unauthenticated cart access", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.cart.get()).rejects.toThrow();
  });

  it("returns cart items for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const items = await caller.cart.get();
    expect(Array.isArray(items)).toBe(true);
  });

  it("throws UNAUTHORIZED for unauthenticated cart update", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.cart.update({ id: 1, quantity: 2 })).rejects.toThrow();
  });

  it("throws UNAUTHORIZED for unauthenticated cart remove", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.cart.remove({ id: 1 })).rejects.toThrow();
  });
});

// ─── Orders Tests ──────────────────────────────────────────────────────────────

describe("orders", () => {
  it("throws UNAUTHORIZED for unauthenticated order access", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.orders.myOrders()).rejects.toThrow();
  });

  it("returns orders for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const orders = await caller.orders.myOrders();
    expect(Array.isArray(orders)).toBe(true);
  });

  it("blocks non-admin from accessing admin order list", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.orders.adminList({ limit: 10 })).rejects.toThrow();
  });

  it("allows admin to access admin order list", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const orders = await caller.orders.adminList({ limit: 10 });
    expect(Array.isArray(orders)).toBe(true);
  });
});

// ─── Role-Based Access Control Tests ──────────────────────────────────────────

describe("RBAC", () => {
  it("user role cannot delete products", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.products.adminDelete({ id: 999 })).rejects.toThrow();
  });

  it("admin role can access admin stats", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const stats = await caller.products.adminStats();
    expect(typeof stats.productCount).toBe("number");
    expect(typeof stats.orderCount).toBe("number");
  });

  it("user cannot update order status", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.orders.adminUpdateStatus({ id: 1, status: "shipped" })
    ).rejects.toThrow();
  });

  it("admin can update order status", async () => {
    // This will fail if order 999 doesn't exist, but should not throw FORBIDDEN
    const caller = appRouter.createCaller(createAdminContext());
    // It may throw NOT_FOUND but not FORBIDDEN
    try {
      await caller.orders.adminUpdateStatus({ id: 999, status: "shipped" });
    } catch (err: unknown) {
      const trpcErr = err as { code?: string };
      expect(trpcErr.code).not.toBe("FORBIDDEN");
    }
  });
});
