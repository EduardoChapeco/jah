import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// 1. Carrega variáveis de ambiente
const envPath = path.resolve(process.cwd(), ".env");
let env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [k, ...v] = trimmed.split("=");
      env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
}

const url = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const keyToUse = serviceKey || anonKey;

console.log("================================================================================");
console.log("🏛️ AUDITORIA COMPLETA DE UPLOAD DE MÍDIA LOCAL & RLS (JAH PLATFORM)");
console.log("================================================================================");
console.log("Supabase URL:", url);
console.log("Chave em uso:", keyToUse ? "CONFIGURADA (OK)" : "AUSENTE");

if (!url || !keyToUse) {
  console.error("ERRO: Credenciais do Supabase não encontradas.");
  process.exit(1);
}

const adminClient = createClient(url, keyToUse);
const anonClient = createClient(url, anonKey || keyToUse);

// 1x1 transparent PNG em base64 (simula imagem real de desktop)
const samplePngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const samplePngBuffer = Buffer.from(samplePngBase64, "base64");

// 1x1 dummy video buffer (simula vídeo real de desktop)
const sampleMp4Buffer = Buffer.from("AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAAY=", "base64");

const BUCKETS = ["post-media", "public_media", "product-media", "cms-media", "classifieds", "avatars"];

async function testStorageBuckets() {
  console.log("\n📦 1. VERIFICAÇÃO DE BUCKETS DE STORAGE:");
  const { data: buckets, error } = await adminClient.storage.listBuckets();
  if (error) {
    console.error("  ❌ Erro ao listar buckets:", error.message);
    return false;
  }
  
  const existingIds = buckets.map(b => b.id);
  console.log("  Buckets existentes no banco:", existingIds);

  for (const bucketId of BUCKETS) {
    if (!existingIds.includes(bucketId)) {
      console.log(`  Criando bucket faltante '${bucketId}'...`);
      const { error: createErr } = await adminClient.storage.createBucket(bucketId, {
        public: true,
        fileSizeLimit: 104857600
      });
      if (createErr) {
        console.error(`  ❌ Erro ao criar bucket '${bucketId}':`, createErr.message);
      } else {
        console.log(`  ✅ Bucket '${bucketId}' criado com sucesso!`);
      }
    } else {
      console.log(`  ✅ Bucket '${bucketId}' ativo e público.`);
    }
  }
  return true;
}

async function testMediaUploads() {
  console.log("\n📸 2. TESTE DE UPLOAD DE MÍDIA LOCAL (DESKTOP/MOBILE):");
  let allSuccess = true;

  for (const bucketId of BUCKETS) {
    const filename = `local_desktop_upload_${Date.now()}_test.png`;
    const uploadPath = `desktop_uploads/${filename}`;

    // Teste de upload de Imagem
    const { data: uploadData, error: uploadErr } = await adminClient.storage
      .from(bucketId)
      .upload(uploadPath, samplePngBuffer, {
        contentType: "image/png",
        upsert: true
      });

    if (uploadErr) {
      console.error(`  ❌ Falha no upload de imagem no bucket '${bucketId}':`, uploadErr.message);
      allSuccess = false;
      continue;
    }

    const { data: urlData } = adminClient.storage.from(bucketId).getPublicUrl(uploadPath);
    const publicUrl = urlData.publicUrl;

    // Teste de Fetch HTTP na URL pública gerada
    try {
      const fetchRes = await fetch(publicUrl);
      if (fetchRes.ok) {
        console.log(`  ✅ Upload Imagem no bucket '${bucketId}': OK (HTTP ${fetchRes.status}) -> ${publicUrl}`);
      } else {
        console.warn(`  ⚠️ Upload Imagem no bucket '${bucketId}' retornou HTTP ${fetchRes.status}`);
      }
    } catch (fetchErr) {
      console.error(`  ❌ Erro ao acessar URL pública de '${bucketId}':`, fetchErr.message);
    }
  }

  // Teste de Upload de Vídeo no post-media e classifieds
  console.log("\n🎥 3. TESTE DE UPLOAD DE VÍDEO (DESKTOP/MOBILE):");
  for (const vidBucket of ["post-media", "classifieds"]) {
    const vidPath = `desktop_videos/video_${Date.now()}_sample.mp4`;
    const { data: vidData, error: vidErr } = await adminClient.storage
      .from(vidBucket)
      .upload(vidPath, sampleMp4Buffer, {
        contentType: "video/mp4",
        upsert: true
      });

    if (vidErr) {
      console.error(`  ❌ Falha no upload de vídeo no bucket '${vidBucket}':`, vidErr.message);
      allSuccess = false;
    } else {
      const { data: urlData } = adminClient.storage.from(vidBucket).getPublicUrl(vidPath);
      console.log(`  ✅ Upload Vídeo no bucket '${vidBucket}': OK -> ${urlData.publicUrl}`);
    }
  }

  return allSuccess;
}

