import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";

describe("M-Pesa credentials", () => {
  it("should have MPESA_CONSUMER_KEY set", () => {
    expect(ENV.mpesaConsumerKey).toBeTruthy();
    expect(ENV.mpesaConsumerKey.length).toBeGreaterThan(10);
  });

  it("should have MPESA_CONSUMER_SECRET set", () => {
    expect(ENV.mpesaConsumerSecret).toBeTruthy();
    expect(ENV.mpesaConsumerSecret.length).toBeGreaterThan(10);
  });
});
