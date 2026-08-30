export interface NicheCatalogContext {
  entityName: string;
  entityNamePlural: string;
  nameLabel: string;
  namePlaceholder: string;
  categoryLabel: string;
  shortDescLabel: string;
  shortDescPlaceholder: string;
  descLabel: string;
  descPlaceholder: string;
  brandLabel: string;
  brandPlaceholder: string;
  skuLabel: string;
  skuPlaceholder: string;
  priceLabel: string;
  variationsSectionTitle: string;
  addVariationBtnText: string;
  addDimensionDialogTitle: string;
  addDimensionDialogDesc: string;
  dimensionNameLabel: string;
  dimensionNamePlaceholder: string;
  dimensionValueLabel: string;
  dimensionValuePlaceholder: string;
  suggestedDimensionChips: Array<{ name: string; firstValue: string }>;
  isFoodBusiness: boolean;
  isServiceBusiness: boolean;
  isVehicleBusiness: boolean;
  isRealEstateBusiness: boolean;
}

export function getNicheCatalogContext(storeSegmentRaw?: string | null): NicheCatalogContext {
  const segment = (storeSegmentRaw || "").toLowerCase();

  // 1. GASTRONOMIA & DELIVERY
  if (
    segment.includes("gastro") ||
    segment.includes("restauran") ||
    segment.includes("lanchon") ||
    segment.includes("pizza") ||
    segment.includes("hamburg") ||
    segment.includes("marmit") ||
    segment.includes("bar") ||
    segment.includes("caf") ||
    segment.includes("doce") ||
    segment.includes("padar") ||
    segment.includes("comida") ||
    segment.includes("aliment")
  ) {
    return {
      entityName: "Item do Cardápio",
      entityNamePlural: "Itens do Cardápio",
      nameLabel: "Nome do Prato / Item *",
      namePlaceholder: "Ex: Pizza Margherita Especial, Burger Artesanal Duplo, Açaí 500ml",
      categoryLabel: "Sessão do Cardápio",
      shortDescLabel: "Ingredientes Principais / Resumo",
      shortDescPlaceholder: "Ex: Pão brioche selado, 2x smash 90g, cheddar cremoso e bacon crocante",
      descLabel: "Descrição do Prato / Detalhes de Preparo",
      descPlaceholder: "Descreva os ingredientes, ponto sugerido, harmonização e informações de alérgenos...",
      brandLabel: "Cozinha / Linha (Opcional)",
      brandPlaceholder: "Ex: Artesanal, Especial da Casa, Linha Fit",
      skuLabel: "Código do Item no PDV",
      skuPlaceholder: "Ex: PIZ-01, BURG-12",
      priceLabel: "Preço do Prato / Item (R$)",
      variationsSectionTitle: "Tamanhos & Porções (Broto, Média, Grande)",
      addVariationBtnText: "Adicionar Tamanho / Porção",
      addDimensionDialogTitle: "Novo Tamanho ou Variação de Prato",
      addDimensionDialogDesc: "Ex: Tamanho (Broto, Média, Grande), Ponto da Carne (Ao ponto, Bem passado) ou Massa.",
      dimensionNameLabel: "Tipo de Variação (Tamanho, Ponto, Massa)",
      dimensionNamePlaceholder: "Ex: Tamanho, Ponto da Carne, Tipo de Borda",
      dimensionValueLabel: "Primeira Opção (Ex: Grande, Ao Ponto)",
      dimensionValuePlaceholder: "Ex: Grande, Ao Ponto, Massa Pan",
      suggestedDimensionChips: [
        { name: "Tamanho", firstValue: "Grande" },
        { name: "Ponto da Carne", firstValue: "Ao Ponto" },
        { name: "Tipo de Massa", firstValue: "Tradicional" },
        { name: "Porção", firstValue: "Individual" },
      ],
      isFoodBusiness: true,
      isServiceBusiness: false,
      isVehicleBusiness: false,
      isRealEstateBusiness: false,
    };
  }

  // 2. VEÍCULOS & CONCESSIONÁRIA
  if (
    segment.includes("veicul") ||
    segment.includes("carro") ||
    segment.includes("moto") ||
    segment.includes("automot") ||
    segment.includes("garagem")
  ) {
    return {
      entityName: "Veículo",
      entityNamePlural: "Estoque de Veículos",
      nameLabel: "Título do Veículo (Marca, Modelo, Ano) *",
      namePlaceholder: "Ex: Honda Civic Touring 1.5 Turbo Automático 2022",
      categoryLabel: "Categoria de Veículo",
      shortDescLabel: "Destaques Rápidos (KM, Câmbio, Laudo)",
      shortDescPlaceholder: "Ex: 45.000 km, Único Dono, Laudo Cautelar 100% Aprovado, Teto Solar",
      descLabel: "Ficha Técnica Completa & Opcionais",
      descPlaceholder: "Liste todos os opcionais (bancos em couro, multimídia, sensor de ré, IPVA pago)...",
      brandLabel: "Marca / Montadora",
      brandPlaceholder: "Ex: Honda, Toyota, BMW, Chevrolet",
      skuLabel: "Placa / Chassi Final",
      skuPlaceholder: "Ex: PLACA-9G81",
      priceLabel: "Valor de Venda (R$)",
      variationsSectionTitle: "Versões ou Configurações do Veículo",
      addVariationBtnText: "Adicionar Versão / Cor",
      addDimensionDialogTitle: "Nova Versão ou Cor de Veículo",
      addDimensionDialogDesc: "Ex: Versão (Sport, Touring), Câmbio (Manual, Automático) ou Cor.",
      dimensionNameLabel: "Propriedade (Versão, Câmbio, Cor)",
      dimensionNamePlaceholder: "Ex: Versão, Cor, Câmbio",
      dimensionValueLabel: "Primeira Opção (Ex: Touring, Prata)",
      dimensionValuePlaceholder: "Ex: Touring Turbo, Prata Lunar",
      suggestedDimensionChips: [
        { name: "Versão", firstValue: "Touring" },
        { name: "Cor", firstValue: "Preto Ninja" },
        { name: "Câmbio", firstValue: "Automático" },
      ],
      isFoodBusiness: false,
      isServiceBusiness: false,
      isVehicleBusiness: true,
      isRealEstateBusiness: false,
    };
  }

  // 3. IMOBILIÁRIA & IMÓVEIS
  if (segment.includes("imove") || segment.includes("imobili") || segment.includes("corret")) {
    return {
      entityName: "Imóvel",
      entityNamePlural: "Catálogo de Imóveis",
      nameLabel: "Título do Imóvel *",
      namePlaceholder: "Ex: Apartamento 3 Suítes Alto Padrão Centro com Sacada Gourmet",
      categoryLabel: "Tipo de Imóvel (Apto, Casa, Terreno)",
      shortDescLabel: "Resumo dos Cômodos & Metragem",
      shortDescPlaceholder: "Ex: 180m² privativos, 3 suítes, 2 vagas de garagem e vista livre",
      descLabel: "Descrição do Imóvel & Condomínio",
      descPlaceholder: "Detalhes de acabamento, infraestrutura de lazer do prédio, mobília inclusa e localização...",
      brandLabel: "Construtora / Empreendimento",
      brandPlaceholder: "Ex: Empreendimento Grand Tower",
      skuLabel: "Código de Referência do Imóvel",
      skuPlaceholder: "Ex: AP-CENTRO-301",
      priceLabel: "Valor do Imóvel (R$)",
      variationsSectionTitle: "Tipologias & Andares",
      addVariationBtnText: "Adicionar Tipologia",
      addDimensionDialogTitle: "Nova Tipologia de Imóvel",
      addDimensionDialogDesc: "Ex: Andar (Baixo, Alto), Posição Solar (Norte, Leste) ou Vagas.",
      dimensionNameLabel: "Tipo de Variação (Andar, Sol, Vagas)",
      dimensionNamePlaceholder: "Ex: Andar, Posição Solar, Vagas",
      dimensionValueLabel: "Primeira Opção",
      dimensionValuePlaceholder: "Ex: Andar Alto, Sol da Manhã",
      suggestedDimensionChips: [
        { name: "Andar", firstValue: "Andar Alto" },
        { name: "Posição Solar", firstValue: "Sol da Manhã" },
        { name: "Vagas", firstValue: "2 Vagas Cobertas" },
      ],
      isFoodBusiness: false,
      isServiceBusiness: false,
      isVehicleBusiness: false,
      isRealEstateBusiness: true,
    };
  }

  // 4. LOCAÇÃO & ESTRUTURAS PARA EVENTOS
  if (
    segment.includes("locac") ||
    segment.includes("alug") ||
    segment.includes("equipamento") ||
    segment.includes("blaster") ||
    segment.includes("som") ||
    segment.includes("ilumin") ||
    segment.includes("tenda")
  ) {
    return {
      entityName: "Equipamento / Bem",
      entityNamePlural: "Equipamentos & Bens",
      nameLabel: "Nome do Equipamento / Estrutura *",
      namePlaceholder: "Ex: Caixa Ativa JBL EON 715 1300W, Tenda Piramidal 10x10m",
      categoryLabel: "Categoria de Equipamento",
      shortDescLabel: "Resumo Técnico / Itens Inclusos",
      shortDescPlaceholder: "Ex: Acompanha tripé reforçado e cabos balanceados XLR 10m",
      descLabel: "Ficha Técnica, Dimensões e Restrições",
      descPlaceholder: "Voltagem, potência, tempo estimado de montagem, peso e requisitos de transporte...",
      brandLabel: "Marca / Fabricante",
      brandPlaceholder: "Ex: JBL, QSC, Behringer, Estruturas Sul",
      skuLabel: "Código do Patrimônio",
      skuPlaceholder: "Ex: PAT-SOM-01",
      priceLabel: "Valor da Diária de Locação (R$)",
      variationsSectionTitle: "Variações do Equipamento (Voltagem, Kit)",
      addVariationBtnText: "Adicionar Variação de Equipamento",
      addDimensionDialogTitle: "Nova Variação de Equipamento",
      addDimensionDialogDesc: "Ex: Voltagem (110V, 220V, Bivolt) ou Kit (Com Tripé, Sem Tripé).",
      dimensionNameLabel: "Propriedade do Equipamento",
      dimensionNamePlaceholder: "Ex: Voltagem, Kit / Configuração",
      dimensionValueLabel: "Primeira Opção",
      dimensionValuePlaceholder: "Ex: 220V, Kit Completo",
      suggestedDimensionChips: [
        { name: "Voltagem", firstValue: "220V" },
        { name: "Kit", firstValue: "Com Pedestal e Cabos" },
        { name: "Tamanho", firstValue: "10x10 Metros" },
      ],
      isFoodBusiness: false,
      isServiceBusiness: false,
      isVehicleBusiness: false,
      isRealEstateBusiness: false,
    };
  }

  // 5. PET SHOP & VETERINÁRIA
  if (
    segment.includes("pet") ||
    segment.includes("veterin") ||
    segment.includes("banho") ||
    segment.includes("tosa") ||
    segment.includes("agro") ||
    segment.includes("racao")
  ) {
    return {
      entityName: "Produto Pet",
      entityNamePlural: "Produtos Pet & Rações",
      nameLabel: "Nome do Produto / Ração *",
      namePlaceholder: "Ex: Ração Super Premium Cães Adultos Frango 15kg, Antipulgas Simparic",
      categoryLabel: "Categoria Pet",
      shortDescLabel: "Indicação & Benefícios Principais",
      shortDescPlaceholder: "Ex: Para cães de porte médio a grande, sem corantes e rica em ômega 3 e 6",
      descLabel: "Composição, Níveis de Garantia e Modo de Uso",
      descPlaceholder: "Guia de alimentação diária, tabela de ingredientes, peso e orientações de conservação...",
      brandLabel: "Marca / Laboratório",
      brandPlaceholder: "Ex: Premier, Royal Canin, Zoetis, Bravecto",
      skuLabel: "Código EAN / SKU",
      skuPlaceholder: "Ex: 7891234567890",
      priceLabel: "Preço de Venda (R$)",
      variationsSectionTitle: "Variações de Embalagem (Peso, Sabor, Porte)",
      addVariationBtnText: "Adicionar Pacote / Variação",
      addDimensionDialogTitle: "Nova Variação de Embalagem",
      addDimensionDialogDesc: "Ex: Peso do Pacote (1kg, 3kg, 15kg), Sabor ou Porte do Animal.",
      dimensionNameLabel: "Tipo de Variação (Peso, Sabor, Porte)",
      dimensionNamePlaceholder: "Ex: Peso da Embalagem, Sabor, Porte",
      dimensionValueLabel: "Primeira Opção",
      dimensionValuePlaceholder: "Ex: 15kg, Frango & Arroz, Porte Grande",
      suggestedDimensionChips: [
        { name: "Peso da Embalagem", firstValue: "15kg" },
        { name: "Sabor", firstValue: "Frango & Arroz" },
        { name: "Porte", firstValue: "Médio / Grande" },
      ],
      isFoodBusiness: false,
      isServiceBusiness: false,
      isVehicleBusiness: false,
      isRealEstateBusiness: false,
    };
  }

  // 6. SUPERMERCADO, HORTIFRÚTI & AÇOUGUE
  if (
    segment.includes("mercado") ||
    segment.includes("supermercado") ||
    segment.includes("hortifruti") ||
    segment.includes("acougue") ||
    segment.includes("mercearia")
  ) {
    return {
      entityName: "Item de Mercado",
      entityNamePlural: "Itens de Mercado & Hortifrúti",
      nameLabel: "Nome do Produto / Alimento *",
      namePlaceholder: "Ex: Filé Mignon Bovino Resfriado Peça a Vácuo, Maçã Gala Selecionada",
      categoryLabel: "Sessão do Mercado (Açougue, Hortifrúti, Mercearia)",
      shortDescLabel: "Resumo do Produto / Origem",
      shortDescPlaceholder: "Ex: Corte nobre macio e limpo, ideal para grelhados e assados",
      descLabel: "Informações Nutricionais e Conservação",
      descPlaceholder: "Tabela de valor energético, conservação e detalhes do produtor...",
      brandLabel: "Marca / Produtor",
      brandPlaceholder: "Ex: Friboi, Seara, Nestlé, Produtor Local",
      skuLabel: "Código EAN / Barras",
      skuPlaceholder: "Ex: 7891234567890",
      priceLabel: "Preço de Venda (R$)",
      variationsSectionTitle: "Variações de Corte ou Embalagem",
      addVariationBtnText: "Adicionar Variação de Embalagem",
      addDimensionDialogTitle: "Nova Variação de Corte / Peso",
      addDimensionDialogDesc: "Ex: Tipo de Corte (Em Bifes, Peça Inteira, Moído) ou Embalagem (500g, 1kg).",
      dimensionNameLabel: "Tipo de Variação (Corte, Peso)",
      dimensionNamePlaceholder: "Ex: Tipo de Corte, Peso da Embalagem",
      dimensionValueLabel: "Primeira Opção",
      dimensionValuePlaceholder: "Ex: Em Bifes Finos, 1kg",
      suggestedDimensionChips: [
        { name: "Tipo de Corte", firstValue: "Em Bifes" },
        { name: "Peso da Embalagem", firstValue: "1kg" },
        { name: "Maturação", firstValue: "Tradicional" },
      ],
      isFoodBusiness: false,
      isServiceBusiness: false,
      isVehicleBusiness: false,
      isRealEstateBusiness: false,
    };
  }

  // 7. ELETRÔNICOS & ASSISTÊNCIA TÉCNICA
  if (
    segment.includes("celul") ||
    segment.includes("eletron") ||
    segment.includes("assist") ||
    segment.includes("repar") ||
    segment.includes("consert") ||
    segment.includes("inform")
  ) {
    return {
      entityName: "Aparelho / Peça",
      entityNamePlural: "Aparelhos, Peças & Acessórios",
      nameLabel: "Nome do Aparelho / Acessório *",
      namePlaceholder: "Ex: iPhone 15 Pro Max 256GB Titânio Natural, Película 3D de Vidro",
      categoryLabel: "Categoria de Eletrônicos",
      shortDescLabel: "Especificações Rápidas",
      shortDescPlaceholder: "Ex: 256GB, Tela OLED 6.7', Acompanha cabo USB-C, 1 ano de garantia",
      descLabel: "Ficha Técnica, Compatibilidade e Garantia",
      descPlaceholder: "Processador, memória RAM, portas de conexão, itens inclusos na caixa e termos de garantia...",
      brandLabel: "Marca / Fabricante",
      brandPlaceholder: "Ex: Apple, Samsung, Xiaomi, Motorola, Dell",
      skuLabel: "Código SKU / Part Number",
      skuPlaceholder: "Ex: IPH-15PM-256",
      priceLabel: "Preço de Venda (R$)",
      variationsSectionTitle: "Variações (Armazenamento, Voltagem, Cor)",
      addVariationBtnText: "Adicionar Variação Técnica",
      addDimensionDialogTitle: "Nova Variação Técnica",
      addDimensionDialogDesc: "Ex: Capacidade (128GB, 256GB, 512GB), Voltagem (110V, 220V, Bivolt) ou Cor.",
      dimensionNameLabel: "Propriedade Técnica",
      dimensionNamePlaceholder: "Ex: Capacidade, Voltagem, Cor",
      dimensionValueLabel: "Primeira Opção",
      dimensionValuePlaceholder: "Ex: 256GB, Bivolt, Grafite",
      suggestedDimensionChips: [
        { name: "Capacidade", firstValue: "256GB" },
        { name: "Voltagem", firstValue: "Bivolt" },
        { name: "Cor", firstValue: "Grafite" },
        { name: "Condição", firstValue: "Novo Lacrado" },
      ],
      isFoodBusiness: false,
      isServiceBusiness: false,
      isVehicleBusiness: false,
      isRealEstateBusiness: false,
    };
  }

  // 8. PADRÃO: VAREJO & MODA (Roupas, Calçados, Comércio Geral)
  return {
    entityName: "Produto",
    entityNamePlural: "Produtos",
    nameLabel: "Nome do Produto *",
    namePlaceholder: "Ex: Camiseta Básica Algodão Egípcio, Calça Jeans Slim",
    categoryLabel: "Categoria do Produto",
    shortDescLabel: "Resumo do Produto",
    shortDescPlaceholder: "Ex: 100% algodão egípcio com toque macio e caimento impecável",
    descLabel: "Descrição Completa & Tabela de Medidas",
    descPlaceholder: "Composição do tecido, guia de tamanhos, instruções de lavagem e diferenciais...",
    brandLabel: "Marca / Fabricante",
    brandPlaceholder: "Ex: Nike, Zara, Autoral",
    skuLabel: "Código SKU",
    skuPlaceholder: "Ex: CAM-ALG-001",
    priceLabel: "Preço de Venda (R$)",
    variationsSectionTitle: "Grade de Variações (Tamanho, Cor, Tecido)",
    addVariationBtnText: "Adicionar Variação de Grade",
    addDimensionDialogTitle: "Nova Dimensão de Grade",
    addDimensionDialogDesc: "Ex: Tamanho (P, M, G, GG), Cor (Preto, Branco) ou Numeração (36 ao 44).",
    dimensionNameLabel: "Nome da Dimensão (Tamanho, Cor, Numeração)",
    dimensionNamePlaceholder: "Ex: Tamanho, Cor, Numeração",
    dimensionValueLabel: "Primeira Opção / Valor",
    dimensionValuePlaceholder: "Ex: M, Azul Marinho, 38",
    suggestedDimensionChips: [
      { name: "Tamanho", firstValue: "M" },
      { name: "Cor", firstValue: "Preto" },
      { name: "Numeração", firstValue: "38" },
      { name: "Tecido", firstValue: "Algodão" },
    ],
    isFoodBusiness: false,
    isServiceBusiness: false,
    isVehicleBusiness: false,
    isRealEstateBusiness: false,
  };
}
