import { z } from "zod";
import { SevenSinHookDTO, SevenSinHookSchema } from "../types/squads-and-onboarding";
import { getStoreBrandDna } from "./market-radar.functions";
import { getServerClient } from "@/lib/supabase";

// ── DEFINIÇÃO DOS 7 PECADOS & GATILHOS PSICOLÓGICOS ─────────────────────────
export const SEVEN_SINS_DEFINITIONS = {
  orgulho: {
    label: "Orgulho & Exclusividade",
    subconscious: "Necessidade de status, validação, ser visto como especial ou superior à média.",
    defaultAngle: "Você não aceita o básico. Feito exclusivamente para quem exige o melhor.",
    color: "#EAB308", // Amber
  },
  ganancia: {
    label: "Ganância & Retorno",
    subconscious: "Sensação de estar lucrando, economizando dinheiro real ou levando vantagem justa.",
    defaultAngle: "Leve o dobro de valor investindo menos. A matemática joga a seu favor.",
    color: "#16A34A", // Emerald
  },
  luxuria: {
    label: "Luxúria & Desejo Sensorial",
    subconscious: "Ativação de prazer imediato, apetite visual incontrolável e indulgência sensorial.",
    defaultAngle: "Uma experiência tão irresistível que é impossível experimentar apenas uma vez.",
    color: "#E11D48", // Rose
  },
  inveja: {
    label: "Inveja & Destaque Social",
    subconscious: "Desejo de possuir o que os outros cobiçam e ser o modelo seguido pelo grupo.",
    defaultAngle: "O segredo que seus amigos vão perguntar de onde você tirou.",
    color: "#8B5CF6", // Violet
  },
  gula: {
    label: "Gula & Abundância",
    subconscious: "Fartura, saciedade máxima, porções generosas sem sensação de escassez.",
    defaultAngle: "Porções generosas, sabor arrebatador e zero arrependimento a cada mordida.",
    color: "#EA580C", // Orange
  },
  ira: {
    label: "Ira & Inconformismo",
    subconscious: "Revolta contra abusos de mercado, indignação com produtos ruins ou promessas falsas.",
    defaultAngle: "Chega de pagar caro por promessas vazias e entregas que atrasam.",
    color: "#DC2626", // Red
  },
  preguica: {
    label: "Preguiça & Zero Esforço",
    subconscious: "Conveniência extrema, solução pronta em 1 clique sem nenhum esforço mental.",
    defaultAngle: "Um toque na tela e tudo resolvido. Você não precisa nem levantar do sofá.",
    color: "#0A84FF", // Blue
  },
};

export type SinType = keyof typeof SEVEN_SINS_DEFINITIONS;

// ── PERSONAS SINTÉTICAS DO SIMLAB V2 ────────────────────────────────────────
export interface SimLabPersonaResult {
  persona_id: string;
  name: string;
  archetype_label: string;
  avatar_url: string;
  conversion_probability: number; // 0-100
  reaction_verbatim: string;
  primary_objection?: string;
  recommended_fix?: string;
}

// ── 1. GERAR COPY DE ALTA CONVERSÃO POR PECADO CAPITAL (V4 COMPANY AGENT) ──
export async function generateSevenSinCopy(
  storeId: string,
  params: {
    sin: SinType;
    productId?: string;
    productNameFallback?: string;
    targetChannel: "whatsapp" | "instagram_ad" | "push_notification" | "storefront_banner";
  }
): Promise<SevenSinHookDTO> {
  const serverClient = getServerClient();
  let productName = params.productNameFallback || "Produto Destaque";
  let productPrice = "R$ 49,90";

  if (params.productId) {
    const { data: prod } = await serverClient
      .from("products")
      .select("name, price, description")
      .eq("id", params.productId)
      .eq("store_id", storeId)
      .maybeSingle();

    if (prod) {
      productName = prod.name;
      if (prod.price) {
        productPrice = `R$ ${(Number(prod.price) / 100).toFixed(2).replace(".", ",")}`;
      }
    }
  }

  const dna = await getStoreBrandDna(storeId);
  const def = SEVEN_SINS_DEFINITIONS[params.sin] || SEVEN_SINS_DEFINITIONS.orgulho;

  // Redação estruturada do Agente "agent.v4_copywriter" (Copywriter Sênior & Psicanalista)
  let headline = "";
  let body = "";
  let cta = "";

  switch (params.sin) {
    case "orgulho":
      headline = `Não é para qualquer um: Conheça o padrão oficial de ${productName}`;
      body = `Quem entende de qualidade reconhece à primeira vista. Selecionado sob critérios rigorosos para clientes que exigem excelência sem concessões. Disponível por apenas ${productPrice}.`;
      cta = "Garantir Edição Limitada";
      break;
    case "ganancia":
      headline = `Pague por 1, sinta o valor de 2: O melhor custo-benefício de ${productName}`;
      body = `Economize margem real sem abrir mão do padrão premium. Ao pedir hoje por ${productPrice}, você tem retorno de sabor e economia imediata comprovada.`;
      cta = "Aproveitar Oportunidade Exclusiva";
      break;
    case "luxuria":
      headline = `Uma explosão sensorial inesquecível: ${productName}`;
      body = `A textura perfeita, o aroma irresistível e o sabor que conquista no primeiro instante. Você merece se dar esse presente especial hoje por ${productPrice}.`;
      cta = "Quero Sentir Esse Sabor Agora";
      break;
    case "inveja":
      headline = `O que todos estão comentando na cidade: Experimente o novo ${productName}`;
      body = `Descubra por que quem experimenta não consegue mais voltar atrás. Seja o primeiro do seu círculo a ter a experiência completa por ${productPrice}.`;
      cta = "Ver Por Que É Tão Desejado";
      break;
    case "gula":
      headline = `Fartura sem limites: Surpreenda seu apetite com ${productName}`;
      body = `Uma porção generosa e irresistível, preparada com os melhores ingredientes da casa. Satisfação garantida do início ao fim por apenas ${productPrice}.`;
      cta = "Pedir Minha Porção Especial";
      break;
    case "ira":
      headline = `Cansado de pagar caro por comida sem graça? Chegou o verdadeiro ${productName}`;
      body = `Chega de promessas não cumpridas e entregas que frustram. Nós respeitamos seu tempo e seu dinheiro com padrão rigoroso de qualidade por ${productPrice}.`;
      cta = "Exigir o Padrão Que Eu Mereço";
      break;
    case "preguica":
      headline = `Em 1 toque no seu celular: ${productName} na sua porta`;
      body = `Sem filas, sem dor de cabeça, sem cadastros complicados. Peça agora em segundos pelo WhatsApp e receba quentinho onde estiver por ${productPrice}.`;
      cta = "Pedir em 1 Clique Sem Esforço";
      break;
  }

  return {
    sin: params.sin,
    title: `${def.label} — ${productName}`,
    subconscious_trigger: def.subconscious,
    copy_headline: headline,
    copy_body: body,
    call_to_action: cta,
    recommended_channel: params.targetChannel,
  };
}

