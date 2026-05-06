import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { registerMpesaCallbackRoute } from "./mpesaCallback";
import * as dbModule from "./db";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(),
  mpesaTransactions: { checkoutRequestId: "checkoutRequestId", status: "status", orderId: "orderId", amount: "amount", phoneNumber: "phoneNumber", mpesaReceiptNumber: "mpesaReceiptNumber", updatedAt: "updatedAt", resultCode: "resultCode", resultDesc: "resultDesc" },
  orders: { id: "id", status: "status", updatedAt: "updatedAt" },
}));

describe("M-Pesa Callback Handler", () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    registerMpesaCallbackRoute(app);
    vi.resetAllMocks();
  });

  it("should handle a successful payment callback", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{
        id: 1,
        orderId: 101,
        checkoutRequestId: "ws_CO_123",
        amount: "100",
        status: "pending"
      }]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };

    (dbModule.getDb as any).mockResolvedValue(mockDb);

    const callbackPayload = {
      Body: {
        stkCallback: {
          MerchantRequestID: "12345",
          CheckoutRequestID: "ws_CO_123",
          ResultCode: 0,
          ResultDesc: "Success",
          CallbackMetadata: {
            Item: [
              { Name: "MpesaReceiptNumber", Value: "R123456" },
              { Name: "Amount", Value: 100 },
              { Name: "PhoneNumber", Value: "254712345678" }
            ]
          }
        }
      }
    };

    const response = await request(app)
      .post("/api/mpesa/callback")
      .send(callbackPayload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ResultCode: 0, ResultDesc: "Accepted" });
    expect(mockDb.update).toHaveBeenCalledTimes(2); // Once for transaction, once for order
  });

  it("should handle a cancelled payment callback", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{
        id: 1,
        orderId: 101,
        checkoutRequestId: "ws_CO_123",
        amount: "100",
        status: "pending"
      }]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };

    (dbModule.getDb as any).mockResolvedValue(mockDb);

    const callbackPayload = {
      Body: {
        stkCallback: {
          MerchantRequestID: "12345",
          CheckoutRequestID: "ws_CO_123",
          ResultCode: 1032,
          ResultDesc: "Request cancelled by user"
        }
      }
    };

    const response = await request(app)
      .post("/api/mpesa/callback")
      .send(callbackPayload);

    expect(response.status).toBe(200);
    expect(mockDb.update).toHaveBeenCalledTimes(2); // Once for transaction, once for order (revert to pending)
  });
});
