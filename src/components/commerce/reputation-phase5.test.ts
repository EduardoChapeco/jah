import { describe, it, expect } from "vitest";
import { builderRegistry } from "@/lib/builder-registry";

describe("Fase 5: Portal de Reputação & SAC Auditado (Reclame Aqui)", () => {
  it("builderRegistry deve registrar reputation_score_header com campos de pontuação", () => {
    const manifest = builderRegistry["reputation_score_header"];
    expect(manifest).toBeDefined();
    expect(manifest.name).toBe("Score de Reputação & Confiança");
    expect(manifest.category).toBe("content");
    expect(manifest.icon).toBe("ShieldCheck");
  });

  it("builderRegistry deve registrar reputation_badges_strip", () => {
    const manifest = builderRegistry["reputation_badges_strip"];
    expect(manifest).toBeDefined();
    expect(manifest.name).toBe("Faixa de Selos Auditados");
    expect(manifest.icon).toBe("Award");
  });

  it("builderRegistry deve registrar reputation_timeline_feed", () => {
    const manifest = builderRegistry["reputation_timeline_feed"];
    expect(manifest).toBeDefined();
    expect(manifest.name).toBe("Feed Público de Manifestações");
    expect(manifest.icon).toBe("MessageSquare");
  });

  it("manifests de reputação devem possuir defaultProps válidas", () => {
    for (const key of ["reputation_score_header", "reputation_badges_strip", "reputation_timeline_feed"]) {
      const m = builderRegistry[key];
      expect(m.defaultProps).toBeDefined();
      expect(m.defaultProps.block_type).toBe(key);
    }
  });
});
