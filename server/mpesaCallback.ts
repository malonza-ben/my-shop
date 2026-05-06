import type { Express, Request, Response } from "express";
import { getDb } from "./db";
import { mpesaTransactions, orders } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * M-Pesa Daraja STK Push Callback Handler
 * Safaricom POSTs to this endpoint after payment processing.
 * Payload: { Body: { stkCallback: { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata? } } }
 */
export function registerMpesaCallbackRoute(app: Express) {
  app.post("/api/mpesa/callback", async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        Body?: {
          stkCallback?: {
            MerchantRequestID?: string;
            CheckoutRequestID?: string;
            ResultCode?: number;
            ResultDesc?: string;
            CallbackMetadata?: {
              Item?: Array<{ Name: string; Value?: string | number }>;
            };
          };
        };
      };

      const callback = body?.Body?.stkCallback;
      if (!callback) {
        console.warn("[M-Pesa Callback] Invalid payload received:", JSON.stringify(body));
        return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
      }

      const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

      if (!CheckoutRequestID) {
        console.warn("[M-Pesa Callback] Missing CheckoutRequestID");
        return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
      }

      const db = await getDb();
      if (!db) {
        console.error("[M-Pesa Callback] Database unavailable");
        return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
      }

      // Find the transaction
      const txRows = await db
        .select()
        .from(mpesaTransactions)
        .where(eq(mpesaTransactions.checkoutRequestId, CheckoutRequestID))
        .limit(1);

      if (!txRows.length) {
        console.warn("[M-Pesa Callback] Transaction not found for CheckoutRequestID:", CheckoutRequestID);
        return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
      }

      const tx = txRows[0];

      // Idempotency: skip if already processed
      if (tx.status === "success" || tx.status === "failed" || tx.status === "cancelled") {
        console.log("[M-Pesa Callback] Transaction already processed:", CheckoutRequestID);
        return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
      }

      if (ResultCode === 0) {
        // Payment successful - extract metadata
        const items = CallbackMetadata?.Item ?? [];
        const getMeta = (name: string) => items.find((i) => i.Name === name)?.Value;
        const receiptNumber = String(getMeta("MpesaReceiptNumber") ?? "");
        const amount = String(getMeta("Amount") ?? tx.amount);
        const phoneNumber = String(getMeta("PhoneNumber") ?? tx.phoneNumber ?? "");

        await db
          .update(mpesaTransactions)
          .set({
            status: "success",
            mpesaReceiptNumber: receiptNumber || null,
            amount,
            phoneNumber: phoneNumber || tx.phoneNumber,
            updatedAt: new Date(),
          })
          .where(eq(mpesaTransactions.checkoutRequestId, CheckoutRequestID));

        // Update the order to paid
        await db
          .update(orders)
          .set({ status: "paid", updatedAt: new Date() })
          .where(eq(orders.id, tx.orderId));

        console.log(`[M-Pesa Callback] ✅ Payment SUCCESS for order ${tx.orderId}, receipt: ${receiptNumber}`);
      } else {
        // Payment failed or cancelled
        const status = ResultCode === 1032 ? "cancelled" : "failed";

        await db
          .update(mpesaTransactions)
          .set({
            status,
            resultCode: ResultCode != null ? String(ResultCode) : null,
            resultDesc: ResultDesc ?? null,
            updatedAt: new Date(),
          })
          .where(eq(mpesaTransactions.checkoutRequestId, CheckoutRequestID));

        // Revert order to pending on cancellation
        if (status === "cancelled") {
          await db
            .update(orders)
            .set({ status: "pending", updatedAt: new Date() })
            .where(eq(orders.id, tx.orderId));
        }

        console.log(`[M-Pesa Callback] ❌ Payment ${status} for order ${tx.orderId}: ${ResultDesc}`);
      }

      // Always respond 200 to Safaricom
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    } catch (err) {
      console.error("[M-Pesa Callback] Error processing callback:", err);
      // Always respond 200 to prevent Safaricom retries
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    }
  });
}
