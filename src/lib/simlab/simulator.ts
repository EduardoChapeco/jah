/**
 * Motor de Simulação Estocástica de Personas (JAH SimLab / Simwork Engine)
 * Avalia propostas comerciais, culturais e de eventos contra o catálogo de personas.
 */

import { SEED_PERSONAS, type SyntheticPersona } from "./seed-personas";
export type { SyntheticPersona } from "./seed-personas";

export interface SimulationInput {
  title: string;
  description: string;
  priceCents: number;
  niche: "eventos" | "gastronomia" | "moda" | "musica" | "servicos" | "classificados";
  format?: "produto" | "evento" | "flyer" | "post" | "servico";
  targetAudienceHint?: string;
}

export interface PersonaEvaluation {
  persona: SyntheticPersona;
  affinityScore: number; // 0-100
  willConvert: boolean;
  conversionProbability: number; // 0-100%
  pricePerception: "muito_barato" | "justo" | "caro" | "fora_de_cogitacao";
  sentiment: "entusiasmado" | "favoravel" | "neutro" | "cético" | "rejeitado";
  quote: string;
  keyObjection?: string;
  triggerActivated: string;
}

export interface SimulationResult {
  overallScore: number; // 0-100
  estimatedConversionRate: number; // %
  priceElasticityIndex: number; // 0-100 (100 = preço percebido como excelente)
  totalPersonasEvaluated: number;
  favorableCount: number;
  skepticalCount: number;
  evaluations: PersonaEvaluation[];
  topObjections: string[];
  recommendations: string[];
  summary: string;
}

