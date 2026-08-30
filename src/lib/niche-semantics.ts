/**
 * Biblioteca Canônica de Semântica e Terminologia Contextual por Nicho (JAH / Wider)
 *
 * Fornece a identidade semântica completa para adaptar títulos, botões de ação,
 * labels, placeholders, tipos de pedidos e termos operacionais de acordo com
 * o segmento comercial ativo da loja.
 */

export interface NicheSemantics {
  nicheId: string;
  name: string;
  itemSingular: string;
  itemPlural: string;
  catalogTitle: string;
  newItemAction: string;
  editItemAction: string;
  categoriesLabel: string;
  newCategoryAction: string;
  modifiersLabel: string;
  newModifierAction: string;
  ordersLabel: string;
  kdsLabel: string;
  customerLabel: string;
  stockLabel: string;
  searchItemPlaceholder: string;
  emptyCatalogText: string;
  priceLabel: string;
  skuLabel: string;
  preparationOrDurationLabel?: string;
  posServiceModes: Array<{ id: string; label: string; placeholder?: string }>;
  suggestedPresets: Array<{ name: string; type: "single" | "multiple"; desc: string }>;
}

export const NICHE_SEMANTICS_REGISTRY: Record<string, NicheSemantics> = {
  // 1. GASTRONOMIA, RESTAURANTES & DELIVERY
  gastronomy: {
    nicheId: "gastronomy",
    name: "Gastronomia & Delivery",
    itemSingular: "Prato / Lanche",
    itemPlural: "Pratos & Itens",
    catalogTitle: "Cardápio & Itens",
    newItemAction: "Adicionar ao Cardápio",
    editItemAction: "Editar Item do Cardápio",
    categoriesLabel: "Categorias do Menu",
    newCategoryAction: "Nova Seção do Cardápio",
    modifiersLabel: "Adicionais & Opcionais",
    newModifierAction: "Novo Grupo de Adicionais",
    ordersLabel: "Pedidos & Cozinha",
    kdsLabel: "Gestor de Pedidos (KDS)",
    customerLabel: "Clientes",
    stockLabel: "Controle de Insumos",
    searchItemPlaceholder: "Buscar por prato, lanche, bebida ou código...",
    emptyCatalogText: "Nenhum prato ou item cadastrado no cardápio ainda.",
    priceLabel: "Preço de Venda",
    skuLabel: "Código do Item / PDV",
    preparationOrDurationLabel: "Tempo Estimado de Preparo (minutos)",
    posServiceModes: [
      { id: "counter", label: "Balcão (Takeout)", placeholder: "Nome do Cliente" },
      { id: "table", label: "Mesa (Salão)", placeholder: "Número da Mesa (ex: 04)" },
      { id: "tab", label: "Comanda", placeholder: "Número da Comanda (ex: 12)" },
      { id: "delivery", label: "Delivery", placeholder: "Endereço / Telefone" },
    ],
    suggestedPresets: [
      { name: "Adicionais Pagos (Bacon, Queijo, Molhos)", type: "multiple", desc: "Permite escolher vários extras com valor adicional" },
      { name: "Ponto da Carne (Ao Ponto, Bem Passado)", type: "single", desc: "Escolha obrigatória de 1 opção sem acréscimo" },
      { name: "Bebida Acompanhamento", type: "single", desc: "Oferta de bebida em combo" },
      { name: "Tamanho da Porção (Individual, Médio, Família)", type: "single", desc: "Variação de tamanho da refeição" },
    ],
  },

  // 2. VAREJO, MODA & CALÇADOS
  retail: {
    nicheId: "retail",
    name: "Varejo, Moda & Acessórios",
    itemSingular: "Produto",
    itemPlural: "Produtos",
    catalogTitle: "Catálogo & Estoque",
    newItemAction: "Novo Produto",
    editItemAction: "Editar Produto",
    categoriesLabel: "Categorias de Produto",
    newCategoryAction: "Nova Categoria",
    modifiersLabel: "Grades (Cores & Tamanhos)",
    newModifierAction: "Novo Grupo de Grade",
    ordersLabel: "Histórico de Vendas",
    kdsLabel: "Separação & Despacho",
    customerLabel: "Clientes",
    stockLabel: "Estoque & Movimentos",
    searchItemPlaceholder: "Buscar produto por nome, marca, SKU ou código de barras...",
    emptyCatalogText: "Nenhum produto cadastrado no catálogo ainda.",
    priceLabel: "Preço de Venda",
    skuLabel: "SKU / Código de Barras",
    posServiceModes: [
      { id: "counter", label: "Balcão / Caixa", placeholder: "Nome do Cliente" },
      { id: "fitting", label: "Provador / Reserva", placeholder: "Identificação da Reserva" },
      { id: "delivery", label: "Envio Correios / Motoboy", placeholder: "Endereço de Entrega" },
    ],
    suggestedPresets: [
      { name: "Grade de Tamanhos (P, M, G, GG ou 36 ao 44)", type: "single", desc: "Seleção do tamanho do vestuário/calçado" },
      { name: "Variação de Cores", type: "single", desc: "Opção de cor da peça" },
      { name: "Embalagem para Presente Luxo", type: "single", desc: "Embalagem especial com cartão" },
    ],
  },

  // 3. SERVIÇOS, BELEZA, ESTÉTICA & BARBEARIA
  services: {
    nicheId: "services",
    name: "Serviços, Beleza & Estética",
    itemSingular: "Procedimento / Serviço",
    itemPlural: "Serviços & Procedimentos",
    catalogTitle: "Catálogo de Serviços",
    newItemAction: "Cadastrar Serviço",
    editItemAction: "Editar Serviço",
    categoriesLabel: "Especialidades / Áreas",
    newCategoryAction: "Nova Especialidade",
    modifiersLabel: "Procedimentos Adicionais & Extras",
    newModifierAction: "Novo Grupo de Opcionais",
    ordersLabel: "Agendamentos & Comandas",
    kdsLabel: "Fila de Atendimento",
    customerLabel: "Clientes / Pacientes",
    stockLabel: "Produtos & Homecare",
    searchItemPlaceholder: "Buscar serviço ou profissional...",
    emptyCatalogText: "Nenhum serviço cadastrado na grade ainda.",
    priceLabel: "Valor do Serviço",
    skuLabel: "Código do Serviço",
    preparationOrDurationLabel: "Duração Média da Sessão (minutos)",
    posServiceModes: [
      { id: "chair", label: "Cadeira / Cabine", placeholder: "Nome do Cliente / Profissional" },
      { id: "counter", label: "Recepção / Caixa", placeholder: "Nome do Cliente" },
      { id: "home", label: "Atendimento em Domicílio", placeholder: "Endereço do Cliente" },
    ],
    suggestedPresets: [
      { name: "Tratamento / Hidratação Extra", type: "multiple", desc: "Adicionais durante a realização do procedimento" },
      { name: "Produto Homecare Recomendado", type: "multiple", desc: "Itens para continuidade do cuidado em casa" },
    ],
  },

  // 4. LOCAÇÃO DE EQUIPAMENTOS & ESTRUTURAS
  rental: {
    nicheId: "rental",
    name: "Locação, Estruturas & Eventos",
    itemSingular: "Equipamento / Bem",
    itemPlural: "Bens & Equipamentos",
    catalogTitle: "Inventário de Locação",
    newItemAction: "Cadastrar Equipamento",
    editItemAction: "Editar Equipamento",
    categoriesLabel: "Categorias de Equipamentos",
    newCategoryAction: "Nova Categoria",
    modifiersLabel: "Acessórios & Operadores Técnicos",
    newModifierAction: "Novo Grupo de Opcionais",
    ordersLabel: "Contratos & Locações",
    kdsLabel: "Montagens & Despacho",
    customerLabel: "Clientes / Produtores",
    stockLabel: "Disponibilidade de Frota/Itens",
    searchItemPlaceholder: "Buscar equipamento por nome, número de série ou modelo...",
    emptyCatalogText: "Nenhum equipamento cadastrado no inventário ainda.",
    priceLabel: "Valor da Diária / Período",
    skuLabel: "Número de Patrimônio / Série",
    posServiceModes: [
      { id: "pickup", label: "Retirada no Galpão", placeholder: "Nome do Responsável" },
      { id: "assembly", label: "Montagem no Local", placeholder: "Endereço do Evento" },
      { id: "quote", label: "Reserva de Orçamento", placeholder: "Data do Evento" },
    ],
    suggestedPresets: [
      { name: "Operador Técnico / Blaster / Sonoplasta", type: "single", desc: "Inclusão de profissional habilitado para a operação" },
      { name: "Cabos, Suportes & Extensões Extras", type: "multiple", desc: "Acessórios complementares para o setup" },
      { name: "Frete / Deslocamento de Equipe", type: "single", desc: "Taxa de transporte conforme a distância" },
    ],
  },

  // 5. ASSISTÊNCIA TÉCNICA & REPAROS
  tech_repair: {
    nicheId: "tech_repair",
    name: "Assistência Técnica & Reparos",
    itemSingular: "Serviço / Peça",
    itemPlural: "Peças, Capinhas & Serviços",
    catalogTitle: "Peças & Tabela de Reparo",
    newItemAction: "Novo Reparo ou Acessório",
    editItemAction: "Editar Item",
    categoriesLabel: "Marcas / Modelos de Aparelho",
    newCategoryAction: "Nova Categoria / Marca",
    modifiersLabel: "Garantia Estendida & Acessórios",
    newModifierAction: "Novo Grupo de Opcionais",
    ordersLabel: "Ordens de Serviço (OS)",
    kdsLabel: "Bancada de Reparos (Fila)",
    customerLabel: "Clientes",
    stockLabel: "Estoque de Peças & Telas",
    searchItemPlaceholder: "Buscar reparo, tela, bateria, capinha ou película...",
    emptyCatalogText: "Nenhuma peça ou serviço cadastrado ainda.",
    priceLabel: "Valor da Peça / Mão de Obra",
    skuLabel: "Código da Peça / SKU",
    preparationOrDurationLabel: "Tempo de Execução do Reparo (horas)",
    posServiceModes: [
      { id: "os", label: "Ordem de Serviço (OS)", placeholder: "Aparelho / IMEI / Senha" },
      { id: "counter", label: "Balcão (Acessórios)", placeholder: "Nome do Cliente" },
      { id: "delivery", label: "Delivery / Motoboy", placeholder: "Endereço de Entrega" },
    ],
    suggestedPresets: [
      { name: "Tipo de Peça (Original Nacional / Premium)", type: "single", desc: "Escolha da procedência da peça" },
      { name: "Película 3D de Proteção Aplicada", type: "single", desc: "Proteção adicional para tela recém trocada" },
      { name: "Garantia Estendida (6 Meses / 1 Ano)", type: "single", desc: "Extensão da cobertura técnica" },
    ],
  },

  // 6. PET SHOP & CLÍNICA VETERINÁRIA
  pet: {
    nicheId: "pet",
    name: "Pet Shop & Veterinária",
    itemSingular: "Produto / Procedimento",
    itemPlural: "Rações, Medicamentos & Banho",
    catalogTitle: "Produtos & Procedimentos Pet",
    newItemAction: "Novo Item ou Procedimento",
    editItemAction: "Editar Item Pet",
    categoriesLabel: "Sessões Pet (Cães, Gatos, Farmácia)",
    newCategoryAction: "Nova Seção Pet",
    modifiersLabel: "Adicionais de Estética (Hidratação, Tosa)",
    newModifierAction: "Novo Grupo de Adicionais",
    ordersLabel: "Grade de Atendimentos & Vendas",
    kdsLabel: "Fila de Banho e Tosa",
    customerLabel: "Tutores & Pets",
    stockLabel: "Estoque de Rações & Farmácia",
    searchItemPlaceholder: "Buscar ração, antipulgas, brinquedo ou serviço...",
    emptyCatalogText: "Nenhum produto ou serviço cadastrado ainda.",
    priceLabel: "Preço",
    skuLabel: "Código de Barras / SKU",
    preparationOrDurationLabel: "Tempo Médio de Banho/Consulta (min)",
    posServiceModes: [
      { id: "bath", label: "Banho & Tosa", placeholder: "Nome do Pet e Tutor" },
      { id: "clinic", label: "Consulta Veterinária", placeholder: "Nome do Paciente Pet" },
      { id: "counter", label: "Balcão da Loja", placeholder: "Nome do Tutor" },
      { id: "delivery", label: "Tele-Entrega de Ração", placeholder: "Endereço de Entrega" },
    ],
    suggestedPresets: [
      { name: "Porte do Animal (Pequeno, Médio, Grande)", type: "single", desc: "Variação de preço por porte físico" },
      { name: "Hidratação de Pelagem com Óleo de Argan", type: "single", desc: "Tratamento estético premium" },
      { name: "Tosa Higiênica e Corte de Unhas", type: "multiple", desc: "Procedimentos complementares inclusos" },
    ],
  },

  // 7. SUPERMERCADO, AÇOUGUE & HORTIFRÚTI
  supermarket: {
    nicheId: "supermarket",
    name: "Supermercado, Açougue & Hortifrúti",
    itemSingular: "Mercadoria",
    itemPlural: "Produtos das Gôndolas",
    catalogTitle: "Gôndolas & Hortifrúti",
    newItemAction: "Cadastrar Mercadoria",
    editItemAction: "Editar Mercadoria",
    categoriesLabel: "Sessões do Mercado",
    newCategoryAction: "Nova Seção / Corredor",
    modifiersLabel: "Cortes de Carne & Embalagem",
    newModifierAction: "Novo Tipo de Corte",
    ordersLabel: "Separação de Compras",
    kdsLabel: "Fila de Separação (Picking)",
    customerLabel: "Clientes",
    stockLabel: "Validades & Reposição",
    searchItemPlaceholder: "Buscar por código EAN, nome do produto ou hortifrúti...",
    emptyCatalogText: "Nenhuma mercadoria cadastrada nas gôndolas ainda.",
    priceLabel: "Preço por Unidade / KG",
    skuLabel: "Código de Barras (EAN-13)",
    posServiceModes: [
      { id: "checkout", label: "Caixa Rápido / Frente de Loja", placeholder: "CPF do Cliente" },
      { id: "delivery", label: "Entrega em Domicílio", placeholder: "Endereço do Cliente" },
      { id: "pickup", label: "Retirada na Loja (Drive-thru)", placeholder: "Nome do Comprador" },
    ],
    suggestedPresets: [
      { name: "Tipo de Corte da Carne (Bife Fino, Moída 2x, Pedaço)", type: "single", desc: "Preferência de manipulação no açougue" },
      { name: "Ponto das Frutas (Maduras para Hoje, Verdes para Semana)", type: "single", desc: "Instrução para seleção no hortifrúti" },
    ],
  },

  // 8. EVENTOS, SHOWS, FESTAS & INGRESSOS
  events: {
    nicheId: "events",
    name: "Eventos, Shows & Ingressos",
    itemSingular: "Ingresso / Lote",
    itemPlural: "Lotes & Ingressos",
    catalogTitle: "Eventos & Lotes",
    newItemAction: "Criar Evento / Lote",
    editItemAction: "Editar Lote",
    categoriesLabel: "Tipos de Evento",
    newCategoryAction: "Nova Categoria de Evento",
    modifiersLabel: "Setores & Experiências (VIP, Camarote, Pista)",
    newModifierAction: "Novo Setor",
    ordersLabel: "Ingressos Vendidos",
    kdsLabel: "Portaria & Validação QR Code",
    customerLabel: "Participantes / Compradores",
    stockLabel: "Capacidade & Lotação",
    searchItemPlaceholder: "Buscar evento, show ou lote...",
    emptyCatalogText: "Nenhum evento publicado ainda.",
    priceLabel: "Valor do Ingresso",
    skuLabel: "Código do Lote",
    posServiceModes: [
      { id: "boxoffice", label: "Bilheteria Física", placeholder: "Nome do Participante" },
      { id: "promoter", label: "Comissário / Promoter", placeholder: "Nome do Comissário" },
      { id: "door", label: "Portaria / Entrada", placeholder: "Validação de Pulseira" },
    ],
    suggestedPresets: [
      { name: "Setor do Evento (Pista, Camarote Open Bar, Mezanino)", type: "single", desc: "Acesso por área" },
      { name: "Tipo de Ingresso (Inteira, Meia-Entrada, Solidário)", type: "single", desc: "Modalidade de compra do ingresso" },
      { name: "Combo de Bebidas / Fichas Antecipadas", type: "multiple", desc: "Consumação adquirida com desconto" },
    ],
  },

  // 9. AUTOMÓVEIS & VEÍCULOS
  vehicles: {
    nicheId: "vehicles",
    name: "Automóveis & Concessionária",
    itemSingular: "Veículo",
    itemPlural: "Estoque de Veículos",
    catalogTitle: "Estoque de Veículos",
    newItemAction: "Cadastrar Veículo",
    editItemAction: "Editar Veículo",
    categoriesLabel: "Categorias (SUVs, Sedans, Hatchs, Motos)",
    newCategoryAction: "Nova Categoria de Veículo",
    modifiersLabel: "Opcionais & Pacotes do Veículo",
    newModifierAction: "Novo Pacote de Opcionais",
    ordersLabel: "Propostas & Financiamentos",
    kdsLabel: "Preparação & Vistoria",
    customerLabel: "Leads & Compradores",
    stockLabel: "Pátio & Disponibilidade",
    searchItemPlaceholder: "Buscar por marca, modelo, ano ou placa...",
    emptyCatalogText: "Nenhum veículo cadastrado no pátio ainda.",
    priceLabel: "Valor do Veículo (Tabela FIPE / Pedida)",
    skuLabel: "Placa / Renavam",
    posServiceModes: [
      { id: "showroom", label: "Salão de Vendas (Showroom)", placeholder: "Nome do Interessado" },
      { id: "tradein", label: "Avaliação de Troca", placeholder: "Placa do Carro Usado" },
    ],
    suggestedPresets: [
      { name: "Garantia Mecânica Estendida (1 Ano Motor e Câmbio)", type: "single", desc: "Proteção mecânica para seminovos" },
      { name: "Vitrificação de Pintura & Insulfilm", type: "multiple", desc: "Serviços de estética automotiva entregues com o carro" },
    ],
  },

  // 10. IMÓVEIS & IMOBILIÁRIA
  real_estate: {
    nicheId: "real_estate",
    name: "Imóveis & Imobiliária",
    itemSingular: "Imóvel",
    itemPlural: "Catálogo de Imóveis",
    catalogTitle: "Catálogo de Imóveis",
    newItemAction: "Cadastrar Imóvel",
    editItemAction: "Editar Imóvel",
    categoriesLabel: "Tipos (Casas, Apartamentos, Terrenos, Salas)",
    newCategoryAction: "Novo Tipo de Imóvel",
    modifiersLabel: "Comodidades (Piscina, Garagem, Mobiliado)",
    newModifierAction: "Novo Grupo de Comodidades",
    ordersLabel: "Propostas & Contratos",
    kdsLabel: "Vistorias & Chaves",
    customerLabel: "Interessados / Inquilinos",
    stockLabel: "Disponibilidade de Chaves",
    searchItemPlaceholder: "Buscar por bairro, condomínio, código do imóvel...",
    emptyCatalogText: "Nenhum imóvel cadastrado no catálogo ainda.",
    priceLabel: "Valor de Venda / Aluguel",
    skuLabel: "Código do Imóvel (Ref)",
    posServiceModes: [
      { id: "visit", label: "Agendamento de Visita", placeholder: "Nome do Interessado" },
      { id: "proposal", label: "Proposta Formal", placeholder: "Nome do Comprador" },
    ],
    suggestedPresets: [
      { name: "Opção de Mobília (100% Mobiliado, Semi-Mobiliado, Vazio)", type: "single", desc: "Condição de entrega do imóvel" },
    ],
  },

  // 11. EDUCAÇÃO, CURSOS & WORKSHOPS
  education: {
    nicheId: "education",
    name: "Cursos, Turmas & Educação",
    itemSingular: "Curso / Turma",
    itemPlural: "Cursos & Workshops",
    catalogTitle: "Catálogo de Cursos",
    newItemAction: "Cadastrar Curso",
    editItemAction: "Editar Curso",
    categoriesLabel: "Áreas do Conhecimento",
    newCategoryAction: "Nova Área",
    modifiersLabel: "Materiais Didáticos & Certificados",
    newModifierAction: "Novo Grupo de Materiais",
    ordersLabel: "Matrículas & Inscrições",
    kdsLabel: "Gestão de Turmas & Presença",
    customerLabel: "Alunos & Matriculados",
    stockLabel: "Vagas por Turma",
    searchItemPlaceholder: "Buscar curso por nome, instrutor ou área...",
    emptyCatalogText: "Nenhum curso cadastrado ainda.",
    priceLabel: "Mensalidade / Valor da Matrícula",
    skuLabel: "Código da Turma",
    posServiceModes: [
      { id: "enrollment", label: "Secretaria / Matrícula", placeholder: "Nome do Aluno" },
      { id: "scholarship", label: "Bolsa / Desconto Convênio", placeholder: "Instituição Conveniada" },
    ],
    suggestedPresets: [
      { name: "Kit de Apostilas Impressas + Mochila", type: "single", desc: "Material físico de apoio para o aluno" },
      { name: "Mentoria Individual 1-on-1", type: "multiple", desc: "Sessões exclusivas com o professor" },
    ],
  },

  // 12. NOTÍCIAS & REDAÇÃO DE JORNAL
  news: {
    nicheId: "news",
    name: "Notícias & Portal de Mídia",
    itemSingular: "Reportagem",
    itemPlural: "Todas as Matérias",
    catalogTitle: "Redação & Reportagens",
    newItemAction: "Nova Reportagem",
    editItemAction: "Editar Matéria",
    categoriesLabel: "Editorias (Cidade, Polícia, Política, Esporte)",
    newCategoryAction: "Nova Editoria",
    modifiersLabel: "Banners Patrocinados & Encartes",
    newModifierAction: "Novo Formato Publicitário",
    ordersLabel: "Assinaturas & Publicidades",
    kdsLabel: "Fila de Pauta & Revisão",
    customerLabel: "Leitores & Assinantes",
    stockLabel: "Pautas em Produção",
    searchItemPlaceholder: "Buscar matéria por título, autor ou palavra-chave...",
    emptyCatalogText: "Nenhuma matéria publicada na redação ainda.",
    priceLabel: "Valor de Anúncio / Assinatura",
    skuLabel: "Código da Pauta",
    posServiceModes: [
      { id: "classified", label: "Balcão de Classificados", placeholder: "Nome do Anunciante" },
      { id: "subscription", label: "Assinatura Mensal", placeholder: "Nome do Assinante" },
    ],
    suggestedPresets: [
      { name: "Posicionamento do Anúncio (Capa, Topo, Lateral)", type: "single", desc: "Área de exibição do banner" },
    ],
  },
};

