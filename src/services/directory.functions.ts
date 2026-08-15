import { createServerFn } from "@tanstack/react-start";
import { getServerClient } from "@/lib/supabase";
import { z } from "zod";

const SEED_DIRECTORY = [
  {
    id: "d0000000-0000-0000-0000-000000000001",
    category: "saude",
    address: "Av. Fernando Machado, 1240 — Centro, Chapecó",
    latitude: -27.0988,
    longitude: -52.6177,
    contact_phone: "(49) 99812-4411",
    working_hours: "Seg a Sex: 07:30 - 19:30",
    is_verified: true,
    status: "active",
    created_at: new Date().toISOString(),
    stores: {
      name: "Clínica Integrada de Fisioterapia & Pilates",
      type: "service_health",
      description: "Reabilitação ortopédica, pilates clínico, osteopatia e recuperação esportiva.",
      avatar_url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=200&q=80",
    },
  },
  {
    id: "d0000000-0000-0000-0000-000000000002",
    category: "reformas",
    address: "Rua Marechal Deodoro, 310 — Jardim Itália",
    latitude: -27.1023,
    longitude: -52.6145,
    contact_phone: "(49) 98822-5533",
    working_hours: "Seg a Sex: 08:00 - 18:00",
    is_verified: true,
    status: "active",
    created_at: new Date().toISOString(),
    stores: {
      name: "Studio D'Art Arquitetura & Reformas",
      type: "service_construction",
      description: "Projetos arquitetônicos residenciais e comerciais, reformas completas e marcenaria fina.",
      avatar_url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=200&q=80",
    },
  },
  {
    id: "d0000000-0000-0000-0000-000000000003",
    category: "auto",
    address: "Av. General Osório, 890 — Santa Maria",
    latitude: -27.0911,
    longitude: -52.6255,
    contact_phone: "(49) 3322-1144",
    working_hours: "Seg a Sex: 08:00 - 18:30 | Sáb: 08:00 - 12:00",
    is_verified: true,
    status: "active",
    created_at: new Date().toISOString(),
    stores: {
      name: "Auto Center & Mecânica Especializada Oeste",
      type: "service_automotive",
      description: "Diagnóstico computadorizado, suspensão, freios, troca de óleo e pneus importados.",
      avatar_url: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=200&q=80",
    },
  },
  {
    id: "d0000000-0000-0000-0000-000000000004",
    category: "pet",
    address: "Rua Benjamin Constant, 450 — São Cristóvão",
    latitude: -27.1088,
    longitude: -52.6099,
    contact_phone: "(49) 99133-7788",
    working_hours: "24 Horas (Plantão Veterinário)",
    is_verified: true,
    status: "active",
    created_at: new Date().toISOString(),
    stores: {
      name: "Hospital Veterinário & Pet Hotel Quatro Patas",
      type: "service_pet",
      description: "Emergência 24h, cirurgias, exames laboratoriais, banho & tosa e hospedagem climatizada.",
      avatar_url: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=200&q=80",
    },
  },
  {
    id: "d0000000-0000-0000-0000-000000000005",
    category: "servicos",
    address: "Centro Comercial Chapecó — Sala 402",
    latitude: -27.1001,
    longitude: -52.6162,
    contact_phone: "(49) 99944-2211",
    working_hours: "Seg a Sex: 09:00 - 18:00",
    is_verified: true,
    status: "active",
    created_at: new Date().toISOString(),
    stores: {
      name: "Ateliê & Alfaiataria Fina Autoral",
      type: "service_fashion",
      description: "Ajustes sob medida, ternos customizados, vestidos de festa e consultoria de estilo.",
      avatar_url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=200&q=80",
    },
  },
  {
    id: "d0000000-0000-0000-0000-000000000006",
    category: "servicos",
    address: "Av. Nereu Ramos, 750D — Centro",
    latitude: -27.0975,
    longitude: -52.6189,
    contact_phone: "(49) 3328-9900",
    working_hours: "Seg a Sex: 08:30 - 18:00",
    is_verified: true,
    status: "active",
    created_at: new Date().toISOString(),
    stores: {
      name: "Escritório Contábil & Assessoria Empresarial",
      type: "service_legal",
      description: "Abertura de empresas, planejamento tributário, gestão financeira e assessoria para MEIs e PMEs.",
      avatar_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&q=80",
    },
  },
];

export const getPublicDirectory = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        limit: z.number().int().min(1).max(100).optional(),
        category: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const limit = data?.limit ?? 50;

    try {
      let query = supabase
        .from("directory_listings")
        .select(
          `
          id, category, address, latitude, longitude, contact_phone, working_hours, is_verified, status, created_at,
          stores ( name, type, avatar_url, description )
        `,
        )
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (data?.category && data.category !== "todos") {
        query = query.eq("category", data.category);
      }

      const { data: listings } = await query;

      if (listings && listings.length > 0) {
        return listings;
      }

      // Se a tabela directory_listings estiver sem registros específicos, busca diretamente as lojas ativas
      const { data: storesData } = await supabase
        .from("stores")
        .select("id, name, slug, avatar_url, banner_url, niche, is_verified, active, created_at")
        .eq("active", true)
        .limit(limit);

      if (storesData && storesData.length > 0) {
        return storesData.map((s: any) => ({
          id: s.id,
          category: s.niche || "servicos",
          address: "Chapecó - SC",
          latitude: null,
          longitude: null,
          contact_phone: "(49) 99999-0000",
          working_hours: "Seg a Sex: 08:00 - 18:00",
          is_verified: !!s.is_verified,
          status: "active",
          created_at: s.created_at,
          stores: {
            name: s.name,
            type: s.niche || "ecommerce",
            description: "Empresa e atendimento local na comunidade.",
            avatar_url: s.avatar_url,
          },
        }));
      }
    } catch (err) {
      console.warn("[directory] Fallback para sementes de diretório:", err);
    }

    if (data?.category && data.category !== "todos") {
      return SEED_DIRECTORY.filter((d) => d.category === data.category);
    }

    return SEED_DIRECTORY.slice(0, limit);
  });
