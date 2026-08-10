import { describe, it, expect } from "vitest";

function generateTrackingUrl(trackingCode: string, trackingUrl?: string): string {
  return trackingUrl || "";
}

describe("Order Shipment Tracking Helpers", () => {
  it("should return empty string if no explicit URL is provided", () => {
    const url = generateTrackingUrl("AA123456789BR");
    expect(url).toBe("");
  });

  it("should preserve custom tracking URL if explicitly provided", () => {
    const customUrl = "https://minhatransportadora.com/track/123";
    const url = generateTrackingUrl("123", customUrl);
    expect(url).toBe(customUrl);
  });
});
