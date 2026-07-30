import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceKey) {
  console.error("❌ ERRO: Faltando VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no ambiente.");
  process.exit(1);
}

const serviceClient = createClient(supabaseUrl, serviceKey);

// ==============================================================================
// 1. UTILITÁRIOS
// ==============================================================================

async function uploadSvgPlaceholder(filename: string, text: string, color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
    <rect width="100%" height="100%" fill="${color}" />
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#ffffff" text-anchor="middle" dy=".3em">${text}</text>
  </svg>`;

  const { data, error } = await serviceClient.storage
    .from("product-media")
    .upload(`loja-modelo/${filename}`, svg, {
      contentType: "image/svg+xml",
      upsert: true,
    });

  if (error) {
    console.warn(`⚠️ Aviso: Falha ao fazer upload de ${filename}:`, error);
    return null;
  }

  const { data: publicData } = serviceClient.storage.from("product-media").getPublicUrl(`loja-modelo/${filename}`);
  return publicData.publicUrl;
}

// ==============================================================================
// 2. ORQUESTRADOR
// ==============================================================================

async function runSeed() {
  console.log("================================================================================");
  console.log("🌱 INICIANDO ORQUESTRADOR DE SEED - LOJA MODELO");
  console.log("================================================================================\n");

  // 1. ESTABILIZAÇÃO DO TENANT
  console.log("⏳ [1/5] Estabilizando Tenant (Organização e Loja)...");

  // Ajusta a organização
  const { data: org, error: orgErr } = await serviceClient
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (orgErr || !org) {
    console.error("❌ ERRO: Nenhuma organização encontrada.", orgErr);
    process.exit(1);
  }

  await serviceClient
    .from("organizations")
    .update({ name: "Loja Modelo Org", slug: "loja-modelo-org" })
    .eq("id", org.id);

  // Ajusta a loja
  const { data: store, error: storeErr } = await serviceClient
    .from("stores")
    .select("*")
    .eq("organization_id", org.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (storeErr || !store) {
    console.error("❌ ERRO: Nenhuma loja encontrada.", storeErr);
    process.exit(1);
  }

  await serviceClient
    .from("stores")
    .update({ name: "Loja Modelo", slug: "loja-modelo" })
    .eq("id", store.id);

  console.log(`✅ Loja configurada: "${store.name}" -> "Loja Modelo" (ID: ${store.id})`);

  // 2. UPLOAD DE MÍDIAS
  console.log("\n⏳ [2/5] Gerando Mídias de Demonstração...");
  const mediaUrls = {
    geral: await uploadSvgPlaceholder("lm-geral.svg", "Loja Modelo", "#4F46E5"),
    luminaria: await uploadSvgPlaceholder("lm-luminaria.svg", "Luminária", "#F59E0B"),
    tenis: await uploadSvgPlaceholder("lm-tenis.svg", "Tênis Runner", "#10B981"),
    cam_branco: await uploadSvgPlaceholder("lm-cam-branco.svg", "Camiseta Branca", "#D1D5DB"), // text white on light gray is hard, but it's ok for demo
    cam_preto: await uploadSvgPlaceholder("lm-cam-preto.svg", "Camiseta Preta", "#111827"),
    cam_azul: await uploadSvgPlaceholder("lm-cam-azul.svg", "Camiseta Azul", "#3B82F6"),
    smart_128: await uploadSvgPlaceholder("lm-smart-128.svg", "Phone 128GB", "#8B5CF6"),
    smart_256: await uploadSvgPlaceholder("lm-smart-256.svg", "Phone 256GB", "#6D28D9"),
    calca: await uploadSvgPlaceholder("lm-calca.svg", "Calça Alfaiataria", "#EC4899"),
    cama_branco: await uploadSvgPlaceholder("lm-cama-branco.svg", "Cama Branca", "#D1D5DB"),
    cama_cinza: await uploadSvgPlaceholder("lm-cama-cinza.svg", "Cama Cinza", "#6B7280"),
  };
  console.log("✅ Imagens processadas e hospedadas no Supabase Storage.");

  // 3. CATEGORIAS E COLEÇÕES
  console.log("\n⏳ [3/5] Estruturando Categorias e Coleções...");

  const catNames = ["Moda Feminina", "Moda Masculina", "Eletrônicos", "Casa e Decoração"];
  const categoryIds: Record<string, string> = {};

  for (const name of catNames) {
    const slug = name.toLowerCase().replace(/ /g, "-").replace(/ç/g, "c").replace(/ã/g, "a");
    const { data: cat } = await serviceClient
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .eq("store_id", store.id)
      .single();

    if (cat) {
      categoryIds[name] = cat.id;
    } else {
      const { data: newCat } = await serviceClient
        .from("categories")
        .insert({ store_id: store.id, name, slug, ordering: 0 })
        .select("id")
        .single();
      if (newCat) categoryIds[name] = newCat.id;
    }
  }

  const colNames = ["Novidades", "Mais Vendidos", "Ofertas"];
  const collectionIds: Record<string, string> = {};

  for (const name of colNames) {
    const slug = name.toLowerCase().replace(/ /g, "-");
    const { data: col } = await serviceClient
      .from("collections")
      .select("id")
      .eq("slug", slug)
      .eq("store_id", store.id)
      .single();

    if (col) {
      collectionIds[name] = col.id;
    } else {
      const { data: newCol } = await serviceClient
        .from("collections")
        .insert({ store_id: store.id, name, slug })
        .select("id")
        .single();
      if (newCol) collectionIds[name] = newCol.id;
    }
  }
  console.log("✅ Categorias e Coleções configuradas.");

  // 4. CARGA EXTREMA DE PRODUTOS
  console.log("\n⏳ [4/5] Processando Matriz de Produtos...");

  // Função auxiliar para injetar produto
  async function seedProduct(
    skuPrefix: string,
    title: string,
    priceCents: number,
    options: { name: string; values: string[] }[],
    variants: { sku: string; price_cents: number; stock: number; attributes: any; image_url?: string }[],
    categoryId: string,
    collectionId?: string
  ) {
    const slug = skuPrefix.toLowerCase();
    
    // Deleta anterior (Idempotência total baseada no slug)
    const { data: existing } = await serviceClient.from("products").select("id").eq("slug", slug).single();
    if (existing) {
      const pId = existing.id;
      // cascade deletes via foreign keys might not be fully configured, let's manually clean
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

    // Cria Produto
    const payload = {
      store_id: store.id,
      title,
      slug,
      description: `Produto demonstrativo (${title}) criado pelo orquestrador LojaModelo.`,
      price_cents: priceCents,
      status: "published",
      options,
      variants,
    };

    const { data: createRes, error: createErr } = await serviceClient.rpc("create_product_transaction_v1", { payload });
    if (createErr || !createRes) {
      console.error(`❌ Erro ao criar produto ${title}:`, createErr);
      return;
    }
    const productId = createRes.id;

    // Associa categoria e coleção
    if (categoryId) {
      await serviceClient.from("product_categories").insert({ product_id: productId, category_id: categoryId });
    }
    if (collectionId) {
      await serviceClient.from("product_collections").insert({ product_id: productId, collection_id: collectionId });
    }

    // Saldo real atômico
    const matrixUpdate = variants.map(v => ({
      sku: v.sku,
      attributes: v.attributes,
      stock: v.stock
    }));

    await serviceClient.rpc("batch_upsert_variant_matrix_v1", {
      store_id_param: store.id,
      product_id_param: productId,
      matrix: matrixUpdate,
    });

    // Anexa imagem padrão (primeira url)
    const defaultImage = variants.find(v => v.image_url)?.image_url || mediaUrls.geral;
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

  // P1: Simples
  await seedProduct(
    "LM-SMP-01", "Luminária de Mesa", 15000,
    [],
    [{ sku: "LM-SMP-01", price_cents: 15000, stock: 10, attributes: {}, image_url: mediaUrls.luminaria }],
    categoryIds["Casa e Decoração"], collectionIds["Novidades"]
  );

  // P2: 1 Opção (Tênis)
  await seedProduct(
    "LM-TNS-02", "Tênis Runner", 35000,
    [{ name: "Tamanho", values: ["38", "39", "40", "41"] }],
    [
      { sku: "LM-TNS-02-38", price_cents: 35000, stock: 5, attributes: { Tamanho: "38" } },
      { sku: "LM-TNS-02-39", price_cents: 35000, stock: 12, attributes: { Tamanho: "39" } },
      { sku: "LM-TNS-02-40", price_cents: 35000, stock: 0, attributes: { Tamanho: "40" } }, // Esgotado
      { sku: "LM-TNS-02-41", price_cents: 35000, stock: 2, attributes: { Tamanho: "41" } }, // Baixo
    ],
    categoryIds["Moda Masculina"], collectionIds["Mais Vendidos"]
  );

  // P3: 2 Opções c/ Lacuna (Camiseta)
  // Lacuna: Preto não tem P.
  await seedProduct(
    "LM-CAM-03", "Camiseta Básica", 8900,
    [
      { name: "Cor", values: ["Branco", "Preto", "Azul"] },
      { name: "Tamanho", values: ["P", "M", "G"] }
    ],
    [
      { sku: "LM-CAM-03-BR-P", price_cents: 8900, stock: 10, attributes: { Cor: "Branco", Tamanho: "P" }, image_url: mediaUrls.cam_branco },
      { sku: "LM-CAM-03-BR-M", price_cents: 8900, stock: 10, attributes: { Cor: "Branco", Tamanho: "M" } },
      { sku: "LM-CAM-03-BR-G", price_cents: 8900, stock: 10, attributes: { Cor: "Branco", Tamanho: "G" } },
      
      { sku: "LM-CAM-03-PR-M", price_cents: 8900, stock: 10, attributes: { Cor: "Preto", Tamanho: "M" }, image_url: mediaUrls.cam_preto },
      { sku: "LM-CAM-03-PR-G", price_cents: 8900, stock: 10, attributes: { Cor: "Preto", Tamanho: "G" } },
      
      { sku: "LM-CAM-03-AZ-P", price_cents: 8900, stock: 10, attributes: { Cor: "Azul", Tamanho: "P" }, image_url: mediaUrls.cam_azul },
      { sku: "LM-CAM-03-AZ-M", price_cents: 8900, stock: 10, attributes: { Cor: "Azul", Tamanho: "M" } },
      { sku: "LM-CAM-03-AZ-G", price_cents: 8900, stock: 10, attributes: { Cor: "Azul", Tamanho: "G" } },
    ],
    categoryIds["Moda Masculina"], collectionIds["Ofertas"]
  );

  // P4: Preço Flexível (Smartphone)
  await seedProduct(
    "LM-CEL-04", "Smartphone X1", 250000,
    [{ name: "Armazenamento", values: ["128GB", "256GB"] }],
    [
      { sku: "LM-CEL-04-128", price_cents: 250000, stock: 20, attributes: { Armazenamento: "128GB" }, image_url: mediaUrls.smart_128 },
      { sku: "LM-CEL-04-256", price_cents: 290000, stock: 10, attributes: { Armazenamento: "256GB" }, image_url: mediaUrls.smart_256 },
    ],
    categoryIds["Eletrônicos"], undefined
  );

  // P5: 3 Opções (Calça)
  await seedProduct(
    "LM-CAL-05", "Calça Alfaiataria", 19900,
    [
      { name: "Cor", values: ["Bege", "Preto"] },
      { name: "Tamanho", values: ["38", "40"] },
      { name: "Modelagem", values: ["Reta", "Pantalona"] }
    ],
    [
      { sku: "LM-CAL-05-BE-38-RT", price_cents: 19900, stock: 5, attributes: { Cor: "Bege", Tamanho: "38", Modelagem: "Reta" }, image_url: mediaUrls.calca },
      { sku: "LM-CAL-05-BE-40-RT", price_cents: 19900, stock: 5, attributes: { Cor: "Bege", Tamanho: "40", Modelagem: "Reta" } },
      { sku: "LM-CAL-05-PR-38-PA", price_cents: 19900, stock: 5, attributes: { Cor: "Preto", Tamanho: "38", Modelagem: "Pantalona" } },
      { sku: "LM-CAL-05-PR-40-PA", price_cents: 19900, stock: 5, attributes: { Cor: "Preto", Tamanho: "40", Modelagem: "Pantalona" } },
    ],
    categoryIds["Moda Feminina"], collectionIds["Novidades"]
  );

  console.log("✅ Carga de catálogo e estoque concluída atômica e deterministicamente.");

  // 5. ATUALIZANDO HOMEPAGE (BUILDER)
  console.log("\n⏳ [5/5] Injetando DataBindings na Homepage CMS...");
  // Limpa Home existente
  const { data: pages } = await serviceClient.from("pages").select("id").eq("store_id", store.id).eq("slug", "home");
  if (pages && pages.length > 0) {
    const pageId = pages[0].id;
    // O sistema de pages pode não ter CASCADE simples (mas não precisamos recriar a Page, só a Version)
    
    // Despublica versoes antigas
    await serviceClient.from("page_versions").update({ published: false }).eq("page_id", pageId);

    // Cria nova versao
    const { data: newVersion } = await serviceClient
      .from("page_versions")
      .insert({
        page_id: pageId,
        published: true,
        schema_version: 1,
        content: {},
      })
      .select("id")
      .single();

    if (newVersion) {
      // Insere sections (Nodes)
      const sections = [
        {
          version_id: newVersion.id,
          type: "hero",
          position: 0,
          settings: {
            title: "Bem-vindo à Loja Modelo",
            subtitle: "Esta é a vitrine demonstrativa rodando 100% sobre o motor canônico da plataforma Hr Shoes.",
            image_url: mediaUrls.geral,
            cta_text: "Ver Novidades"
          }
        },
        {
          version_id: newVersion.id,
          type: "product_carousel",
          position: 1,
          settings: {
            title: "Novidades Quentes",
            dataSource: { type: "collection", id: collectionIds["Novidades"] }
          }
        },
        {
          version_id: newVersion.id,
          type: "product_grid",
          position: 2,
          settings: {
            title: "Os Mais Vendidos",
            dataSource: { type: "collection", id: collectionIds["Mais Vendidos"] }
          }
        }
      ];

      await serviceClient.from("page_sections").insert(sections);
    }
    console.log("✅ Homepage estruturada com Coleções Dinâmicas.");
  } else {
    console.warn("⚠️ Aviso: Página 'home' não encontrada. O seed da homepage foi pulado. Verifique as migrations de CMS iniciais.");
  }

  console.log("\n================================================================================");
  console.log("🏆 SEED CONCLUÍDO COM SUCESSO! A Loja Modelo está pronta para demonstração.");
  console.log("================================================================================\n");
}

runSeed().catch((err) => {
  console.error("Erro fatal no orquestrador de seed:", err);
  process.exit(1);
});
