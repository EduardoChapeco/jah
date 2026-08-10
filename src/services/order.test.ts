import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listOrdersHandler,
  getOrderByIdHandler,
  updateOrderStatusHandler,
} from "./order.functions";

// ------------------------------------------------------------------ Mocks --

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockUpdate = vi.fn();
const mockSingle = vi.fn();

const mockQueryChain = {
  select: mockSelect,
  order: mockOrder,
  eq: mockEq,
  in: mockIn,
  update: mockUpdate,
  single: mockSingle,
};

mockSelect.mockReturnValue(mockQueryChain);
mockOrder.mockReturnValue(mockQueryChain);
mockEq.mockReturnValue(mockQueryChain);
mockIn.mockReturnValue(mockQueryChain);
mockUpdate.mockReturnValue(mockQueryChain);

const mockSupabase = { from: mockFrom };

vi.mock("@/lib/supabase", () => ({
  getServerClient: () => mockSupabase,
  SupabaseUnconfiguredError: class extends Error {},
}));

// --------------------------------------------------------------------- Tests

describe("listOrdersHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue(mockQueryChain);
    mockSelect.mockReturnValue(mockQueryChain);
    mockOrder.mockReturnValue(mockQueryChain);
  });

  it("should return all orders ordered by created_at desc", async () => {
    const orders = [{ id: "ord-1", status: "paid", total_cents: 15000 }];
    mockOrder.mockResolvedValueOnce({ data: orders, error: null });

    const res = await listOrdersHandler("store-1");
    expect(res).toEqual(orders);
    expect(mockFrom).toHaveBeenCalledWith("orders");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("should return empty array when data is null", async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: null });
    const res = await listOrdersHandler("store-1");
    expect(res).toEqual([]);
  });

  it("should propagate database error", async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { message: "DB error" } });
    await expect(listOrdersHandler("store-1")).rejects.toThrow("DB error");
  });
});

describe("getOrderByIdHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue(mockQueryChain);
    mockSelect.mockReturnValue(mockQueryChain);
    mockEq.mockReturnValue(mockQueryChain);
  });

  it("should return order details by ID", async () => {
    const order = {
      id: "ord-1",
      public_token: "ABC123",
      status: "processing",
      total_cents: 15000,
      order_items: [
        {
          id: "oi-1",
          product_title: "Tênis HR",
          qty: 2,
          unit_price_cents: 7500,
          total_cents: 15000,
        },
      ],
    };
    mockSingle.mockResolvedValueOnce({ data: order, error: null });

    const res = await getOrderByIdHandler("ord-1", "store-1");
    expect(res).toEqual(order);
    expect(mockEq).toHaveBeenCalledWith("id", "ord-1");
  });

  it("should throw error when order not found", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: "No rows" } });
    await expect(getOrderByIdHandler("bad-id", "store-1")).rejects.toThrow("Pedido não encontrado");
  });
});

describe("updateOrderStatusHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue(mockQueryChain);
    mockSelect.mockReturnValue(mockQueryChain);
    mockUpdate.mockReturnValue(mockQueryChain);
    mockEq.mockReturnValue(mockQueryChain);
    mockSingle.mockReturnValue(mockQueryChain);
  });

  it("should update order status and return ok", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "ord-1" }, error: null });
    // mockQueryChain thenable resolves for update query
    const updateChain = {
      then: (resolve: any) => resolve({ error: null }),
    };
    mockEq
      .mockReturnValueOnce(mockQueryChain)
      .mockReturnValueOnce(mockQueryChain)
      .mockReturnValueOnce(updateChain as any);

    const res = await updateOrderStatusHandler("ord-1", "shipped", "store-1");
    expect(res).toEqual({ status: "ok", message: "Status do pedido atualizado." });
    expect(mockFrom).toHaveBeenCalledWith("orders");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "shipped", shipped_at: expect.any(String) }),
    );
  });

  it("should propagate error when update fails", async () => {
    mockSingle.mockResolvedValueOnce({ data: { id: "ord-1" }, error: null });
    const updateChain = {
      then: (resolve: any) => resolve({ error: { message: "RLS violation" } }),
    };
    mockEq
      .mockReturnValueOnce(mockQueryChain)
      .mockReturnValueOnce(mockQueryChain)
      .mockReturnValueOnce(updateChain as any);

    await expect(updateOrderStatusHandler("ord-1", "delivered", "store-1")).rejects.toThrow(
      "RLS violation",
    );
  });
});
