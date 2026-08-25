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

async function _getProductBySlug(slug: string): Promise<ProductDetailDTO> {
  try {
    const db = getAnonServerClient();

    // 1. Tenta buscar produto com joins essenciais
    let { data: product, error } = await db
      .from("products")
      .select(
        `id, slug, title, description, brand, manufacturer, ean,
         price_cents, compare_at_cents, allows_preorder, store_id,
         seo_title, seo_description, meta_title, meta_description, short_description, status,
         is_physical, weight_kg, width_cm, height_cm, length_cm, preparation_time_days, stores(id, name, slug, logo_url, city, state, address, is_verified, rating),
         product_media(id, url, alt, media_type, sort_order, focal_point, variant_id),
         product_variants(
           id, sku, display_name, status, price_override_cents,
           stock_on_hand, attributes, ean,
           weight_kg, width_cm, height_cm, length_cm,
           allow_backorder, backorder_lead_time_days, requires_payment_for_backorder,
           product_media(id, url, alt, media_type, sort_order, focal_point)
         )
        `,
      )
      .eq("slug", slug)
      .neq("status", "archived")
      .maybeSingle();

    // Fallback: Se falhou por joins complexos, busca produto simples
    if (!product && error) {
      console.warn("[product.functions] Erro no join complexo, tentando busca direta:", error.message);
      const simpleRes = await db
        .from("products")
        .select("*")
        .eq("slug", slug)
        .neq("status", "archived")
        .maybeSingle();
      
      if (simpleRes.data) {
        const prodId = simpleRes.data.id;
        const [mediaRes, varRes] = await Promise.all([
          db.from("product_media").select("*").eq("product_id", prodId),
          db.from("product_variants").select("*").eq("product_id", prodId),
        ]);
        product = {
          ...simpleRes.data,
          product_media: mediaRes.data || [],
          product_variants: varRes.data || [],
        };
      }
    }

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

      if (variants.length === 0) {
        variants.push({
          id: product.id as string,
          sku: (product.ean as string | null) || `SKU-${(product.id as string).slice(0, 8)}`,
          displayName: (product.title as string) || "Padrão",
          effectivePriceCents: (product.price_cents as number) || 0,
          availableQty: 99,
          attributes: {},
          ean: (product.ean as string | null) ?? null,
          weightKg: (product.weight_kg as number | null) ?? null,
          widthCm: (product.width_cm as number | null) ?? null,
          heightCm: (product.height_cm as number | null) ?? null,
          lengthCm: (product.length_cm as number | null) ?? null,
          allowBackorder: true,
          backorderLeadTimeDays: 0,
          requiresPaymentForBackorder: false,
          media: sortedMedia,
        });
      }

      const canonicalSeoTitle =
        (product.meta_title as string | null) ?? (product.seo_title as string | null) ?? null;
      const canonicalSeoDescription =
        (product.meta_description as string | null) ??
        (product.seo_description as string | null) ??
        null;

      const rawProduct = product as any;
      const optionGroups: any[] = ((rawProduct.product_option_groups as any[]) ?? [])
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
        storeId: (product.store_id as string | null) ?? undefined,
        store: (product as any).stores || null,
        store_id: (product.store_id as string | null) ?? undefined,
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
        reviews: ((rawProduct.reviews as any[] | null) ?? []).map((r: any) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          reviewer_name: (r.reviewer_name as string | null) ?? null,
        })),
        categories: ((rawProduct.product_categories as any[] | null) ?? [])
          .map((pc: any) => pc.categories)
          .filter(Boolean),
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
