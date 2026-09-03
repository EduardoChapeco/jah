import { describe, it, expect } from "vitest";
import { upsertEventSchema } from "@/types/community";

describe("Events Contract & Schema Shield (Microfase 75A)", () => {
  it("valida payload de criacao de evento com datetime e category compativeis", () => {
    const rawInput = {
      title: "Festival das Flores e Turismo 2026",
      description: "Grande feira regional com expositores e passeios",
      event_date: new Date("2026-11-20T19:00:00Z").toISOString(),
      location: "Pavilhão Central de Eventos",
      category: "shows",
      status: "published" as const,
    };

    const parsed = upsertEventSchema.safeParse(rawInput);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe("Festival das Flores e Turismo 2026");
      expect(parsed.data.category).toBe("shows");
      expect(parsed.data.status).toBe("published");
    }
  });

  it("rejeita evento com titulo vazio", () => {
    const invalidInput = {
      title: "",
      event_date: new Date().toISOString(),
      category: "shows",
    };

    const parsed = upsertEventSchema.safeParse(invalidInput);
    expect(parsed.success).toBe(false);
  });
});
