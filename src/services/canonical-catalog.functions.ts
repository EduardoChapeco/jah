import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";

export interface CanonicalDeviceBrandDTO {
  id: string;
  name: string;
  slug: string;
  category: string;
  models?: Array<{ id: string; name: string; slug: string; release_year?: number; storage_options?: string[] }>;
}

export interface CanonicalVehicleBrandDTO {
  id: string;
  name: string;
  slug: string;
  vehicle_type: string;
  models?: Array<{ id: string; name: string; slug: string }>;
}

export interface CanonicalJobOccupationDTO {
  id: string;
  title: string;
  cbo_code?: string;
  category: string;
}

export async function fetchCanonicalDeviceBrands(category?: string): Promise<CanonicalDeviceBrandDTO[]> {
  try {
    const supabase = getServerClient();
    let query = supabase
      .from("canonical_device_brands")
      .select("id, name, slug, category, canonical_device_models(id, name, slug, release_year, storage_options)")
      .order("name", { ascending: true });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return (data as any[]).map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        category: b.category,
        models: b.canonical_device_models || [],
      }));
    }
  } catch (err) {
    console.warn("[canonical-catalog] Erro ao buscar marcas de aparelhos:", err);
  }

  // Fallback canônico
  return [
    {
      id: "brand-apple",
      name: "Apple",
      slug: "apple",
      category: "smartphones",
      models: [
        { id: "m-ip16pm", name: "iPhone 16 Pro Max", slug: "iphone-16-pro-max", release_year: 2024 },
        { id: "m-ip16p", name: "iPhone 16 Pro", slug: "iphone-16-pro", release_year: 2024 },
        { id: "m-ip16", name: "iPhone 16", slug: "iphone-16", release_year: 2024 },
        { id: "m-ip15pm", name: "iPhone 15 Pro Max", slug: "iphone-15-pro-max", release_year: 2023 },
        { id: "m-ip15p", name: "iPhone 15 Pro", slug: "iphone-15-pro", release_year: 2023 },
        { id: "m-ip15", name: "iPhone 15", slug: "iphone-15", release_year: 2023 },
        { id: "m-ip14", name: "iPhone 14", slug: "iphone-14", release_year: 2022 },
        { id: "m-ip13", name: "iPhone 13", slug: "iphone-13", release_year: 2021 },
        { id: "m-ip12", name: "iPhone 12", slug: "iphone-12", release_year: 2020 },
        { id: "m-ip11", name: "iPhone 11", slug: "iphone-11", release_year: 2019 },
      ],
    },
    {
      id: "brand-samsung",
      name: "Samsung",
      slug: "samsung",
      category: "smartphones",
      models: [
        { id: "m-s24u", name: "Galaxy S24 Ultra", slug: "galaxy-s24-ultra", release_year: 2024 },
        { id: "m-s24", name: "Galaxy S24", slug: "galaxy-s24", release_year: 2024 },
        { id: "m-s23", name: "Galaxy S23", slug: "galaxy-s23", release_year: 2023 },
        { id: "m-zfold5", name: "Galaxy Z Fold 5", slug: "galaxy-z-fold-5", release_year: 2023 },
        { id: "m-a54", name: "Galaxy A54 5G", slug: "galaxy-a54-5g", release_year: 2023 },
      ],
    },
    {
      id: "brand-xiaomi",
      name: "Xiaomi",
      slug: "xiaomi",
      category: "smartphones",
      models: [
        { id: "m-xm14", name: "Xiaomi 14", slug: "xiaomi-14", release_year: 2024 },
        { id: "m-rn13p", name: "Redmi Note 13 Pro 5G", slug: "redmi-note-13-pro-5g", release_year: 2024 },
        { id: "m-px6p", name: "Poco X6 Pro", slug: "poco-x6-pro", release_year: 2024 },
      ],
    },
    {
      id: "brand-motorola",
      name: "Motorola",
      slug: "motorola",
      category: "smartphones",
      models: [
        { id: "m-e50u", name: "Edge 50 Ultra", slug: "edge-50-ultra", release_year: 2024 },
        { id: "m-g84", name: "Moto G84 5G", slug: "moto-g84-5g", release_year: 2023 },
      ],
    },
  ];
}

