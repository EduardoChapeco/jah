import { createFileRoute } from "@tanstack/react-router";
import { getServerClient } from "@/lib/supabase";

export const Route = createFileRoute("/api/pwa/manifest.json")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const storeId = url.searchParams.get("storeId");
          const slug = url.searchParams.get("slug");

          // Manifest Padrão do Super App Wider
          const defaultManifest = {
            name: "Wider — Super App Comunitário",
            short_name: "Wider",
            description: "Wider Community Platform — Comércio Local, Serviços, Turismo e Comunidade",
            start_url: "/",
            scope: "/",
            display: "standalone",
            background_color: "#f4f4f0",
            theme_color: "#1a1a14",
            orientation: "portrait-primary",
            icons: [
              {
                src: "/favicon.ico",
                sizes: "64x64 32x32 24x24 16x16",
                type: "image/x-icon",
              },
              {
                src: "/icons/icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any maskable",
              },
              {
                src: "/icons/icon-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any maskable",
              },
            ],
          };

          if (!storeId && !slug) {
            return new Response(JSON.stringify(defaultManifest, null, 2), {
              headers: {
                "Content-Type": "application/manifest+json; charset=utf-8",
                "Cache-Control": "public, max-age=3600, s-maxage=86400",
                "Access-Control-Allow-Origin": "*",
              },
            });
          }

          const db = getServerClient();
          let query = db.from("stores").select("id, name, slug, description, settings");

          if (storeId) {
            query = query.eq("id", storeId);
          } else if (slug) {
            query = query.eq("slug", slug);
          }

          const { data: store, error } = await query.single();

          if (error || !store) {
            return new Response(JSON.stringify(defaultManifest, null, 2), {
              headers: {
                "Content-Type": "application/manifest+json; charset=utf-8",
                "Cache-Control": "public, max-age=300",
                "Access-Control-Allow-Origin": "*",
              },
            });
          }

          const settings = (store.settings || {}) as Record<string, any>;
          const logoUrl =
            settings.logoUrl ||
            settings.logo_url ||
            settings.cover_url ||
            settings.coverUrl ||
            "/icons/icon-512x512.png";

          const primaryColor = settings.primaryColor || settings.primary_color || "#09090b";
          const shortName = store.name.length > 12 ? store.name.slice(0, 12).trim() : store.name;
          const storeStartUrl = `/perfil-da-loja?storeId=${store.id}&source=pwa`;

          const storeManifest = {
            name: `${store.name} — Loja Oficial`,
            short_name: shortName,
            description:
              store.description ||
              `Aplicativo oficial da ${store.name}. Faça pedidos, veja o catálogo e fale conosco direto pelo celular.`,
            start_url: storeStartUrl,
            scope: `/`,
            display: "standalone",
            background_color: "#ffffff",
            theme_color: primaryColor,
            orientation: "portrait-primary",
            icons: [
              {
                src: logoUrl,
                sizes: "192x192",
                type: "image/png",
                purpose: "any maskable",
              },
              {
                src: logoUrl,
                sizes: "512x512",
                type: "image/png",
                purpose: "any maskable",
              },
            ],
            shortcuts: [
              {
                name: "Catálogo & Cardápio",
                short_name: "Catálogo",
                description: "Ver todos os produtos e promoções",
                url: `${storeStartUrl}&tab=catalogo`,
              },
              {
                name: "Fale Conosco",
                short_name: "WhatsApp",
                description: "Atendimento direto",
                url: `${storeStartUrl}&tab=contato`,
              },
            ],
          };

          return new Response(JSON.stringify(storeManifest, null, 2), {
            headers: {
              "Content-Type": "application/manifest+json; charset=utf-8",
              "Cache-Control": "public, max-age=600, s-maxage=3600",
              "Access-Control-Allow-Origin": "*",
            },
          });
        } catch (err: any) {
          console.error("[api.pwa.manifest] Error generating manifest:", err);
          return new Response(JSON.stringify({ error: "Erro ao gerar manifesto PWA" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
