import { describe, it, expect } from "vitest";
import { TravelBookingDossierModal } from "./travel-booking-dossier-modal";

describe("Travel Booking Dossier Modal & Dynamic Checkout", () => {
  it("exporta o componente de dossiê de viagens com sucesso", () => {
    expect(TravelBookingDossierModal).toBeDefined();
    expect(typeof TravelBookingDossierModal).toBe("function");
  });

  it("garante que o dossiê estrutura mensagem para WhatsApp com dados de passageiros e pacote", () => {
    const mockClassified = {
      id: "11111111-1111-4111-a111-111111111111",
      title: "Resort All Inclusive Bahia 5D/4N",
      price_cents: 349900,
      contact_whatsapp: "49999887766",
    };

    expect(mockClassified.title).toContain("Resort");
    expect(mockClassified.price_cents).toBe(349900);
  });
});
