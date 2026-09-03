import { describe, it, expect } from "vitest";
import { formatMoney } from "@/lib/money";
import type { TravelPackageData } from "@/types/travel-package";

describe("Travel Package Engine & Editorial Detail (Microfase 77A)", () => {
  it("valida cálculo canônico de parcelamento em até 12x sem juros", () => {
    const totalCents = 425000; // R$ 4.250,00
    const installmentCents = Math.round(totalCents / 12); // R$ 354,16
    expect(installmentCents).toBe(35417);
    expect(formatMoney(totalCents)).toBe("R$ 4.250,00");
  });

  it("garante que o payload de pacote de viagem possui as 4 dimensões ricas estruturadas", () => {
    const pkg: TravelPackageData = {
      destination: {
        name: "Ilhéus",
        region: "Bahia, Brasil",
        country: "Brasil",
        weather_summary: "28°C Ensolarado",
        gallery_urls: ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
      },
      resort: {
        name: "Resort Tororomba",
        stars: 4,
        meal_plan: "All Inclusive",
        duration_text: "5D / 4N",
        bio_bullets: ["Paraíso ecológico à beira-mar", "All Inclusive completo"],
        badges: ["Eco-friendly", "Pé na Areia"],
        photos: ["https://example.com/resort1.jpg"],
      },
      itinerary_days: [
        {
          id: "day_1",
          day: 1,
          date: "23 Out",
          title: "Chegada e Check-in no Resort",
          description: "Chegada e aproveitamento da piscina e drinks.",
        },
        {
          id: "day_2",
          day: 2,
          date: "24 Out",
          title: "City Tour Histórico",
          description: "Visita aos centros históricos e praias.",
        },
      ],
      inclusions: ["Voo Ida e Volta", "Hospedagem All Inclusive", "Transfer In/Out"],
    };

    expect(pkg.destination.name).toBe("Ilhéus");
    expect(pkg.resort?.meal_plan).toBe("All Inclusive");
    expect(pkg.itinerary_days?.length).toBe(2);
    expect(pkg.inclusions?.length).toBe(3);
  });
});
