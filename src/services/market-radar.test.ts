import { describe, it, expect } from "vitest";
import {
  listCompetitors,
  createCompetitor,
  captureAndAnalyzeCompetitor,
  getStoreBrandDna,
  updateStoreBrandDna,
} from "./market-radar.functions";

describe("Market Radar & Brand DNA Services (Big Tech Council)", () => {
  const realStoreId = "c6ccd3b2-aa54-42a2-b0fe-251daa5b97f7";
  let createdCompetitorId: string;

  it("1. Deve criar um novo concorrente monitorado no banco real", async () => {
    const comp = await createCompetitor(realStoreId, {
      name: "Concorrente Teste Regional",
      website_url: "https://regionaltour.com.br",
      instagram_handle: "@regionaltour_oficial",
      notes: "Agência concorrente operando rotas e pacotes executivos.",
    });

    expect(comp).toBeDefined();
    expect(comp.id).toBeDefined();
    expect(comp.name).toBe("Concorrente Teste Regional");
    expect(comp.instagram_handle).toBe("regionaltour_oficial");
    expect(comp.is_active).toBe(true);

    createdCompetitorId = comp.id;
  });

  it("2. Deve listar concorrentes da loja incluindo o concorrente recém-criado", async () => {
    const competitors = await listCompetitors(realStoreId);
    expect(Array.isArray(competitors)).toBe(true);
    expect(competitors.length).toBeGreaterThan(0);

    const found = competitors.find((c) => c.id === createdCompetitorId);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Concorrente Teste Regional");
  });

  it("3. Deve executar captura forense e análise dos agentes The Visionary & The Identity Engineer", async () => {
    expect(createdCompetitorId).toBeDefined();
    const snapshot = await captureAndAnalyzeCompetitor(realStoreId, createdCompetitorId);

    expect(snapshot).toBeDefined();
    expect(snapshot.competitor_id).toBe(createdCompetitorId);
    expect(snapshot.screenshot_url).toContain("http");
    expect(snapshot.extracted_dna.brand_archetype).toBeDefined();
    expect(snapshot.extracted_dna.color_palette.length).toBeGreaterThan(0);
    expect(snapshot.extracted_dna.weaknesses.length).toBeGreaterThan(0);
    expect(snapshot.marketing_hooks.length).toBeGreaterThan(0);
    expect(snapshot.pricing_signals.tier).toBeDefined();
    expect(snapshot.analyzed_by_agent_id).toBe("agent.strategy_corporate_consultant");
  });

  it("4. Deve obter ou inicializar o Brand DNA da loja com os 7 Pecados e SWOT", async () => {
    const dna = await getStoreBrandDna(realStoreId);

    expect(dna).toBeDefined();
    expect(dna.store_id).toBe(realStoreId);
    expect(dna.archetype).toBeDefined();
    expect(dna.color_palette.primary).toBeDefined();
    expect(dna.seven_sins_triggers).toBeDefined();
    expect(dna.seven_sins_triggers.orgulho).toBeDefined();
    expect(dna.seven_sins_triggers.gula).toBeDefined();
    expect(dna.swot_analysis.strengths.length).toBeGreaterThan(0);
  });

  it("5. Deve atualizar o Brand DNA da loja com novas diretrizes estratégicas", async () => {
    const updated = await updateStoreBrandDna(realStoreId, {
      archetype: "O Explorador",
      archetype_justification: "Foco em novas jornadas, pioneirismo e experiências inesquecíveis.",
      tone_of_voice: "Aventureiro, inspirador e confiável",
    });

    expect(updated.archetype).toBe("O Explorador");
    expect(updated.archetype_justification).toContain("jornadas");
    expect(updated.tone_of_voice).toContain("Aventureiro");
  });
});
