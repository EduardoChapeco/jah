/**
 * Catálogo Canônico de Seed Personas (JAH SimLab — derivado do Simwork Engine)
 * Personas brasileiras calibradas para simulação de mercado, produtos e eventos.
 */

export interface SyntheticPersona {
  id: string;
  name: string;
  avatarUrl?: string;
  demographic: {
    age: number;
    gender: "female" | "male" | "non_binary";
    city: string;
    state: string;
    income: number; // Renda mensal em BRL
    occupation: string;
  };
  psychography: {
    values: string[];
    fears: string[];
    aspirations: string[];
  };
  digitalBehavior: {
    timeOnline: string;
    channels: string[];
    formats: string[];
    paymentMethods: string[];
  };
  triggerScores: {
    urgency: number; // 1-10
    socialProof: number; // 1-10
    discount: number; // 1-10
    hedonic: number; // 1-10 (busca por prazer/estética/experiência)
    authority: number; // 1-10
    frictionSensitivity: number; // 1-10 (sensibilidade a checkout difícil)
    cynicism: number; // 1-10 (desconfiança inicial de marcas/anúncios)
  };
  preferredNiches: ("eventos" | "gastronomia" | "moda" | "musica" | "servicos" | "classificados")[];
  contextDescription: string;
}

export const SEED_PERSONAS: SyntheticPersona[] = [
  {
    id: "BR_F_32_CARLA_RS",
    name: "Carla Silveira",
    demographic: {
      age: 32,
      gender: "female",
      city: "Porto Alegre",
      state: "RS",
      income: 5800,
      occupation: "Analista Administrativa",
    },
    psychography: {
      values: ["família", "segurança", "praticidade", "autenticidade"],
      fears: ["compras por impulso ruins", "atraso na entrega", "qualidade inferior"],
      aspirations: ["momentos de lazer de qualidade", "produtos duráveis", "vida organizada"],
    },
    digitalBehavior: {
      timeOnline: "3h/dia",
      channels: ["instagram", "whatsapp", "pinterest"],
      formats: ["carrosséis", "reels rápidos", "avaliações de clientes"],
      paymentMethods: ["pix", "cartão de crédito parcelado"],
    },
    triggerScores: {
      urgency: 6,
      socialProof: 9,
      discount: 8,
      hedonic: 6,
      authority: 7,
      frictionSensitivity: 8,
      cynicism: 6,
    },
    preferredNiches: ["gastronomia", "moda", "servicos", "classificados"],
    contextDescription:
      "Navega à noite após o expediente, busca recomendações reais e clareza de frete/trocas.",
  },
  {
    id: "BR_M_26_GABRIEL_SP",
    name: "Gabriel Santos",
    demographic: {
      age: 26,
      gender: "male",
      city: "São Paulo",
      state: "SP",
      income: 7200,
      occupation: "Designer & Criador Digital",
    },
    psychography: {
      values: ["estética", "inovação", "liberdade", "comunidade cultural"],
      fears: ["produtos genéricos", "eventos desorganizados", "perder lançamentos exclusivos"],
      aspirations: [
        "frequentar as melhores festas",
        "apoiar artistas independentes",
        "lifestyle autêntico",
      ],
    },
    digitalBehavior: {
      timeOnline: "6h/dia",
      channels: ["instagram", "twitter", "tiktok", "spotify"],
      formats: ["flyers conceituais", "stories", "vídeos curtos", "zines"],
      paymentMethods: ["pix", "apple pay", "cartão à vista"],
    },
    triggerScores: {
      urgency: 8,
      socialProof: 7,
      discount: 4,
      hedonic: 9,
      authority: 8,
      frictionSensitivity: 9,
      cynicism: 5,
    },
    preferredNiches: ["eventos", "musica", "moda", "gastronomia"],
    contextDescription:
      "Consumidor cultural ativo, compra ingressos no 1º lote e valoriza design arrojado.",
  },
  {
    id: "BR_F_52_VERA_SC",
    name: "Vera Lúcia",
    demographic: {
      age: 52,
      gender: "female",
      city: "Chapecó",
      state: "SC",
      income: 4200,
      occupation: "Comerciante Local",
    },
    psychography: {
      values: ["tradição", "honestidade", "atendimento humano", "economia"],
      fears: ["golpes online", "dificuldade técnica", "comprar sem falar com alguém"],
      aspirations: ["reunir a família", "compras seguras e locais", "apoio ao comércio do bairro"],
    },
    digitalBehavior: {
      timeOnline: "2h/dia",
      channels: ["whatsapp", "facebook", "instagram"],
      formats: ["fotos nítidas", "mensagens diretas de áudio/texto"],
      paymentMethods: ["pix", "dinheiro", "cartão presencial"],
    },
    triggerScores: {
      urgency: 4,
      socialProof: 8,
      discount: 9,
      hedonic: 4,
      authority: 9,
      frictionSensitivity: 10,
      cynicism: 8,
    },
    preferredNiches: ["gastronomia", "servicos", "classificados"],
    contextDescription:
      "Valoriza WhatsApp direto, fotos reais sem filtros e confirmação humana de pedidos.",
  },
  {
    id: "BR_M_21_MATEUS_SC",
    name: "Mateus Fontana",
    demographic: {
      age: 21,
      gender: "male",
      city: "Florianópolis",
      state: "SC",
      income: 2400,
      occupation: "Estudante & Músico",
    },
    psychography: {
      values: ["música underground", "sustentabilidade", "amizade", "acesso acessível"],
      fears: ["ingressos caros", "falta de grana", "eventos comerciais sem alma"],
      aspirations: [
        "tocar com sua banda",
        "comprar instrumentos usados",
        "viver a cena independente",
      ],
    },
    digitalBehavior: {
      timeOnline: "5h/dia",
      channels: ["instagram", "discord", "spotify", "tiktok"],
      formats: ["stories", "mural de desapego", "cartazes lambe-lambe"],
      paymentMethods: ["pix"],
    },
    triggerScores: {
      urgency: 7,
      socialProof: 6,
      discount: 9,
      hedonic: 8,
      authority: 5,
      frictionSensitivity: 6,
      cynicism: 4,
    },
    preferredNiches: ["eventos", "musica", "classificados", "moda"],
    contextDescription:
      "Caçador de desapegos e shows independentes, sensível a preço e fiel a marcas com propósito.",
  },
  {
    id: "BR_F_28_JULIANA_PR",
    name: "Juliana Rocha",
    demographic: {
      age: 28,
      gender: "female",
      city: "Curitiba",
      state: "PR",
      income: 6500,
      occupation: "Arquiteta de Interiores",
    },
    psychography: {
      values: ["design autoral", "sustentabilidade", "bem-estar", "gastronomia artesanal"],
      fears: ["produção em massa sem qualidade", "experiências barulhentas", "falta de higiene"],
      aspirations: ["decorar com peças únicas", "apoiar ceramistas e artesãos locais"],
    },
    digitalBehavior: {
      timeOnline: "4h/dia",
      channels: ["instagram", "pinterest", "substack"],
      formats: ["galerias com boa iluminação", "textos explicativos de conceito"],
      paymentMethods: ["pix", "cartão de crédito"],
    },
    triggerScores: {
      urgency: 5,
      socialProof: 8,
      discount: 3,
      hedonic: 10,
      authority: 8,
      frictionSensitivity: 7,
      cynicism: 6,
    },
    preferredNiches: ["gastronomia", "moda", "servicos", "classificados"],
    contextDescription:
      "Disposta a pagar mais por peças autorais, packaging sustentável e storytelling impecável.",
  },
];
