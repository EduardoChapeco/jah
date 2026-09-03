import { describe, it, expect } from "vitest";
import { resolveGeoCoordinates, GLOBAL_DEFAULT_LOCATION } from "./location-master-pill";

describe("Geolocation Engine & Auto-Detection (Microfase 77E)", () => {
  it("garante que o fallback global padrão está estruturado", () => {
    expect(GLOBAL_DEFAULT_LOCATION.city).toBe("Global");
    expect(GLOBAL_DEFAULT_LOCATION.source).toBe("default");
  });

  it("resolve coordenadas de São Miguel do Oeste deterministicamente via base canônica offline", async () => {
    // Lat/Lng reais de São Miguel do Oeste - SC
    const res = await resolveGeoCoordinates(-26.7264, -53.5186);
    expect(res.city).toBe("São Miguel do Oeste");
    expect(res.state).toBe("SC");
    expect(res.address).toContain("São Miguel do Oeste");
  });

  it("resolve coordenadas de Chapecó deterministicamente via base canônica offline", async () => {
    // Lat/Lng reais de Chapecó - SC
    const res = await resolveGeoCoordinates(-27.1004, -52.6152);
    expect(res.city).toBe("Chapecó");
    expect(res.state).toBe("SC");
    expect(res.address).toContain("Chapecó");
  });
});
