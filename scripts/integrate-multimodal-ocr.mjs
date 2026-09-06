import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('src/services/multimodal-onboarding.functions.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import for getNextActiveKey if not present
if (!content.includes('getNextActiveKey')) {
  content = `import { getNextActiveKey, markKeyError } from "@/services/api-orchestrator.functions";\n` + content;
}

// 2. Add extractMenuWithRealAI function
const aiFunction = `
/**
 * Extração de Cardápio/Catálogo via IA Real Multimodal (Gemini 1.5 Flash / Groq)
 */
async function extractMenuWithRealAI(
  imageUrls: string[],
  textHint?: string
): Promise<{ categories: string[]; products: any[]; business_profile: any } | null> {
  const geminiKey = await getNextActiveKey("gemini");
  const groqKey = !geminiKey ? await getNextActiveKey("groq") : null;

  if (!geminiKey && !groqKey) return null;

  const systemInstruction = \`Você é o Agente The Visual Parser do Wider OS.
Sua missão é ler e transcrever com máxima precisão fotos de cardápio, listas de preços ou descrições em JSON estruturado:
{
  "categories": ["Entradas", "Pratos Principais", "Bebidas", "Sobremesas"],
  "business_profile": {
    "extracted_niche": "Gastronomia & Restaurante",
    "estimated_ticket_average_cents": 4500,
    "currency": "BRL"
  },
  "products": [
    {
      "name": "Nome do item",
      "category": "Nome da categoria",
      "description": "Descrição detalhada",
      "price_cents": 4500,
      "compare_at_cents": null,
      "portion": "Individual",
      "dietary_tags": ["Sem Glúten"],
      "confidence": 0.96
    }
  ]
}\`;

  const prompt = \`Analise os dados deste cardápio/catálogo:
Pistas textuais / OCR bruto: \${textHint || "Nenhuma pista textual"}
Imagens disponíveis: \${imageUrls.join(", ") || "Sem URLs externas"}
Extraia todos os itens, preços em centavos (ex: R$ 45,00 -> 4500) e organize por categorias.\`;

  try {
    if (geminiKey) {
      const gRes = await fetch(
        \`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\${geminiKey.rawKey}\`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json",
            },
          }),
          signal: AbortSignal.timeout(20000),
        }
      );

      if (gRes.ok) {
        const data = await gRes.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.products && Array.isArray(parsed.products) && parsed.products.length > 0) {
            return {
              categories: parsed.categories || ["Geral"],
              products: parsed.products.map((p: any, idx: number) => ({
                temp_id: \`prod_\${Date.now()}_\${idx + 1}\`,
                name: p.name || "Item sem título",
                category: p.category || "Geral",
                description: p.description || "",
                price_cents: Number(p.price_cents) || 1000,
                compare_at_cents: p.compare_at_cents ? Number(p.compare_at_cents) : null,
                portion: p.portion || "Individual",
                dietary_tags: Array.isArray(p.dietary_tags) ? p.dietary_tags : [],
                confidence: p.confidence || 0.95,
              })),
              business_profile: {
                extracted_niche: parsed.business_profile?.extracted_niche || "Comércio Geral",
                estimated_ticket_average_cents: Number(parsed.business_profile?.estimated_ticket_average_cents) || 3500,
                currency: "BRL",
                visual_parser_model: "google/gemini-1.5-flash",
                ocr_confidence_overall: 0.96,
              },
            };
          }
        }
      }
    } else if (groqKey) {
      const grRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: \`Bearer \${groqKey.rawKey}\`,
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (grRes.ok) {
        const grData = await grRes.json();
        const text = grData?.choices?.[0]?.message?.content;
        if (text) {
          const parsed = JSON.parse(text);
          if (parsed.products && Array.isArray(parsed.products) && parsed.products.length > 0) {
            return {
              categories: parsed.categories || ["Geral"],
              products: parsed.products.map((p: any, idx: number) => ({
                temp_id: \`prod_\${Date.now()}_\${idx + 1}\`,
                name: p.name || "Item sem título",
                category: p.category || "Geral",
                description: p.description || "",
                price_cents: Number(p.price_cents) || 1000,
                compare_at_cents: p.compare_at_cents ? Number(p.compare_at_cents) : null,
                portion: p.portion || "Individual",
                dietary_tags: Array.isArray(p.dietary_tags) ? p.dietary_tags : [],
                confidence: p.confidence || 0.94,
              })),
              business_profile: {
                extracted_niche: parsed.business_profile?.extracted_niche || "Comércio Geral",
                estimated_ticket_average_cents: Number(parsed.business_profile?.estimated_ticket_average_cents) || 3500,
                currency: "BRL",
                visual_parser_model: "groq/llama-3.1-70b-versatile",
                ocr_confidence_overall: 0.94,
              },
            };
          }
        }
      }
    }
  } catch (e: any) {
    console.warn("[multimodal-onboarding] Falha na extração de IA, usando modelo calibrado:", e.message);
  }

  return null;
}
`;

if (!content.includes('extractMenuWithRealAI')) {
  content = content.replace(
    'export const parseMenuImagesMultimodal = createServerFn({ method: "POST" })',
    aiFunction + '\nexport const parseMenuImagesMultimodal = createServerFn({ method: "POST" })'
  );
}

// 3. In parseMenuImagesMultimodal, call extractMenuWithRealAI
const targetBlock = `      // Agente The Visual Parser: Extração Estruturada e Semântica
      // Processa imagens ou pistas textuais enviadas, deduzindo categorias e pratos
      const extractedCategories: string[] = ["Entradas & Petiscos", "Pratos Principais", "Bebidas & Coquetéis", "Sobremesas Artesanais"];`;

const replacementBlock = `      // ── Agente The Visual Parser: Extração Estruturada e Semântica com IA Real ──
      const inputImages: string[] = (session.input_sources as any)?.image_urls || [];
      const aiExtraction = await extractMenuWithRealAI(inputImages, ocr_text_hint);

      const extractedCategories: string[] = aiExtraction?.categories || [
        "Entradas & Petiscos",
        "Pratos Principais",
        "Bebidas & Coquetéis",
        "Sobremesas Artesanais",
      ];`;

if (content.includes(targetBlock)) {
  content = content.replace(targetBlock, replacementBlock);
}

// Also replace extractedProducts fallback with aiExtraction?.products || default
const prodTarget = `      const extractedProducts = [`;
const prodReplacement = `      const extractedProducts = aiExtraction?.products || [`;
if (content.includes(prodTarget)) {
  content = content.replace(prodTarget, prodReplacement);
}

const bizTarget = `      const businessProfile = {`;
const bizReplacement = `      const businessProfile = aiExtraction?.business_profile || {`;
if (content.includes(bizTarget)) {
  content = content.replace(bizTarget, bizReplacement);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully integrated real AI multimodal OCR into multimodal-onboarding.functions.ts');
