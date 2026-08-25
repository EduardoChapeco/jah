import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";

export interface FlashOfferDTO {
  id: string;
  title: string;
  slug: string;
  store_id: string;
  store_name: string;
  price_cents: number;
  original_price_cents: number;
  discount_percent: number;
  mechanic_label: string;
  ends_at?: string | null;
  cover_image: string;
  selling_unit?: string;
  in_stock?: boolean;
  has_flash_offer?: boolean;
  meal_time?: "cafe_manha" | "almoco" | "jantar" | "happy_hour" | null;
  has_free_delivery?: boolean;
  has_express_delivery?: boolean;
  has_2for1_promo?: boolean;
}

export interface StoreCardDTO {
  id: string;
  name: string;
  slug: string;
  avatar_url?: string;
  banner_url?: string;
  category?: string;
  rating?: number;
  review_count?: number;
  distance_km?: number;
  is_open?: boolean;
  delivery_time_min?: string;
}

export interface MarketplaceSectionDTO {
  id: string;
  type: "flash_deal_rail" | "product_rail" | "store_rail" | "category_grid";
  title: string;
  subtitle?: string;
  layout_variant?: string;
  items: any[];
}

// ─── 1. MAPEAMENTO DE PALAVRAS-CHAVE POR NICHO PARA FILTRAGEM RIGOROSA ─────────
export const NICHE_STORE_KEYWORDS: Record<string, string[]> = {
  mercado: [
    "mercado",
    "supermercado",
    "mercearia",
    "hortifruti",
    "emporio",
    "atacado",
    "atacarejo",
    "feira",
    "laticinios",
    "despensa",
    "fruteira",
    "alimentos",
  ],
  gastronomia: [
    "restaurante",
    "hamburgueria",
    "pizzaria",
    "cafeteria",
    "lanchonete",
    "bar",
    "doceria",
    "gastronomia",
    "pastelaria",
    "sushi",
    "bistro",
    "marmitaria",
    "buffet",
    "cafe",
    "sorveteria",
    "acai",
    "lanches",
  ],
  moda: [
    "moda",
    "vestuario",
    "calcados",
    "roupas",
    "boutique",
    "calcado",
    "acessorios",
    "joalheria",
    "otica",
    "brecho",
    "estilo",
    "lingerie",
  ],
  casa: [
    "casa",
    "moveis",
    "decoracao",
    "decor",
    "iluminacao",
    "bazar",
    "utilidades",
    "cama",
    "colchoes",
    "tapetes",
    "cortinas",
    "mesa e banho",
  ],
  construcao: [
    "construcao",
    "materiais",
    "tintas",
    "ferragens",
    "madeireira",
    "eletrica",
    "hidraulica",
    "ferramentas",
    "reforma",
    "acabamentos",
    "pisos",
  ],
  pet: [
    "pet",
    "veterinaria",
    "agropecuaria",
    "racao",
    "banho e tosa",
    "petshop",
    "animais",
    "clinica veterinaria",
  ],
  farmacia: [
    "farmacia",
    "drogaria",
    "saude",
    "manipulacao",
    "suplementos",
    "medicamentos",
    "farma",
    "droga",
  ],
  beleza: [
    "beleza",
    "estetica",
    "barbearia",
    "salao",
    "cosmeticos",
    "perfumaria",
    "esmalteria",
    "cabelo",
    "skincare",
    "barber",
    "spa",
  ],
  bebidas: [
    "bebidas",
    "adega",
    "distribuidora",
    "cervejaria",
    "chopp",
    "conveniencia",
    "vinhos",
    "tele-cerveja",
    "distribuidora de bebidas",
  ],
  acougue: [
    "acougue",
    "carnes",
    "boutique de carnes",
    "frigorifico",
    "churrasco",
    "cortes nobres",
    "casa de carnes",
  ],
  eletronicos: [
    "eletronicos",
    "informatica",
    "celulares",
    "tech",
    "games",
    "assistencia",
    "computadores",
    "acessorios tech",
    "tecnologia",
  ],
  livros: [
    "livraria",
    "sebo",
    "papelaria",
    "livros",
    "escolar",
    "escritorio",
    "leitura",
  ],
  limpeza: [
    "limpeza",
    "quimicos",
    "descartaveis",
    "lavanderia",
    "higiene profissional",
    "produtos de limpeza",
  ],
  servicos: [
    "servicos",
    "prestador",
    "assistencia",
    "reparos",
    "manutencao",
    "consultoria",
    "instalacoes",
    "marido de aluguel",
  ],
  imoveis: [
    "imobiliaria",
    "corretor",
    "imoveis",
    "locacao",
    "temporada",
    "pousada",
    "hotel",
    "hospedagem",
  ],
  turismo: [
    "turismo",
    "passeios",
    "aventura",
    "hotel",
    "pousada",
    "ecoturismo",
    "guia",
    "atracoes",
  ],
};

