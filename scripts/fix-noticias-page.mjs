import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.resolve(__dirname, "../src/routes/_store.noticias.index.tsx");
let content = fs.readFileSync(targetFile, "utf8");

// Procurar o trecho quebrado
const brokenChunk = `  const featuredArticle = articles[0];\n  const breakingNews = articles.filter(\n  )}`;

const replacement = `  const featuredArticle = articles[0];
  const breakingNews = articles.filter(
    (a) => (a as any).is_breaking || a.category === "urgente" || a.kicker?.toLowerCase().includes("urgente"),
  );
  const cultureArticles = articles.filter((a) => a.category === "cultura");
  const economyArticles = articles.filter((a) => a.category === "economia");
  const gridArticles = articles.slice(1);

  return (
    <div className="max-w-2xl mx-auto px-4 space-y-6 pb-20">
      {/* ── 1. Top Banners de Notícias ── */}
      {banners && banners.length > 0 && (
        <section aria-label="Banners e Anúncios">
          <BannerHeroCarousel banners={banners} />
        </section>
      )}`;

if (content.includes(brokenChunk)) {
  content = content.replace(brokenChunk, replacement);
  fs.writeFileSync(targetFile, content, "utf8");
  console.log("✅ _store.noticias.index.tsx corrigido com sucesso com max-w-2xl!");
} else {
  console.log("Chunk não encontrado exato, procurando variações...");
  // Regex replacement
  const regex = /const featuredArticle = articles\[0\];\s*const breakingNews = articles\.filter\(\s*\)\s*}/;
  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(targetFile, content, "utf8");
    console.log("✅ _store.noticias.index.tsx corrigido via regex!");
  } else {
    console.error("❌ Não foi possível encontrar o padrão quebrado.");
  }
}
