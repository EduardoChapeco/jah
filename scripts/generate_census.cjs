const fs = require("fs");
const path = require("path");

const filesTxt = fs.readFileSync("src_files.txt", "utf8");
const files = filesTxt.split("\n").filter((l) => l.trim().length > 0);

// Files with hex colors
const hexColorsData = `
src\\routes\\feed.tsx
src\\routes\\admin.match-time.tsx
src\\routes\\_store.produto.$slug.tsx
src\\routes\\_store.stories.tsx
src\\routes\\admin.builder.analytics.tsx
src\\components\\ui\\image-cropper-dialog.tsx
src\\components\\ui\\progress.tsx
src\\components\\commerce\\experience-renderer.tsx
src\\components\\ui\\chart.tsx
src\\components\\commerce\\dynamic-sections\\before-after-slider.tsx
src\\components\\commerce\\dynamic-sections\\faq-accordion.tsx
src\\components\\commerce\\dynamic-sections\\gallery-grid.tsx
src\\components\\commerce\\dynamic-sections\\announcement-bar.tsx
src\\components\\commerce\\dynamic-sections\\image-hotspots.tsx
src\\components\\commerce\\dynamic-sections\\product-carousel.tsx
src\\components\\commerce\\dynamic-sections\\store-hours.tsx
src\\components\\commerce\\dynamic-sections\\store-profile-hero.tsx
src\\components\\commerce\\dynamic-sections\\testimonial-carousel.tsx
src\\components\\commerce\\dynamic-sections\\timeline-history.tsx
src\\components\\commerce\\dynamic-sections\\trust-badges.tsx
src\\components\\commerce\\dynamic-sections\\store-contact.tsx
src\\components\\commerce\\dynamic-sections\\split-banner.tsx
src\\components\\admin\\builder\\builder-left-panel.tsx
src\\components\\commerce\\dynamic-sections\\product-grid.tsx
`;
const hexFiles = hexColorsData
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l.length > 0)
  .map((l) => l.replace(/\\/g, "/"));

const styleData = `
src\\routes\\_store.agenda.tsx
src\\routes\\_store.index.tsx
src\\routes\\admin.growth.comissoes.tsx
src\\routes\\admin.growth.campanhas.tsx
src\\routes\\feed.tsx
src\\components\\commerce\\public-header.tsx
`;
const styleFiles = styleData
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l.length > 0)
  .map((l) => l.replace(/\\/g, "/"));

let censusContent = `# Censo de Código - Jah Commerce\n\n`;
censusContent += `Este documento categoriza cada arquivo mapeado na pasta \`src/\`, indicando a presença de dívida visual.\n\n`;

censusContent += `| Arquivo | Categoria | Dívida Visual (Hex, Style inline) | Ação Proposta |\n`;
censusContent += `|---|---|---|---|\n`;

for (const fileLine of files) {
  const relativePath = path.relative(process.cwd(), fileLine.trim()).replace(/\\/g, "/");
  if (!relativePath.startsWith("src")) continue;

  let category = "desconhecido";
  if (relativePath.includes("components/ui/")) category = "canônico";
  else if (relativePath.includes("components/commerce/")) category = "migrar";
  else if (relativePath.includes("components/admin/")) category = "migrar";
  else if (relativePath.includes("routes/")) category = "migrar";
  else if (relativePath.includes("lib/") || relativePath.includes("types/")) category = "canônico";

  let debt = [];
  if (hexFiles.some((f) => relativePath.endsWith(f) || f.endsWith(relativePath)))
    debt.push("Hex Colors");
  if (styleFiles.some((f) => relativePath.endsWith(f) || f.endsWith(relativePath)))
    debt.push("Inline Styles");

  const debtStr = debt.length > 0 ? debt.join(", ") : "Limpo";

  censusContent += `| ${relativePath} | ${category} | ${debtStr} | Revisar |\n`;
}

if (!fs.existsSync("docs/audit")) {
  fs.mkdirSync("docs/audit", { recursive: true });
}

fs.writeFileSync("docs/audit/CODE-CENSUS.md", censusContent);
console.log("CODE-CENSUS.md created successfully.");
