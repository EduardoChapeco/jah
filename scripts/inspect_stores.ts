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

async function inspectStores() {
  console.log("=== Listando Lojas / Empresas Cadastradas no Banco ===");
  const { data: stores, error } = await supabase
    .from("stores")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao listar lojas:", error);
    return;
  }

  console.log(`Total de lojas encontradas: ${stores?.length || 0}`);
  if (stores && stores.length > 0) {
    console.table(
      stores.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        created_at: s.created_at,
      }))
    );
  }

  // Verificar usuários cadastrados também
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (users?.users) {
    console.log(`\n=== Usuários Cadastrados (${users.users.length}) ===`);
    console.table(
      users.users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        metadata: JSON.stringify(u.user_metadata),
      }))
    );
  }
}

inspectStores();
