/**
 * canonical-hiring.ts
 * Taxonomia Canônica e Mensuração Padronizada de Vagas, Carreiras e Talentos
 * Padrão InfoJobs / Gupy / LinkedIn Jobs / Catho
 */

export interface CanonicalSelectOption {
  value: string;
  label: string;
  weight?: number; // Para cálculo de compatibilidade / gráficos comparativos
}

export const CANONICAL_EDUCATION_LEVELS: CanonicalSelectOption[] = [
  { value: "fundamental_incompleto", label: "Ensino Fundamental Incompleto", weight: 1 },
  { value: "fundamental_completo", label: "Ensino Fundamental Completo", weight: 2 },
  { value: "medio_incompleto", label: "Ensino Médio Incompleto", weight: 3 },
  { value: "medio_completo", label: "Ensino Médio Completo", weight: 4 },
  { value: "tecnico_cursando", label: "Ensino Técnico Cursando", weight: 5 },
  { value: "tecnico_completo", label: "Ensino Técnico Completo", weight: 6 },
  { value: "superior_cursando", label: "Ensino Superior Cursando", weight: 7 },
  { value: "superior_completo", label: "Ensino Superior Completo", weight: 8 },
  { value: "pos_graduacao", label: "Pós-Graduação / Especialização / MBA", weight: 9 },
  { value: "mestrado", label: "Mestrado", weight: 10 },
  { value: "doutorado", label: "Doutorado / Pós-Doutorado", weight: 11 },
];

export const CANONICAL_EXPERIENCE_LEVELS: CanonicalSelectOption[] = [
  { value: "sem_experiencia", label: "Sem Experiência (Primeiro Emprego / Jovem Aprendiz)", weight: 0 },
  { value: "menos_1_ano", label: "Menos de 1 ano", weight: 1 },
  { value: "1_a_2_anos", label: "1 a 2 anos (Júnior)", weight: 2 },
  { value: "2_a_3_anos", label: "2 a 3 anos (Pleno I)", weight: 3 },
  { value: "3_a_5_anos", label: "3 a 5 anos (Pleno II)", weight: 4 },
  { value: "mais_5_anos", label: "Mais de 5 anos (Sênior / Especialista)", weight: 5 },
];

export const CANONICAL_JOB_REGIMES: CanonicalSelectOption[] = [
  { value: "CLT", label: "CLT (Carteira Assinada / Efetivo)" },
  { value: "PJ", label: "PJ (Prestador de Serviço / Contrato)" },
  { value: "Estágio", label: "Estágio Remunerado" },
  { value: "Jovem Aprendiz", label: "Jovem Aprendiz" },
  { value: "Temporário", label: "Temporário / Safra / Eventual" },
  { value: "Freelancer", label: "Freelancer / Diária / Autônomo" },
];

export const CANONICAL_WORKPLACE_MODELS: CanonicalSelectOption[] = [
  { value: "presencial", label: "100% Presencial na Empresa" },
  { value: "hibrido", label: "Híbrido (Presencial + Remoto)" },
  { value: "remoto", label: "100% Remoto (Home Office)" },
];

export const CANONICAL_WORK_SCHEDULES: CanonicalSelectOption[] = [
  { value: "integral_44h", label: "Período Integral (44h semanais)" },
  { value: "parcial_meio_periodo", label: "Meio Período (4h a 6h diárias)" },
  { value: "escala_12x36", label: "Escala 12x36" },
  { value: "escala_6x1", label: "Escala 6x1" },
  { value: "noturno", label: "Turno Noturno" },
  { value: "flexivel", label: "Horário Flexível" },
];

export const CANONICAL_SALARY_RANGES: CanonicalSelectOption[] = [
  { value: "a_combinar", label: "A Combinar" },
  { value: "ate_1500", label: "Até R$ 1.500" },
  { value: "1500_2500", label: "R$ 1.500 a R$ 2.500" },
  { value: "2500_4000", label: "R$ 2.500 a R$ 4.000" },
  { value: "4000_7000", label: "R$ 4.000 a R$ 7.000" },
  { value: "7000_12000", label: "R$ 7.000 a R$ 12.000" },
  { value: "acima_12000", label: "Acima de R$ 12.000" },
];

export const CANONICAL_JOB_BENEFITS: string[] = [
  "Vale Refeição (VR)",
  "Vale Alimentação (VA)",
  "Vale Transporte (VT)",
  "Plano de Saúde",
  "Plano Odontológico",
  "Seguro de Vida",
  "Gympass / TotalPass",
  "Auxílio Creche",
  "PLR / Bônus por Metas",
  "Day Off de Aniversário",
  "Previdência Privada",
  "Ajuda de Custo Home Office",
  "Estacionamento Gratuito",
  "Desconto em Produtos da Empresa",
];

export const SUGGESTED_JOB_SKILLS: string[] = [
  "Comunicação Assertiva",
  "Atendimento ao Cliente",
  "Trabalho em Equipe",
  "Organização e Pontualidade",
  "Proatividade",
  "Resolução de Problemas",
  "Informática Básica / Pacote Office",
  "Excel Intermediário / Avançado",
  "Vendas & Negociação",
  "Gestão de Pessoas",
  "Inglês Intermediário / Avançado",
  "Redação Comercial",
  "Gestão do Tempo",
];

export function getEducationLabel(value: string | undefined): string {
  if (!value) return "Não especificada";
  const found = CANONICAL_EDUCATION_LEVELS.find((e) => e.value === value || e.label === value);
  return found ? found.label : value;
}

export function getExperienceLabel(value: string | undefined): string {
  if (!value) return "Não especificada";
  const found = CANONICAL_EXPERIENCE_LEVELS.find((e) => e.value === value || e.label === value);
  return found ? found.label : value;
}

export function getRegimeLabel(value: string | undefined): string {
  if (!value) return "CLT";
  const found = CANONICAL_JOB_REGIMES.find((r) => r.value === value || r.label === value);
  return found ? found.label : value;
}

export function getWorkplaceModelLabel(value: string | undefined): string {
  if (!value) return "Presencial";
  const found = CANONICAL_WORKPLACE_MODELS.find((w) => w.value === value || w.label === value);
  return found ? found.label : value;
}