// ─── 2. SEEDS CONTEXTUAIS E EXCLUSIVOS POR NICHO (SEM CONTAMINAÇÃO CRUZADA) ─────
export const NICHE_SEEDS: Record<string, FlashOfferDTO[]> = {
  mercado: [
    {
      id: "p-mercado-01",
      title: "Cesta de Orgânicos da Serra (Hortaliças, Legumes e Frutas)",
      slug: "cesta-organicos-serra",
      store_id: "s-mercado-01",
      store_name: "Hortifrúti da Terra",
      price_cents: 4200,
      original_price_cents: 5500,
      discount_percent: 24,
      mechanic_label: "24% OFF",
      ends_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
      selling_unit: "cesta",
      in_stock: true,
      has_flash_offer: true,
      has_free_delivery: true,
    },
    {
      id: "p-mercado-02",
      title: "Queijo Colonial Canastra Artesanal Peça (500g)",
      slug: "queijo-colonial-canastra-500g",
      store_id: "s-mercado-02",
      store_name: "Empório da Roça",
      price_cents: 2890,
      original_price_cents: 3600,
      discount_percent: 20,
      mechanic_label: "20% OFF",
      ends_at: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: true,
    },
    {
      id: "p-mercado-03",
      title: "Azeite de Oliva Extra Virgem Primeira Prensagem (500ml)",
      slug: "azeite-extra-virgem-500ml",
      store_id: "s-mercado-03",
      store_name: "Supermercado Central",
      price_cents: 3890,
      original_price_cents: 4990,
      discount_percent: 22,
      mechanic_label: "22% OFF",
      ends_at: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: true,
      has_express_delivery: true,
    },
    {
      id: "p-mercado-04",
      title: "Arroz Nobre Reserva Especial Tipo 1 (Pacote 5kg)",
      slug: "arroz-nobre-reserva-5kg",
      store_id: "s-mercado-03",
      store_name: "Supermercado Central",
      price_cents: 2790,
      original_price_cents: 3490,
      discount_percent: 20,
      mechanic_label: "TABLOIDE",
      ends_at: null,
      cover_image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80",
      selling_unit: "pct",
      in_stock: true,
      has_flash_offer: false,
    },
    {
      id: "p-mercado-05",
      title: "Café em Grãos Seleção Especial Torra Média (500g)",
      slug: "cafe-graos-selecao-500g",
      store_id: "s-mercado-02",
      store_name: "Empório da Roça",
      price_cents: 3200,
      original_price_cents: 3900,
      discount_percent: 18,
      mechanic_label: "OFERTA",
      ends_at: null,
      cover_image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: false,
    },
  ],
  gastronomia: [
    {
      id: "p-gastro-01",
      title: "Smash Burger Duplo Artesanal com Queijo Canastra",
      slug: "smash-burger-duplo-artesanal",
      store_id: "s-gastro-01",
      store_name: "La Brasa Gourmet",
      price_cents: 3490,
      original_price_cents: 4890,
      discount_percent: 29,
      mechanic_label: "29% OFF",
      ends_at: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: true,
      meal_time: "almoco",
      has_express_delivery: true,
    },
    {
      id: "p-gastro-02",
      title: "Pizza Artesanal Margherita di Bufala Fermentação Natural",
      slug: "pizza-margherita-bufala",
      store_id: "s-gastro-02",
      store_name: "Pizzaria Bella Napoli",
      price_cents: 4990,
      original_price_cents: 6990,
      discount_percent: 28,
      mechanic_label: "28% OFF",
      ends_at: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: true,
      meal_time: "jantar",
      has_express_delivery: true,
    },
    {
      id: "p-gastro-03",
      title: "Café Especial Moído na Hora (250g) - Notas Florais",
      slug: "cafe-especial-moido-na-hora",
      store_id: "s-gastro-03",
      store_name: "Torrefação Autoral",
      price_cents: 2900,
      original_price_cents: 3800,
      discount_percent: 24,
      mechanic_label: "24% OFF",
      ends_at: new Date(Date.now() + 14 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: true,
      meal_time: "cafe_manha",
      has_free_delivery: true,
    },
  ],
  moda: [
    {
      id: "p-moda-01",
      title: "Camiseta Linho Puro Masculina Algodão Orgânico",
      slug: "camiseta-linho-puro-masculina",
      store_id: "s-moda-01",
      store_name: "Ateliê & Estilo Catarinense",
      price_cents: 11900,
      original_price_cents: 14900,
      discount_percent: 20,
      mechanic_label: "20% OFF",
      ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: true,
      has_free_delivery: true,
    },
    {
      id: "p-moda-02",
      title: "Vestido Midi Floral em Viscose Premium",
      slug: "vestido-midi-floral",
      store_id: "s-moda-02",
      store_name: "Boutique Elegance",
      price_cents: 18900,
      original_price_cents: 23900,
      discount_percent: 21,
      mechanic_label: "21% OFF",
      ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: true,
    },
  ],
  casa: [
    {
      id: "p-casa-01",
      title: "Luminária Pendente Nórdica em Alumínio Fosco",
      slug: "luminaria-pendente-nordica",
      store_id: "s-casa-01",
      store_name: "Casa & Luz Decorações",
      price_cents: 14900,
      original_price_cents: 19900,
      discount_percent: 25,
      mechanic_label: "25% OFF",
      ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: true,
      has_free_delivery: true,
    },
    {
      id: "p-casa-02",
      title: "Jogo de Lençol 400 Fios Algodão Egípcio Queen",
      slug: "jogo-lencol-400-fios-queen",
      store_id: "s-casa-02",
      store_name: "Conforto & Lar",
      price_cents: 22900,
      original_price_cents: 28900,
      discount_percent: 21,
      mechanic_label: "21% OFF",
      ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: true,
    },
  ],
  construcao: [
    {
      id: "p-const-01",
      title: "Tinta Acrílica Premium Fosca 18L Branca Antimofo",
      slug: "tinta-acrilica-premium-18l",
      store_id: "s-const-01",
      store_name: "Tintas & Cores Regional",
      price_cents: 28900,
      original_price_cents: 36000,
      discount_percent: 20,
      mechanic_label: "20% OFF",
      ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: true,
      has_free_delivery: true,
    },
    {
      id: "p-const-02",
      title: "Parafusadeira e Furadeira de Impacto 20V Bivolt",
      slug: "parafusadeira-furadeira-impacto-20v",
      store_id: "s-const-02",
      store_name: "Ferragens & Ferramentas União",
      price_cents: 34900,
      original_price_cents: 45000,
      discount_percent: 22,
      mechanic_label: "22% OFF",
      ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: true,
    },
  ],
  pet: [
    {
      id: "p-pet-01",
      title: "Ração Super Premium Cães Adultos Frango & Arroz 15kg",
      slug: "racao-super-premium-caes-15kg",
      store_id: "s-pet-01",
      store_name: "Pet Central & Agro",
      price_cents: 21900,
      original_price_cents: 26900,
      discount_percent: 19,
      mechanic_label: "19% OFF",
      ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&q=80",
      selling_unit: "sc",
      in_stock: true,
      has_flash_offer: true,
      has_free_delivery: true,
    },
    {
      id: "p-pet-02",
      title: "Cama Pet Ortopédica Lavável Impermeável Grande",
      slug: "cama-pet-ortopedica-grande",
      store_id: "s-pet-02",
      store_name: "Mundo Pet & Vet",
      price_cents: 13900,
      original_price_cents: 17900,
      discount_percent: 22,
      mechanic_label: "22% OFF",
      ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: true,
    },
  ],
  farmacia: [
    {
      id: "p-farma-01",
      title: "Kit Vitamina C 1000mg + Zinco Imunidade Forte 60 Cápsulas",
      slug: "kit-vitamina-c-zinco-imunidade",
      store_id: "s-farma-01",
      store_name: "Farmácia São Lucas",
      price_cents: 3990,
      original_price_cents: 5200,
      discount_percent: 23,
      mechanic_label: "23% OFF",
      ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: true,
      has_free_delivery: true,
    },
    {
      id: "p-farma-02",
      title: "Protetor Solar Facial Antioleosidade Toque Seco FPS 60 (50g)",
      slug: "protetor-solar-facial-fps60",
      store_id: "s-farma-02",
      store_name: "Drogaria & Saúde",
      price_cents: 5990,
      original_price_cents: 7990,
      discount_percent: 25,
      mechanic_label: "25% OFF",
      ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: true,
    },
  ],
  beleza: [
    {
      id: "p-bel-01",
      title: "Kit Shampoo & Condicionador Nutrição Óleo de Argan 500ml",
      slug: "kit-shampoo-condicionador-argan",
      store_id: "s-bel-01",
      store_name: "Belleza Cosméticos",
      price_cents: 7990,
      original_price_cents: 10900,
      discount_percent: 27,
      mechanic_label: "27% OFF",
      ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: true,
      has_free_delivery: true,
    },
    {
      id: "p-bel-02",
      title: "Sérum Facial Antissinais com Ácido Hialurônico Puro 30ml",
      slug: "serum-facial-acido-hialuronico",
      store_id: "s-bel-02",
      store_name: "Maison des Parfums",
      price_cents: 8900,
      original_price_cents: 11900,
      discount_percent: 25,
      mechanic_label: "25% OFF",
      ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: true,
    },
  ],
  bebidas: [
    {
      id: "p-beb-01",
      title: "Pack Cerveja Artesanal IPA Local (6x 355ml) Garrafa",
      slug: "pack-cerveja-artesanal-ipa",
      store_id: "s-beb-01",
      store_name: "Cervejaria das Araucárias",
      price_cents: 5490,
      original_price_cents: 6500,
      discount_percent: 15,
      mechanic_label: "HAPPY HOUR",
      ends_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&q=80",
      selling_unit: "pack",
      in_stock: true,
      has_flash_offer: true,
      meal_time: "happy_hour",
      has_2for1_promo: true,
    },
    {
      id: "p-beb-02",
      title: "Vinho Tinto Cabernet Sauvignon Gran Reserva 750ml",
      slug: "vinho-tinto-cabernet-reserva",
      store_id: "s-beb-02",
      store_name: "Adega & Vinhedos Seleção",
      price_cents: 8990,
      original_price_cents: 11900,
      discount_percent: 24,
      mechanic_label: "24% OFF",
      ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: true,
      has_free_delivery: true,
    },
  ],
  acougue: [
    {
      id: "p-acou-01",
      title: "Picanha Angus Black Certificada Peça Resfriada (1.2kg)",
      slug: "picanha-angus-black-12kg",
      store_id: "s-acou-01",
      store_name: "Boutique de Carnes Prime",
      price_cents: 10990,
      original_price_cents: 13900,
      discount_percent: 21,
      mechanic_label: "21% OFF",
      ends_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&q=80",
      selling_unit: "kg",
      in_stock: true,
      has_flash_offer: true,
      has_express_delivery: true,
    },
    {
      id: "p-acou-02",
      title: "Costela Bovina Janela Especial para Fogo de Chão (3kg)",
      slug: "costela-bovina-janela-3kg",
      store_id: "s-acou-02",
      store_name: "Casa de Carnes Tradicional",
      price_cents: 11900,
      original_price_cents: 14900,
      discount_percent: 20,
      mechanic_label: "CHURRASCO",
      ends_at: null,
      cover_image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
      selling_unit: "kg",
      in_stock: true,
      has_flash_offer: false,
    },
  ],
  eletronicos: [
    {
      id: "p-elet-01",
      title: "Fone de Ouvido Bluetooth com Cancelamento de Ruído Ativo",
      slug: "fone-bluetooth-noise-cancelling",
      store_id: "s-elet-01",
      store_name: "Tech & Sound Informática",
      price_cents: 24900,
      original_price_cents: 32900,
      discount_percent: 24,
      mechanic_label: "24% OFF",
      ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: true,
      has_free_delivery: true,
    },
  ],
  livros: [
    {
      id: "p-liv-01",
      title: "Livro 'O Poder do Hábito' Edição Especial Capa Dura",
      slug: "livro-poder-habito-especial",
      store_id: "s-liv-01",
      store_name: "Livraria & Letras",
      price_cents: 5490,
      original_price_cents: 6990,
      discount_percent: 21,
      mechanic_label: "21% OFF",
      ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: true,
    },
  ],
  limpeza: [
    {
      id: "p-limp-01",
      title: "Desengordurante Concentrado Profissional Galão 5L",
      slug: "desengordurante-concentrado-5l",
      store_id: "s-limp-01",
      store_name: "Limpeza Total Profissional",
      price_cents: 4990,
      original_price_cents: 6500,
      discount_percent: 23,
      mechanic_label: "23% OFF",
      ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&q=80",
      selling_unit: "un",
      in_stock: true,
      has_flash_offer: true,
      has_free_delivery: true,
    },
  ],
  servicos: [
    {
      id: "p-serv-01",
      title: "Pacote Manutenção Preventiva Residencial e Reparos",
      slug: "manutencao-preventiva-residencial",
      store_id: "s-serv-01",
      store_name: "Marido de Aluguel Express",
      price_cents: 18000,
      original_price_cents: 24000,
      discount_percent: 25,
      mechanic_label: "25% OFF",
      ends_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      cover_image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80",
      selling_unit: "servico",
      in_stock: true,
      has_flash_offer: true,
    },
  ],
};

// ─── 3. LOJAS CONTEXTUAIS PADRÃO POR NICHO ──────────────────────────────────
export const NICHE_DEFAULT_STORES: Record<string, StoreCardDTO[]> = {};

// ─── 4. FUNÇÃO SERVER BFF: getMarketplaceFeed ─────────────────────────────────
export const getMarketplaceFeed = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        niche: z.string().optional(),
        mealTime: z.enum(["cafe_manha", "almoco", "jantar", "happy_hour"]).optional(),
      })
      .optional(),
  )
  .handler(async ({ data: params }) => {
    const supabase = getServerClient();
    const rawNiche = params?.niche;
    const isGlobal = !rawNiche || rawNiche === "todos" || rawNiche === "ofertas" || rawNiche === "home";
    const normalizedNiche = isGlobal ? "global" : rawNiche.toLowerCase().trim();

    const nicheKeywords = NICHE_STORE_KEYWORDS[normalizedNiche] || [normalizedNiche];

    // 1. Busca lojas ativas reais no Supabase, filtradas pelo nicho se aplicável
    let storesQuery = supabase
      .from("stores")
      .select("id, name, slug, type, description, settings")
      .limit(30);

    const { data: storesData, error: storeErr } = await storesQuery;
    if (storeErr) {
      console.warn("[marketplace] Erro na busca de lojas do feed:", storeErr.message);
    }

    let allDbStores: StoreCardDTO[] = (storesData || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      slug: s.slug || `loja-${s.id.slice(0, 6)}`,
      avatar_url: s.settings?.logoUrl || undefined,
      banner_url: s.settings?.bannerUrl || undefined,
      category: s.type || "Comércio Local",
      rating: 4.9,
      review_count: 120,
      distance_km: 1.2,
      is_open: true,
      delivery_time_min: "Disponível",
    }));

    // Filtra lojas rigorosamente se for marketplace vertical
    let filteredStores: StoreCardDTO[] = allDbStores;
    if (!isGlobal) {
      filteredStores = allDbStores.filter((st) => {
        const cat = (st.category || "").toLowerCase();
        const name = (st.name || "").toLowerCase();
        return nicheKeywords.some((kw) => cat.includes(kw) || name.includes(kw));
      });
    }

    // Apenas lojas reais do Supabase

    // 2. Busca produtos reais publicados no Supabase
    let productsQuery = supabase
      .from("products")
      .select(
        `
        id,
        title,
        slug,
        store_id,
        price_cents,
        compare_at_cents,
        status,
        attributes,
        media:product_media(url, alt, sort_order),
        store:stores(id, name, slug, type, settings)
      `,
      )
      .in("status", ["published", "active"]);

    const { data: productsData, error: prodErr } = await productsQuery.limit(60);
    if (prodErr) {
      console.warn("[marketplace] Erro na busca de produtos do feed:", prodErr.message);
    }

    let products: FlashOfferDTO[] = (productsData || []).map((p: any) => {
      const sortedMedia = Array.isArray(p.media)
        ? [...p.media].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        : [];
      const cover = sortedMedia[0]?.url || "";
      const originalPrice = p.compare_at_cents || p.price_cents;
      const discount =
        originalPrice > p.price_cents
          ? Math.round(((originalPrice - p.price_cents) / originalPrice) * 100)
          : 0;

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        store_id: p.store_id,
        store_name: p.store?.name || "Loja Parceira",
        price_cents: p.price_cents,
        original_price_cents: originalPrice,
        discount_percent: discount,
        mechanic_label: discount > 0 ? `${discount}% OFF` : "OFERTA",
        ends_at: "",
        cover_image: cover,
        selling_unit: "un",
        in_stock: true,
        has_flash_offer: discount > 0,
        meal_time: p.attributes?.meal_time || null,
        has_free_delivery:
          p.attributes?.free_delivery === true || p.attributes?.entrega_gratis === true,
        has_express_delivery:
          p.attributes?.express_delivery === true || p.attributes?.entrega_expressa === true,
      };
    });

    // Filtra produtos rigorosamente pelo nicho se não for global
    if (!isGlobal) {
      const matchingStoreIds = new Set(filteredStores.map((s) => s.id));
      products = products.filter((p) => {
        // Match 1: Produto pertence a uma loja do nicho
        if (matchingStoreIds.has(p.store_id)) return true;

        // Match 2: Título do produto ou atributos pertencem ao nicho
        const titleLower = p.title.toLowerCase();
        return nicheKeywords.some((kw) => titleLower.includes(kw));
      });
    }

    // Apenas produtos reais do Supabase

    // 3. Montagem das seções contextuais e rigorosamente NÃO-REPETITIVAS
    const sections: MarketplaceSectionDTO[] = [];

    // Seção 1: Ofertas Relâmpago (Produtos exclusivamente com desconto ou flash offer)
    const flashDeals = products.filter((p) => p.has_flash_offer || p.discount_percent > 0);
    const flashItems = flashDeals.length > 0 ? flashDeals.slice(0, 6) : products.slice(0, 4);
    const usedIds = new Set(flashItems.map((p) => p.id));

    if (flashItems.length > 0) {
      sections.push({
        id: "sec-flash-deals",
        type: "flash_deal_rail",
        title: "Ofertas Relâmpago",
        subtitle: "Descontos exclusivos por tempo limitado",
        layout_variant: "rail_standard",
        items: flashItems,
      });
    }

    // Seção 2: Lojas e Estabelecimentos Contextuais
    if (filteredStores.length > 0) {
      sections.push({
        id: "sec-local-stores",
        type: "store_rail",
        title: isGlobal ? "Lojas & Negócios Locais" : "Estabelecimentos em Destaque",
        subtitle: "Comércios parceiros com entrega e retirada",
        layout_variant: "rail_compact",
        items: filteredStores,
      });
    }

    // Seção 3: Produtos em Destaque do Catálogo (Exclui os itens já exibidos nas ofertas relâmpago!)
    const remainingProducts = products.filter((p) => !usedIds.has(p.id));
    const trendingItems =
      remainingProducts.length > 0 ? remainingProducts.slice(0, 8) : products.slice(0, 6);

    if (trendingItems.length > 0) {
      sections.push({
        id: "sec-trending",
        type: "product_rail",
        title: "Produtos em Destaque",
        subtitle: "Mais pedidos e bem avaliados da categoria",
        layout_variant: "rail_standard",
        items: trendingItems,
      });
    }

    return { sections, allProducts: products };
  });

