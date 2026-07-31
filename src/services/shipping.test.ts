import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listShippingZonesHandler,
  upsertShippingZoneHandler,
  deleteShippingZoneHandler,
  upsertShippingRateHandler,
  deleteShippingRateHandler,
  calculateShippingHandler,
} from "./shipping.functions";

const storeId = "store-123";
const userId = "user-123";

// Helper to create a thenable query builder mock
function createMockQueryBuilder(resolvedValue: any) {
  const builder: any = {
    select: vi.fn().mockImplementation(() => builder),
    insert: vi.fn().mockImplementation(() => builder),
    update: vi.fn().mockImplementation(() => builder),
    upsert: vi.fn().mockImplementation(() => builder),
    delete: vi.fn().mockImplementation(() => builder),
    eq: vi.fn().mockImplementation(() => builder),
    order: vi.fn().mockImplementation(() => builder),
    single: vi.fn().mockImplementation(() => builder),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(resolvedValue)),
    limit: vi.fn().mockImplementation(() => builder),
    then: vi.fn().mockImplementation((onfulfilled: any) => {
      return Promise.resolve(resolvedValue).then(onfulfilled);
    }),
  };
  return builder;
}

const mockFrom = vi.fn();
const mockSupabase = {
  from: mockFrom,
};

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getServerClient: () => mockSupabase,
  SupabaseUnconfiguredError: class extends Error {},
}));

vi.mock("@/lib/server-access", () => ({
  getSSRClient: () => ({ auth: { getUser: mockGetUser } }),
  getServerIdentity: vi.fn().mockResolvedValue({
    id: "user-123",
    role: "owner",
    store_id: "store-123",
    memberships: [{ store_id: "store-123", role: "owner" }],
  }),
  assertStoreAccess: vi.fn(),
}));

describe("Shipping Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation((_table: string) =>
      createMockQueryBuilder({ data: [], error: null }),
    );
    mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
  });

  describe("listShippingZonesHandler", () => {
    it("should list all zones belonging to the store", async () => {
      const mockZones = [{ id: "zone-1", name: "Sul", regions: ["80", "81"], is_active: true }];
      const builder = createMockQueryBuilder({ data: mockZones, error: null });
      mockFrom.mockImplementation(() => builder);
      const res = await listShippingZonesHandler();
      expect(res).toEqual(mockZones);
      expect(mockFrom).toHaveBeenCalledWith("shipping_zones");
      expect(builder.eq).toHaveBeenCalledWith("store_id", storeId);
    });

    it("should return empty array when no zones exist", async () => {
      mockFrom.mockImplementation(() => createMockQueryBuilder({ data: null, error: null }));
      expect(await listShippingZonesHandler()).toEqual([]);
    });
  });

  describe("upsertShippingZoneHandler", () => {
    it("should upsert a new zone", async () => {
      const newZone = { name: "Sudeste", regions: ["11", "12"], is_active: true };
      const createdZone = { id: "zone-2", ...newZone, store_id: storeId };
      const builder = createMockQueryBuilder({ data: createdZone, error: null });
      mockFrom.mockImplementation(() => builder);
      const res = await upsertShippingZoneHandler(newZone);
      expect(res).toEqual(createdZone);
      expect(builder.upsert).toHaveBeenCalledWith({ ...newZone, store_id: storeId });
    });

    it("should upsert an existing zone", async () => {
      const zone = { id: "zone-2", name: "Sudeste Editado", regions: ["11"], is_active: true };
      const updated = { ...zone, store_id: storeId };
      const builder = createMockQueryBuilder({ data: updated, error: null });
      mockFrom.mockImplementation(() => builder);
      const res = await upsertShippingZoneHandler(zone);
      expect(res).toEqual(updated);
      expect(builder.upsert).toHaveBeenCalledWith({ ...zone, store_id: storeId });
    });
  });

  describe("deleteShippingZoneHandler", () => {
    it("should delete a zone belonging to the store", async () => {
      const builder = createMockQueryBuilder({ error: null });
      mockFrom.mockImplementation(() => builder);
      await deleteShippingZoneHandler("zone-2");
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith("id", "zone-2");
      expect(builder.eq).toHaveBeenCalledWith("store_id", storeId);
    });

    it("should throw error if delete fails", async () => {
      mockFrom.mockImplementation(() => createMockQueryBuilder({ error: new Error("Fail to delete") }));
      await expect(deleteShippingZoneHandler("zone-2")).rejects.toThrow("Fail to delete");
    });
  });

  describe("upsertShippingRateHandler", () => {
    it("should upsert a rate", async () => {
      const mockRate = { zone_id: "zone-1", name: "PAC", price_cents: 1500, is_active: true };
      const createdRate = { id: "rate-1", ...mockRate, store_id: storeId };
      const builder = createMockQueryBuilder({ data: createdRate, error: null });
      mockFrom.mockImplementation(() => builder);
      const res = await upsertShippingRateHandler(mockRate);
      expect(res).toEqual(createdRate);
      expect(builder.upsert).toHaveBeenCalledWith({ ...mockRate, store_id: storeId });
    });
  });

  describe("deleteShippingRateHandler", () => {
    it("should delete a shipping rate", async () => {
      const builder = createMockQueryBuilder({ error: null });
      mockFrom.mockImplementation(() => builder);
      await deleteShippingRateHandler("rate-1");
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith("id", "rate-1");
    });
  });

  describe("calculateShippingHandler", () => {
    it("should return manual shipping options from database", async () => {
      const mockOptions = [
        { name: "PAC Sul", price_cents: 1000, estimated_days: 5, is_active: true },
        { name: "SEDEX Sul", price_cents: 2500, estimated_days: 2, is_active: true },
      ];
      mockFrom.mockImplementation((table: string) => {
        if (table === "shipping_options") return createMockQueryBuilder({ data: mockOptions, error: null });
        if (table === "integration_credentials") return createMockQueryBuilder({ data: null, error: null });
        return createMockQueryBuilder({ data: [], error: null });
      });

      const res = await calculateShippingHandler({ zipcode: "80000000" });
      expect(res).toHaveLength(2);
      expect(res).toContainEqual(expect.objectContaining({ service_name: "PAC Sul", price_cents: 1000 }));
      expect(res).toContainEqual(expect.objectContaining({ service_name: "SEDEX Sul", price_cents: 2500 }));
    });

    it("should return empty array when no options configured", async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === "integration_credentials") return createMockQueryBuilder({ data: null, error: null });
        return createMockQueryBuilder({ data: [], error: null });
      });
      const res = await calculateShippingHandler({ zipcode: "80000000" });
      expect(res).toEqual([]);
    });
  });
});
