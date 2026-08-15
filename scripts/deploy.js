import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("==========================================");
console.log(" Deploy Full Pipeline: Jah Community      ");
console.log("==========================================");

const envPath = path.resolve(__dirname, "../.env.secrets");
if (!fs.existsSync(envPath)) {
  console.error(`O arquivo de secrets nao foi encontrado: ${envPath}`);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
const secrets = {};

envContent.split("\n").forEach((line) => {
  line = line.trim();
  if (line.startsWith("#") || !line) return;

  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let key = match[1].trim();
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.substring(1, value.length - 1);
    }
    secrets[key] = value;
  }
});

function runCommand(command, env = {}, input = null) {
  console.log(`\n> Executando: ${command}`);
  try {
    const options = {
      stdio: input !== null ? ["pipe", "inherit", "inherit"] : "inherit",
      env: { ...process.env, ...env },
      shell: true,
    };

    if (input !== null) {
      options.input = input;
    }

    execSync(command, options);
  } catch (error) {
    console.error(`Erro ao executar: ${command}`);
    if (!input) process.exit(1);
  }
}

// 1. Supabase DB Push
if (secrets.SUPABASE_ACCESS_TOKEN && secrets.SUPABASE_DB_PASSWORD) {
  console.log("1. Realizando Push de Banco de Dados (Supabase)...");
  try {
    execSync("npx supabase db push", {
      stdio: "inherit",
      env: {
        ...process.env,
        SUPABASE_ACCESS_TOKEN: secrets.SUPABASE_ACCESS_TOKEN,
        SUPABASE_DB_PASSWORD: secrets.SUPABASE_DB_PASSWORD,
      },
      shell: true,
    });
  } catch (e) {
    console.warn("Aviso no Supabase DB Push. Continuando...");
  }
} else {
  console.warn("Aviso: Tokens do Supabase não encontrados no .env.secrets.");
}

// 2. Build
console.log("\n2. Realizando Build da Aplicação...");
runCommand("npm run build");

// 3. Cloudflare Secrets Put (opcional / fallback seguro)
console.log("\n3. Injetando Segredos no Cloudflare Pages (Wrangler)...");
const keysToPush = ["SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET"];

for (const key of keysToPush) {
  if (secrets[key]) {
    try {
      console.log(` -> Empacotando secret: ${key}`);
      runCommand(
        `npx wrangler pages secret put ${key} --project-name jah`,
        {},
        `${secrets[key]}\n`,
      );
    } catch {
      console.warn(`Aviso: Secret ${key} já configurada ou ignorada.`);
    }
  }
}

// 4. Deploy Final
console.log("\n4. Realizando Deploy para o Cloudflare Pages...");
const outputDir = fs.existsSync(path.resolve(__dirname, "../.output/public"))
  ? ".output/public"
  : "dist";
console.log(`Diretório alvo: ${outputDir}`);
runCommand(`npx wrangler pages deploy ${outputDir} --project-name jah`);

console.log("\n==========================================");
console.log("Deploy Finalizado com Sucesso!");
console.log("==========================================");
