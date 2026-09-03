import type { SectionTemplate } from "./builder-types";

// Helper para gerar IDs previsíveis temporários (o injetor deve substituir por UUIDs reais)
const genId = (prefix: string) => `tpl_${prefix}`;

export const sectionTemplates: Record<string, SectionTemplate> = {
  // ── 1. FAIXAS & HEROS ──
  hero_carousel: {
    id: "hero_carousel",
    name: "Carrossel Principal (Hero)",
    description: "Banners rotativos de ponta a ponta com botões de ação e transição suave.",
    category: "commerce",
    previewImageUrl:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("container"),
        node_type: "container",
        block_type: "container",
        parent_id: genId("section"),
        layout_rules: {
          maxWidth: "full",
          display: "flex",
          flexDirection: "col",
          gap: "none",
          paddingX: "none",
          paddingY: "none",
        },
      },
      {
        id: genId("carousel"),
        node_type: "composition",
        block_type: "hero_carousel",
        parent_id: genId("container"),
        content: {
          autoPlay: true,
          interval: 5,
          banners: [
            { image_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80" },
            { image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80" },
          ],
          showOverlay: true,
          overlayOpacity: "medium",
          desktopHeight: "proportional",
        },
      },
    ],
  },

  split_banner: {
    id: "split_banner",
    name: "Hero Dividido (Split Banner)",
    description: "Layout editorial com imagem de alta resolução e bloco de texto com CTA.",
    category: "commerce",
    previewImageUrl:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("container"),
        node_type: "container",
        block_type: "container",
        parent_id: genId("section"),
        layout_rules: {
          maxWidth: "full",
          display: "flex",
          flexDirection: "col",
          gap: "none",
          paddingX: "none",
          paddingY: "none",
        },
      },
      {
        id: genId("split"),
        node_type: "composition",
        block_type: "split_banner",
        parent_id: genId("container"),
        content: {
          title: "Nova Coleção Exclusiva",
          subtitle: "Peças desenvolvidas com tecidos nobres e acabamento impecável.",
          buttonText: "Explorar Coleção",
          buttonLink: "/produtos",
          imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80",
          imagePosition: "right",
        },
      },
    ],
  },

  announcement_bar: {
    id: "announcement_bar",
    name: "Barra de Avisos no Topo",
    description: "Barra compacta para avisos de frete grátis, cupons ou comunicados urgentes.",
    category: "marketing",
    previewImageUrl:
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("bar"),
        node_type: "element",
        block_type: "announcement_bar",
        parent_id: genId("section"),
        content: {
          text: "Frete Grátis para todo o Brasil em compras acima de R$ 250",
          linkText: "Aproveitar Agora",
          linkUrl: "/produtos",
        },
      },
    ],
  },

  // ── 2. VITRINE & PRODUTOS ──
  product_grid: {
    id: "product_grid",
    name: "Grade de Produtos",
    description: "Exibição dos produtos do catálogo em grid responsivo com cards e preços.",
    category: "commerce",
    previewImageUrl:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("container"),
        node_type: "container",
        block_type: "container",
        parent_id: genId("section"),
        layout_rules: {
          maxWidth: "xl",
          display: "flex",
          flexDirection: "col",
          gap: "md",
          paddingX: "md",
          paddingY: "xl",
        },
      },
      {
        id: genId("grid"),
        node_type: "composition",
        block_type: "product_grid",
        parent_id: genId("container"),
        content: {
          title: "Produtos em Destaque",
          subtitle: "As últimas novidades da coleção",
          columnsDesktop: 4,
          columnsMobile: 2,
        },
        data_bindings: { source: "latest_products", limit: 8 },
      },
    ],
  },

  product_carousel: {
    id: "product_carousel",
    name: "Carrossel de Produtos",
    description: "Trilho horizontal de produtos com scroll suave por toque.",
    category: "commerce",
    previewImageUrl:
      "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("container"),
        node_type: "container",
        block_type: "container",
        parent_id: genId("section"),
        layout_rules: {
          maxWidth: "xl",
          display: "flex",
          flexDirection: "col",
          gap: "md",
          paddingX: "md",
          paddingY: "xl",
        },
      },
      {
        id: genId("rail"),
        node_type: "composition",
        block_type: "product_rail",
        parent_id: genId("container"),
        content: {
          title: "Mais Vendidos da Semana",
          subtitle: "Os itens favoritos dos nossos clientes.",
          layout: "carousel",
        },
        data_bindings: { source: "latest_products", limit: 8 },
      },
    ],
  },

  // ── 3. TURISMO & VIAGENS ──
  tourism_quote_hero: {
    id: "tourism_quote_hero",
    name: "Hero com Cotação de Viagem",
    description: "Formulário de cotação de viagens em tempo real com captura de leads no WhatsApp.",
    category: "commerce",
    previewImageUrl:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("container"),
        node_type: "container",
        block_type: "container",
        parent_id: genId("section"),
        layout_rules: {
          maxWidth: "full",
          display: "flex",
          flexDirection: "col",
          gap: "none",
          paddingX: "none",
          paddingY: "none",
        },
      },
      {
        id: genId("tourism_hero"),
        node_type: "composition",
        block_type: "tourism_quote_hero",
        parent_id: genId("container"),
        content: {
          title: "Sua Próxima Viagem Inesquecível Começa Aqui",
          subtitle: "Roteiros exclusivos, cruzeiros, passagens aéreas e pacotes completos com assessoria VIP.",
          badge: "Agência Especializada em Turismo",
          bgImageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1600&auto=format&fit=crop",
        },
      },
    ],
  },

  tourism_services_grid: {
    id: "tourism_services_grid",
    name: "Grade de Especialidades de Turismo",
    description: "Matriz com os 8 principais serviços de agência de turismo com ação direta.",
    category: "commerce",
    previewImageUrl:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("container"),
        node_type: "container",
        block_type: "container",
        parent_id: genId("section"),
        layout_rules: {
          maxWidth: "xl",
          display: "flex",
          flexDirection: "col",
          gap: "md",
          paddingX: "md",
          paddingY: "xl",
        },
      },
      {
        id: genId("tourism_services"),
        node_type: "composition",
        block_type: "tourism_services_grid",
        parent_id: genId("container"),
        content: {
          title: "Nossas Especialidades em Turismo",
          subtitle: "Assessoria completa de ponta a ponta para que sua única preocupação seja fazer as malas.",
        },
      },
    ],
  },

  tourism_destinations_carousel: {
    id: "tourism_destinations_carousel",
    name: "Carrossel de Destinos Populares",
    description: "Cards visuais de destinos nacionais e internacionais com preços a partir de.",
    category: "commerce",
    previewImageUrl:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("container"),
        node_type: "container",
        block_type: "container",
        parent_id: genId("section"),
        layout_rules: {
          maxWidth: "xl",
          display: "flex",
          flexDirection: "col",
          gap: "md",
          paddingX: "md",
          paddingY: "xl",
        },
      },
      {
        id: genId("destinations"),
        node_type: "composition",
        block_type: "tourism_destinations_carousel",
        parent_id: genId("container"),
        content: {
          title: "Destinos Populares em Destaque",
          subtitle: "Pacotes completos com voos, hospedagem e assessoria personalizada.",
        },
      },
    ],
  },

  // ── 4. GASTRONOMIA & FOOD ──
  food_menu_streamlined: {
    id: "food_menu_streamlined",
    name: "Cardápio Mobile-First com Barra Flutuante",
    description: "Lista compacta com miniaturas à direita, adição em 1 toque e barra flutuante de sacola.",
    category: "commerce",
    previewImageUrl:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("menu_streamlined"),
        node_type: "composition",
        block_type: "food_menu_streamlined",
        parent_id: genId("section"),
        content: {
          storeName: "Pizzas & Cucina Rocco",
          openingHoursText: "Aberto hoje das 18:00 às 23:30",
          isOpenNow: true,
        },
      },
    ],
  },

  curated_hits_rail: {
    id: "curated_hits_rail",
    name: "Trilho Top Mais Vendidos (Hits)",
    description: "Carrossel de produtos mais vendidos com ranking numérico (#1, #2), desconto e botão rápido.",
    category: "commerce",
    previewImageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("hits_rail"),
        node_type: "composition",
        block_type: "curated_hits_rail",
        parent_id: genId("section"),
        content: {
          title: "Top Mais Pedidos da Região",
          subtitle: "Os pratos e produtos favoritos dos clientes com descontos exclusivos.",
          savingsText: "Economize até 25% nos itens mais pedidos deste mês.",
        },
      },
    ],
  },

  table_order_comanda: {
    id: "table_order_comanda",
    name: "Comanda & QR Code de Mesa",
    description: "Cartão de autoatendimento no salão com número de mesa e QR Code para pedidos diretos.",
    category: "commerce",
    previewImageUrl:
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("table_comanda"),
        node_type: "element",
        block_type: "table_order_comanda",
        parent_id: genId("section"),
        content: {
          tableNumber: "10",
          storeName: "Pizzas & Cucina Rocco",
          wifiName: "Rocco_Clientes_5G",
        },
      },
    ],
  },

  food_menu_tabs: {
    id: "food_menu_tabs",
    name: "Cardápio Digital por Abas",
    description: "Cardápio completo organizado por categorias (Entradas, Principais, Bebidas, Sobremesas).",
    category: "commerce",
    previewImageUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("menu"),
        node_type: "composition",
        block_type: "food_menu_tabs",
        parent_id: genId("section"),
        content: {
          title: "Cardápio do Restaurante",
          subtitle: "Ingredientes frescos selecionados diariamente pelo nosso chef.",
        },
      },
    ],
  },

  chef_special_banner: {
    id: "chef_special_banner",
    name: "Destaque do Prato do Chef",
    description: "Lâmina visual para o prato estrela com lista de ingredientes e tempo de preparo.",
    category: "commerce",
    previewImageUrl:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("chef_special"),
        node_type: "composition",
        block_type: "chef_special_banner",
        parent_id: genId("section"),
        content: {
          title: "Sugestão do Chef",
          dishName: "Costela Prensada ao Demi-Glace",
          description: "Cozida lentamente por 12 horas em baixa temperatura, servida com aligot de queijo da canastra.",
          priceCents: 9600,
          prepTimeMinutes: 25,
        },
      },
    ],
  },

  restaurant_hours_delivery: {
    id: "restaurant_hours_delivery",
    name: "Horários de Cozinha & Entrega",
    description: "Grade informativa de funcionamento, taxas de entrega e retirada no balcão.",
    category: "commerce",
    previewImageUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("hours"),
        node_type: "composition",
        block_type: "restaurant_hours_delivery",
        parent_id: genId("section"),
        content: {
          title: "Horários de Atendimento & Entrega",
        },
      },
    ],
  },

  table_booking_card: {
    id: "table_booking_card",
    name: "Formulário de Reserva de Mesa",
    description: "Agendamento de mesa com data, horário e pessoas com confirmação no WhatsApp.",
    category: "commerce",
    previewImageUrl:
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("booking"),
        node_type: "composition",
        block_type: "table_booking_card",
        parent_id: genId("section"),
        content: {
          title: "Reserve sua Mesa",
          subtitle: "Garanta uma experiência memorável com confirmação instantânea.",
        },
      },
    ],
  },

  // ── 5. MODA & LOOKBOOK ──
  shop_the_look_hotspots: {
    id: "shop_the_look_hotspots",
    name: "Shop the Look (Hotspots)",
    description: "Foto editorial com pontos clicáveis para ver e comprar as peças do look.",
    category: "commerce",
    previewImageUrl:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("lookbook"),
        node_type: "composition",
        block_type: "shop_the_look_hotspots",
        parent_id: genId("section"),
        content: {
          title: "Shop the Look",
          subtitle: "Clique nos pontos da foto para ver e comprar cada peça da composição.",
        },
      },
    ],
  },

  size_guide_table: {
    id: "size_guide_table",
    name: "Tabela de Medidas (Guia de Tamanhos)",
    description: "Tabela clara de caimento com medidas de busto, cintura e quadril.",
    category: "content",
    previewImageUrl:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("guide"),
        node_type: "composition",
        block_type: "size_guide_table",
        parent_id: genId("section"),
        content: {
          title: "Guia de Medidas",
          subtitle: "Encontre o tamanho perfeito para o seu caimento ideal.",
        },
      },
    ],
  },

  // ── 6. SERVIÇOS & CLÍNICAS ──
  specialist_team_grid: {
    id: "specialist_team_grid",
    name: "Corpo Clínico & Equipe",
    description: "Grade de especialistas com registro profissional (CRM/CRO) e especialidades.",
    category: "content",
    previewImageUrl:
      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("team"),
        node_type: "composition",
        block_type: "specialist_team_grid",
        parent_id: genId("section"),
        content: {
          title: "Corpo Clínico & Especialistas",
          subtitle: "Profissionais certificados com vasta experiência para cuidar de você.",
        },
      },
    ],
  },

  service_pricing_table: {
    id: "service_pricing_table",
    name: "Tabela de Planos & Procedimentos",
    description: "Tabela comparativa de pacotes e planos multi-sessão para clínicas e salões.",
    category: "content",
    previewImageUrl:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("container"),
        node_type: "container",
        block_type: "container",
        parent_id: genId("section"),
        layout_rules: {
          maxWidth: "xl",
          display: "flex",
          flexDirection: "col",
          gap: "md",
          paddingX: "md",
          paddingY: "xl",
        },
      },
      {
        id: genId("pricing_table"),
        node_type: "composition",
        block_type: "service_pricing_table",
        parent_id: genId("container"),
        content: {
          title: "Planos & Tabela de Procedimentos",
          subtitle: "Escolha o pacote ideal para suas necessidades.",
        },
      },
    ],
  },

  // ── 7. IMÓVEIS & CORRETORES ──
  property_features_grid: {
    id: "property_features_grid",
    name: "Ficha Técnica do Imóvel",
    description: "Ficha estrutural com metragem (m²), dormitórios, suítes, vagas e botão de visita.",
    category: "content",
    previewImageUrl:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("property"),
        node_type: "composition",
        block_type: "property_features_grid",
        parent_id: genId("section"),
        content: {
          title: "Ficha Técnica do Imóvel",
          subtitle: "Todos os detalhes estruturais e diferenciais de acabamento.",
        },
      },
    ],
  },

  // ── 8. BIOLINK & REDES SOCIAIS ──
  biolink_profile_header: {
    id: "biolink_profile_header",
    name: "Perfil de Biolink com Selo",
    description: "Foto de perfil circular com selo de verificação, @handle e biografia.",
    category: "social",
    previewImageUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("bio_profile"),
        node_type: "element",
        block_type: "biolink_profile_header",
        parent_id: genId("section"),
        content: {
          name: "Sua Marca & Co.",
          handle: "@suamarca",
          bio: "Produtos autorais e atendimento exclusivo. Acesse nossos links oficiais abaixo.",
          isVerified: true,
        },
      },
    ],
  },

  biolink_action_buttons: {
    id: "biolink_action_buttons",
    name: "Botões de Links em Pílula",
    description: "Lista de botões táteis para links externos, WhatsApp e catálogo.",
    category: "social",
    previewImageUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("bio_links"),
        node_type: "element",
        block_type: "biolink_action_buttons",
        parent_id: genId("section"),
        content: {
          links: [
            { id: "l1", title: "Fale Conosco no WhatsApp", url: "/contato", isHighlight: true },
            { id: "l2", title: "Acessar Catálogo de Produtos", url: "/produtos" },
            { id: "l3", title: "Nossa Localização & Horários", url: "#" },
          ],
        },
      },
    ],
  },

  biolink_pix_card: {
    id: "biolink_pix_card",
    name: "Chave Pix Copia e Cola",
    description: "Card com chave Pix e botão de copiar com 1 clique para pagamentos rápidos.",
    category: "social",
    previewImageUrl:
      "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("bio_pix"),
        node_type: "element",
        block_type: "biolink_pix_card",
        parent_id: genId("section"),
        content: {
          pixKey: "contato@suamarca.com.br",
          pixKeyType: "Chave E-mail",
          beneficiaryName: "Sua Loja Oficial LTDA",
          bankName: "Wider Pay Instant",
        },
      },
    ],
  },

  // ── 9. GERAIS & CONTEÚDO ──
  bento_grid: {
    id: "bento_grid",
    name: "Mosaico Bento Grid",
    description: "Grid moderno assimétrico estilo Apple para links e coleções.",
    category: "content",
    previewImageUrl:
      "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("container"),
        node_type: "container",
        block_type: "container",
        parent_id: genId("section"),
        layout_rules: {
          maxWidth: "xl",
          display: "flex",
          flexDirection: "col",
          gap: "md",
          paddingX: "md",
          paddingY: "xl",
        },
      },
      {
        id: genId("bento"),
        node_type: "composition",
        block_type: "bento_grid",
        parent_id: genId("container"),
        content: {
          title: "Destaques da Coleção",
        },
      },
    ],
  },

  gallery_grid: {
    id: "gallery_grid",
    name: "Galeria de Fotos (Mural)",
    description: "Grade responsiva para fotos, portfólio e fotos de clientes.",
    category: "content",
    previewImageUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("container"),
        node_type: "container",
        block_type: "container",
        parent_id: genId("section"),
        layout_rules: {
          maxWidth: "xl",
          display: "flex",
          flexDirection: "col",
          gap: "md",
          paddingX: "md",
          paddingY: "xl",
        },
      },
      {
        id: genId("gallery"),
        node_type: "composition",
        block_type: "gallery_grid",
        parent_id: genId("container"),
        content: {
          title: "Nossa Galeria",
          images: [
            { url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80", alt: "Foto 1" },
            { url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80", alt: "Foto 2" },
            { url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80", alt: "Foto 3" },
          ],
        },
      },
    ],
  },

  before_after_slider: {
    id: "before_after_slider",
    name: "Comparador Antes e Depois",
    description: "Slider tátil interativo para comparar resultados estéticos ou reformas.",
    category: "content",
    previewImageUrl:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("slider"),
        node_type: "element",
        block_type: "before_after_slider",
        parent_id: genId("section"),
        content: {
          title: "Resultados Reais",
          beforeImageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
          afterImageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
        },
      },
    ],
  },

  location_map_card: {
    id: "location_map_card",
    name: "Localização & Endereço com Mapa",
    description: "Endereço físico com horários, telefone e rota no Google Maps.",
    category: "content",
    previewImageUrl:
      "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("location"),
        node_type: "composition",
        block_type: "location_map_card",
        parent_id: genId("section"),
        content: {
          title: "Venha nos Visitar",
          address: "Av. Brasil, 1420 - Centro",
          cityState: "São Miguel do Oeste - SC",
        },
      },
    ],
  },

  newsletter_capture: {
    id: "newsletter_capture",
    name: "Captura de Leads & Novidades",
    description: "Bloco minimalista com campo de e-mail/WhatsApp para captação de clientes.",
    category: "marketing",
    previewImageUrl:
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("newsletter"),
        node_type: "element",
        block_type: "newsletter_capture",
        parent_id: genId("section"),
        content: {
          title: "Fique por Dentro dos Lançamentos",
          subtitle: "Receba novidades exclusivas e cupons de desconto.",
        },
      },
    ],
  },

  faq_accordion: {
    id: "faq_accordion",
    name: "Perguntas Frequentes (FAQ)",
    description: "Lista expansível de dúvidas mais comuns sobre prazos e trocas.",
    category: "marketing",
    previewImageUrl:
      "https://images.unsplash.com/photo-1516382772719-7554907104b2?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("container"),
        node_type: "container",
        block_type: "container",
        parent_id: genId("section"),
        layout_rules: {
          maxWidth: "md",
          display: "flex",
          flexDirection: "col",
          gap: "md",
          paddingX: "md",
          paddingY: "xl",
        },
      },
      {
        id: genId("faq"),
        node_type: "composition",
        block_type: "faq_accordion",
        parent_id: genId("container"),
        content: {
          title: "Dúvidas Frequentes",
          faqs: [
            { question: "Qual o prazo de entrega?", answer: "Entre 3 a 7 dias úteis após a confirmação." },
            { question: "Como funciona a troca?", answer: "Primeira troca grátis em até 7 dias corridos." },
          ],
        },
      },
    ],
  },

  testimonial_carousel: {
    id: "testimonial_carousel",
    name: "Depoimentos de Clientes",
    description: "Depoimentos reais com fotos, notas e estrelas para gerar credibilidade.",
    category: "marketing",
    previewImageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
      },
      {
        id: genId("container"),
        node_type: "container",
        block_type: "container",
        parent_id: genId("section"),
        layout_rules: {
          maxWidth: "lg",
          display: "flex",
          flexDirection: "col",
          gap: "md",
          paddingX: "md",
          paddingY: "xl",
        },
      },
      {
        id: genId("testimonials"),
        node_type: "composition",
        block_type: "testimonial_carousel",
        parent_id: genId("container"),
        content: {
          title: "O Que Dizem Nossos Clientes",
          subtitle: "Histórias reais de quem ama nossos produtos e atendimento.",
        },
      },
    ],
  },
};

export const getAllTemplates = () => Object.values(sectionTemplates);
export const getTemplatesByCategory = (category: string) =>
  getAllTemplates().filter((t) => t.category === category);
