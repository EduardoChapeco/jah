import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("WMS & Expedição - Schemas Zod de Separação e Despacho", () => {
  it("valida o schema de conferência de produto por código de barras", () => {
    const ScanSchema = z.object({
      sessionId: z.string().uuid(),
      barcode: z.string().min(3),
    });

    const validPayload = {
      sessionId: "123e4567-e89b-12d3-a456-426614174000",
      barcode: "7891234567890",
    };

    expect(ScanSchema.parse(validPayload)).toEqual(validPayload);
    expect(() => ScanSchema.parse({ sessionId: "invalid-uuid", barcode: "12" })).toThrow();
  });

  it("valida o schema de geração de romaneio de despacho com lista de pedidos", () => {
    const ManifestSchema = z.object({
      batchId: z.string().uuid().optional(),
      orderIds: z.array(z.string().uuid()).min(1),
      carrierName: z.string().default("Transportadora Própria"),
    });

    const validManifest = {
      orderIds: ["123e4567-e89b-12d3-a456-426614174001", "123e4567-e89b-12d3-a456-426614174002"],
      carrierName: "MotoLink Express",
    };

    const parsed = ManifestSchema.parse(validManifest);
    expect(parsed.orderIds).toHaveLength(2);
    expect(parsed.carrierName).toBe("MotoLink Express");

    // Rejeita lista vazia de pedidos
    expect(() => ManifestSchema.parse({ orderIds: [] })).toThrow();
  });

  it("valida o filtro de status de lotes de picking", () => {
    const BatchFilterSchema = z.object({
      status: z.enum(["pending", "assigned", "in_progress", "completed", "cancelled"]).optional(),
    }).optional();

    expect(BatchFilterSchema.parse({ status: "in_progress" })?.status).toBe("in_progress");
    expect(BatchFilterSchema.parse({})).toEqual({});
    expect(() => BatchFilterSchema.parse({ status: "invalid_status" })).toThrow();
  });
});