export function runSimulation(input: SimulationInput): SimulationResult {
  const priceReais = input.priceCents / 100;
  const titleLower = input.title.toLowerCase();
  const descLower = input.description.toLowerCase();

  const evaluations: PersonaEvaluation[] = SEED_PERSONAS.map((persona) => {
    let affinity = 50;

    // 1. Nicho preferido
    if (persona.preferredNiches.includes(input.niche)) {
      affinity += 20;
    }

    // 2. Análise de Renda vs Preço (Elasticidade)
    const incomeShare = (priceReais / (persona.demographic.income || 3000)) * 100;
    let pricePerception: PersonaEvaluation["pricePerception"] = "justo";

    if (input.priceCents === 0) {
      pricePerception = "muito_barato";
      affinity += 20;
    } else if (incomeShare < 1.0) {
      pricePerception = "muito_barato";
      affinity += 15;
    } else if (incomeShare < 3.0) {
      pricePerception = "justo";
      affinity += 5;
    } else if (incomeShare < 7.0) {
      pricePerception = "caro";
      affinity -= 15;
    } else {
      pricePerception = "fora_de_cogitacao";
      affinity -= 35;
    }

    // 3. Gatilhos da Persona vs Conteúdo da Proposta
    let triggerActivated = "Afinidade de Categoria";
    if (
      descLower.includes("exclusivo") ||
      descLower.includes("lote") ||
      descLower.includes("limitado")
    ) {
      affinity += (persona.triggerScores.urgency - 5) * 3;
      triggerActivated = "Urgência / Escassez";
    }
    if (
      descLower.includes("artesanal") ||
      descLower.includes("autoral") ||
      descLower.includes("independente")
    ) {
      affinity += (persona.triggerScores.hedonic - 5) * 3;
      triggerActivated = "Identidade Autoral";
    }
    if (
      descLower.includes("desconto") ||
      descLower.includes("promoção") ||
      descLower.includes("off")
    ) {
      affinity += (persona.triggerScores.discount - 5) * 3;
      triggerActivated = "Oportunidade Financeira";
    }

    // 4. Penalidade de Cinismo
    if (descLower.length < 30) {
      affinity -= persona.triggerScores.cynicism * 2; // Falta de detalhe gera desconfiança
    }

    affinity = Math.max(5, Math.min(98, Math.round(affinity)));

    // Decisão de conversão
    const conversionProbability = Math.max(
      0,
      Math.min(100, Math.round(affinity * (pricePerception === "fora_de_cogitacao" ? 0.2 : 1.0))),
    );
    const willConvert = conversionProbability >= 55;

    let sentiment: PersonaEvaluation["sentiment"] = "neutro";
    if (conversionProbability >= 80) sentiment = "entusiasmado";
    else if (conversionProbability >= 60) sentiment = "favoravel";
    else if (conversionProbability >= 40) sentiment = "neutro";
    else if (conversionProbability >= 20) sentiment = "cético";
    else sentiment = "rejeitado";

    // Gera citação sintética contextual
    let quote = "";
    let keyObjection: string | undefined;

    if (sentiment === "entusiasmado") {
      quote = `Adorei a proposta! O valor de R$ ${priceReais.toFixed(2)} faz total sentido pelo que oferece. Já quero garantir.`;
    } else if (sentiment === "favoravel") {
      quote = `Parece muito bom. Só gostaria de ver mais fotos e detalhes antes de fechar a compra.`;
    } else if (sentiment === "neutro") {
      quote = `Interessante, mas vou esperar sair mais avaliações ou conversar com alguém que já comprou.`;
      keyObjection = "Falta prova social / avaliações de outros compradores";
    } else if (sentiment === "cético") {
      quote = `Achei o valor um pouco salgado para pouca informação descrita na página.`;
      keyObjection = `Preço (R$ ${priceReais.toFixed(2)}) percebido como elevado sem clareza dos diferenciais`;
    } else {
      quote = `Não compraria agora. O preço não cabe no meu orçamento ou não vi benefício claro.`;
      keyObjection = "Desalinhamento de renda com o valor cobrado";
    }

    return {
      persona,
      affinityScore: affinity,
      willConvert,
      conversionProbability,
      pricePerception,
      sentiment,
      quote,
      keyObjection,
      triggerActivated,
    };
  });

  const totalEvaluated = evaluations.length;
  const favorableCount = evaluations.filter((e) => e.willConvert).length;
  const skepticalCount = totalEvaluated - favorableCount;

  const avgScore = Math.round(
    evaluations.reduce((acc, e) => acc + e.affinityScore, 0) / totalEvaluated,
  );
  const estimatedConversion = Math.round((favorableCount / totalEvaluated) * 100);

  const priceScores = evaluations.map((e) => {
    if (e.pricePerception === "muito_barato") return 100;
    if (e.pricePerception === "justo") return 80;
    if (e.pricePerception === "caro") return 40;
    return 10;
  });
  const priceElasticityIndex = Math.round(priceScores.reduce((a, b) => a + b, 0) / totalEvaluated);

  const topObjections = Array.from(
    new Set(evaluations.map((e) => e.keyObjection).filter(Boolean) as string[]),
  ).slice(0, 3);

  const recommendations: string[] = [];
  if (input.description.length < 60) {
    recommendations.push(
      "Aprofunde a descrição: adicione dimensões, materiais, horários ou diferenciais para reduzir o cinismo do consumidor.",
    );
  }
  if (priceElasticityIndex < 60 && priceReais > 0) {
    recommendations.push(
      `Considere criar uma opção de entrada (lote promocional ou versão menor) para atrair perfis mais jovens e sensíveis a preço.`,
    );
  }
  if (topObjections.some((o) => o.includes("prova social"))) {
    recommendations.push(
      "Estimule avaliações e depoimentos rápidos na página pública para aumentar a segurança de compra.",
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      "A proposta está muito bem equilibrada para o público-alvo principal! Pronta para publicação.",
    );
  }

  const summary = `Simulação concluída com ${totalEvaluated} personas ativas. Score de atratividade: ${avgScore}/100. Conversão estimada de ${estimatedConversion}%.`;

  return {
    overallScore: avgScore,
    estimatedConversionRate: estimatedConversion,
    priceElasticityIndex,
    totalPersonasEvaluated: totalEvaluated,
    favorableCount,
    skepticalCount,
    evaluations,
    topObjections,
    recommendations,
    summary,
  };
}
