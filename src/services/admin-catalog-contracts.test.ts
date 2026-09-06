import { describe, it, expect } from "vitest";
import { z } from "zod";
import { getNicheSemantics } from "@/lib/niche-semantics";
import { getNicheCatalogContext } from "@/lib/catalog-niche-context";

// Schema canônico de validação de item no catálogo
const ProductValidationSchema = z.object({
 title: z.string().min(2, "Título deve ter no mínimo 2 caracteres").max(120),
 slug: z.string().regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
 price_cents: z.number().int().nonnegative("Preço não pode ser negativo"),
 status: z.enum(["published", "draft", "archived"]),
 stock: z.number().int().nonnegative().optional(),
});

describe("Catálogo, Estoque & Precificação — Ciclo 3 Microfase 3.1", () => {
 describe("Validação de Contratos de Produtos & Variantes", () => {
 it("valida criação de produto com campos obrigatórios íntegros", () => {
 const validProduct = {
 title: "Café Espresso Duplo Especial",
 slug: "cafe-espresso-duplo-especial",
 price_cents: 1450,
 status: "published" as const,
 stock: 50,
 };

 const parsed = ProductValidationSchema.safeParse(validProduct);
 expect(parsed.success).toBe(true);
 });

 it("rejeita produto com preço negativo", () => {
 const invalidProduct = {
 title: "Item Promocional Inválido",
 slug: "item-invalido",
 price_cents: -500,
 status: "published" as const,
 };

 const parsed = ProductValidationSchema.safeParse(invalidProduct);
 expect(parsed.success).toBe(false);
 });

 it("rejeita slug com caracteres especiais ou espaços", () => {
 const invalidSlug = {
 title: "Produto Teste",
 slug: "produto com espaco e Ç",
 price_cents: 2990,
 status: "draft" as const,
 };

 const parsed = ProductValidationSchema.safeParse(invalidSlug);
 expect(parsed.success).toBe(false);
 });
 });

 describe("Adaptação de Semântica Multi-Nicho no Catálogo", () => {
 it("retorna semântica correta para o nicho de Gastronomia", () => {
 const storeGastro = {
 settings: { segment: "gastronomy" },
 };
 const semantics = getNicheSemantics(storeGastro);
 const ctx = getNicheCatalogContext(storeGastro);

 expect(semantics.nicheId).toBe("gastronomy");
 expect(ctx.entityName).toBe("Item do Cardápio");
 });

 it("retorna semântica correta para o nicho de Turismo", () => {
 const storeTourism = {
 settings: { segment: "tourism" },
 };
 const semantics = getNicheSemantics(storeTourism);
 const ctx = getNicheCatalogContext(storeTourism);

 expect(semantics.nicheId).toBe("tourism");
 expect(ctx.entityName).toBe("Pacote / Roteiro");
 });

 it("retorna semântica correta para o nicho de Varejo Geral", () => {
 const storeRetail = {
 settings: { segment: "retail" },
 };
 const semantics = getNicheSemantics(storeRetail);
 const ctx = getNicheCatalogContext(storeRetail);

 expect(semantics.nicheId).toBe("retail");
 expect(ctx.entityName).toBe("Produto");
 });
 });
});
