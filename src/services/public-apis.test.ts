import { describe, it, expect } from "vitest";
import { DEFAULT_PUBLIC_API_GOVERNANCE } from "./public-apis.functions";

describe("public-apis governance", () => {
  it("provides correct default zero-cost configurations", () => {
    expect(DEFAULT_PUBLIC_API_GOVERNANCE.defaultMapProvider).toBe("carto_voyager");
    expect(DEFAULT_PUBLIC_API_GOVERNANCE.isMapServiceActive).toBe(true);
    expect(DEFAULT_PUBLIC_API_GOVERNANCE.isCepAutoFillActive).toBe(true);
    expect(DEFAULT_PUBLIC_API_GOVERNANCE.isCnpjLookupActive).toBe(true);
    expect(DEFAULT_PUBLIC_API_GOVERNANCE.isCpfValidationActive).toBe(true);
    expect(DEFAULT_PUBLIC_API_GOVERNANCE.isBirthDateValidationActive).toBe(true);
    expect(DEFAULT_PUBLIC_API_GOVERNANCE.isOsmGeocodingActive).toBe(true);
    expect(DEFAULT_PUBLIC_API_GOVERNANCE.primaryCepProvider).toBe("brasilapi_v2");
  });
});
