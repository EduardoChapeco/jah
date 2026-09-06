import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('src/services/market-radar.functions.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports at the top
const importsToAdd = `import { getNextActiveKey, markKeyError } from "@/services/api-orchestrator.functions";\n`;

if (!content.includes('getNextActiveKey')) {
  content = importsToAdd + content;
}

// 2. Add captureWithSteelOrFirecrawl function
const captureFunction = `
/**
 * Captura screenshot de página inteira e scraping via Steel.dev ou Firecrawl
 */
async function captureBrowserScreenshotAndContent(targetUrl: string): Promise<{ screenshotUrl: string | null; markdown: string | null }> {
  // 1. Tenta Steel.dev se houver chave ativa
  const steelKey = await getNextActiveKey("steel");
  if (steelKey) {
    try {
      // Chamada à API Steel.dev para automação de browser headless
      const steelRes = await fetch("https://api.steel.dev/v1/screenshot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-steel-api-key": steelKey.rawKey,
        },
        body: JSON.stringify({
          url: targetUrl,
          fullPage: true,
          format: "png",
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (steelRes.ok) {
        const sData = await steelRes.json();
        if (sData?.url || sData?.screenshotUrl) {
          return { screenshotUrl: sData.url || sData.screenshotUrl, markdown: null };
        }
      } else {
        await markKeyError(steelKey.id, \`Steel.dev status \${steelRes.status}\`);
      }
    } catch (e: any) {
      await markKeyError(steelKey.id, \`Steel.dev error: \${e.message}\`);
    }
  }

  // 2. Tenta Firecrawl se houver chave ativa
  const firecrawlKey = await getNextActiveKey("firecrawl");
  if (firecrawlKey) {
    try {
      const fcRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: \`Bearer \${firecrawlKey.rawKey}\`,
        },
        body: JSON.stringify({
          url: targetUrl,
          formats: ["markdown", "screenshot@fullPage"],
          onlyMainContent: true,
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (fcRes.ok) {
        const fcData = await fcRes.json();
        const screenshot = fcData?.data?.screenshot || fcData?.data?.screenshotUrl || null;
        const markdown = fcData?.data?.markdown || null;
        if (screenshot || markdown) {
          return { screenshotUrl: screenshot, markdown };
        }
      } else {
        await markKeyError(firecrawlKey.id, \`Firecrawl status \${fcRes.status}\`);
      }
    } catch (e: any) {
      await markKeyError(firecrawlKey.id, \`Firecrawl error: \${e.message}\`);
    }
  }

  return { screenshotUrl: null, markdown: null };
}

/**
 * Analisa o DNA da marca do concorrente via IA Real (Gemini Flash / Groq)
 */
async function analyzeCompetitorDnaWithAI(competitorName: string, targetUrl: string, markdownContent?: string | null): Promise<any | null> {
  const geminiKey = await getNextActiveKey("gemini");
  const groqKey = !geminiKey ? await getNextActiveKey("groq") : null;

  if (!geminiKey && !groqKey) return null;

  const systemInstruction = \`Você é um consultor sênior de inteligência competitiva e branding.
Analise o concorrente informado e extraia seu DNA de marca em JSON:
{
  "brand_archetype": "O Herói | O Criador | O Fora da Lei | O Sábio | O Cuidador | O Mago | O Soberano | O Amante | O Explorador",
  "color_palette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "typography": "string de fonte dominante",
  "strengths": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
  "weaknesses": ["vulnerabilidade 1", "vulnerabilidade 2", "vulnerabilidade 3"],
  "differentiation_gap": "como a nossa loja pode superar este concorrente",
  "marketing_hooks": ["anúncio de ataque 1", "anúncio de contra-proposta 2", "chamada de conversão 3"],
  "pricing_signals": {
    "tier": "budget | mid_market | premium | luxury",
    "average_ticket_estimate": 65,
    "promotional_intensity": "moderate | aggressive | conservative"
  }
}\`;

  const prompt = \`Concorrente: \${competitorName}
URL: \${targetUrl}
Conteúdo da página:
\${(markdownContent || "").slice(0, 5000)}
\`;

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
              temperature: 0.2,
              responseMimeType: "application/json",
            },
          }),
          signal: AbortSignal.timeout(18000),
        }
      );

      if (gRes.ok) {
        const data = await gRes.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return JSON.parse(text);
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
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(18000),
      });

      if (grRes.ok) {
        const grData = await grRes.json();
        const text = grData?.choices?.[0]?.message?.content;
        if (text) return JSON.parse(text);
      }
    }
  } catch (e: any) {
    console.warn("[market-radar] Falha na análise de IA, usando modelo calibrado:", e.message);
  }

  return null;
}
`;

if (!content.includes('captureBrowserScreenshotAndContent')) {
  content = content.replace(
    'export async function captureAndAnalyzeCompetitor(',
    captureFunction + '\nexport async function captureAndAnalyzeCompetitor('
  );
}

// 3. In captureAndAnalyzeCompetitor, call captureBrowserScreenshotAndContent & analyzeCompetitorDnaWithAI
const oldCaptureCall = `const screenshotUrl = \`https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop\`;`;

const newCaptureCall = `// ── Captura Real via Steel.dev / Firecrawl ──
    const captured = await captureBrowserScreenshotAndContent(targetUrl);
    const screenshotUrl = captured.screenshotUrl || \`https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop\`;

    // ── Análise Cognitiva Real via IA (Gemini / Groq) ──
    const aiAnalysis = await analyzeCompetitorDnaWithAI(comp.name, targetUrl, captured.markdown);
    if (aiAnalysis) {
      if (aiAnalysis.brand_archetype) extractedDna.brand_archetype = aiAnalysis.brand_archetype;
      if (aiAnalysis.color_palette?.length) extractedDna.color_palette = aiAnalysis.color_palette;
      if (aiAnalysis.typography) extractedDna.typography = aiAnalysis.typography;
      if (aiAnalysis.strengths?.length) extractedDna.strengths = aiAnalysis.strengths;
      if (aiAnalysis.weaknesses?.length) extractedDna.weaknesses = aiAnalysis.weaknesses;
      if (aiAnalysis.differentiation_gap) extractedDna.differentiation_gap = aiAnalysis.differentiation_gap;
      if (aiAnalysis.marketing_hooks?.length) {
        marketingHooks.splice(0, marketingHooks.length, ...aiAnalysis.marketing_hooks);
      }
      if (aiAnalysis.pricing_signals) {
        pricingSignals.tier = aiAnalysis.pricing_signals.tier || pricingSignals.tier;
        pricingSignals.average_ticket_estimate = aiAnalysis.pricing_signals.average_ticket_estimate || pricingSignals.average_ticket_estimate;
      }
    }`;

content = content.replace(oldCaptureCall, newCaptureCall);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated market-radar.functions.ts with Steel.dev & AI integration!');
