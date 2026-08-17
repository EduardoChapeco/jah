export interface CityRecord {
  id: string;
  name: string;
  state: string;
  label: string; // Ex: "Chapecó - SC"
  region: string;
  lat?: number;
  lng?: number;
}

export const CANONICAL_CITIES: CityRecord[] = [
  // ── Grande Oeste Catarinense (Foco Principal Jah) ──
  { id: "chapeco-sc", name: "Chapecó", state: "SC", label: "Chapecó - SC", region: "Oeste SC", lat: -27.1004, lng: -52.6152 },
  { id: "xanxere-sc", name: "Xanxerê", state: "SC", label: "Xanxerê - SC", region: "Oeste SC", lat: -26.8747, lng: -52.4036 },
  { id: "concordia-sc", name: "Concórdia", state: "SC", label: "Concórdia - SC", region: "Oeste SC", lat: -27.2341, lng: -52.0264 },
  { id: "sao-miguel-do-oeste-sc", name: "São Miguel do Oeste", state: "SC", label: "São Miguel do Oeste - SC", region: "Extremo Oeste SC", lat: -26.7264, lng: -53.5186 },
  { id: "joacaba-sc", name: "Joaçaba", state: "SC", label: "Joaçaba - SC", region: "Meio-Oeste SC", lat: -27.1772, lng: -51.5039 },
  { id: "pinhalzinho-sc", name: "Pinhalzinho", state: "SC", label: "Pinhalzinho - SC", region: "Oeste SC", lat: -26.8458, lng: -52.9933 },
  { id: "maravilha-sc", name: "Maravilha", state: "SC", label: "Maravilha - SC", region: "Oeste SC", lat: -26.7622, lng: -53.1764 },
  { id: "xaxim-sc", name: "Xaxim", state: "SC", label: "Xaxim - SC", region: "Oeste SC", lat: -26.9608, lng: -52.5358 },
  { id: "seara-sc", name: "Seara", state: "SC", label: "Seara - SC", region: "Oeste SC", lat: -27.1517, lng: -52.3117 },
  { id: "coronel-freitas-sc", name: "Coronel Freitas", state: "SC", label: "Coronel Freitas - SC", region: "Oeste SC", lat: -26.9083, lng: -52.7042 },
  { id: "palmitos-sc", name: "Palmitos", state: "SC", label: "Palmitos - SC", region: "Extremo Oeste SC", lat: -27.0678, lng: -53.1611 },
  { id: "itapiranga-sc", name: "Itapiranga", state: "SC", label: "Itapiranga - SC", region: "Extremo Oeste SC", lat: -27.1681, lng: -53.7125 },
  { id: "sao-lourenco-do-oeste-sc", name: "São Lourenço do Oeste", state: "SC", label: "São Lourenço do Oeste - SC", region: "Noroeste SC", lat: -26.3589, lng: -52.8514 },
  { id: "cunha-pora-sc", name: "Cunha Porã", state: "SC", label: "Cunha Porã - SC", region: "Oeste SC", lat: -26.9536, lng: -53.1683 },
  { id: "quilombo-sc", name: "Quilombo", state: "SC", label: "Quilombo - SC", region: "Oeste SC", lat: -26.7267, lng: -52.7239 },
  { id: "saudades-sc", name: "Saudades", state: "SC", label: "Saudades - SC", region: "Oeste SC", lat: -26.9242, lng: -53.0033 },
  { id: "abelardo-luz-sc", name: "Abelardo Luz", state: "SC", label: "Abelardo Luz - SC", region: "Oeste SC", lat: -26.5683, lng: -52.3278 },
  { id: "guatambu-sc", name: "Guatambu", state: "SC", label: "Guatambu - SC", region: "Oeste SC", lat: -27.1333, lng: -52.7833 },
  { id: "cordilheira-alta-sc", name: "Cordilheira Alta", state: "SC", label: "Cordilheira Alta - SC", region: "Oeste SC", lat: -26.9833, lng: -52.6167 },
  { id: "nova-erechim-sc", name: "Nova Erechim", state: "SC", label: "Nova Erechim - SC", region: "Oeste SC", lat: -26.8986, lng: -52.9069 },
  { id: "caxambu-do-sul-sc", name: "Caxambu do Sul", state: "SC", label: "Caxambu do Sul - SC", region: "Oeste SC", lat: -27.1625, lng: -52.8806 },
  { id: "aguas-de-chapeco-sc", name: "Águas de Chapecó", state: "SC", label: "Águas de Chapecó - SC", region: "Oeste SC", lat: -27.0694, lng: -52.9867 },
  { id: "sao-carlos-sc", name: "São Carlos", state: "SC", label: "São Carlos - SC", region: "Oeste SC", lat: -27.0811, lng: -53.0039 },

  // ── Outras Macrorregiões de Santa Catarina ──
  { id: "florianopolis-sc", name: "Florianópolis", state: "SC", label: "Florianópolis - SC", region: "Grande Florianópolis", lat: -27.5954, lng: -48.5480 },
  { id: "sao-jose-sc", name: "São José", state: "SC", label: "São José - SC", region: "Grande Florianópolis", lat: -27.6136, lng: -48.6364 },
  { id: "palhoca-sc", name: "Palhoça", state: "SC", label: "Palhoça - SC", region: "Grande Florianópolis", lat: -27.6453, lng: -48.6678 },
  { id: "joinville-sc", name: "Joinville", state: "SC", label: "Joinville - SC", region: "Norte SC", lat: -26.3045, lng: -48.8487 },
  { id: "blumenau-sc", name: "Blumenau", state: "SC", label: "Blumenau - SC", region: "Vale do Itajaí", lat: -26.9194, lng: -49.0661 },
  { id: "balneario-camboriu-sc", name: "Balneário Camboriú", state: "SC", label: "Balneário Camboriú - SC", region: "Litoral Norte SC", lat: -26.9926, lng: -48.6353 },
  { id: "itajai-sc", name: "Itajaí", state: "SC", label: "Itajaí - SC", region: "Litoral Norte SC", lat: -26.9078, lng: -48.6619 },
  { id: "criciuma-sc", name: "Criciúma", state: "SC", label: "Criciúma - SC", region: "Sul SC", lat: -28.6775, lng: -49.3697 },
  { id: "lages-sc", name: "Lages", state: "SC", label: "Lages - SC", region: "Serra Catarinense", lat: -27.8161, lng: -50.3261 },
  { id: "brusque-sc", name: "Brusque", state: "SC", label: "Brusque - SC", region: "Vale do Itajaí", lat: -27.0978, lng: -48.9106 },
  { id: "tubarao-sc", name: "Tubarão", state: "SC", label: "Tubarão - SC", region: "Sul SC", lat: -28.4739, lng: -49.0072 },
  { id: "rio-do-sul-sc", name: "Rio do Sul", state: "SC", label: "Rio do Sul - SC", region: "Alto Vale SC", lat: -27.2153, lng: -49.6431 },
  { id: "jaragua-do-sul-sc", name: "Jaraguá do Sul", state: "SC", label: "Jaraguá do Sul - SC", region: "Norte SC", lat: -26.4853, lng: -49.0839 },
  { id: "videira-sc", name: "Videira", state: "SC", label: "Videira - SC", region: "Meio-Oeste SC", lat: -27.0083, lng: -51.1528 },
  { id: "cacador-sc", name: "Caçador", state: "SC", label: "Caçador - SC", region: "Meio-Oeste SC", lat: -26.7753, lng: -51.0125 },

  // ── Paraná (Cidades Chave & Fronteira com SC) ──
  { id: "curitiba-pr", name: "Curitiba", state: "PR", label: "Curitiba - PR", region: "Capital PR", lat: -25.4284, lng: -49.2733 },
  { id: "pato-branco-pr", name: "Pato Branco", state: "PR", label: "Pato Branco - PR", region: "Sudoeste PR", lat: -26.2289, lng: -52.6711 },
  { id: "francisco-beltrao-pr", name: "Francisco Beltrão", state: "PR", label: "Francisco Beltrão - PR", region: "Sudoeste PR", lat: -26.0792, lng: -53.0553 },
  { id: "cascavel-pr", name: "Cascavel", state: "PR", label: "Cascavel - PR", region: "Oeste PR", lat: -24.9578, lng: -53.4595 },
  { id: "foz-do-iguacu-pr", name: "Foz do Iguaçu", state: "PR", label: "Foz do Iguaçu - PR", region: "Oeste PR", lat: -25.5163, lng: -54.5854 },
  { id: "londrina-pr", name: "Londrina", state: "PR", label: "Londrina - PR", region: "Norte PR", lat: -23.3045, lng: -51.1696 },
  { id: "maringa-pr", name: "Maringá", state: "PR", label: "Maringá - PR", region: "Norte PR", lat: -23.4205, lng: -51.9333 },
  { id: "ponta-grossa-pr", name: "Ponta Grossa", state: "PR", label: "Ponta Grossa - PR", region: "Campos Gerais PR", lat: -25.0994, lng: -50.1583 },

  // ── Rio Grande do Sul (Norte & Fronteira com SC) ──
  { id: "porto-alegre-rs", name: "Porto Alegre", state: "RS", label: "Porto Alegre - RS", region: "Capital RS", lat: -30.0346, lng: -51.2177 },
  { id: "erechim-rs", name: "Erechim", state: "RS", label: "Erechim - RS", region: "Norte RS", lat: -27.6342, lng: -52.2739 },
  { id: "passo-fundo-rs", name: "Passo Fundo", state: "RS", label: "Passo Fundo - RS", region: "Norte RS", lat: -28.2628, lng: -52.4067 },
  { id: "caxias-do-sul-rs", name: "Caxias do Sul", state: "RS", label: "Caxias do Sul - RS", region: "Serra Gaúcha", lat: -29.1678, lng: -51.1794 },
  { id: "nonoai-rs", name: "Nonoai", state: "RS", label: "Nonoai - RS", region: "Norte RS", lat: -27.3592, lng: -52.7744 },
  { id: "frederico-westphalen-rs", name: "Frederico Westphalen", state: "RS", label: "Frederico Westphalen - RS", region: "Norte RS", lat: -27.3589, lng: -53.3961 },

  // ── Grandes Capitais & Polos Nacionais ──
  { id: "sao-paulo-sp", name: "São Paulo", state: "SP", label: "São Paulo - SP", region: "Sudeste", lat: -23.5505, lng: -46.6333 },
  { id: "campinas-sp", name: "Campinas", state: "SP", label: "Campinas - SP", region: "Interior SP", lat: -22.9056, lng: -47.0608 },
  { id: "rio-de-janeiro-rj", name: "Rio de Janeiro", state: "RJ", label: "Rio de Janeiro - RJ", region: "Sudeste", lat: -22.9068, lng: -43.1729 },
  { id: "brasilia-df", name: "Brasília", state: "DF", label: "Brasília - DF", region: "Centro-Oeste", lat: -15.7975, lng: -47.8919 },
  { id: "belo-horizonte-mg", name: "Belo Horizonte", state: "MG", label: "Belo Horizonte - MG", region: "Sudeste", lat: -19.9167, lng: -43.9345 },
  { id: "salvador-ba", name: "Salvador", state: "BA", label: "Salvador - BA", region: "Nordeste", lat: -12.9777, lng: -38.5016 },
  { id: "goiania-go", name: "Goiânia", state: "GO", label: "Goiânia - GO", region: "Centro-Oeste", lat: -16.6869, lng: -49.2648 },
];

/**
 * Busca inteligente de cidades com normalização de acentos e ordenação por relevância.
 */
export function searchCanonicalCities(query: string, limit = 8): CityRecord[] {
  if (!query || query.trim().length === 0) {
    return CANONICAL_CITIES.slice(0, limit);
  }

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const q = normalize(query);

  return CANONICAL_CITIES.map((c) => {
    const normName = normalize(c.name);
    const normLabel = normalize(c.label);
    const normState = normalize(c.state);

    let score = 0;
    if (normName === q || normLabel === q) score = 100;
    else if (normName.startsWith(q)) score = 80;
    else if (normLabel.includes(q)) score = 60;
    else if (normState === q) score = 40;
    else if (normalize(c.region).includes(q)) score = 30;

    return { city: c, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.city);
}

export function findCityByLabel(label: string): CityRecord | undefined {
  if (!label) return undefined;
  return CANONICAL_CITIES.find(
    (c) => c.label.toLowerCase() === label.toLowerCase() || c.name.toLowerCase() === label.toLowerCase(),
  );
}
