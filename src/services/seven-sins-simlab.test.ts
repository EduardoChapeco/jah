import { describe, it, expect } from "vitest";
import {
  generateSevenSinCopy,
  runSimLabPersonaTest,
  SEVEN_SINS_DEFINITIONS,
} from "./seven-sins-simlab.functions";

describe("Seven Sins Canvas & SimLab V2 (Big Tech Council)", () => {
  const realStoreId = "c6ccd3b2-aa54-42a2-b0fe-251daa5b97f7";

  it("1. Deve ter os 7 pecados capitais canônicos definidos", () => {
    const keys = Object.keys(SEVEN_SINS_DEFINITIONS);
    expect(keys).toContain("orgulho");
    expect(keys).toContain("ganancia");
    expect(keys).toContain("luxuria");
    expect(keys).toContain("inveja");
    expect(keys).toContain("gula");
    expect(keys).toContain("ira");
    expect(keys).toContain("preguica");
    expect(keys.length).toBe(7);
  });

  it("2. Deve redigir copy estruturada por pecado capital (Orgulho)", async () => {
    const hook = await generateSevenSinCopy(realStoreId, {
      sin: "orgulho",
      productNameFallback: "Combo Executivo Supreme",
      targetChannel: "whatsapp",
    });

    expect(hook).toBeDefined();
    expect(hook.sin).toBe("orgulho");
    expect(hook.copy_headline).toContain("Combo Executivo Supreme");
    expect(hook.call_to_action).toBeDefined();
    expect(hook.recommended_channel).toBe("whatsapp");
  });

  it("3. Deve redigir copy estruturada por pecado capital (Preguiça / Zero Esforço)", async () => {
    const hook = await generateSevenSinCopy(realStoreId, {
      sin: "preguica",
      productNameFallback: "Pacote Final de Semana Express",
      targetChannel: "instagram_ad",
    });

    expect(hook.sin).toBe("preguica");
    expect(hook.copy_headline).toContain("Pacote Final de Semana Express");
    expect(hook.copy_body).toContain("WhatsApp");
  });

  it("4. Deve simular impacto da copy no SimLab V2 com 5 personas sintéticas", async () => {
    const results = await runSimLabPersonaTest({
      sin: "orgulho",
      copyHeadline: "Não é para qualquer um: Conheça o padrão oficial",
      copyBody: "Quem entende de qualidade reconhece à primeira vista.",
    });

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(5);

    for (const r of results) {
      expect(r.persona_id).toBeDefined();
      expect(r.name).toBeDefined();
      expect(r.conversion_probability).toBeGreaterThanOrEqual(40);
      expect(r.conversion_probability).toBeLessThanOrEqual(100);
      expect(r.reaction_verbatim.length).toBeGreaterThan(10);
    }
  });
});
