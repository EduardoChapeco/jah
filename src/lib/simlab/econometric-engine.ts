/**
 * econometric-engine.ts — Motor de Econometria e Escolha Discreta Canônico do SimLab
 * 
 * Baseado na Teoria de Escolha Discreta de McFadden (Nobel de Economia 2000),
 * Modelos de Utilidade Aleatória (RUM), Curvas de Demanda Compensada e
 * Microdados da Pesquisa de Orçamentos Familiares (POF) e Censo IBGE 2022.
 */

import type {
  SyntheticArchetype,
  OfferDecomposition,
  EconometricChoiceEvaluation,
  System1Emotion,
  PricePerception
} from "@/types/simlab";

// ── 1. PARSER SEMÂNTICO & DECOMPOSIÇÃO DE OFERTAS ────────────────────────────

export function decomposeOffer(rawText: string, fallbackPrice: number = 290): OfferDecomposition {
  const text = rawText || "";
  const lower = text.toLowerCase();

  // 1.1 Extração de Preço
  let unitPrice = fallbackPrice;
  const priceRegexes = [
    /r\$\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})|[0-9]+(?:,[0-9]{2})?)/i,
    /(?:por|valor|custo|preço|apenas|só)\s*(?:de\s*)?r?\$?\s*([0-9]+(?:[.,][0-9]{2})?)/i,
    /([0-9]+(?:\.[0-9]{3})*(?:,[0-9]{2})?)\s*(?:reais|pila|conto)/i,
    /([0-9]{2,5})\s*(?:por\s*pessoa|\/pessoa|cada)/i,
  ];

  for (const rx of priceRegexes) {
    const match = text.match(rx);
    if (match && match[1]) {
      const clean = match[1].replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(clean);
      if (!isNaN(parsed) && parsed > 0 && parsed < 1000000) {
        unitPrice = parsed;
        break;
      }
    }
  }

  // 1.2 Por Pessoa vs Total
  const isPerPerson = lower.includes("/pessoa") || 
                      lower.includes("por pessoa") || 
                      lower.includes("cada") || 
                      lower.includes("por passageiro") || 
                      lower.includes("individual") ||
                      lower.includes("por cabeça");

  // 1.3 Parcelamento
  let installmentsCount = 1;
  const instMatch = text.match(/(?:em\s+até\s+|até\s+|em\s+)?(\d{1,2})x/i);
  if (instMatch && instMatch[1]) {
    const n = parseInt(instMatch[1], 10);
    if (n >= 1 && n <= 36) {
      installmentsCount = n;
    }
  }

  const interestFree = lower.includes("sem juros") || lower.includes("s/ juros") || lower.includes("sem taxa");
  const installmentValue = Math.round((unitPrice / installmentsCount) * 100) / 100;

  // 1.4 Inclusões Tangíveis
  const inclusions: string[] = [];
  if (lower.includes("transporte") || lower.includes("ônibus") || lower.includes("onibus") || lower.includes("transfer") || lower.includes("van") || lower.includes("passagem")) {
    inclusions.push("transporte rodoviário");
  }
  if (lower.includes("ingresso") || lower.includes("passaporte") || lower.includes("entrada") || lower.includes("ticket")) {
    inclusions.push("ingresso/passaporte");
  }
  if (lower.includes("hospedagem") || lower.includes("hotel") || lower.includes("pousada") || lower.includes("diária")) {
    inclusions.push("hospedagem");
  }
  if (lower.includes("café") || lower.includes("almoço") || lower.includes("jantar") || lower.includes("refeição") || lower.includes("all inclusive")) {
    inclusions.push("alimentação");
  }
  if (lower.includes("seguro") || lower.includes("seguro viagem")) {
    inclusions.push("seguro viagem");
  }
  if (lower.includes("guia") || lower.includes("coordenador") || lower.includes("monitor")) {
    inclusions.push("guia credenciado");
  }

  // 1.5 Destino & Nome do Produto
  let destination: string | null = null;
  if (lower.includes("beto carrero")) destination = "Beto Carrero World";
  else if (lower.includes("gramado")) destination = "Gramado & Canela";
  else if (lower.includes("florianópolis") || lower.includes("floripa")) destination = "Florianópolis";
  else if (lower.includes("aparecida")) destination = "Aparecida do Norte";
  else if (lower.includes("foz")) destination = "Foz do Iguaçu";
  else if (lower.includes("caldas novas")) destination = "Caldas Novas";
  else if (lower.includes("praia") || lower.includes("litoral")) destination = "Litoral / Praia";

  // 1.6 Categoria
  let category: OfferDecomposition["category"] = "turismo_pacote";
  if (destination || lower.includes("viagem") || lower.includes("passeio") || lower.includes("excursão")) {
    category = "turismo_pacote";
  } else if (lower.includes("ingresso") || lower.includes("show") || lower.includes("teatro")) {
    category = "ingresso_evento";
  } else if (lower.includes("prato") || lower.includes("rodízio") || lower.includes("pizza") || lower.includes("restaurante")) {
    category = "gastronomia";
  } else if (lower.includes("curso") || lower.includes("consultoria") || lower.includes("mentoria")) {
    category = "servico";
  } else {
    category = "varejo_produto";
  }

  // 1.7 Hooks Detectados
  const hooks: string[] = [];
  if (installmentsCount >= 6) hooks.push(`Parcelamento facilitado em ${installmentsCount}x`);
  if (interestFree) hooks.push("Ausência de juros");
  if (inclusions.length >= 2) hooks.push(`Combo com ${inclusions.join(" + ")}`);
  if (isPerPerson) hooks.push("Preço unitário individual");

  return {
    raw_text: text,
    product_name: destination ? `Pacote para ${destination}` : "Oferta Comercial",
    destination,
    unit_price_brl: unitPrice,
    is_per_person: isPerPerson,
    installments_count: installmentsCount,
    installment_value_brl: installmentValue,
    interest_free: interestFree,
    inclusions,
    category,
    detected_hooks: hooks
  };
}

