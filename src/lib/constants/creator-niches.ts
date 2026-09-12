/**
 * Taxonomia Canônica de Nichos & Categorias para Criadores, Influenciadores, Marcas e Afiliados
 * 
 * Fonte única de verdade para seleção padronizada de segmentos em perfis artísticos,
 * vitrines digitais, programas de afiliação e parcerias comerciais.
 */

export interface CreatorNiche {
  id: string;
  label: string;
  group: string;
  description?: string;
  badge?: string;
}

export interface CreatorNicheGroup {
  name: string;
  niches: CreatorNiche[];
}

export const CREATOR_NICHE_GROUPS: CreatorNicheGroup[] = [
  {
    name: "Estilo de Vida, Beleza & Bem-Estar",
    niches: [
      { id: "moda_estilo", label: "Moda, Roupas & Estilo Pessoal", group: "Estilo de Vida, Beleza & Bem-Estar", description: "Looks, tendências, calçados e acessórios" },
      { id: "beleza_maquiagem", label: "Beleza, Maquiagem & Cosméticos", group: "Estilo de Vida, Beleza & Bem-Estar", description: "Skincare, maquiagem e cuidados pessoais" },
      { id: "fitness_treino", label: "Fitness, Treino & Academia", group: "Estilo de Vida, Beleza & Bem-Estar", description: "Musculação, crossfit, rotina de exercícios" },
      { id: "saude_nutricao", label: "Saúde, Nutrição & Bem-Estar", group: "Estilo de Vida, Beleza & Bem-Estar", description: "Dietas, suplementação, saúde integrativa e mente sã" },
      { id: "maternidade_familia", label: "Maternidade, Paternidade & Família", group: "Estilo de Vida, Beleza & Bem-Estar", description: "Rotina infantil, educação de filhos e vida familiar" },
      { id: "pets_animais", label: "Pets & Animais de Estimação", group: "Estilo de Vida, Beleza & Bem-Estar", description: "Cães, gatos, adestramento e cuidados pet" },
    ],
  },
  {
    name: "Gastronomia, Turismo & Viagens",
    niches: [
      { id: "turismo_viagens", label: "Turismo, Viagens & Roteiros", group: "Gastronomia, Turismo & Viagens", description: "Dicas de viagem, voos, hotéis, ecoturismo e experiências" },
      { id: "gastronomia_culinaria", label: "Gastronomia, Culinária & Receitas", group: "Gastronomia, Turismo & Viagens", description: "Receitas caseiras, reviews de restaurantes e chef" },
      { id: "bebidas_vinhos", label: "Vinhos, Cervejas Artesanais & Drinks", group: "Gastronomia, Turismo & Viagens", description: "Sommeliers, coquetelaria e harmonizações" },
      { id: "hotelaria_pousadas", label: "Hotelaria, Pousadas & Resorts", group: "Gastronomia, Turismo & Viagens", description: "Hospedagens exclusivas, resorts e turismo regional" },
    ],
  },
  {
    name: "Tecnologia, Games & Digital",
    niches: [
      { id: "tecnologia_ia", label: "Tecnologia, Inovação & IA", group: "Tecnologia, Games & Digital", description: "Smartphones, computadores, aplicativos e inteligência artificial" },
      { id: "games_streaming", label: "Games, Streaming & eSports", group: "Tecnologia, Games & Digital", description: "Gameplay, consoles, jogos online e transmissões ao vivo" },
      { id: "design_criacao", label: "Design, Criação Visual & Edição", group: "Tecnologia, Games & Digital", description: "Audiovisual, edição de vídeo, fotografia e artes gráficas" },
      { id: "programacao_dev", label: "Programação, Software & No-Code", group: "Tecnologia, Games & Digital", description: "Desenvolvimento web, automações e produtos digitais" },
    ],
  },
  {
    name: "Negócios, Finanças & Carreira",
    niches: [
      { id: "financas_investimentos", label: "Finanças, Investimentos & Economia", group: "Negócios, Finanças & Carreira", description: "Educação financeira, renda fixa, bolsa e patrimônio" },
      { id: "empreendedorismo", label: "Empreendedorismo & Pequenos Negócios", group: "Negócios, Finanças & Carreira", description: "Gestão, liderança, startups e novos negócios" },
      { id: "marketing_vendas", label: "Marketing Digital & Vendas", group: "Negócios, Finanças & Carreira", description: "Tráfego pago, lançamentos, copywriting e social media" },
      { id: "carreira_desenvolvimento", label: "Carreira, Liderança & Produtividade", group: "Negócios, Finanças & Carreira", description: "Desenvolvimento profissional, hábitos e estudos" },
      { id: "direito_advocacia", label: "Direito, Legislação & Concursos", group: "Negócios, Finanças & Carreira", description: "Orientações jurídicas, direitos do cidadão e concursos" },
    ],
  },
  {
    name: "Casa, Construção, Veículos & DIY",
    niches: [
      { id: "casa_decoracao", label: "Casa, Decoração & Organização", group: "Casa, Construção, Veículos & DIY", description: "Design de interiores, móveis, mesa posta e organização" },
      { id: "arquitetura_construcao", label: "Arquitetura, Obras & Engenharia", group: "Casa, Construção, Veículos & DIY", description: "Projetos arquitetônicos, reformas e materiais de construção" },
      { id: "automotivo_veiculos", label: "Automotivo, Carros & Motos", group: "Casa, Construção, Veículos & DIY", description: "Test-drives, mecânica, personalização e mercado automotivo" },
      { id: "diy_artesanato", label: "Artesanato, DIY & Faça Você Mesmo", group: "Casa, Construção, Veículos & DIY", description: "Costura, marcenaria amadora, customização e pintura" },
    ],
  },
  {
    name: "Cultura, Entretenimento & Afiliados",
    niches: [
      { id: "achadinhos_afiliados", label: "Achadinhos & Ofertas (Afiliados)", group: "Cultura, Entretenimento & Afiliados", description: "Curadoria de promoções, cupons, produtos úteis e recomendações" },
      { id: "comercio_local", label: "Comércio Local & Serviços da Cidade", group: "Cultura, Entretenimento & Afiliados", description: "Divulgação de lojas de bairro, eventos e prestadores locais" },
      { id: "musica_eventos", label: "Música, Shows & Festivais", group: "Cultura, Entretenimento & Afiliados", description: "Bandas, DJs, instrumentos musicais e vida noturna" },
      { id: "livros_literatura", label: "Livros, Leitura & Literatura", group: "Cultura, Entretenimento & Afiliados", description: "Resenhas literárias, lançamentos e indicações de leitura" },
      { id: "humor_comedia", label: "Humor, Comédia & Vlogs", group: "Cultura, Entretenimento & Afiliados", description: "Esquetes cômicas, memes e crônicas do cotidiano" },
      { id: "geral", label: "Variedades & Entretenimento Geral", group: "Cultura, Entretenimento & Afiliados", description: "Conteúdo multitemático e comunidade aberta" },
    ],
  },
];

export const CANONICAL_CREATOR_NICHES: CreatorNiche[] = CREATOR_NICHE_GROUPS.flatMap(
  (group) => group.niches
);

export function getCreatorNicheById(id?: string | null): CreatorNiche | undefined {
  if (!id) return undefined;
  const normalized = id.toLowerCase().trim();
  return CANONICAL_CREATOR_NICHES.find(
    (n) => n.id.toLowerCase() === normalized || n.label.toLowerCase() === normalized
  );
}

export function getCreatorNicheLabel(idOrLabel?: string | null): string {
  if (!idOrLabel) return "Variedades & Geral";
  const found = getCreatorNicheById(idOrLabel);
  if (found) return found.label;
  return idOrLabel;
}
