/**
 * M-Pesa Debug & Enhanced Logging
 * Helps diagnose STK Push issues
 */

export function logMpesaRequest(endpoint: string, payload: unknown, headers: unknown) {
  console.log(`[M-Pesa Request] ${endpoint}`);
  console.log(`  Headers:`, JSON.stringify(headers, null, 2));
  console.log(`  Payload:`, JSON.stringify(payload, null, 2));
}

export function logMpesaResponse(endpoint: string, status: number, data: unknown) {
  console.log(`[M-Pesa Response] ${endpoint} (${status})`);
  console.log(`  Data:`, JSON.stringify(data, null, 2));
}

export function logMpesaError(endpoint: string, error: unknown) {
  console.error(`[M-Pesa Error] ${endpoint}`);
  if (error instanceof Error) {
    console.error(`  Message:`, error.message);
    console.error(`  Stack:`, error.stack);
  } else {
    console.error(`  Error:`, JSON.stringify(error, null, 2));
  }
}

export function validateMpesaConfig(config: {
  consumerKey: string;
  consumerSecret: string;
  businessShortCode: string;
  passkey: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.consumerKey || config.consumerKey.length === 0) {
    errors.push("M-Pesa Consumer Key is missing or empty");
  }
  if (!config.consumerSecret || config.consumerSecret.length === 0) {
    errors.push("M-Pesa Consumer Secret is missing or empty");
  }
  if (!config.businessShortCode || config.businessShortCode.length === 0) {
    errors.push("Business Short Code is missing or empty");
  }
  if (!config.passkey || config.passkey.length === 0) {
    errors.push("M-Pesa Passkey is missing or empty");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, "");

  // Handle different formats
  if (cleaned.startsWith("0")) {
    // 0XXXXXXXXX → 254XXXXXXXXX
    cleaned = "254" + cleaned.slice(1);
  } else if (cleaned.startsWith("254")) {
    // Already in 254XXXXXXXXX format
    // Keep as is
  } else if (cleaned.length === 9) {
    // XXXXXXXXX → 254XXXXXXXXX
    cleaned = "254" + cleaned;
  } else if (cleaned.length === 10) {
    // XXXXXXXXXXX (with leading 0) → 254XXXXXXXXX
    if (cleaned.startsWith("0")) {
      cleaned = "254" + cleaned.slice(1);
    } else {
      cleaned = "254" + cleaned;
    }
  }

  // Validate final format
  if (cleaned.length !== 12 || !cleaned.startsWith("254")) {
    throw new Error(
      `Invalid phone number format: ${phone} → ${cleaned}. Expected format: 254XXXXXXXXX or 0XXXXXXXXX`
    );
  }

  return cleaned;
}

export function getMpesaTestCredentials() {
  return {
    consumerKey: "YOUR_SANDBOX_CONSUMER_KEY",
    consumerSecret: "YOUR_SANDBOX_CONSUMER_SECRET",
    businessShortCode: "174379",
    passkey: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
    testPhoneNumber: "254708374149", // Safaricom test number
  };
}