/**
 * Retorna o mapa semântico refinado para uma determinada loja.
 * Analisa o campo `segment`, `type`, `category` ou configurações de nicho.
 */
export function getNicheSemantics(storeData: any): NicheSemantics {
  const storeName = (storeData?.name || storeData?.stores?.name || "").toLowerCase();
  const segment = (
    storeData?.segment ||
    storeData?.type ||
    storeData?.category ||
    storeData?.stores?.segment ||
    storeData?.stores?.type ||
    storeData?.stores?.category ||
    storeData?.settings?.segment ||
    storeData?.settings?.type ||
    storeData?.settings?.niche ||
    storeData?.stores?.settings?.segment ||
    storeData?.stores?.settings?.type ||
    storeData?.stores?.settings?.niche ||
    storeData?.description ||
    storeName ||
    ""
  ).toLowerCase();

  if (
    segment.includes("gastro") ||
    segment.includes("restauran") ||
    segment.includes("pizz") ||
    segment.includes("burg") ||
    segment.includes("lanch") ||
    segment.includes("bar") ||
    segment.includes("caf") ||
    segment.includes("comida") ||
    segment.includes("alimento") ||
    segment.includes("bebida")
  ) {
    return NICHE_SEMANTICS_REGISTRY.gastronomy;
  }

  if (
    segment.includes("servi") ||
    segment.includes("belez") ||
    segment.includes("salao") ||
    segment.includes("barbear") ||
    segment.includes("estetic") ||
    segment.includes("manicur") ||
    segment.includes("cabel") ||
    segment.includes("spa") ||
    segment.includes("terapia") ||
    segment.includes("tatto")
  ) {
    return NICHE_SEMANTICS_REGISTRY.services;
  }

  if (
    segment.includes("loca") ||
    segment.includes("alug") ||
    segment.includes("estrutur") ||
    segment.includes("tenda") ||
    segment.includes("equipament") ||
    segment.includes("som") ||
    segment.includes("ilumina") ||
    segment.includes("gerador") ||
    segment.includes("blaster")
  ) {
    return NICHE_SEMANTICS_REGISTRY.rental;
  }

  if (
    segment.includes("assist") ||
    segment.includes("celular") ||
    segment.includes("repar") ||
    segment.includes("conserto") ||
    segment.includes("eletron") ||
    segment.includes("informat")
  ) {
    return NICHE_SEMANTICS_REGISTRY.tech_repair;
  }

  if (
    segment.includes("pet") ||
    segment.includes("veterin") ||
    segment.includes("banho") ||
    segment.includes("tosa") ||
    segment.includes("racao") ||
    segment.includes("agro")
  ) {
    return NICHE_SEMANTICS_REGISTRY.pet;
  }

  if (
    segment.includes("super") ||
    segment.includes("mercad") ||
    segment.includes("acougue") ||
    segment.includes("horti") ||
    segment.includes("fruti") ||
    segment.includes("sacol") ||
    segment.includes("mercear")
  ) {
    return NICHE_SEMANTICS_REGISTRY.supermarket;
  }

  if (
    segment.includes("event") ||
    segment.includes("show") ||
    segment.includes("ingress") ||
    segment.includes("festa") ||
    segment.includes("balada") ||
    segment.includes("teatro") ||
    segment.includes("produt")
  ) {
    return NICHE_SEMANTICS_REGISTRY.events;
  }

  if (
    segment.includes("veicul") ||
    segment.includes("carro") ||
    segment.includes("moto") ||
    segment.includes("automot") ||
    segment.includes("concessionar") ||
    segment.includes("garagem")
  ) {
    return NICHE_SEMANTICS_REGISTRY.vehicles;
  }

  if (
    segment.includes("imove") ||
    segment.includes("imobili") ||
    segment.includes("apartament") ||
    segment.includes("aluguel") ||
    segment.includes("corretor")
  ) {
    return NICHE_SEMANTICS_REGISTRY.real_estate;
  }

  if (
    segment.includes("educa") ||
    segment.includes("curso") ||
    segment.includes("escola") ||
    segment.includes("turma") ||
    segment.includes("treina") ||
    segment.includes("workshop")
  ) {
    return NICHE_SEMANTICS_REGISTRY.education;
  }

  if (
    segment.includes("notici") ||
    segment.includes("jornal") ||
    segment.includes("redac") ||
    segment.includes("portal") ||
    segment.includes("revist")
  ) {
    return NICHE_SEMANTICS_REGISTRY.news;
  }

  // Padrão universal: Varejo & Catálogo
  return NICHE_SEMANTICS_REGISTRY.retail;
}
