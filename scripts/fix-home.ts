import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const serviceClient = createClient(supabaseUrl, serviceKey);

async function run() {
  const { data: store } = await serviceClient
    .from("stores")
    .select("id")
    .eq("slug", "loja-modelo")
    .single();
  const storeId = store.id;

  const { data: colNovidades } = await serviceClient
    .from("collections")
    .select("id")
    .eq("slug", "novidades")
    .single();
  const { data: colMaisVendidos } = await serviceClient
    .from("collections")
    .select("id")
    .eq("slug", "mais-vendidos")
    .single();

  const mediaUrls = {
    hero_banner:
      "https://gnfhhvcgnswctzvjcefe.supabase.co/storage/v1/object/public/product-media/loja-modelo/lm-hero-banner.svg",
  };

  await serviceClient
    .from("experience_documents")
    .delete()
    .eq("store_id", storeId)
    .eq("slug", "home");

  const { data: doc } = await serviceClient
    .from("experience_documents")
    .insert({
      store_id: storeId,
      document_type: "storefront",
      slug: "home",
      title: "Página Inicial da Loja Modelo",
      is_active: true,
    })
    .select("id")
    .single();

  const { data: version } = await serviceClient
    .from("experience_versions")
    .insert({
      document_id: doc!.id,
      version_number: 2,
      status: "published",
      commit_message: "Fix: Top level sections",
    })
    .select("id")
    .single();

  const nodesToInsert = [
    {
      version_id: version!.id,
      parent_id: null, // Top level!
      node_type: "section",
      block_type: "hero_carousel",
      sort_order: 0,
      content: {
        banners: [
          {
            image_url: mediaUrls.hero_banner,
            title: "Coleção de Inverno 2026",
            subtitle: "Conforto e elegância para os dias mais frios.",
            button_text: "Explorar Coleção",
            link: "/colecao/novidades",
          },
        ],
      },
    },
    {
      version_id: version!.id,
      parent_id: null, // Top level!
      node_type: "section",
      block_type: "product_carousel",
      sort_order: 1,
      content: {
        title: "Lançamentos Quentes",
      },
      data_bindings: {
        source: "product_collection",
        collection_slug: "novidades",
        limit: 8,
      },
    },
    {
      version_id: version!.id,
      parent_id: null, // Top level!
      node_type: "section",
      block_type: "product_grid",
      sort_order: 2,
      content: {
        title: "Os Mais Vendidos",
        subtitle: "As peças favoritas dos nossos clientes.",
      },
      data_bindings: {
        source: "product_collection",
        collection_slug: "mais-vendidos",
        limit: 12,
      },
    },
  ];

  const { error: nodesErr } = await serviceClient.from("experience_nodes").insert(nodesToInsert);
  if (nodesErr) console.error("Error:", nodesErr);
  else console.log("Fixed! 3 top-level sections inserted.");
}

run();
