import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getStockLevelsHandler,
  adjustStockHandler,
  getStockMovementsHandler,
} from "./stock.functions";

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockIlike = vi.fn();
const mockLimit = vi.fn();
const mockSingle = vi.fn();
const mockRpc = vi.fn();

const mockQueryBuilder = {
  select: mockSelect,
  eq: mockEq,
  order: mockOrder,
  ilike: mockIlike,
  limit: mockLimit,
  single: mockSingle,
};

mockSelect.mockReturnValue(mockQueryBuilder);
mockEq.mockReturnValue(mockQueryBuilder);
mockOrder.mockReturnValue(mockQueryBuilder);
mockIlike.mockReturnValue(mockQueryBuilder);
mockLimit.mockReturnValue(mockQueryBuilder);
mockSingle.mockReturnValue(mockQueryBuilder);

const mockSupabase = {
  from: mockFrom,
  rpc: mockRpc,
};

vi.mock("@/lib/supabase", () => {
  return {
    getServerClient: () => mockSupabase,
    SupabaseUnconfiguredError: class extends Error {},
  };
});

describe("Stock Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue(mockQueryBuilder);
    mockSelect.mockReturnValue(mockQueryBuilder);
    mockEq.mockReturnValue(mockQueryBuilder);
    mockOrder.mockReturnValue(mockQueryBuilder);
    mockIlike.mockReturnValue(mockQueryBuilder);
    mockLimit.mockReturnValue(mockQueryBuilder);
    mockSingle.mockReturnValue(mockQueryBuilder);
  });


  describe("getStockLevelsHandler", () => {
    it("should retrieve all stock variants ordered by sku", async () => {
      const mockVariants = [
        {
          id: "v-1",
          sku: "TENIS-39",
          stock_on_hand: 10,
          products: { title: "Tênis" },
        },
      ];
      mockOrder.mockResolvedValueOnce({ data: mockVariants, error: null });

      const res = await getStockLevelsHandler({}, "store-1");
      expect(res).toEqual(mockVariants);
      expect(mockFrom).toHaveBeenCalledWith("product_variants");
      expect(mockOrder).toHaveBeenCalledWith("sku");
    });

    it("should apply ilike filter when search param is provided", async () => {
      const mockVariants = [{ id: "v-1", sku: "TENIS-39" }];
      mockIlike.mockResolvedValueOnce({ data: mockVariants, error: null });

      const res = await getStockLevelsHandler({ search: "TENIS" }, "store-1");
      expect(res).toEqual(mockVariants);
      expect(mockIlike).toHaveBeenCalledWith("sku", "%TENIS%");
    });

    it("should propagate database error", async () => {
      mockOrder.mockResolvedValueOnce({ data: null, error: { message: "DB select fail" } });

      await expect(getStockLevelsHandler({}, "store-1")).rejects.toThrow("DB select fail");
    });

    it("should return empty array when data is null with no error", async () => {
      mockOrder.mockResolvedValueOnce({ data: null, error: null });

      const res = await getStockLevelsHandler({}, "store-1");
      expect(res).toEqual([]);
    });
  });

  describe("adjustStockHandler", () => {
    it("should call adjust_stock RPC with correct parameters and return ok status", async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: "var-uuid-1" }, error: null });
      mockRpc.mockResolvedValueOnce({ error: null });

      const res = await adjustStockHandler({
        variantId: "var-uuid-1",
        qty: 10,
        movementType: "purchase",
        note: "Compra de fornecedor",
      }, "store-1");

      expect(res).toEqual({ status: "ok", message: "Estoque ajustado com sucesso." });
      expect(mockRpc).toHaveBeenCalledWith("adjust_stock", {
        p_variant_id: "var-uuid-1",
        p_qty: 10,
        p_movement_type: "purchase",
        p_note: "Compra de fornecedor",
      });
    });

    it("should use null note when not provided", async () => {
      mockSingle.mockResolvedValueOnce({ data: { id: "var-uuid-1" }, error: null });
      mockRpc.mockResolvedValueOnce({ error: null });

      await adjustStockHandler({ variantId: "var-uuid-1", qty: -1, movementType: "damage" }, "store-1");
      expect(mockRpc).toHaveBeenCalledWith("adjust_stock", {
        p_variant_id: "var-uuid-1",
        p_qty: -1,
        p_movement_type: "damage",
        p_note: null,
      });
    });

    it("should propagate RPC error", async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: "Variant not found" } });

      await expect(
        adjustStockHandler({ variantId: "bad-uuid", qty: 1, movementType: "adjustment" }, "store-1"),
      ).rejects.toThrow("Variante não encontrada ou acesso negado");
    });
  });


  describe("getStockMovementsHandler", () => {
    it("should retrieve stock movements ordered by created_at desc limited by limit param", async () => {
      const mockMovements = [
        { id: "mov-1", movement_type: "purchase", qty: 10, created_at: "2026-01-01" },
      ];
      mockLimit.mockResolvedValueOnce({ data: mockMovements, error: null });

      const res = await getStockMovementsHandler(50, "store-1");
      expect(res).toEqual(mockMovements);
      expect(mockFrom).toHaveBeenCalledWith("stock_movements");
      expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(mockLimit).toHaveBeenCalledWith(50);
    });

    it("should propagate database error", async () => {
      mockLimit.mockResolvedValueOnce({ data: null, error: { message: "DB movements fail" } });

      await expect(getStockMovementsHandler(50, "store-1")).rejects.toThrow("DB movements fail");
    });

    it("should return empty array when data is null", async () => {
      mockLimit.mockResolvedValueOnce({ data: null, error: null });

      const res = await getStockMovementsHandler(10, "store-1");
      expect(res).toEqual([]);
    });
  });
});
