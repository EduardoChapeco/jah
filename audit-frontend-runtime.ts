import fs from "fs";
import path from "path";

const SRC_DIR = path.join(process.cwd(), "src");
const COMPONENTS_DIR = path.join(SRC_DIR, "components");
const ROUTES_DIR = path.join(SRC_DIR, "routes");
const ROUTES_TS = path.join(SRC_DIR, "lib", "routes.ts");

function walkDir(dir: string, fileList: string[] = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath, fileList);
    } else if (filePath.endsWith(".tsx") || filePath.endsWith(".ts")) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function auditFrontend() {
  console.log("--- INICIANDO SCAN FORENSE DE FRONTEND (Fase 5) ---");
  let hasErrors = false;

  const componentFiles = walkDir(COMPONENTS_DIR);
  const routeFiles = walkDir(ROUTES_DIR);
  const allUiFiles = [...componentFiles, ...routeFiles];

  // Regra 1: Sem tokens Ad-Hoc
  // Verifica bg-red-*, text-blue-*, etc. Evitando falsos positivos em Tailwind permitidos
  // A regra principal de Design System pede para usar surface, primary, bg-background etc.
  const badColorsRegex =
    /\b(bg|text)-(red|blue|green|yellow|purple|pink|indigo|teal|orange)-[0-9]{2,3}\b/g;
  const badHexRegex = /#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\b/g;

  // Regra 2: Sem supabase.from
  const supabaseRegex = /supabase\.from\(/g;

  // Regra 3: Sem fetch em componentes (exceto presigned URLs, que são permitidas)
  const fetchRegex = /\bfetch\(/g;

  console.log(
    `\n[STEP 1] Varrendo ${allUiFiles.length} arquivos UI em busca de violações de Design System...`,
  );

  for (const file of allUiFiles) {
    const content = fs.readFileSync(file, "utf-8");
    const relativePath = path.relative(process.cwd(), file);

    // Ignora icones svg que podem ter fill hex
    if (content.includes("<svg") && !relativePath.includes("admin")) {
      // SVG paths are less strict
    }

    const colorMatches = [...content.matchAll(badColorsRegex)];
    if (colorMatches.length > 0) {
      console.warn(
        `[VIOLATION] Cores Tailwind Hardcoded em ${relativePath}: ${colorMatches.map((m) => m[0]).join(", ")}`,
      );
      hasErrors = true;
    }

    // Checking for raw supabase calls (allow in api routes)
    if (supabaseRegex.test(content) && !relativePath.includes("api.")) {
      console.error(`[CRITICAL] Componente tentando acessar banco DIRETAMENTE: ${relativePath}`);
      hasErrors = true;
    }

    // Checking for raw fetches inside useEffect
    if (fetchRegex.test(content) && content.includes("useEffect")) {
      // Whitelist for allowed components like image-upload
      if (!relativePath.includes("image-upload.tsx") && !relativePath.includes("calendar.tsx")) {
        console.warn(
          `[WARNING] Possível Data Fetching local proibido detectado em ${relativePath}. Favor usar server functions.`,
        );
      }
    }
  }

  console.log("\n[STEP 2] Validando Registro de Rotas...");
  if (fs.existsSync(ROUTES_TS)) {
    const routesContent = fs.readFileSync(ROUTES_TS, "utf-8");
    if (routesContent.includes("navPlanned: true") || routesContent.includes('"Em breve"')) {
      console.warn(
        `[VIOLATION] Encontradas rotas "Em breve" que vazam para produção no routes.ts.`,
      );
      hasErrors = true;
    } else {
      console.log('✅ Nenhuma rota "Em breve" ou falsa funcionalidade no registro canônico.');
    }
  } else {
    console.error("Falha ao encontrar src/lib/routes.ts");
    hasErrors = true;
  }

  console.log("\n=======================================");
  if (hasErrors) {
    console.log("❌ O Design System / Frontend REPROVOU na auditoria.");
    process.exit(1);
  } else {
    console.log("✅ O Frontend Passou perfeitamente nos checks arquitetônicos.");
    console.log("=======================================");
  }
}

auditFrontend();
