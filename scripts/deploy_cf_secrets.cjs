const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, "../.env.secrets");
if (!fs.existsSync(envPath)) {
  console.error("Arquivo .env.secrets não encontrado.");
  process.exit(1);
}

const sec = fs.readFileSync(envPath, "utf8");
const vars = {};

sec.split("\n").forEach((l) => {
  const m = l.trim().match(/^([^=]+)=(.*)$/);
  if (m && !m[1].startsWith("#")) {
    vars[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, "");
  }
});

console.log("==================================================");
console.log(" Sincronizando Secrets com Cloudflare Pages (wider)");
console.log("==================================================");

const secretsToPush = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "VITE_SITE_URL"
];

// Assegura que SUPABASE_URL e SUPABASE_ANON_KEY existam no payload
vars["SUPABASE_URL"] = vars["VITE_SUPABASE_URL"] || "https://jfuebqmltksyznovhlwa.supabase.co";
vars["SUPABASE_ANON_KEY"] = vars["VITE_SUPABASE_ANON_KEY"];
vars["VITE_SITE_URL"] = "https://wider.pages.dev";

for (const key of secretsToPush) {
  const val = vars[key];
  if (val) {
    console.log(`\n-> Injetando secret: ${key}...`);
    try {
      execSync(`npx wrangler pages secret put ${key} --project-name wider`, {
        input: `${val}\n`,
        stdio: ["pipe", "inherit", "inherit"],
        shell: true,
      });
      console.log(`   ✓ Secret ${key} atualizada com sucesso!`);
    } catch (e) {
      console.warn(`   ! Aviso ao atualizar secret ${key}:`, e.message);
    }
  }
}

console.log("\n==================================================");
console.log(" Sincronização de Secrets Concluída!");
console.log("==================================================");
