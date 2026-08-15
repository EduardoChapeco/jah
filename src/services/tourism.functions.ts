/**
 * tourism.functions.ts — BFF para o Módulo Master de Turismo, Viagens & Lazer
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";

export interface TourismItemDTO {
  id: string;
  title: string;
  subtitle: string;
  category: "passeios" | "hospedagens" | "agencias" | "gastronomia_turistica" | "aventura";
  location: string;
  duration?: string;
  price_display: string;
  image_url: string;
  provider_name: string;
  whatsapp: string;
  rating: number;
  featured?: boolean;
}

export const SEED_TOURISM: TourismItemDTO[] = [
  {
    id: "tour-001",
    title: "Passeio de Catamarã no Vale do Rio Uruguai",
    subtitle: "Navegação cênica pelas águas calmas do Rio Uruguai com almoço típico colonial a bordo.",
    category: "passeios",
    location: "Goio-Ên — Chapecó / Nonoai",
    duration: "4 horas",
    price_display: "R$ 120,00 / pessoa",
    image_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
    provider_name: "Rota das Águas Ecoturismo",
    whatsapp: "49991223344",
    rating: 4.9,
    featured: true,
  },
  {
    id: "tour-002",
    title: "Diária Romântica em Cabana de Montanha & Spa",
    subtitle: "Cabana privativa com hidromassagem, lareira, vista panorâmica da serra e café da manhã colonial.",
    category: "hospedagens",
    location: "Linha Rodeio Bonito",
    duration: "Diária / Casal",
    price_display: "R$ 480,00 / diária",
    image_url: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80",
    provider_name: "Pousada Morada dos Canyons",
    whatsapp: "49998877665",
    rating: 5.0,
    featured: true,
  },
  {
    id: "tour-003",
    title: "Circuito das Vinícolas Coloniais & Degustação",
    subtitle: "Roteiro guiado por 3 vinícolas familiares com degustação de rótulos artesanais e queijos premiados.",
    category: "gastronomia_turistica",
    location: "Interior de Chapecó & Guatambu",
    duration: "6 horas",
    price_display: "R$ 160,00 / pessoa",
    image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80",
    provider_name: "Vinhos & Tradição Turismo",
    whatsapp: "49999334455",
    rating: 4.85,
  },
  {
    id: "tour-004",
    title: "Expedição de Caiaque & Stand Up Paddle nas Cachoeiras",
    subtitle: "Aventura aquática com instrução profissional, coletes e paradas para banho em piscinas naturais.",
    category: "aventura",
    location: "Trilha da Cachoeira do Guatambu",
    duration: "3 horas",
    price_display: "R$ 90,00 / pessoa",
    image_url: "https://images.unsplash.com/photo-1472745433479-4556f22e32c2?w=800&q=80",
    provider_name: "Oeste Adventure Club",
    whatsapp: "49991112233",
    rating: 4.92,
  },
  {
    id: "tour-005",
    title: "Excursão de Fim de Semana: Serra Gaúcha & Gramado",
    subtitle: "Pacote completo com transporte executivo, hospedagem, guia de turismo e ingressos para atrações.",
    category: "agencias",
    location: "Saída de Chapecó",
    duration: "3 dias (Sex a Dom)",
    price_display: "R$ 890,00 / pessoa",
    image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    provider_name: "Excelência Tour Agência de Viagens",
    whatsapp: "4933221100",
    rating: 4.98,
    featured: true,
  },
  {
    id: "tour-006",
    title: "Day Use no Parque Aquático das Águas Termais",
    subtitle: "Piscinas aquecidas naturais, toboáguas, quiosques com churrasqueira e restaurante self-service.",
    category: "passeios",
    location: "Águas de Chapecó",
    duration: "Dia todo (08h às 18h)",
    price_display: "R$ 55,00 / pessoa",
    image_url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
    provider_name: "Termas do Oeste Complexo Turístico",
    whatsapp: "4933214500",
    rating: 4.75,
  },
];

export const listPublicTourism = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        category: z.string().optional(),
        search: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    let items = [...SEED_TOURISM];

    if (data?.category && data.category !== "todos") {
      items = items.filter((i) => i.category === data.category);
    }

    if (data?.search) {
      const q = data.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.subtitle.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          i.provider_name.toLowerCase().includes(q),
      );
    }

    return items;
  });
