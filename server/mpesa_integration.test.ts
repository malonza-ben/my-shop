import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { getMpesaAccessToken, initiateStkPush, queryStkStatus } from "./mpesa";
import { ENV } from "./_core/env";

vi.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("M-Pesa Integration", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Set mock environment variables
    ENV.mpesaConsumerKey = "test_key";
    ENV.mpesaConsumerSecret = "test_secret";
  });

  describe("getMpesaAccessToken", () => {
    it("should return an access token on success", async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { access_token: "mock_access_token" },
      });

      const token = await getMpesaAccessToken();
      expect(token).toBe("mock_access_token");
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/oauth/v1/generate"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Basic"),
          }),
        })
      );
    });

    it("should throw an error on failure", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));
      await expect(getMpesaAccessToken()).rejects.toThrow("Network Error");
    });
  });

  describe("initiateStkPush", () => {
    it("should initiate STK push successfully", async () => {
      // Mock token generation
      mockedAxios.get.mockResolvedValueOnce({
        data: { access_token: "mock_access_token" },
      });

      // Mock STK push response
      const mockResponse = {
        MerchantRequestID: "12345-67890",
        CheckoutRequestID: "ws_CO_01012023000000000000",
        ResponseCode: "0",
        ResponseDescription: "Success. Request accepted for processing",
        CustomerMessage: "Success. Request accepted for processing",
      };
      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const params = {
        phoneNumber: "0712345678",
        amount: 100,
        orderId: 1,
        orderNumber: "ORD-001",
        callbackUrl: "https://example.com/callback",
      };

      const result = await initiateStkPush(params);
      expect(result).toEqual(mockResponse);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/mpesa/stkpush/v1/processrequest"),
        expect.objectContaining({
          PhoneNumber: "254712345678",
          Amount: 100,
          BusinessShortCode: "174379",
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer mock_access_token",
          }),
        })
      );
    });
  });

  describe("queryStkStatus", () => {
    it("should query STK status successfully", async () => {
      // Mock token generation
      mockedAxios.get.mockResolvedValueOnce({
        data: { access_token: "mock_access_token" },
      });

      // Mock query response
      const mockResponse = {
        ResponseCode: "0",
        ResponseDescription: "The service request has been accepted successully",
        MerchantRequestID: "12345-67890",
        CheckoutRequestID: "ws_CO_01012023000000000000",
        ResultCode: "0",
        ResultDesc: "The service request is processed successfully.",
      };
      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await queryStkStatus("ws_CO_01012023000000000000");
      expect(result).toEqual(mockResponse);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/mpesa/stkpushquery/v1/query"),
        expect.objectContaining({
          CheckoutRequestID: "ws_CO_01012023000000000000",
          BusinessShortCode: "174379",
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer mock_access_token",
          }),
        })
      );
    });
  });
});
