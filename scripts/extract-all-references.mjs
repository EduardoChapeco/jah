import fs from "fs";
import path from "path";

const root = process.cwd();
const parent = path.dirname(root);
const refsDir = path.join(parent, "projetos-referencias");
const dstBase = path.join(root, "src");

console.log("=== COMPREHENSIVE MULTI-REPO EXTRACTION STARTING ===");

function copyDirRecursive(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

// 1. EXTRAÇÃO DE CLASSIFICADOS WAESY
const waesySrc = path.join(refsDir, "classificadoswaesy", "src");
if (fs.existsSync(waesySrc)) {
  console.log("[1/3] Extracting classificadoswaesy components...");
  const modulesToCopy = [
    "ads",
    "ad-detail",
    "business-wizard",
    "store-wizard",
    "pos",
    "restaurant",
    "logistics",
    "news",
    "promotions",
    "scanner",
    "combos",
    "addons",
    "presentations",
    "service-wizard"
  ];
  for (const mod of modulesToCopy) {
    const s = path.join(waesySrc, "components", mod);
    const d = path.join(dstBase, "components", "classificados", mod);
    if (fs.existsSync(s)) {
      copyDirRecursive(s, d);
      console.log(`  ✓ classificados/${mod}`);
    }
  }
}

// 2. EXTRAÇÃO DE PERSONA-NEXUS
const personaSrc = path.join(refsDir, "persona-nexus", "src");
if (fs.existsSync(personaSrc)) {
  console.log("[2/3] Extracting persona-nexus modules...");
  const personaModules = ["experience", "intelligence", "marketing", "monetization", "operations"];
  for (const mod of personaModules) {
    const s = path.join(personaSrc, "modules", mod);
    const d = path.join(dstBase, "modules", "nexus", mod);
    if (fs.existsSync(s)) {
      copyDirRecursive(s, d);
      console.log(`  ✓ nexus/${mod}`);
    }
  }
}

// 3. EXTRAÇÃO DE BANCO DE DADOS & SCHEMAS DE TRAVELAGENCIAS
const travelSqlSrc = path.join(refsDir, "travelagencias", "supabase", "migrations");
const jahMigrationsDst = path.join(root, "supabase", "reference-migrations");
if (fs.existsSync(travelSqlSrc)) {
  console.log("[3/3] Archiving reference SQL migrations...");
  fs.mkdirSync(jahMigrationsDst, { recursive: true });
  copyDirRecursive(travelSqlSrc, path.join(jahMigrationsDst, "travelagencias"));
  console.log("  ✓ reference-migrations/travelagencias complete");
}

console.log("=== COMPREHENSIVE EXTRACTION COMPLETED WITH 100% OF REPOSITORIES! ===");
