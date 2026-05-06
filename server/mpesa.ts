import axios from "axios";
import { ENV } from "./_core/env";

const MPESA_BASE_URL = "https://sandbox.safaricom.co.ke";
// For production: "https://api.safaricom.co.ke"

const BUSINESS_SHORT_CODE = "174379"; // Sandbox shortcode
const PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"; // Sandbox passkey
const CALLBACK_URL_BASE = process.env.MPESA_CALLBACK_URL || "";

export async function getMpesaAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${ENV.mpesaConsumerKey}:${ENV.mpesaConsumerSecret}`
  ).toString("base64");

  const response = await axios.get(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    }
  );

  return response.data.access_token as string;
}

export function getMpesaTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

export function getMpesaPassword(timestamp: string): string {
  return Buffer.from(
    `${BUSINESS_SHORT_CODE}${PASSKEY}${timestamp}`
  ).toString("base64");
}

export interface StkPushParams {
  phoneNumber: string;
  amount: number;
  orderId: number;
  orderNumber: string;
  callbackUrl: string;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export async function initiateStkPush(params: StkPushParams): Promise<StkPushResponse> {
  const accessToken = await getMpesaAccessToken();
  const timestamp = getMpesaTimestamp();
  const password = getMpesaPassword(timestamp);

  // Normalize phone number to 254XXXXXXXXX format
  let phone = params.phoneNumber.replace(/\D/g, "");
  if (phone.startsWith("0")) {
    phone = "254" + phone.slice(1);
  } else if (phone.startsWith("+")) {
    phone = phone.slice(1);
  }
  if (!phone.startsWith("254")) {
    phone = "254" + phone;
  }

  const payload = {
    BusinessShortCode: BUSINESS_SHORT_CODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.ceil(params.amount),
    PartyA: phone,
    PartyB: BUSINESS_SHORT_CODE,
    PhoneNumber: phone,
    CallBackURL: params.callbackUrl,
    AccountReference: params.orderNumber,
    TransactionDesc: `Payment for Order ${params.orderNumber}`,
  };

  const response = await axios.post(
    `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data as StkPushResponse;
}

export interface StkQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

export async function queryStkStatus(checkoutRequestId: string): Promise<StkQueryResponse> {
  const accessToken = await getMpesaAccessToken();
  const timestamp = getMpesaTimestamp();
  const password = getMpesaPassword(timestamp);

  const payload = {
    BusinessShortCode: BUSINESS_SHORT_CODE,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };

  const response = await axios.post(
    `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data as StkQueryResponse;
}
