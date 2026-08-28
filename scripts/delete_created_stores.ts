import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const secretsPath = path.resolve(process.cwd(), ".env.secrets");
const envContent = fs.readFileSync(secretsPath, "utf8");
const secrets: Record<string, string> = {};

envContent.split("\n").forEach((line) => {
  const match = line.trim().match(/^([^=]+)=(.*)$/);
  if (match && !match[1].startsWith("#")) {
    secrets[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
  }
});

const supabaseUrl = secrets.VITE_SUPABASE_URL || "https://jfuebqmltksyznovhlwa.supabase.co";
const serviceRoleKey = secrets.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

const STORES_TO_DELETE = [
  "c1454349-0d8b-461a-9487-07a53b82bd87", // Restaurante Sabor da
  "1e5fc2df-3727-4ecb-b84a-850aa85a041d", // Chef Edu
];

const USERS_TO_DELETE = [
  "c8ef0f11-e28f-41ff-862a-8969847ddbe5", // colaborador.sabor@gmail.com
];

async function deleteCreatedStores() {
  console.log("=== Iniciando Exclusão das Empresas de Teste Criadas ===");

  for (const storeId of STORES_TO_DELETE) {
    console.log(`\n-> Removendo dependências da loja: ${storeId}`);

    // 1. Limpar tabelas dependentes
    const dependentTables = [
      "banners",
      "working_hours",
      "store_neighborhood_delivery_rules",
      "store_memberships",
      "store_staff",
      "store_settings",
      "store_policies",
      "product_variants",
      "products",
      "categories",
      "orders",
      "cart_items",
      "coupons",
      "delivery_zones",
    ];

    for (const table of dependentTables) {
      try {
        const { error } = await supabase.from(table).delete().eq("store_id", storeId);
        if (!error) {
          console.log(`   ✓ Limpo: ${table}`);
        }
      } catch (err: any) {
        // Ignora caso coluna store_id não exista nessa tabela específica
      }
    }

    // 2. Limpar a loja
    const { error: storeErr } = await supabase.from("stores").delete().eq("id", storeId);
    if (storeErr) {
      console.error(`   ✗ Erro ao deletar loja ${storeId}:`, storeErr.message);
    } else {
      console.log(`   ✓ Loja ${storeId} deletada com sucesso!`);
    }
  }

  // 3. Deletar usuários convidados de teste
  for (const userId of USERS_TO_DELETE) {
    console.log(`\n-> Removendo usuário convidado de teste: ${userId}`);
    const { error: userErr } = await supabase.auth.admin.deleteUser(userId);
    if (userErr) {
      console.warn(`   ! Aviso ao deletar usuário ${userId}:`, userErr.message);
    } else {
      console.log(`   ✓ Usuário ${userId} deletado do Auth com sucesso!`);
    }
  }

  console.log("\n=== Verificando Lojas Restantes ===");
  const { data: remainingStores } = await supabase.from("stores").select("id, name, slug");
  console.table(remainingStores);
  console.log("Operação de limpeza concluída com sucesso!");
}

deleteCreatedStores();