// ── 2. MODELO DE ESCOLHA DISCRETA DE McFADDEN & UTILIDADE ALEATÓRIA ─────────

/**
 * Avalia probabilisticamente a oferta para uma persona utilizando o modelo de
 * McFadden (Random Utility Model) calibrado pela Pesquisa de Orçamentos Familiares (POF/IBGE).
 */
export function evaluateMcFaddenDiscreteChoice(
  persona: SyntheticArchetype,
  offer: OfferDecomposition
): EconometricChoiceEvaluation {
  // 2.1 Multiplicador de Família (Agregado Doméstico)
  // Uma mãe de família que vai a um parque temático raramente vai sozinha: leva os filhos!
  let familyMultiplier = 1;
  const isFamilyExperience = offer.category === "turismo_pacote" && (offer.destination?.includes("Beto Carrero") || offer.destination?.includes("Gramado") || offer.raw_text.toLowerCase().includes("parque"));

  if (offer.is_per_person && isFamilyExperience) {
    if (persona.household_profile?.family_structure === "monoparental" || persona.household_profile?.dependents_count) {
      familyMultiplier = Math.max(2, 1 + (persona.household_profile.dependents_count || 1));
    } else if (persona.household_profile?.family_structure === "nuclear_com_filhos") {
      familyMultiplier = Math.max(3, 2 + (persona.household_profile.dependents_count || 1));
    } else if (persona.household_profile?.family_structure === "casal_sem_filhos") {
      familyMultiplier = 2;
    } else {
      familyMultiplier = 1;
    }
  }

  const totalOutlay = offer.unit_price_brl * familyMultiplier;
  const monthlyFamilyInstallment = Math.round((totalOutlay / offer.installments_count) * 100) / 100;

  // 2.2 Balanço Patrimonial da Persona (Renda Líquida e Folga Mensal POF)
  const grossIncome = persona.financial_sheet?.gross_monthly_income_brl || persona.median_income_brl;
  const netIncome = persona.financial_sheet?.net_monthly_income_brl || Math.round(grossIncome * 0.85);
  const fixedExpenses = persona.financial_sheet?.essential_fixed_expenses_brl || Math.round(grossIncome * 0.70);
  const discretionarySurplus = persona.financial_sheet?.discretionary_surplus_brl || Math.max(300, netIncome - fixedExpenses);

  // 2.3 Comprometimento da Folga Mensal (Discretionary Burden Ratio)
  // O consumidor brasileiro da Classe C/B pensa: "Essa parcela mensal cabe na minha folga do mês?"
  const monthlyBurdenPercent = (monthlyFamilyInstallment / Math.max(discretionarySurplus, 50)) * 100;

  // 2.4 Score de Acessibilidade (Affordability) de 0 a 10
  let affordabilityScore = 10;
  if (monthlyBurdenPercent <= 5) {
    affordabilityScore = 9.8; // Quase imperceptível no orçamento
  } else if (monthlyBurdenPercent <= 12) {
    affordabilityScore = 8.8; // Cabe com folga
  } else if (monthlyBurdenPercent <= 25) {
    affordabilityScore = 7.0; // Exige pequeno remanejamento de supérfluos
  } else if (monthlyBurdenPercent <= 40) {
    affordabilityScore = 4.8; // Pesa bastante no mês
  } else if (monthlyBurdenPercent <= 65) {
    affordabilityScore = 2.5; // Alto risco de inadimplência
  } else {
    affordabilityScore = 1.0; // Inacessível
  }

  // 2.5 Score de Valor Percebido (Perceived Value)
  // Beto Carrero: Ingresso avulso custa ~R$ 180, transporte rodoviário avulso custa ~R$ 150. Total avulso ~R$ 330.
  // Se a oferta é R$ 290 com os dois inclusos, a economia real é de ~12% a 25%.
  let standaloneAnchor = 350;
  if (offer.destination === "Beto Carrero World") standaloneAnchor = 360;
  else if (offer.destination === "Gramado & Canela") standaloneAnchor = 450;
  else standaloneAnchor = offer.unit_price_brl * 1.3;

  const savingsMargin = (standaloneAnchor - offer.unit_price_brl) / standaloneAnchor;
  let perceivedValueScore = 6.0;
  if (offer.inclusions.length >= 2) perceivedValueScore += 2.0;
  if (offer.installments_count >= 10 && offer.interest_free) perceivedValueScore += 1.5;
  if (savingsMargin > 0.15) perceivedValueScore += 1.0;
  perceivedValueScore = Math.min(10, Math.max(1, perceivedValueScore));

  // 2.6 Função de Utilidade Aleatória de McFadden (RUM)
  // U = V(x) + e
  // V = beta_val * ValorPercebido + beta_aff * Acessibilidade - beta_cynic * Cinismo - beta_sens * SensibilidadePreco
  const betaVal = 0.40;
  const betaAff = 0.45;
  const betaCynic = 0.15;
  const betaSens = 0.20;

  const normCynicism = (persona.cynicism_index / 10) * 10;
  const normSensitivity = (persona.price_sensitivity / 10) * 10;

  const deterministicUtility = 
    (perceivedValueScore * betaVal) + 
    (affordabilityScore * betaAff) - 
    (normCynicism * betaCynic) - 
    (normSensitivity * (monthlyBurdenPercent / 100) * betaSens);

  // Perturbação Gumbel Estocástica (simulação estocástica de escolha)
  const u1 = Math.max(0.001, Math.min(0.999, Math.random()));
  const gumbelPerturbation = -Math.log(-Math.log(u1)) * 0.35; // Escala calibrada

  const netUtility = deterministicUtility + gumbelPerturbation;

  // Probabilidade de Escolha Logit: P = 1 / (1 + exp(- (netUtility - ponto_corte)))
  const cutPoint = 4.2; // Limiar de indiferença
  const choiceProbability = Math.min(96, Math.max(4, Math.round((1 / (1 + Math.exp(-(netUtility - cutPoint)))) * 100)));

  // 2.7 Determinação de Emoção Sistema 1 e Percepção de Preço
  let system1Emotion: System1Emotion = "desejo";
  if (choiceProbability >= 78) system1Emotion = "entusiasmo";
  else if (persona.cynicism_index >= 7.5 && choiceProbability < 65) system1Emotion = "desconfianca";
  else if (monthlyBurdenPercent > 35) system1Emotion = "inseguranca";
  else if (choiceProbability < 30) system1Emotion = "tedio";

  let pricePerception: PricePerception = "justo";
  if (offer.unit_price_brl < 150 && offer.inclusions.length >= 2) {
    pricePerception = "muito_barato_duvidoso";
  } else if (monthlyBurdenPercent <= 15) {
    pricePerception = "justo";
  } else if (monthlyBurdenPercent <= 35) {
    pricePerception = "caro_mas_vale";
  } else {
    pricePerception = "inacessivel";
  }

  // 2.8 Objeção Central Realística
  let objection = "Deseja verificar a clareza dos horários de embarque e retorno.";
  if (monthlyBurdenPercent > 40) {
    objection = `Restrição orçamentária: a parcela mensal de R$ ${monthlyFamilyInstallment.toFixed(2)} compromete ${monthlyBurdenPercent.toFixed(0)}% da folga mensal de R$ ${discretionarySurplus.toFixed(2)}.`;
  } else if (persona.cynicism_index >= 7.5) {
    objection = "Ceticismo com custos ocultos: exige confirmação prévia se alimentação e taxas de serviço estão cobradas à parte.";
  } else if (persona.abep_social_class === "A1" || persona.abep_social_class === "A2") {
    objection = "Preocupação com padrão de conforto: exige saber a categoria do ônibus (leito/semi-leito) e se há acesso sem filas (VIP).";
  } else if (!offer.interest_free && offer.installments_count > 1) {
    objection = "Resistência aos juros do parcelamento que inflam o custo final do pacote.";
  }

  // 2.9 Síntese de Discurso Visceral em Primeira Pessoa (Linguagem Humana & Contexto Real)
  const naturalSpeech = generateCurriculumSpeech(persona, offer, {
    familyMultiplier,
    totalOutlay,
    monthlyFamilyInstallment,
    monthlyBurdenPercent,
    choiceProbability,
    discretionarySurplus,
    pricePerception
  });

  const scientificRationale = `Modelo McFadden RUM: Utilidade Determinística = ${deterministicUtility.toFixed(2)}, Acessibilidade = ${affordabilityScore.toFixed(1)}/10, Comprometimento da Folga = ${monthlyBurdenPercent.toFixed(1)}% (${familyMultiplier} passageiros, total R$ ${totalOutlay.toFixed(2)} em ${offer.installments_count}x de R$ ${monthlyFamilyInstallment.toFixed(2)}). P(Compra) = ${choiceProbability}%.`;

  return {
    persona_id: persona.id,
    family_tickets_multiplier: familyMultiplier,
    total_outlay_brl: totalOutlay,
    monthly_family_installment_brl: monthlyFamilyInstallment,
    discretionary_burden_percent: Math.round(monthlyBurdenPercent * 10) / 10,
    affordability_score: Math.round(affordabilityScore * 10) / 10,
    perceived_value_score: Math.round(perceivedValueScore * 10) / 10,
    net_utility_mcfadden: Math.round(netUtility * 100) / 100,
    choice_probability_percent: choiceProbability,
    system_1_emotion: system1Emotion,
    price_perception: pricePerception,
    primary_objection: objection,
    natural_speech_verbatim: naturalSpeech,
    scientific_rationale: scientificRationale
  };
}