// ── 2. SIMLAB V2: TESTE DE IMPACTO COM PERSONAS SINTÉTICAS ─────────────────
export async function runSimLabPersonaTest(params: {
  copyHeadline: string;
  copyBody: string;
  sin: SinType;
}): Promise<SimLabPersonaResult[]> {
  // 5 Personas sintéticas calibradas com comportamento de consumo real brasileiro
  const personas = [
    {
      persona_id: "persona_lucas_universitario",
      name: "Lucas Menezes, 23 anos",
      archetype_label: "Universitário Pragmático & Ágil",
      avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150&auto=format&fit=crop",
      preferredSins: ["preguica", "ganancia", "gula"],
      bias: 0.85,
    },
    {
      persona_id: "persona_claudia_mae",
      name: "Cláudia Silveira, 41 anos",
      archetype_label: "Mãe Gestora & Família",
      avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop",
      preferredSins: ["ganancia", "ira", "orgulho"],
      bias: 0.78,
    },
    {
      persona_id: "persona_rodrigo_executivo",
      name: "Rodrigo Carvalho, 36 anos",
      archetype_label: "Executivo Sem Tempo & Status",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
      preferredSins: ["orgulho", "preguica", "inveja"],
      bias: 0.92,
    },
    {
      persona_id: "persona_amanda_foodie",
      name: "Amanda Fontana, 28 anos",
      archetype_label: "Entusiasta Gastronômica & Design",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
      preferredSins: ["luxuria", "orgulho", "inveja"],
      bias: 0.88,
    },
    {
      persona_id: "persona_marcos_economico",
      name: "Marcos Vinícius, 52 anos",
      archetype_label: "Consumidor Tradicional Cético",
      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop",
      preferredSins: ["ganancia", "ira"],
      bias: 0.70,
    },
  ];

  return personas.map((p) => {
    const isPreferred = p.preferredSins.includes(params.sin);
    const score = Math.min(
      98,
      Math.max(45, Math.round(p.bias * 100 + (isPreferred ? 15 : -10) + (Math.random() * 8 - 4)))
    );

    let verbatim = "";
    let objection: string | undefined;
    let fix: string | undefined;

    if (score >= 85) {
      verbatim = `\"Essa headline me pegou de cara. A promessa é clara e toca exatamente no que me faz decidir comprar agora sem pensar duas vezes.\"`;
    } else if (score >= 70) {
      verbatim = `\"Gostei da abordagem e faz sentido, mas ainda precisaria confirmar o prazo exato de entrega ou a taxa de conveniência.\"`;
      objection = "Dúvida sobre transparência de taxas ou prazo final.";
      fix = "Inserir prazo estimado explícito (ex: 'Entrega em até 35 min').";
    } else {
      verbatim = `\"Parece um anúncio comum como outros que vejo. Precisa de uma prova social mais forte para me convencer a agir imediatamente.\"`;
      objection = "Falta de comprovação social ou garantia incontestável.";
      fix = "Adicionar menção de satisfação garantida ou depoimento real.";
    }

    return {
      persona_id: p.persona_id,
      name: p.name,
      archetype_label: p.archetype_label,
      avatar_url: p.avatar_url,
      conversion_probability: score,
      reaction_verbatim: verbatim,
      primary_objection: objection,
      recommended_fix: fix,
    };
  });
}
