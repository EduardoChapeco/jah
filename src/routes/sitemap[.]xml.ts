import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { PUBLIC_ROUTES } from "@/lib/routes";

const BASE_URL = "https://jah.pages.dev";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // Only static, indexable public routes (no params, no checkout).
        const staticPaths = PUBLIC_ROUTES.filter(
          (r) => !r.dynamic && !r.path.startsWith("/checkout") && r.path !== "/carrinho",
        ).map((r) => r.path);

        const dynamicPaths: string[] = [];

        try {
          const { getServerClient } = await import("@/lib/supabase");
          const db = getServerClient();

          // 1. Fetch active pages
          const { data: pages } = await db.from("pages").select("slug").eq("status", "published");
          if (pages) {
            pages.forEach((p) => dynamicPaths.push(`/p/${p.slug}`));
          }

          // 2. Fetch active products
          const { data: products } = await db
            .from("products")
            .select("slug")
            .eq("status", "published");
          if (products) {
            products.forEach((p) => dynamicPaths.push(`/produto/${p.slug}`));
          }

          // 3. Fetch active classifieds
          const { data: classifieds } = await db
            .from("classifieds")
            .select("slug")
            .eq("status", "published");
          if (classifieds) {
            classifieds.forEach((c) => dynamicPaths.push(`/classificados/${c.slug}`));
          }
        } catch (e) {
          console.error("Error generating dynamic sitemap paths:", e);
        }

        const allPaths = [...staticPaths, ...dynamicPaths];

        const urls = allPaths
          .map(
            (path) =>
              `  <url>\n    <loc>${BASE_URL}${path}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`,
          )
          .join("\n");

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