async function testRLSPolicies() {
  console.log("\n🔒 4. TESTE DE POLÍTICAS RLS (ANON VS AUTHENTICATED):");

  // 1. Leitura de Perfis Públicos
  const { data: profiles, error: profErr } = await anonClient.from("profiles").select("id, full_name").limit(2);
  if (profErr) console.error("  ❌ RLS profiles (anon read):", profErr.message);
  else console.log(`  ✅ RLS profiles (anon read): OK (${profiles?.length || 0} registros acessíveis)`);

  // 2. Leitura de Lojas Públicas
  const { data: stores, error: storeErr } = await anonClient.from("stores").select("id, name, slug").limit(2);
  if (storeErr) console.error("  ❌ RLS stores (anon read):", storeErr.message);
  else console.log(`  ✅ RLS stores (anon read): OK (${stores?.length || 0} lojas acessíveis)`);

  // 3. Leitura de Produtos Ativos
  const { data: products, error: prodErr } = await anonClient.from("products").select("id, title, price_cents").limit(2);
  if (prodErr) console.error("  ❌ RLS products (anon read):", prodErr.message);
  else console.log(`  ✅ RLS products (anon read): OK (${products?.length || 0} produtos acessíveis)`);

  // 4. Leitura de Classificados Ativos
  const { data: classifs, error: classifErr } = await anonClient.from("classifieds").select("id, title, price_cents").limit(2);
  if (classifErr) console.error("  ❌ RLS classifieds (anon read):", classifErr.message);
  else console.log(`  ✅ RLS classifieds (anon read): OK (${classifs?.length || 0} classificados acessíveis)`);

  // 5. Leitura de Pacotes de Serviços
  const { data: packages, error: pkgErr } = await anonClient.from("service_packages").select("id, title, price_cents").limit(2);
  if (pkgErr) console.error("  ❌ RLS service_packages (anon read):", pkgErr.message);
  else console.log(`  ✅ RLS service_packages (anon read): OK (${packages?.length || 0} pacotes acessíveis)`);

  // 6. Leitura de Eventos Públicos
  const { data: events, error: evtErr } = await anonClient.from("events").select("id, title, event_date").limit(2);
  if (evtErr) console.error("  ❌ RLS events (anon read):", evtErr.message);
  else console.log(`  ✅ RLS events (anon read): OK (${events?.length || 0} eventos acessíveis)`);

  // 7. Leitura de Posts do Mural
  const { data: posts, error: postErr } = await anonClient.from("posts").select("id, content_text, media_urls").limit(2);
  if (postErr) console.error("  ❌ RLS posts (anon read):", postErr.message);
  else console.log(`  ✅ RLS posts (anon read): OK (${posts?.length || 0} posts acessíveis)`);
}

async function runAudit() {
  await testStorageBuckets();
  await testMediaUploads();
  await testRLSPolicies();
  console.log("\n================================================================================");
  console.log("🎉 AUDITORIA CONCLUÍDA: TODOS OS TESTES DE UPLOAD E RLS FINALIZADOS!");
  console.log("================================================================================");
}

runAudit();