export async function fetchCanonicalVehicleBrands(vehicleType?: string): Promise<CanonicalVehicleBrandDTO[]> {
  try {
    const supabase = getServerClient();
    let query = supabase
      .from("canonical_vehicle_brands")
      .select("id, name, slug, vehicle_type, canonical_vehicle_models(id, name, slug)")
      .order("name", { ascending: true });

    if (vehicleType) {
      query = query.eq("vehicle_type", vehicleType);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return (data as any[]).map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        vehicle_type: b.vehicle_type,
        models: b.canonical_vehicle_models || [],
      }));
    }
  } catch (err) {
    console.warn("[canonical-catalog] Erro ao buscar marcas de veículos:", err);
  }

  return [
    {
      id: "vb-toyota",
      name: "Toyota",
      slug: "toyota",
      vehicle_type: "car",
      models: [
        { id: "vm-corolla", name: "Corolla", slug: "corolla" },
        { id: "vm-hilux", name: "Hilux", slug: "hilux" },
        { id: "vm-cross", name: "Corolla Cross", slug: "corolla-cross" },
      ],
    },
    {
      id: "vb-honda",
      name: "Honda",
      slug: "honda",
      vehicle_type: "car",
      models: [
        { id: "vm-civic", name: "Civic", slug: "civic" },
        { id: "vm-hrv", name: "HR-V", slug: "hr-v" },
      ],
    },
    {
      id: "vb-volkswagen",
      name: "Volkswagen",
      slug: "volkswagen",
      vehicle_type: "car",
      models: [
        { id: "vm-polo", name: "Polo", slug: "polo" },
        { id: "vm-tcross", name: "T-Cross", slug: "t-cross" },
        { id: "vm-nivus", name: "Nivus", slug: "nivus" },
      ],
    },
  ];
}

export async function fetchCanonicalJobOccupations(category?: string): Promise<CanonicalJobOccupationDTO[]> {
  try {
    const supabase = getServerClient();
    let query = supabase
      .from("canonical_job_occupations")
      .select("id, title, cbo_code, category")
      .order("title", { ascending: true });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      return data as CanonicalJobOccupationDTO[];
    }
  } catch (err) {
    console.warn("[canonical-catalog] Erro ao buscar ocupações de trabalho:", err);
  }

  return [
    { id: "job-1", title: "Vendedor / Consultor Comercial", cbo_code: "3541-20", category: "comercial" },
    { id: "job-2", title: "Atendente de Loja / Balcão", cbo_code: "5211-10", category: "atendimento" },
    { id: "job-3", title: "Recepcionista", cbo_code: "4221-05", category: "administrativo" },
    { id: "job-4", title: "Assistente Administrativo", cbo_code: "4110-10", category: "administrativo" },
    { id: "job-5", title: "Desenvolvedor de Software / TI", cbo_code: "2124-05", category: "tecnologia" },
    { id: "job-6", title: "Social Media / Designer", cbo_code: "2624-10", category: "marketing" },
    { id: "job-7", title: "Cozinheiro / Chefe de Cozinha", cbo_code: "5132-05", category: "gastronomia" },
    { id: "job-8", title: "Motorista Entregador / Cargas", cbo_code: "7823-10", category: "logistica" },
  ];
}

export const listCanonicalDeviceBrands = createServerFn({ method: "GET" })
  .validator(z.object({ category: z.string().optional() }).optional())
  .handler(async ({ data: input }) => {
    return await fetchCanonicalDeviceBrands(input?.category);
  });

export const listCanonicalVehicleBrands = createServerFn({ method: "GET" })
  .validator(z.object({ vehicle_type: z.string().optional() }).optional())
  .handler(async ({ data: input }) => {
    return await fetchCanonicalVehicleBrands(input?.vehicle_type);
  });

export const listCanonicalJobOccupations = createServerFn({ method: "GET" })
  .validator(z.object({ category: z.string().optional() }).optional())
  .handler(async ({ data: input }) => {
    return await fetchCanonicalJobOccupations(input?.category);
  });
