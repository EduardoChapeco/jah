import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const serviceClient = createClient(supabaseUrl, serviceKey);

async function run() {
  console.log("Sincronizando perfil admin com a Loja Modelo...");
  
  // 1. Pegar o ID da loja-modelo
  const { data: store } = await serviceClient.from("stores").select("id, organization_id").eq("slug", "loja-modelo").single();
  if (!store) {
    console.log("Loja modelo não encontrada!");
    return;
  }
  
  // 2. Atualizar TODOS os perfis admin/owner para apontar para essa loja e organização
  const { data, error } = await serviceClient
    .from("profiles")
    .update({ store_id: store.id, organization_id: store.organization_id })
    .in("role", ["admin", "owner", "manager"])
    .select("id, role");
    
  if (error) {
    console.error("Erro:", error);
  } else {
    console.log("Perfis atualizados com sucesso:", data);
  }
}

run();
