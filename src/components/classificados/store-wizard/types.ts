export const STORE_TYPES = [
  { id: "alimentacao", icon: "🍔", label: "Alimentação", subtitle: "Restaurante, dark kitchen, confeitaria" },
  { id: "imoveis", icon: "🏠", label: "Imóveis", subtitle: "Imobiliária, corretor, construtora" },
  { id: "automoveis", icon: "🚗", label: "Automóveis", subtitle: "Loja de veículos, oficina, peças" },
  { id: "moda", icon: "👕", label: "Moda & Vestuário", subtitle: "Roupas, calçados, acessórios" },
  { id: "servicos", icon: "🛠", label: "Serviços", subtitle: "Manutenção, reparos, consultoria" },
  { id: "eventos", icon: "🎉", label: "Eventos", subtitle: "Festas, shows, buffet, decoração" },
  { id: "turismo", icon: "✈️", label: "Turismo & Viagens", subtitle: "Hospedagem, passeios, guias" },
  { id: "produtos-fisicos", icon: "📦", label: "Produtos Físicos", subtitle: "Loja física, bazar, artesanato" },
  { id: "produtos-digitais", icon: "💻", label: "Produtos Digitais", subtitle: "Cursos, ebooks, SaaS" },
  { id: "pets", icon: "🐾", label: "Pets", subtitle: "Petshop, veterinário, banho & tosa" },
  { id: "entregas", icon: "🚴", label: "Entregas", subtitle: "Motoboy, frete, logística" },
  { id: "profissional-liberal", icon: "🧑‍💼", label: "Profissional Liberal", subtitle: "Advogado, contador, designer" },
] as const;

export const ACCENT_COLORS = [
  "#f97316", "#ef4444", "#8b5cf6", "#3b82f6", "#10b981",
  "#f59e0b", "#ec4899", "#06b6d4", "#84cc16", "#6366f1",
];

export const DAYS_OF_WEEK = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
] as const;

export interface DayHours {
  active: boolean;
  open: string;
  close: string;
}

export interface DeliveryArea {
  name: string;
  time: string;
  price: string;
}

export interface StoreWizardData {
  // Step 1
  storeType: string;
  // Step 2
  name: string;
  slug: string;
  customSlug: boolean;
  tagline: string;
  categoryId: string;
  logoFile: File | null;
  logoPreview: string;
  bannerFile: File | null;
  bannerPreview: string;
  accentColor: string;
  // Step 3
  onlineOnly: boolean;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  whatsapp: string;
  email: string;
  website: string;
  socialLinks: string[];
  // Step 4
  hours: Record<string, DayHours>;
  serviceModes: string[];
  deliveryAreas: DeliveryArea[];
  deliveryMinOrder: string;
  deliveryPrepTime: string;
  partnerDriver: boolean;
  ownDriver: boolean;
  pickupWaitTime: string;
  paymentMethods: string[];
  pixKey: string;
  maxInstallments: string;
  noInterestInstallments: string;
  mealVoucherBrands: string[];
  changeAvailable: boolean;
}

export const defaultWizardData: StoreWizardData = {
  storeType: "",
  name: "",
  slug: "",
  customSlug: false,
  tagline: "",
  categoryId: "",
  logoFile: null,
  logoPreview: "",
  bannerFile: null,
  bannerPreview: "",
  accentColor: "#f97316",
  onlineOnly: false,
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  whatsapp: "",
  email: "",
  website: "",
  socialLinks: [""],
  hours: {
    seg: { active: true, open: "08:00", close: "18:00" },
    ter: { active: true, open: "08:00", close: "18:00" },
    qua: { active: true, open: "08:00", close: "18:00" },
    qui: { active: true, open: "08:00", close: "18:00" },
    sex: { active: true, open: "08:00", close: "18:00" },
    sab: { active: false, open: "08:00", close: "13:00" },
    dom: { active: false, open: "08:00", close: "13:00" },
  },
  serviceModes: [],
  deliveryAreas: [],
  deliveryMinOrder: "",
  deliveryPrepTime: "30",
  partnerDriver: false,
  ownDriver: false,
  pickupWaitTime: "15",
  paymentMethods: [],
  pixKey: "",
  maxInstallments: "1",
  noInterestInstallments: "1",
  mealVoucherBrands: [],
  changeAvailable: true,
};

export interface StepProps {
  data: StoreWizardData;
  onChange: (partial: Partial<StoreWizardData>) => void;
}
