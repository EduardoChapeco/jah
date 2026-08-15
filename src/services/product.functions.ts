/**
 * Product detail server function Commerce (BFF boundary)
 *
 * Single product lookup by slug. Returns full detail DTO including
 * variants with server-computed effective prices, available quantities,
 * display names, media per variant, and all logistics fields.
 * Never exposes cost_cents to the client.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getAnonServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import type {
  ProductDetailResult,
  ProductDetailDTO,
  VariantDTO,
  ProductMediaDTO,
} from "@/types/catalog";

const SEED_PRODUCT_DETAILS: Record<string, Partial<ProductDetailDTO>> = {
  "smash-burger-duplo": {
    id: "b0000000-0000-0000-0000-000000000001",
    slug: "smash-burger-duplo",
    title: "Smash Burger Duplo Artesanal com Queijo Canastra",
    description:
      "Dois blends de 90g prensados na chapa ultra quente com crosta caramelizada, queijo da canastra derretido, maionese artesanal da casa e pão brioche amanteigado tostado.",
    shortDescription: "Burger artesanal com crosta perfeita e queijo canastra",
    brand: "La Brasa Gourmet",
    priceCents: 3490,
    compareAtCents: 4890,
    isPhysical: true,
    preparationTimeDays: 0,
    media: [
      {
        id: "d0000000-0000-0000-0000-000000000001",
        url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
        alt: "Smash Burger Duplo Artesanal",
        mediaType: "image",
        sortOrder: 0,
        focalPoint: { x: 50, y: 50 },
      },
    ],
    variants: [
      {
        id: "c0000000-0000-0000-0000-000000000001",
        sku: "BRG-SMASH-01",
        displayName: "Individual (Padrão)",
        effectivePriceCents: 3490,
        availableQty: 50,
        attributes: { Tamanho: "Individual" },
        allowBackorder: false,
        backorderLeadTimeDays: 0,
        requiresPaymentForBackorder: true,
        media: [],
      },
      {
        id: "c0000000-0000-0000-0000-000000000002",
        sku: "BRG-SMASH-COMBO",
        displayName: "Combo com Batata Rústica & Refri",
        effectivePriceCents: 4790,
        availableQty: 40,
        attributes: { Tamanho: "Combo Completo" },
        allowBackorder: false,
        backorderLeadTimeDays: 0,
        requiresPaymentForBackorder: true,
        media: [],
      },
    ],
    optionGroups: [],
    reviews: [
      {
        id: "f0000000-0000-0000-0000-000000000099",
        rating: 5,
        comment: "Melhor smash burger de Chapecó! Carne no ponto e queijo derretido sensacional.",
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        reviewer_name: "Guilherme M.",
      },
    ],
    categories: [
      { id: "c0000000-0001-0000-0000-000000000001", name: "Gastronomia", slug: "gastronomia" },
    ],
  },
  "cafe-especial-graos": {
    id: "b0000000-0000-0000-0000-000000000002",
    slug: "cafe-especial-graos",
    title: "Café Especial Moído na Hora (250g) - Notas Florais",
    description:
      "Grãos selecionados 100% arábica da Serra da Mantiqueira. Torra média com notas sensoriais de caramelo, jasmim e frutas amarelas.",
    brand: "Torrefação Autoral",
    priceCents: 2900,
    compareAtCents: 3800,
    isPhysical: true,
    media: [
      {
        id: "d0000000-0000-0000-0000-000000000002",
        url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80",
        alt: "Café Especial Grãos",
        mediaType: "image",
        sortOrder: 0,
        focalPoint: { x: 50, y: 50 },
      },
    ],
    variants: [
      {
        id: "c0000000-0000-0000-0000-000000000003",
        sku: "CAF-250G",
        displayName: "Pacote 250g (Grãos)",
        effectivePriceCents: 2900,
        availableQty: 35,
        attributes: { Moagem: "Em Grãos" },
        allowBackorder: false,
        backorderLeadTimeDays: 0,
        requiresPaymentForBackorder: true,
        media: [],
      },
    ],
    optionGroups: [],
    reviews: [],
    categories: [
      { id: "c0000000-0001-0000-0000-000000000002", name: "Gastronomia", slug: "gastronomia" },
    ],
  },
};

async function _getProductBySlug(slug: string): Promise<ProductDetailDTO> {
  try {
    const db = getAnonServerClient();

    // 1. Tenta buscar no banco de dados primeiro
    let query = db
      .from("products")
      .select(
        `id, slug, title, description, brand, manufacturer, ean,
         price_cents, compare_at_cents, allows_preorder,
         seo_title, seo_description, meta_title, meta_description, short_description, status,
         is_physical, weight_kg, width_cm, height_cm, length_cm, preparation_time_days,
         product_media(id, url, alt, media_type, sort_order, focal_point, variant_id),
         product_variants(
           id, sku, display_name, status, price_override_cents,
           stock_on_hand, attributes, ean,
           weight_kg, width_cm, height_cm, length_cm,
           allow_backorder, backorder_lead_time_days, requires_payment_for_backorder,
           product_media(id, url, alt, media_type, sort_order, focal_point)
         ),
         product_categories(
           category_id,
           categories(id, name, slug)
         ),
         product_option_groups(
           sort_order,
           option_groups(
             id, internal_name, display_name, selection_type,
             min_selections, max_selections, is_required,
             option_values(
               id, label, price_modifier_cents, is_default, is_active, sort_order
             )
           )
         ),
         reviews(id, rating, comment, created_at, status, reviewer_name)
        `,
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    const { data: product, error } = await query;

    if (product) {
      type RawMedia = {
        id: string;
        url: string;
        alt: string | null;
        media_type: string;
        sort_order: number;
        focal_point: { x: number; y: number } | null;
        variant_id?: string | null;
      };
      type RawVariant = {
        id: string;
        sku: string;
        display_name: string | null;
        status: string;
        price_override_cents: number | null;
        stock_on_hand: number;
        attributes: Record<string, string>;
        ean: string | null;
        weight_kg: number | null;
        width_cm: number | null;
        height_cm: number | null;
        length_cm: number | null;
        allow_backorder: boolean | null;
        backorder_lead_time_days: number | null;
        requires_payment_for_backorder: boolean | null;
        product_media: RawMedia[] | null;
      };

      const mapMedia = (m: RawMedia): ProductMediaDTO => ({
        id: m.id,
        url: m.url,
        alt: m.alt ?? null,
        mediaType: m.media_type as ProductMediaDTO["mediaType"],
        sortOrder: m.sort_order,
        focalPoint: m.focal_point ?? { x: 50, y: 50 },
        variantId: m.variant_id ?? null,
      });

      const rawMedia = (product.product_media as RawMedia[] | null) ?? [];
      const sortedMedia = rawMedia
        .filter((m) => !m.variant_id)
        .map(mapMedia)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      const variants: VariantDTO[] = ((product.product_variants as RawVariant[] | null) ?? [])
        .filter((v) => v.status === "active")
        .map((v) => ({
          id: v.id,
          sku: v.sku,
          displayName: v.display_name ?? null,
          effectivePriceCents: v.price_override_cents ?? (product.price_cents as number),
          availableQty: v.stock_on_hand,
          attributes: v.attributes ?? {},
          ean: v.ean ?? null,
          weightKg: v.weight_kg ?? (product.weight_kg as number | null) ?? null,
          widthCm: v.width_cm ?? (product.width_cm as number | null) ?? null,
          heightCm: v.height_cm ?? (product.height_cm as number | null) ?? null,
          lengthCm: v.length_cm ?? (product.length_cm as number | null) ?? null,
          allowBackorder: v.allow_backorder ?? false,
          backorderLeadTimeDays: v.backorder_lead_time_days ?? 0,
          requiresPaymentForBackorder: v.requires_payment_for_backorder ?? true,
          media: ((v.product_media as RawMedia[] | null) ?? [])
            .map(mapMedia)
            .sort((a, b) => a.sortOrder - b.sortOrder),
        }));

      const canonicalSeoTitle =
        (product.meta_title as string | null) ?? (product.seo_title as string | null) ?? null;
      const canonicalSeoDescription =
        (product.meta_description as string | null) ??
        (product.seo_description as string | null) ??
        null;

      const optionGroups: any[] = ((product.product_option_groups as any[]) ?? [])
        .map((pog: any) => {
          const og = pog.option_groups;
          if (!og) return null;
          return {
            id: og.id,
            internalName: og.internal_name,
            displayName: og.display_name,
            selectionType: og.selection_type,
            minSelections: og.min_selections,
            maxSelections: og.max_selections,
            isRequired: og.is_required,
            sortOrder: pog.sort_order,
            values: (og.option_values ?? [])
              .filter((v: any) => v.is_active)
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((v: any) => ({
                id: v.id,
                label: v.label,
                priceModifierCents: v.price_modifier_cents,
                isDefault: v.is_default,
              })),
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
        .map((og: any) => {
          const { sortOrder, ...rest } = og;
          return rest;
        });

      return {
        id: product.id as string,
        slug: product.slug as string,
        title: product.title as string,
        description: (product.description as string | null) ?? null,
        shortDescription: (product.short_description as string | null) ?? null,
        brand: (product.brand as string | null) ?? null,
        manufacturer: (product.manufacturer as string | null) ?? null,
        ean: (product.ean as string | null) ?? null,
        priceCents: product.price_cents as number,
        compareAtCents: (product.compare_at_cents as number | null) ?? null,
        media: sortedMedia,
        variants,
        optionGroups,
        seoTitle: canonicalSeoTitle,
        seoDescription: canonicalSeoDescription,
        weightKg: (product.weight_kg as number | null) ?? null,
        widthCm: (product.width_cm as number | null) ?? null,
        heightCm: (product.height_cm as number | null) ?? null,
        lengthCm: (product.length_cm as number | null) ?? null,
        isPhysical: product.is_physical !== false,
        preparationTimeDays: (product.preparation_time_days as number | null) ?? 0,
        reviews: ((product.reviews as any[] | null) ?? []).map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          reviewer_name: (r.reviewer_name as string | null) ?? null,
        })),
        categories: ((product.product_categories as any[] | null) ?? [])
          .map((pc: any) => pc.categories)
          .filter(Boolean),
      };
    }

    // 2. Se não encontrado no banco, verifica se é um produto seed do catálogo
    const seed = SEED_PRODUCT_DETAILS[slug];
    if (seed) {
      return {
        id: seed.id || `prod-${slug}`,
        slug: slug,
        title: seed.title || "Produto Comunitário JAH",
        description: seed.description || "Produto autoral exclusivo da nossa comunidade.",
        shortDescription: seed.shortDescription || null,
        brand: seed.brand || "Marca Local",
        manufacturer: null,
        ean: null,
        priceCents: seed.priceCents || 2990,
        compareAtCents: seed.compareAtCents || null,
        media: seed.media || [],
        variants: (seed.variants as VariantDTO[]) || [
          {
            id: "c0000000-0000-0000-0000-000000000001",
            sku: `SKU-${slug.toUpperCase()}`,
            displayName: "Padrão",
            effectivePriceCents: seed.priceCents || 2990,
            availableQty: 25,
            attributes: {},
            allowBackorder: false,
            backorderLeadTimeDays: 0,
            requiresPaymentForBackorder: true,
            media: [],
          },
        ],
        optionGroups: seed.optionGroups || [],
        seoTitle: seed.title,
        seoDescription: seed.shortDescription || null,
        weightKg: 0.5,
        widthCm: 15,
        heightCm: 10,
        lengthCm: 20,
        isPhysical: true,
        preparationTimeDays: 0,
        reviews: seed.reviews || [],
        categories: seed.categories || [
          { id: "cat-geral", name: "Mercado Local", slug: "mercado" },
        ],
      };
    }

    throw new Error("Produto não encontrado");
  } catch (e) {
    if (e instanceof SupabaseUnconfiguredError) {
      throw new Error("Os detalhes deste produto estão temporariamente offline para manutenção.");
    }
    if (e instanceof Error) throw e;
    console.error("[product.functions] unexpected error:", e);
    throw new Error("Erro inesperado ao carregar o produto.");
  }
}

export const getProductBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data: { slug } }) => {
    return _getProductBySlug(slug);
  });
