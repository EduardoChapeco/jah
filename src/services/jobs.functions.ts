/**
 * jobs.functions.ts — BFF para o Módulo Master de Vagas & Empregos
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface JobItemDTO {
  id: string;
  title: string;
  company_name: string;
  company_logo?: string;
  category: "clt" | "estagio" | "tech" | "comercial" | "operacional" | "saude";
  location: string;
  workplace_type: "Presencial" | "Híbrido" | "Remoto";
  contract_type: "CLT" | "PJ" | "Estágio" | "Freelancer";
  salary_display: string;
  description: string;
  requirements: string[];
  benefits: string[];
  contact_whatsapp: string;
  created_at: string;
  featured?: boolean;
}

export const SEED_JOBS: JobItemDTO[] = [
  {
    id: "job-001",
    title: "Desenvolvedor(a) Full Stack React & Node.js",
    company_name: "TechOeste Inovação Digital",
    category: "tech",
    location: "Centro — Chapecó / Híbrido",
    workplace_type: "Híbrido",
    contract_type: "CLT",
    salary_display: "R$ 6.500 a R$ 8.500",
    description: "Atuar no desenvolvimento de aplicações modernas em TypeScript, React, Tailwind e APIs REST/GraphQL.",
    requirements: ["Experiência com React e Node.js", "Conhecimento em PostgreSQL", "Git e CI/CD"],
    benefits: ["Vale Refeição R$ 900", "Plano de Saúde Unimed", "Auxílio Home Office"],
    contact_whatsapp: "49998811223",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    featured: true,
  },
  {
    id: "job-002",
    title: "Consultor(a) de Vendas B2B & Expansão Comercial",
    company_name: "AgroIndustrial Chapecó",
    category: "comercial",
    location: "Distrito Industrial — Chapecó",
    workplace_type: "Presencial",
    contract_type: "CLT",
    salary_display: "R$ 3.800 + Comissões agressivas",
    description: "Prospecção de novos clientes no segmento agroindustrial, elaboração de propostas e fechamento de contratos.",
    requirements: ["Experiência comprovada em vendas B2B", "CNH B ativa", "Boa comunicação"],
    benefits: ["Comissões sem teto", "Veículo da empresa", "Vale Combustível"],
    contact_whatsapp: "49991224455",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    featured: true,
  },
  {
    id: "job-003",
    title: "Estágio em Marketing Digital & Criação de Conteúdo",
    company_name: "Studio Criativo Oeste",
    category: "estagio",
    location: "Santa Maria — Chapecó",
    workplace_type: "Híbrido",
    contract_type: "Estágio",
    salary_display: "Bolsa R$ 1.500 + VT",
    description: "Criação de artes para redes sociais, apoio em campanhas de tráfego pago e edição de vídeos curtos.",
    requirements: ["Cursando Publicidade, Design ou Marketing", "Noções de Canva/Photoshop", "Criatividade"],
    benefits: ["Bolsa auxílio", "Vale Transporte", "Treinamentos práticos"],
    contact_whatsapp: "49999331122",
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: "job-004",
    title: "Enfermeiro(a) Plantonista 12x36",
    company_name: "Clínica Integrada Regional",
    category: "saude",
    location: "Jardim Itália — Chapecó",
    workplace_type: "Presencial",
    contract_type: "CLT",
    salary_display: "R$ 4.750 + Insalubridade",
    description: "Atendimento ambulatorial, triagem de pacientes, administração de medicamentos e coordenação de equipe técnica.",
    requirements: ["Graduação completa em Enfermagem", "Registro COREN ativo", "Experiência hospitalar/clínica"],
    benefits: ["Insalubridade 20%", "Alimentação no local", "Plano odontológico"],
    contact_whatsapp: "4933224400",
    created_at: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: "job-005",
    title: "Assistente de Logística & Expedição de Cargas",
    company_name: "Express Logística & Transportes",
    category: "operacional",
    location: "Efapi — Chapecó",
    workplace_type: "Presencial",
    contract_type: "CLT",
    salary_display: "R$ 2.400 + Bônus Meta",
    description: "Controle de notas fiscais, conferência de mercadorias no armazém e roteirização de entregas da frota.",
    requirements: ["Ensino médio completo", "Noções de Excel/ERP", "Organização e dinamismo"],
    benefits: ["Cesta básica", "Vale Transporte", "Seguro de vida"],
    contact_whatsapp: "49998117788",
    created_at: new Date(Date.now() - 432000000).toISOString(),
  },
  {
    id: "job-006",
    title: "Atendente de Restaurante & Caixa",
    company_name: "Bistrô & Cafeteria São Cristóvão",
    category: "clt",
    location: "São Cristóvão — Chapecó",
    workplace_type: "Presencial",
    contract_type: "CLT",
    salary_display: "R$ 1.950 + Gorjetas",
    description: "Atendimento caloroso aos clientes no balcão e salão, operação do PDV e organização do ambiente.",
    requirements: ["Boa postura e simpatia", "Disponibilidade para escala 6x1"],
    benefits: ["Alimentação no bistrô", "Vale transporte", "Bônus por assiduidade"],
    contact_whatsapp: "49991223399",
    created_at: new Date(Date.now() - 518400000).toISOString(),
  },
];

export const listPublicJobs = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        category: z.string().optional(),
        search: z.string().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    let jobs = [...SEED_JOBS];

    if (data?.category && data.category !== "todos") {
      jobs = jobs.filter((j) => j.category === data.category);
    }

    if (data?.search) {
      const q = data.search.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company_name.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q),
      );
    }

    return jobs;
  });
