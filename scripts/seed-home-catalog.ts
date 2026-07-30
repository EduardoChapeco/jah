import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceKey) {
  console.error("❌ ERRO: Faltando chaves do Supabase.");
  process.exit(1);
}

const serviceClient = createClient(supabaseUrl, serviceKey);

// ==============================================================================
// UTILITÁRIOS
// ==============================================================================

async function uploadSvgPlaceholder(filename: string, text: string, color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
    <rect width="100%" height="100%" fill="${color}" />
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#ffffff" text-anchor="middle" dy=".3em">${text}</text>
  </svg>`;

  const { error } = await serviceClient.storage
    .from("product-media")
    .upload(`loja-modelo/${filename}`, svg, {
      contentType: "image/svg+xml",
      upsert: true,
    });

  if (error) {
    console.warn(`⚠️ Aviso: Falha no upload de ${filename}:`, error);
  }

  const { data } = serviceClient.storage.from("product-media").getPublicUrl(`loja-modelo/${filename}`);
  return data.publicUrl;
}

// ==============================================================================
// MAIN SCRIPT
// ==============================================================================

async function runExpandedSeed() {
  console.log("================================================================================");
  console.log("👗 INICIANDO EXPANSÃO DO CATÁLOGO DE VESTUÁRIO E BUILDER HOMEPAGE");
  console.log("================================================================================\n");

  const { data: store } = await serviceClient.from("stores").select("id").eq("slug", "loja-modelo").single();
  if (!store) {
    console.error("❌ ERRO: Loja Modelo não encontrada! Execute o orquestrador base primeiro.");
    process.exit(1);
  }
  const storeId = store.id;

  // 1. CARGA DE MÍDIAS (Vestuário)
  console.log("⏳ [1/4] Gerando imagens de vestuário...");
  const mediaUrls = {
    jaqueta_preta: await uploadSvgPlaceholder("lm-jaq-preto.svg", "Jaqueta Preta", "#111827"),
    jaqueta_bege: await uploadSvgPlaceholder("lm-jaq-bege.svg", "Jaqueta Bege", "#D4D4D8"),
    jaqueta_verde: await uploadSvgPlaceholder("lm-jaq-verde.svg", "Jaqueta Verde", "#047857"),
    moletom_cinza: await uploadSvgPlaceholder("lm-mol-cinza.svg", "Moletom Cinza", "#9CA3AF"),
    moletom_azul: await uploadSvgPlaceholder("lm-mol-azul.svg", "Moletom Azul", "#1D4ED8"),
    jeans_claro: await uploadSvgPlaceholder("lm-jeans-claro.svg", "Jeans Claro", "#60A5FA"),
    jeans_escuro: await uploadSvgPlaceholder("lm-jeans-escuro.svg", "Jeans Escuro", "#1E3A8A"),
    hero_banner: await uploadSvgPlaceholder("lm-hero-banner.svg", "Coleção de Inverno", "#0F172A")
  };

  // 2. CATEGORIAS / COLEÇÕES
  console.log("⏳ [2/4] Identificando referências de taxonomia...");
  
  async function getOrCreateCategory(name: string, slug: string) {
    let { data: cat } = await serviceClient.from("categories").select("id").eq("slug", slug).single();
    if (!cat) {
      const { data: newCat, error } = await serviceClient.from("categories").insert({ store_id: storeId, name, slug, sort_order: 0 }).select("id").single();
      if (error) console.error("Error creating category:", error);
      cat = newCat;
    }
    return cat;
  }

  async function getOrCreateCollection(name: string, slug: string) {
    let { data: col } = await serviceClient.from("collections").select("id").eq("slug", slug).single();
    if (!col) {
      const { data: newCol, error } = await serviceClient.from("collections").insert({ store_id: storeId, name, slug }).select("id").single();
      if (error) console.error("Error creating collection:", error);
      col = newCol;
    }
    return col;
  }

  const catMasc = await getOrCreateCategory("Moda Masculina", "moda-masculina");
  const catFem = await getOrCreateCategory("Moda Feminina", "moda-feminina");
  const colNovidades = await getOrCreateCollection("Novidades", "novidades");
  const colMaisVendidos = await getOrCreateCollection("Mais Vendidos", "mais-vendidos");

  if (!catMasc || !catFem || !colNovidades || !colMaisVendidos) {
    console.error("❌ ERRO: Falha ao obter ou criar categorias e coleções.");
    process.exit(1);
  }

  // 3. SEED DOS PRODUTOS
  console.log("⏳ [3/4] Injetando matriz de produtos (Vestuário)...");

  async function seedProduct(
    skuPrefix: string,
    title: string,
    priceCents: number,
    options: { name: string; values: string[] }[],
    variants: { sku: string; price_cents: number; stock: number; attributes: any; image_url?: string }[],
    categoryId: string,
    collectionId: string
  ) {
    const slug = skuPrefix.toLowerCase();
    
    // Limpeza idempotente
    const { data: existing } = await serviceClient.from("products").select("id").eq("slug", slug).single();
    if (existing) {
      const pId = existing.id;
      await serviceClient.from("product_media").delete().eq("product_id", pId);
      const { data: vars } = await serviceClient.from("product_variants").select("id").eq("product_id", pId);
      if (vars && vars.length > 0) {
        await serviceClient.from("stock_movements").delete().in("variant_id", vars.map(v => v.id));
      }
      await serviceClient.from("product_variants").delete().eq("product_id", pId);
      await serviceClient.from("product_categories").delete().eq("product_id", pId);
      await serviceClient.from("product_collections").delete().eq("product_id", pId);
      await serviceClient.from("products").delete().eq("id", pId);
    }

    const payload = {
      store_id: storeId,
      title,
      slug,
      description: `Peça premium de vestuário demonstrativo (${title}).`,
      price_cents: priceCents,
      status: "published",
      options,
      variants,
    };

    const { data: createRes, error: createErr } = await serviceClient.rpc("create_product_transaction_v1", { payload });
    if (createErr || !createRes) {
      console.error(`❌ Erro ao criar ${title}:`, createErr);
      return;
    }
    const productId = createRes.id;

    await serviceClient.from("product_categories").insert({ product_id: productId, category_id: categoryId });
    await serviceClient.from("product_collections").insert({ product_id: productId, collection_id: collectionId });

    const matrixUpdate = variants.map(v => ({ sku: v.sku, attributes: v.attributes, stock: v.stock }));
    await serviceClient.rpc("batch_upsert_variant_matrix_v1", { store_id_param: storeId, product_id_param: productId, matrix: matrixUpdate });

    // Vincula a imagem (usando a primeira disponível)
    const defaultImage = variants.find(v => v.image_url)?.image_url;
    if (defaultImage) {
      await serviceClient.from("product_media").insert({
        product_id: productId,
        url: defaultImage,
        position: 0,
        type: "image",
      });
    }

    console.log(`   ✔️ Criado: ${title} (${variants.length} variantes)`);
  }

  // P6: Jaqueta Puffer (3 cores x 4 tamanhos)
  await seedProduct(
    "LM-JAQ-06", "Jaqueta Puffer Essential", 34990,
    [
      { name: "Cor", values: ["Preto", "Bege", "Verde"] },
      { name: "Tamanho", values: ["P", "M", "G", "GG"] }
    ],
    [
      { sku: "LM-JAQ-06-PR-P", price_cents: 34990, stock: 5, attributes: { Cor: "Preto", Tamanho: "P" }, image_url: mediaUrls.jaqueta_preta },
      { sku: "LM-JAQ-06-PR-M", price_cents: 34990, stock: 8, attributes: { Cor: "Preto", Tamanho: "M" } },
      { sku: "LM-JAQ-06-PR-G", price_cents: 34990, stock: 0, attributes: { Cor: "Preto", Tamanho: "G" } }, // Esgotado
      { sku: "LM-JAQ-06-PR-GG", price_cents: 34990, stock: 2, attributes: { Cor: "Preto", Tamanho: "GG" } },
      
      { sku: "LM-JAQ-06-BE-P", price_cents: 34990, stock: 4, attributes: { Cor: "Bege", Tamanho: "P" }, image_url: mediaUrls.jaqueta_bege },
      { sku: "LM-JAQ-06-BE-M", price_cents: 34990, stock: 5, attributes: { Cor: "Bege", Tamanho: "M" } },
      { sku: "LM-JAQ-06-BE-G", price_cents: 34990, stock: 5, attributes: { Cor: "Bege", Tamanho: "G" } },
      { sku: "LM-JAQ-06-BE-GG", price_cents: 34990, stock: 2, attributes: { Cor: "Bege", Tamanho: "GG" } },
      
      { sku: "LM-JAQ-06-VD-P", price_cents: 34990, stock: 3, attributes: { Cor: "Verde", Tamanho: "P" }, image_url: mediaUrls.jaqueta_verde },
      { sku: "LM-JAQ-06-VD-M", price_cents: 34990, stock: 0, attributes: { Cor: "Verde", Tamanho: "M" } },
      { sku: "LM-JAQ-06-VD-G", price_cents: 34990, stock: 2, attributes: { Cor: "Verde", Tamanho: "G" } },
      { sku: "LM-JAQ-06-VD-GG", price_cents: 34990, stock: 1, attributes: { Cor: "Verde", Tamanho: "GG" } },
    ],
    catFem.id, colNovidades.id
  );

  // P7: Moletom Canguru (2 cores x 4 tamanhos)
  await seedProduct(
    "LM-MOL-07", "Moletom Canguru", 19900,
    [
      { name: "Cor", values: ["Cinza", "Azul"] },
      { name: "Tamanho", values: ["P", "M", "G", "GG"] }
    ],
    [
      { sku: "LM-MOL-07-CZ-P", price_cents: 19900, stock: 10, attributes: { Cor: "Cinza", Tamanho: "P" }, image_url: mediaUrls.moletom_cinza },
      { sku: "LM-MOL-07-CZ-M", price_cents: 19900, stock: 10, attributes: { Cor: "Cinza", Tamanho: "M" } },
      { sku: "LM-MOL-07-CZ-G", price_cents: 19900, stock: 5, attributes: { Cor: "Cinza", Tamanho: "G" } },
      { sku: "LM-MOL-07-CZ-GG", price_cents: 19900, stock: 0, attributes: { Cor: "Cinza", Tamanho: "GG" } },
      
      { sku: "LM-MOL-07-AZ-P", price_cents: 19900, stock: 8, attributes: { Cor: "Azul", Tamanho: "P" }, image_url: mediaUrls.moletom_azul },
      { sku: "LM-MOL-07-AZ-M", price_cents: 19900, stock: 7, attributes: { Cor: "Azul", Tamanho: "M" } },
      { sku: "LM-MOL-07-AZ-G", price_cents: 19900, stock: 0, attributes: { Cor: "Azul", Tamanho: "G" } },
      { sku: "LM-MOL-07-AZ-GG", price_cents: 19900, stock: 3, attributes: { Cor: "Azul", Tamanho: "GG" } },
    ],
    catMasc.id, colMaisVendidos.id
  );

  // P8: Calça Jeans Slim (2 Lavagens x 4 Tamanhos)
  await seedProduct(
    "LM-JNS-08", "Calça Jeans Slim", 15990,
    [
      { name: "Lavagem", values: ["Clara", "Escura"] },
      { name: "Tamanho", values: ["38", "40", "42", "44"] }
    ],
    [
      { sku: "LM-JNS-08-CL-38", price_cents: 15990, stock: 4, attributes: { Lavagem: "Clara", Tamanho: "38" }, image_url: mediaUrls.jeans_claro },
      { sku: "LM-JNS-08-CL-40", price_cents: 15990, stock: 6, attributes: { Lavagem: "Clara", Tamanho: "40" } },
      { sku: "LM-JNS-08-CL-42", price_cents: 15990, stock: 3, attributes: { Lavagem: "Clara", Tamanho: "42" } },
      { sku: "LM-JNS-08-CL-44", price_cents: 15990, stock: 2, attributes: { Lavagem: "Clara", Tamanho: "44" } },
      
      { sku: "LM-JNS-08-ES-38", price_cents: 15990, stock: 5, attributes: { Lavagem: "Escura", Tamanho: "38" }, image_url: mediaUrls.jeans_escuro },
      { sku: "LM-JNS-08-ES-40", price_cents: 15990, stock: 7, attributes: { Lavagem: "Escura", Tamanho: "40" } },
      { sku: "LM-JNS-08-ES-42", price_cents: 15990, stock: 0, attributes: { Lavagem: "Escura", Tamanho: "42" } }, // Esgotado
      { sku: "LM-JNS-08-ES-44", price_cents: 15990, stock: 1, attributes: { Lavagem: "Escura", Tamanho: "44" } },
    ],
    catMasc.id, colMaisVendidos.id
  );

  // 4. CMS BUILDER - HOMEPAGE
  console.log("\n⏳ [4/4] Construindo Árvore DOM da Homepage...");
  
  // Clean up existing experience_documents with slug 'home' for idempotency
  await serviceClient.from("experience_documents").delete().eq("store_id", storeId).eq("slug", "home");

  // Create Document
  const { data: doc, error: docErr } = await serviceClient.from("experience_documents").insert({
    store_id: storeId,
    document_type: "storefront",
    slug: "home",
    title: "Página Inicial da Loja Modelo",
    is_active: true
  }).select("id").single();

  if (docErr || !doc) {
    console.error("❌ Erro ao criar documento CMS:", docErr);
    process.exit(1);
  }

  // Create Version
  const { data: version, error: verErr } = await serviceClient.from("experience_versions").insert({
    document_id: doc.id,
    version_number: 1,
    status: "published",
    commit_message: "LojaModelo: Initial Seed"
  }).select("id").single();

  if (verErr || !version) {
    console.error("❌ Erro ao criar versão do documento CMS:", verErr);
    process.exit(1);
  }

  // Create Nodes
  // Root node
  const { data: rootNode, error: rootErr } = await serviceClient.from("experience_nodes").insert({
    version_id: version.id,
    parent_id: null,
    node_type: "container",
    block_type: "root",
    sort_order: 0,
    content: {},
  }).select("id").single();

  if (rootErr || !rootNode) {
    console.error("❌ Erro ao criar root node:", rootErr);
    process.exit(1);
  }

  // Child Nodes
  const nodesToInsert = [
    {
      version_id: version.id,
      parent_id: rootNode.id,
      node_type: "section",
      block_type: "hero_carousel",
      sort_order: 0,
      content: {
        slides: [
          {
            image_url: mediaUrls.hero_banner,
            title: "Coleção de Inverno 2026",
            subtitle: "Conforto e elegância para os dias mais frios.",
            cta_text: "Explorar Coleção",
            cta_link: "/colecao/novidades"
          }
        ]
      }
    },
    {
      version_id: version.id,
      parent_id: rootNode.id,
      node_type: "section",
      block_type: "product_carousel",
      sort_order: 1,
      content: {
        title: "Lançamentos Quentes"
      },
      data_bindings: {
        collection_id: colNovidades.id,
        limit: 8
      }
    },
    {
      version_id: version.id,
      parent_id: rootNode.id,
      node_type: "section",
      block_type: "product_grid",
      sort_order: 2,
      content: {
        title: "Os Mais Vendidos",
        subtitle: "As peças favoritas dos nossos clientes."
      },
      data_bindings: {
        collection_id: colMaisVendidos.id,
        limit: 12
      }
    }
  ];

  const { error: nodesErr } = await serviceClient.from("experience_nodes").insert(nodesToInsert);
  
  if (nodesErr) {
    console.error("❌ Erro ao inserir nodes filho:", nodesErr);
    process.exit(1);
  }

  console.log("✅ CMS DOM Tree injetada com sucesso e vinculada às coleções Reais!");

  console.log("\n================================================================================");
  console.log("🏆 EXPANSÃO E BUILDER CONCLUÍDOS! A Homepage está conectada ao Catálogo.");
  console.log("================================================================================\n");
}

runExpandedSeed().catch(err => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
