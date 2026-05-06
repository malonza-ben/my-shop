import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  clearCart,
  createMpesaTransaction,
  createOrder,
  createOrderItems,
  getAllCategories,
  getAllOrders,
  getAllProductsAdmin,
  getCartItems,
  getMpesaTransactionByOrderId,
  getOrderById,
  getOrderByNumber,
  getOrderItems,
  getOrdersByUserId,
  getProducts,
  getProductBySlug,
  getProductById,
  removeCartItem,
  updateCartItem,
  updateMpesaTransaction,
  updateOrderStatus,
  updateProduct,
  createProduct,
  deleteProduct,
  createCategory,
  updateCategory,
  countProducts,
  countOrders,
  upsertCartItem,
} from "./db";
import { initiateStkPush, queryStkStatus } from "./mpesa";

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toSlug(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function generateOrderNumber(): string {
  return "SB" + Date.now().toString(36).toUpperCase() + nanoid(4).toUpperCase();
}

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  categories: router({
    list: publicProcedure.query(() => getAllCategories()),
  }),

  products: router({
    list: publicProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        search: z.string().optional(),
        featured: z.boolean().optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional())
      .query(({ input }) => getProducts(input ?? {})),

    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const product = await getProductBySlug(input.slug);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        return product;
      }),

    adminList: adminProcedure
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }).optional())
      .query(({ input }) => getAllProductsAdmin(input ?? {})),

    adminCreate: adminProcedure
      .input(z.object({
        categoryId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        specifications: z.record(z.string(), z.string()).optional(),
        price: z.string(),
        originalPrice: z.string().optional(),
        stock: z.number().min(0),
        imageUrl: z.string().optional(),
        images: z.array(z.string()).optional(),
        featured: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const slug = toSlug(input.name) + "-" + nanoid(6).toLowerCase();
        await createProduct({
          ...input,
          slug,
          specifications: input.specifications ?? null,
          images: input.images ?? null,
          featured: input.featured ?? false,
        });
        return { success: true };
      }),

    adminUpdate: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        specifications: z.record(z.string(), z.string()).optional(),
        price: z.string().optional(),
        originalPrice: z.string().optional().nullable(),
        stock: z.number().min(0).optional(),
        imageUrl: z.string().optional().nullable(),
        images: z.array(z.string()).optional().nullable(),
        featured: z.boolean().optional(),
        active: z.boolean().optional(),
        categoryId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateProduct(id, data as Parameters<typeof updateProduct>[1]);
        return { success: true };
      }),

    adminDelete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteProduct(input.id);
        return { success: true };
      }),

    adminStats: adminProcedure.query(async () => {
      const [productCount, orderCount] = await Promise.all([countProducts(), countOrders()]);
      return { productCount, orderCount };
    }),
  }),

  cart: router({
    get: protectedProcedure.query(async ({ ctx }) => getCartItems(ctx.user.id)),

    add: protectedProcedure
      .input(z.object({ productId: z.number(), quantity: z.number().min(1).default(1) }))
      .mutation(async ({ ctx, input }) => {
        const product = await getProductById(input.productId);
        if (!product || !product.active) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        if (product.stock < input.quantity) throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient stock" });
        await upsertCartItem({ userId: ctx.user.id, productId: input.productId, quantity: input.quantity });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), quantity: z.number().min(1) }))
      .mutation(async ({ ctx, input }) => {
        await updateCartItem(input.id, ctx.user.id, input.quantity);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await removeCartItem(input.id, ctx.user.id);
        return { success: true };
      }),

    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await clearCart(ctx.user.id);
      return { success: true };
    }),
  }),

  orders: router({
    myOrders: protectedProcedure.query(async ({ ctx }) => getOrdersByUserId(ctx.user.id)),

    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await getOrderById(input.id);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        if (order.userId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const items = await getOrderItems(order.id);
        return { ...order, items };
      }),

    create: protectedProcedure
      .input(z.object({
        shippingAddress: z.object({
          fullName: z.string(),
          phone: z.string(),
          address: z.string(),
          city: z.string(),
          county: z.string(),
        }),
        customerPhone: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const cartData = await getCartItems(ctx.user.id);
        if (cartData.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Cart is empty" });

        const totalAmount = cartData.reduce((sum, item) => {
          return sum + parseFloat(String(item.product.price)) * item.quantity;
        }, 0);

        const orderNumber = generateOrderNumber();
        await createOrder({
          userId: ctx.user.id,
          orderNumber,
          totalAmount: totalAmount.toFixed(2),
          shippingAddress: input.shippingAddress,
          customerPhone: input.customerPhone,
          customerName: input.shippingAddress.fullName,
          notes: input.notes,
          status: "pending",
        });

        const order = await getOrderByNumber(orderNumber);
        if (!order) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await createOrderItems(cartData.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          productName: item.product.name,
          productImage: item.product.imageUrl,
          quantity: item.quantity,
          unitPrice: String(item.product.price),
          subtotal: (parseFloat(String(item.product.price)) * item.quantity).toFixed(2),
        })));

        await clearCart(ctx.user.id);
        return { orderId: order.id, orderNumber };
      }),

    adminList: adminProcedure
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }).optional())
      .query(({ input }) => getAllOrders(input ?? {})),

    adminUpdateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending","payment_initiated","paid","processing","shipped","delivered","cancelled","refunded"]),
      }))
      .mutation(async ({ input }) => {
        await updateOrderStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  mpesa: router({
    initiatePayment: protectedProcedure
      .input(z.object({ orderId: z.number(), phoneNumber: z.string().min(9) }))
      .mutation(async ({ ctx, input }) => {
        const order = await getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        if (order.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        if (order.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Order is not pending" });

        const callbackUrl = `${process.env.APP_URL || "https://sunbox.manus.space"}/api/mpesa/callback`;

        let stkResponse;
        try {
          stkResponse = await initiateStkPush({
            phoneNumber: input.phoneNumber,
            amount: parseFloat(String(order.totalAmount)),
            orderId: order.id,
            orderNumber: order.orderNumber,
            callbackUrl,
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "M-Pesa request failed";
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
        }

        if (stkResponse.ResponseCode !== "0") {
          throw new TRPCError({ code: "BAD_REQUEST", message: stkResponse.ResponseDescription || "STK push failed" });
        }

        await createMpesaTransaction({
          orderId: order.id,
          checkoutRequestId: stkResponse.CheckoutRequestID,
          merchantRequestId: stkResponse.MerchantRequestID,
          phoneNumber: input.phoneNumber,
          amount: String(order.totalAmount),
          status: "pending",
        });

        await updateOrderStatus(order.id, "payment_initiated");
        return { checkoutRequestId: stkResponse.CheckoutRequestID, customerMessage: stkResponse.CustomerMessage };
      }),

    checkStatus: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        if (order.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

        const tx = await getMpesaTransactionByOrderId(input.orderId);
        if (!tx) return { status: "not_initiated", orderStatus: order.status, receiptNumber: null };

        if (["success", "failed", "cancelled", "timeout"].includes(tx.status)) {
          return { status: tx.status, orderStatus: order.status, receiptNumber: tx.mpesaReceiptNumber };
        }

        try {
          const queryResult = await queryStkStatus(tx.checkoutRequestId!);
          if (queryResult.ResultCode === "0") {
            await updateMpesaTransaction(tx.checkoutRequestId!, { status: "success" });
            await updateOrderStatus(order.id, "paid");
            return { status: "success", orderStatus: "paid", receiptNumber: null };
          } else if (queryResult.ResultCode === "1032") {
            await updateMpesaTransaction(tx.checkoutRequestId!, { status: "cancelled", resultCode: queryResult.ResultCode, resultDesc: queryResult.ResultDesc });
            await updateOrderStatus(order.id, "cancelled");
            return { status: "cancelled", orderStatus: "cancelled", receiptNumber: null };
          } else if (queryResult.ResultCode) {
            await updateMpesaTransaction(tx.checkoutRequestId!, { status: "failed", resultCode: queryResult.ResultCode, resultDesc: queryResult.ResultDesc });
            return { status: "failed", orderStatus: order.status, receiptNumber: null };
          }
        } catch { /* still pending */ }

        return { status: tx.status, orderStatus: order.status, receiptNumber: tx.mpesaReceiptNumber };
      }),
  }),

  adminCategories: router({
    create: adminProcedure
      .input(z.object({ name: z.string().min(1), description: z.string().optional(), icon: z.string().optional(), imageUrl: z.string().optional() }))
      .mutation(async ({ input }) => {
        await createCategory({ ...input, slug: toSlug(input.name) });
        return { success: true };
      }),

    update: adminProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), description: z.string().optional(), icon: z.string().optional(), imageUrl: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateCategory(id, data);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