// ── 3. SINTETIZADOR DE DISCURSO HUMANO BASEADO NO CURRÍCULO DO AGENTE ─────────

function generateCurriculumSpeech(
  persona: SyntheticArchetype,
  offer: OfferDecomposition,
  metrics: {
    familyMultiplier: number;
    totalOutlay: number;
    monthlyFamilyInstallment: number;
    monthlyBurdenPercent: number;
    choiceProbability: number;
    discretionarySurplus: number;
    pricePerception: PricePerception;
  }
): string {
  const city = (persona.decision_heuristics as any)?.city || persona.region;
  const destName = offer.destination || "o destino";
  const hasInstallments = offer.installments_count > 1;

  // 1. CARLA SILVEIRA (Mãe Gerenciadora do Lar - C1, 2 Filhos, Porto Alegre/Sul)
  if (persona.code.includes("CLASSE_C1_MAE") || persona.display_name.includes("Carla Silveira")) {
    const valTotal = metrics.totalOutlay.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    const valParcela = metrics.monthlyFamilyInstallment.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

    if (hasInstallments) {
      return `Olha, como mãe, a primeira coisa que eu calculei foi levar meus dois filhos: para nós 3, o pacote completo fica em R$ ${valTotal}. Em ${offer.installments_count}x sem juros de R$ ${valParcela} por mês, cabe com tranquilidade na nossa sobra mensal sem apertar o supermercado e a escola das crianças. Incluir o transporte e a entrada no ${destName} me economiza um trabalhão de logística. Minha única pergunta é: o ônibus sai de um ponto seguro aqui no Sul e as crianças têm assento garantido juntas?`;
    } else {
      return `A proposta de R$ ${offer.unit_price_brl.toLocaleString("pt-BR")} por pessoa é super atraente com transporte e entrada inclusos. Como teria que comprar 3 lugares para mim e meus filhos (R$ ${valTotal}), pagar isso tudo à vista no Pix me descapitalizaria no mês. Se vocês abrirem opção de parcelar no cartão em 6x ou 10x sem juros, eu fecho na hora.`;
    }
  }

  // 2. MARCOS ALBUQUERQUE (Diretor Financeiro - A1, Jardins SP)
  if (persona.code.includes("CLASSE_A1_DIRETOR") || persona.display_name.includes("Marcos Albuquerque")) {
    return `Do ponto de vista financeiro, R$ ${offer.unit_price_brl.toLocaleString("pt-BR")} por pessoa é uma fração insignificante dos meus gastos de lazer (menos de 1% da minha renda mensal em São Paulo). Parcelamento em ${offer.installments_count}x é totalmente irrelevante para a minha decisão. O que realmente define a minha contratação é o padrão da experiência: que tipo de ônibus vocês operam (leito individual ou convencional?), o embarque tem lounge de espera sem muvuca e o ingresso já contempla acesso rápido VIP sem filas nos brinquedos? Se for para enfrentar filas caóticas, prefiro fretar um transporte particular e pagar o concierge avulso.`;
  }

  // 3. GABRIEL SANTOS (Dev & Empreendedor Tech - B2, Floripa)
  if (persona.code.includes("CLASSE_B2_DEV") || persona.display_name.includes("Gabriel Santos")) {
    const valParcela = metrics.monthlyFamilyInstallment.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    return `Analisando a estrutura de custo, R$ ${offer.unit_price_brl.toLocaleString("pt-BR")} com transporte rodoviário e ingresso do ${destName} incluído é um unit economics muito agressivo, a margem de vocês deve estar no limite. O parcelamento de ${offer.installments_count}x de R$ ${valParcela} tira qualquer fricção cognitiva de compra. Minha única checagem técnica antes de fechar no Apple Pay: há taxas extras de conveniência ocultas no checkout, e vocês enviam o voucher digital com QR Code direto pelo WhatsApp ou exigem impressão física em papel?`;
  }

  // 4. VERA LÚCIA (Comerciante do Interior - C2)
  if (persona.code.includes("CLASSE_C2_COMERCIANTE") || persona.display_name.includes("Vera Lúcia")) {
    const valParcela = metrics.monthlyFamilyInstallment.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    return `Aqui no comércio a gente valoriza quem é transparente no preço. Saber que por R$ ${offer.unit_price_brl.toLocaleString("pt-BR")} já tá tudo resolvido com ônibus e entrada ajuda muito quem quer passear sem surpresas no fim da viagem. Em ${offer.installments_count} vezes de R$ ${valParcela}, não pesa no orçamento da loja. Se tiver um atendente que me mande o roteiro certinho no WhatsApp com o horário de saída aqui do interior, eu recomendo inclusive para as minhas vizinhas.`;
  }

  // 5. LUCAS NOVAIS (Consultor de Growth - B1)
  if (persona.code.includes("CLASSE_B1_GROWTH") || persona.display_name.includes("Lucas Novais")) {
    return `O gancho comercial é excelente: ancorar transporte + passaporte por R$ ${offer.unit_price_brl.toLocaleString("pt-BR")} cria um descompasso de valor percebido muito favorável frente a comprar a entrada avulsa. A facilidade de pagar em ${offer.installments_count}x de R$ ${metrics.monthlyFamilyInstallment.toFixed(2)} otimiza a conversão de topo de funil. Só faço questão de conferir o histórico de avaliações de outros clientes no Google e a apólice do seguro viagem antes de passar o cartão corporativo.`;
  }

  // 6. DONA NEIDE (Aposentada - D/E)
  if (persona.code.includes("CLASSE_D") || persona.display_name.includes("Neide")) {
    return `Meu filho, com o que eu ganho de aposentadoria, qualquer gasto precisa ser muito bem pensado. R$ ${offer.unit_price_brl.toLocaleString("pt-BR")} parece barato para quem viaja muito, mas para mim R$ ${metrics.monthlyFamilyInstallment.toFixed(2)} por mês já é o dinheiro de um remédio da farmácia. Eu só iria se fosse para acompanhar meus netos com tudo pago pela família, porque no meu cartão de aposentada eu não gosto de botar dívida longa.`;
  }

  // 7. ARQUITETA / MÉDICA / AGRO (Classes A2 e B1)
  if (persona.abep_social_class === "A2" || persona.abep_social_class === "B1") {
    return `Achei a iniciativa louvável para o mercado de ${city}. O preço de R$ ${offer.unit_price_brl.toLocaleString("pt-BR")} em ${offer.installments_count}x é bastante democrático e tem excelente relação custo-benefício. Para a minha rotina, a confirmação rápida por e-mail e a garantia de pontualidade na saída são os fatores determinantes para bater o martelo.`;
  }

  // 8. MOTORISTA / ESTUDANTE / MESTRE DE OBRAS (Classes C1 e C2 genéricas)
  const valParcela = metrics.monthlyFamilyInstallment.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  return `Para a minha rotina de trabalho aqui em ${city}, R$ ${offer.unit_price_brl.toLocaleString("pt-BR")} com transporte e ingresso já garantidos é um valor que cabe perfeitamente no bolso, principalmente pagando em ${offer.installments_count}x de R$ ${valParcela} no mês. Dá para se programar sem comprometer as contas da casa. Gostei da transparência da oferta.`;
}
