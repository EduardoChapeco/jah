import type { SectionTemplate } from "./builder-types";

// Helper para gerar IDs previsíveis temporários (o injetor deve substituir por UUIDs reais)
const genId = (prefix: string) => `tpl_${prefix}`;

export const sectionTemplates: Record<string, SectionTemplate> = {
  gallery_grid: {
    id: "gallery_grid",
    name: "Galeria em Grade (Mural)",
    description: "Uma grade responsiva ideal para portfólios ou destaques visuais do Instagram.",
    category: "content",
    previewImageUrl:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
        design_tokens: { surfaceVariant: "zine" },
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
            {
              url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446",
              alt: "Imagem 1",
            },
            {
              url: "https://images.unsplash.com/photo-1483985988355-763728e1935b",
              alt: "Imagem 2",
            },
            {
              url: "https://images.unsplash.com/photo-1497366216548-37526070297c",
              alt: "Imagem 3",
            },
          ],
        },
      },
    ],
  },

  hero_carousel: {
    id: "hero_carousel",
    name: "Carrossel Principal (Hero)",
    description: "Banners rotativos de ponta a ponta com botões de ação.",
    category: "commerce",
    previewImageUrl:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=300&q=80",
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
            { image_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8" },
            { image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff" },
          ],
          showOverlay: true,
          overlayOpacity: "medium",
          desktopHeight: "proportional",
        },
      },
    ],
  },

  product_rail: {
    id: "product_rail",
    name: "Vitrine de Produtos (Slider)",
    description: "Carrossel de produtos dinâmico que puxa da sua loja automaticamente.",
    category: "commerce",
    previewImageUrl:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=300&q=80",
    defaultSource: "latest_products",
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
          gap: "lg",
          paddingX: "md",
          paddingY: "xl",
        },
      },
      {
        id: genId("rail"),
        node_type: "composition",
        block_type: "product_rail",
        parent_id: genId("container"),
        data_bindings: { source: "latest_products", limit: 8 },
        content: {
          title: "Novidades da Loja",
          layout: "carousel",
          itemsPerRowDesktop: "4",
          itemsPerRowMobile: "2",
          freeScroll: true,
        },
      },
    ],
  },

  rich_text: {
    id: "rich_text_about",
    name: "Sobre Nós (Texto Largo)",
    description: "Um bloco de texto formatado ideal para contar histórias e apresentar a marca.",
    category: "content",
    previewImageUrl:
      "https://images.unsplash.com/photo-1455390582262-044cdead2708?auto=format&fit=crop&w=300&q=80",
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
          paddingY: "2xl",
        },
      },
      {
        id: genId("text"),
        node_type: "element",
        block_type: "rich_text",
        parent_id: genId("container"),
        content: {
          html: "<div style='text-align:center'><h2 style='font-size:2rem;font-weight:bold;margin-bottom:1rem;'>Nossa História</h2><p style='color:#64748b;font-size:1.125rem;line-height:1.75;'>Nós acreditamos que cada detalhe importa. Nossa jornada começou com a vontade de transformar o simples em extraordinário.</p></div>",
        },
      },
    ],
  },

  bento_grid: {
    id: "bento_grid",
    name: "Mosaico Assimetrico (Bento)",
    description: "Um grid moderno e desconstruído para apresentar múltiplos links ou categorias.",
    category: "commerce",
    previewImageUrl:
      "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=300&q=80",
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
          items: [
            {
              title: "Verão 24",
              subtitle: "Lançamento",
              link: "/colecao/verao",
              size: "large",
              image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b",
            },
            {
              title: "Acessórios",
              subtitle: "Até 50% OFF",
              link: "/categoria/acessorios",
              size: "small",
              image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
            },
            {
              title: "Calçados",
              subtitle: "Novos",
              link: "/categoria/calcados",
              size: "wide",
              image: "https://images.unsplash.com/photo-1514989940723-e8e51635b782",
            },
          ],
        },
      },
    ],
  },

  countdown_timer: {
    id: "countdown_timer",
    name: "Cronômetro Regressivo",
    description: "Gere urgência com um contador de tempo para promoções e lançamentos.",
    category: "marketing",
    previewImageUrl:
      "https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&w=300&q=80",
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
        id: genId("timer"),
        node_type: "element",
        block_type: "countdown_timer",
        parent_id: genId("container"),
        content: {
          title: "A Oferta Termina Em:",
          target_date: new Date(Date.now() + 86400000).toISOString(),
          expired_message: "Oferta Expirada!",
        },
      },
    ],
  },

  trust_badges: {
    id: "trust_badges",
    name: "Selos de Confiança",
    description: "Aumente a conversão exibindo métodos de pagamento, frete ou garantias.",
    category: "commerce",
    previewImageUrl:
      "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?auto=format&fit=crop&w=300&q=80",
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
          paddingY: "lg",
        },
      },
      {
        id: genId("badges"),
        node_type: "composition",
        block_type: "trust_badges",
        parent_id: genId("container"),
        content: {
          badges: [
            { icon: "truck", title: "Frete Rápido", subtitle: "Para todo o Brasil" },
            { icon: "credit-card", title: "Até 12x Sem Juros", subtitle: "No cartão de crédito" },
            { icon: "shield", title: "Compra Segura", subtitle: "Dados criptografados" },
            { icon: "rotate-ccw", title: "Primeira Troca Grátis", subtitle: "Em até 7 dias" },
          ],
        },
      },
    ],
  },

  faq_accordion: {
    id: "faq_accordion",
    name: "Dúvidas Frequentes (FAQ)",
    description: "Reduza o suporte respondendo às dúvidas mais comuns dos seus clientes.",
    category: "marketing",
    previewImageUrl:
      "https://images.unsplash.com/photo-1516382772719-7554907104b2?auto=format&fit=crop&w=300&q=80",
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
          paddingY: "2xl",
        },
      },
      {
        id: genId("faq"),
        node_type: "composition",
        block_type: "faq_accordion",
        parent_id: genId("container"),
        content: {
          title: "Dúvidas Comuns",
          description: "Tudo o que você precisa saber sobre prazos, trocas e garantias.",
          faqs: [
            {
              question: "Qual o prazo de entrega?",
              answer:
                "O prazo varia conforme a sua região, geralmente entre 3 a 10 dias úteis após a confirmação do pagamento.",
            },
            {
              question: "Como funciona a troca?",
              answer:
                "A primeira troca é grátis. Você tem até 7 dias após o recebimento para solicitar a devolução sem custos.",
            },
            {
              question: "Quais as formas de pagamento?",
              answer:
                "Aceitamos PIX com 5% de desconto, Boleto e Cartão de Crédito em até 12x sem juros.",
            },
          ],
        },
      },
    ],
  },

  testimonial_carousel: {
    id: "testimonial_carousel",
    name: "Depoimentos (Provas Sociais)",
    description: "Construa credibilidade mostrando a opinião de quem já comprou com você.",
    category: "marketing",
    previewImageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
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
          paddingY: "2xl",
        },
      },
      {
        id: genId("testimonials"),
        node_type: "composition",
        block_type: "testimonial_carousel",
        parent_id: genId("container"),
        content: {
          title: "O Que Dizem Nossos Clientes",
          subtitle: "Histórias reais de quem ama nossos produtos.",
          testimonials: [
            {
              author: "Maria Silva",
              content:
                "Produto incrível! Chegou super rápido e a qualidade é muito superior ao esperado. Comprarei novamente.",
              rating: 5,
              avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
            },
            {
              author: "João Souza",
              content:
                "Atendimento impecável e o caimento da peça ficou perfeito. Recomendo de olhos fechados.",
              rating: 5,
              avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
            },
            {
              author: "Ana Costa",
              content:
                "Melhor experiência de compra que já tive na internet. A embalagem é um capricho só!",
              rating: 5,
              avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
            },
          ],
        },
      },
    ],
  },

  social_grid: {
    id: "social_grid",
    name: "Feed do Instagram",
    description: "Traga o engajamento das redes sociais para a página principal da sua loja.",
    category: "marketing",
    previewImageUrl:
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=300&q=80",
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
          paddingY: "2xl",
        },
      },
      {
        id: genId("social"),
        node_type: "composition",
        block_type: "social_grid",
        parent_id: genId("container"),
        content: {
          title: "Siga-nos",
          username: "@suamarca",
          posts: [
            {
              image_url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446",
              likes: "1.2k",
              comments: "45",
              link: "https://instagram.com",
            },
            {
              image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c",
              likes: "890",
              comments: "12",
              link: "https://instagram.com",
            },
            {
              image_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b",
              likes: "2.1k",
              comments: "105",
              link: "https://instagram.com",
            },
            {
              image_url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b",
              likes: "560",
              comments: "8",
              link: "https://instagram.com",
            },
          ],
        },
      },
    ],
  },

  upcoming_events: {
    id: "upcoming_events",
    name: "Próximos Eventos",
    description:
      "Lista os próximos eventos cadastrados pelo organizador, sincronizados automaticamente.",
    category: "commerce",
    previewImageUrl:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=300&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
        design_tokens: { surfaceVariant: "ticket" },
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
        id: genId("event_rail"),
        node_type: "composition",
        block_type: "event_rail",
        parent_id: genId("container"),
        content: {
          title: "Nossa Agenda",
          layout: "carousel",
        },
        data_bindings: { source: "upcoming_events", limit: 6 },
      },
    ],
  },

  community_feed: {
    id: "community_feed",
    name: "Zine Comunitário",
    description: "Um mural interativo para classificados e anúncios da Comunidade Wider.",
    category: "social",
    previewImageUrl:
      "https://images.unsplash.com/photo-1517404215738-15263e9f9178?auto=format&fit=crop&w=300&q=80",
    nodes: [
      {
        id: genId("section"),
        node_type: "section",
        block_type: "section",
        parent_id: null,
        design_tokens: { surfaceVariant: "zine" },
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
        id: genId("community_feed"),
        node_type: "composition",
        block_type: "community_feed",
        parent_id: genId("container"),
        content: {
          title: "Mural da Comunidade",
          layout: "masonry",
        },
        data_bindings: { source: "latest_classifieds", limit: 12 },
      },
    ],
  },
};

export const getAllTemplates = () => Object.values(sectionTemplates);
export const getTemplatesByCategory = (category: string) =>
  getAllTemplates().filter((t) => t.category === category);