// ─── 5. FUNÇÃO SERVER BFF: getGlobalDealsPage (Cross-Marketplace) ─────────────
// Agrega as melhores ofertas de TODOS os nichos da plataforma.
// Esta função é a base do módulo /ofertas (diferente do /mercado que é contextual).
export interface GlobalDealNicheSection {
  nicho: string;
  label: string;
  emoji: string;
  color: string;
  to: string;
  items: FlashOfferDTO[];
  stores: StoreCardDTO[];
}

export const getGlobalDealsPage = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        nicheFilter: z.string().optional(), // ex: "gastronomia" para filtrar apenas esse nicho
        limit: z.number().int().min(1).max(30).optional(),
      })
      .optional(),
  )
  .handler(async ({ data: params }) => {
    const supabase = getServerClient();
    const itemsPerNiche = params?.limit ?? 8;
    const nicheFilter = params?.nicheFilter;

    // 1. Busca produtos com desconto real do banco (compare_at_cents > price_cents)
    const { data: discountedProducts, error: prodErr } = await supabase
      .from("products")
      .select(
        `
        id,
        title,
        slug,
        store_id,
        price_cents,
        compare_at_cents,
        status,
        attributes,
        media:product_media(url, alt, sort_order),
        store:stores(id, name, slug, type, settings, description)
      `,
      )
      .in("status", ["published", "active"])
      .not("compare_at_cents", "is", null)
      .order("created_at", { ascending: false })
      .limit(200);

    if (prodErr) {
      console.warn("[getGlobalDealsPage] Error fetching discounted products:", prodErr.message);
    }

    const dbProducts: FlashOfferDTO[] = (discountedProducts || [])
      .filter((p: any) => p.compare_at_cents && p.compare_at_cents > p.price_cents)
      .map((p: any) => {
        const sortedMedia = Array.isArray(p.media)
          ? [...p.media].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          : [];
        const cover = sortedMedia[0]?.url || "";
        const original = p.compare_at_cents || p.price_cents;
        const discount =
          original > p.price_cents
            ? Math.round(((original - p.price_cents) / original) * 100)
            : 0;

        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          store_id: p.store_id,
          store_name: p.store?.name || "Loja Parceira",
          price_cents: p.price_cents,
          original_price_cents: original,
          discount_percent: discount,
          mechanic_label: discount > 0 ? `${discount}% OFF` : "OFERTA",
          ends_at: null,
          cover_image: cover,
          selling_unit: p.attributes?.selling_unit || "un",
          in_stock: true,
          has_flash_offer: discount >= 15,
          has_free_delivery:
            p.attributes?.free_delivery === true || p.attributes?.entrega_gratis === true,
          has_express_delivery:
            p.attributes?.express_delivery === true || p.attributes?.entrega_expressa === true,
        } as FlashOfferDTO;
      });

    // 2. Busca lojas ativas
    const { data: storesData } = await supabase
      .from("stores")
      .select("id, name, slug, type, description, settings")
      .limit(50);

    const allDbStores: StoreCardDTO[] = (storesData || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      slug: s.slug || `loja-${s.id.slice(0, 6)}`,
      avatar_url: s.settings?.logoUrl || undefined,
      banner_url: s.settings?.bannerUrl || undefined,
      category: s.type || "Comércio Local",
      rating: 4.9,
      review_count: 120,
      distance_km: 1.2,
      is_open: true,
      delivery_time_min: "Disponível",
    }));

    // 3. Define as verticais/nichos do módulo Ofertas Global
    const GLOBAL_NICHES: Array<{
      nicho: string;
      label: string;
      emoji: string;
      color: string;
      to: string;
    }> = [
      { nicho: "gastronomia", label: "Gastronomia & Delivery", emoji: "🍔", color: "from-orange-600 to-red-600", to: "/gastronomia" },
      { nicho: "mercado", label: "Mercado & Hortifrúti", emoji: "🛒", color: "from-emerald-700 to-teal-600", to: "/mercado" },
      { nicho: "farmacia", label: "Farmácia & Saúde", emoji: "💊", color: "from-blue-600 to-cyan-600", to: "/farmacia" },
      { nicho: "moda", label: "Moda & Acessórios", emoji: "👗", color: "from-pink-600 to-rose-600", to: "/moda" },
      { nicho: "eletronicos", label: "Eletrônicos & Tech", emoji: "💻", color: "from-indigo-600 to-violet-600", to: "/eletronicos" },
      { nicho: "beleza", label: "Beleza & Bem-Estar", emoji: "💄", color: "from-fuchsia-600 to-pink-600", to: "/beleza" },
      { nicho: "pet", label: "Pet Shop", emoji: "🐾", color: "from-amber-600 to-orange-600", to: "/pet" },
      { nicho: "acougue", label: "Açougue & Churrasco", emoji: "🥩", color: "from-red-700 to-rose-700", to: "/acougue" },
      { nicho: "bebidas", label: "Bebidas & Adega", emoji: "🍻", color: "from-yellow-600 to-amber-600", to: "/bebidas" },
      { nicho: "casa", label: "Casa & Decoração", emoji: "🏠", color: "from-teal-600 to-green-600", to: "/casa" },
    ];

    const targetNiches = nicheFilter
      ? GLOBAL_NICHES.filter((n) => n.nicho === nicheFilter)
      : GLOBAL_NICHES;

    // 4. Para cada nicho, resolve ofertas (DB real + seed de fallback)
    const nicheSections: GlobalDealNicheSection[] = targetNiches
      .map((nicheConfig) => {
        const keywords = NICHE_STORE_KEYWORDS[nicheConfig.nicho] || [nicheConfig.nicho];

        // Lojas do nicho
        const nicheStores = allDbStores.filter((st) => {
          const cat = (st.category || "").toLowerCase();
          const name = (st.name || "").toLowerCase();
          return keywords.some((kw) => cat.includes(kw) || name.includes(kw));
        });

        const nicheStoreIds = new Set(nicheStores.map((s) => s.id));

        // Produtos do nicho (por loja + por título)
        let nicheProducts = dbProducts.filter((p) => {
          if (nicheStoreIds.has(p.store_id)) return true;
          const titleLower = p.title.toLowerCase();
          return keywords.some((kw) => titleLower.includes(kw));
        });

        // Fallback: usa seeds do nicho se não tiver produtos reais suficientes
        if (nicheProducts.length < 3) {
          const nicheSeeds = NICHE_SEEDS[nicheConfig.nicho] || [];
          const existingIds = new Set(nicheProducts.map((p) => p.id));
          for (const seed of nicheSeeds) {
            if (!existingIds.has(seed.id)) {
              nicheProducts.push(seed);
            }
          }
        }

        // Lojas de fallback se poucos
        let finalStores = nicheStores;
        if (finalStores.length < 2) {
          const seedStores = NICHE_DEFAULT_STORES[nicheConfig.nicho] || [];
          const existingStoreIds = new Set(finalStores.map((s) => s.id));
          for (const st of seedStores) {
            if (!existingStoreIds.has(st.id)) {
              finalStores.push(st);
            }
          }
        }

        // Ordena por maior desconto
        nicheProducts.sort((a, b) => b.discount_percent - a.discount_percent);

        return {
          nicho: nicheConfig.nicho,
          label: nicheConfig.label,
          emoji: nicheConfig.emoji,
          color: nicheConfig.color,
          to: nicheConfig.to,
          items: nicheProducts.slice(0, itemsPerNiche),
          stores: finalStores.slice(0, 4),
        };
      })
      .filter((section) => section.items.length > 0); // Omite nichos sem nenhuma oferta

    // 5. Calcula estatísticas globais para Social Proof
    const totalDeals = nicheSections.reduce((acc, s) => acc + s.items.length, 0);
    const maxDiscount = nicheSections.reduce((max, s) => {
      const sectionMax = s.items.reduce((m, p) => Math.max(m, p.discount_percent), 0);
      return Math.max(max, sectionMax);
    }, 0);

    return {
      sections: nicheSections,
      totalDeals,
      maxDiscount,
      hasRealData: dbProducts.length > 0,
    };
  });
