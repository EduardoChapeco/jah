import fs from "fs";
import path from "path";

const root = process.cwd();
const parent = path.dirname(root);
const refProject = path.join(parent, "projetos-referencias", "travelagencias");
const srcBase = path.join(refProject, "src");
const dstBase = path.join(root, "src");

console.log("=== EXTRACTION FROM TRAVELAGENCIAS STARTING ===");
console.log("Source Base:", srcBase);
console.log("Destination Base:", dstBase);

if (!fs.existsSync(srcBase)) {
  console.error("ERROR: Source directory does not exist:", srcBase);
  process.exit(1);
}

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

// 1. Studio completo (sections, toolbar, frames, pickers)
console.log("[1/6] Copying components/studio -> src/components/tourism/studio...");
copyDirRecursive(
  path.join(srcBase, "components", "studio"),
  path.join(dstBase, "components", "tourism", "studio")
);

// 2. Proposals completo (templates, proposal studio, export buttons)
console.log("[2/6] Copying components/proposals -> src/components/tourism/proposals...");
copyDirRecursive(
  path.join(srcBase, "components", "proposals"),
  path.join(dstBase, "components", "tourism", "proposals")
);

// 3. CRM completo (kanban, lead-details, cards, timeline, AI hunter)
console.log("[3/6] Copying components/crm -> src/components/tourism/crm...");
copyDirRecursive(
  path.join(srcBase, "components", "crm"),
  path.join(dstBase, "components", "tourism", "crm")
);

// 4. Operações (trips, vouchers, boarding, group-tours, corporate)
console.log("[4/6] Copying operational modules (trips, vouchers, boarding, group-tours, corporate)...");
copyDirRecursive(
  path.join(srcBase, "components", "trips"),
  path.join(dstBase, "components", "tourism", "trips")
);
copyDirRecursive(
  path.join(srcBase, "components", "vouchers"),
  path.join(dstBase, "components", "tourism", "vouchers")
);
copyDirRecursive(
  path.join(srcBase, "components", "boarding"),
  path.join(dstBase, "components", "tourism", "boarding")
);
copyDirRecursive(
  path.join(srcBase, "components", "group-tours"),
  path.join(dstBase, "components", "tourism", "group-tours")
);
copyDirRecursive(
  path.join(srcBase, "components", "corporate"),
  path.join(dstBase, "components", "tourism", "corporate")
);

// 5. Services de Domínio
console.log("[5/6] Copying domain services...");
const servicesDst = path.join(dstBase, "services", "tourism");
fs.mkdirSync(servicesDst, { recursive: true });

const serviceFiles = [
  "proposals.ts",
  "proposal-storage.ts",
  "crm.ts",
  "trips.ts",
  "vouchers.ts",
  "boarding.ts",
  "rooming.ts",
  "reaccommodation.ts",
  "flight-reconciliation.ts",
  "quotes.ts",
  "clients.ts",
  "tours.ts",
  "visas.ts"
];

for (const sf of serviceFiles) {
  const sfPath = path.join(srcBase, "services", sf);
  if (fs.existsSync(sfPath)) {
    fs.copyFileSync(sfPath, path.join(servicesDst, sf));
    console.log(`  ✓ ${sf}`);
  }
}

// 6. Lib helpers (pricing, adapters, formatters)
console.log("[6/6] Copying lib helpers...");
const libDst = path.join(dstBase, "lib", "tourism");
fs.mkdirSync(libDst, { recursive: true });

const libFiles = ["pricing.ts", "adapters.ts", "formatters.ts"];
for (const lf of libFiles) {
  const lfPath = path.join(srcBase, "lib", lf);
  if (fs.existsSync(lfPath)) {
    fs.copyFileSync(lfPath, path.join(libDst, lf));
    console.log(`  ✓ ${lf}`);
  }
}

console.log("=== EXTRACTION FINISHED SUCCESSFULLY! ===");
