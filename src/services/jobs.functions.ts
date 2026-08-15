/**
 * jobs.functions.ts — BFF para o Módulo Master de Vagas & Empregos (100% Real no Supabase)
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getCurrentIdentity } from "@/services/cart-helpers";

export interface JobItemDTO {
  id: string;
  store_id?: string | null;
  author_profile_id?: string | null;
  title: string;
  company_name: string;
  company_logo_url?: string | null;
  category: "clt" | "pj" | "estagio" | "tech" | "comercial" | "operacional" | "saude" | "outros";
  location: string;
  workplace_type: "Presencial" | "Híbrido" | "Remoto";
  contract_type: "CLT" | "PJ" | "Estágio" | "Freelancer" | "Temporário";
  salary_display: string;
  salary_min_cents?: number | null;
  salary_max_cents?: number | null;
  description: string;
  requirements: string[];
  benefits: string[];
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  is_featured: boolean;
  status: "active" | "paused" | "closed" | "draft";
  created_at: string;
  applications_count?: number;
}

export const listPublicJobs = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        category: z.string().optional(),
        search: z.string().optional(),
        contract_type: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const limit = data?.limit ?? 50;

    let query = supabase
      .from("jobs")
      .select("*")
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (data?.category && data.category !== "todos") {
      query = query.eq("category", data.category);
    }

    if (data?.contract_type && data.contract_type !== "todos") {
      query = query.eq("contract_type", data.contract_type);
    }

    if (data?.search && data.search.trim()) {
      const q = `%${data.search.trim()}%`;
      query = query.or(`title.ilike.${q},company_name.ilike.${q},location.ilike.${q},description.ilike.${q}`);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("Erro ao listar vagas no Supabase:", error);
      return [];
    }

    return (rows || []).map((row: any) => ({
      id: row.id,
      store_id: row.store_id,
      author_profile_id: row.author_profile_id,
      title: row.title,
      company_name: row.company_name,
      company_logo_url: row.company_logo_url,
      category: row.category,
      location: row.location,
      workplace_type: row.workplace_type,
      contract_type: row.contract_type,
      salary_display: row.salary_display,
      salary_min_cents: row.salary_min_cents ? Number(row.salary_min_cents) : null,
      salary_max_cents: row.salary_max_cents ? Number(row.salary_max_cents) : null,
      description: row.description,
      requirements: row.requirements || [],
      benefits: row.benefits || [],
      contact_whatsapp: row.contact_whatsapp,
      contact_email: row.contact_email,
      is_featured: row.is_featured ?? false,
      status: row.status,
      created_at: row.created_at,
    })) as JobItemDTO[];
  });

export const getPublicJobById = createServerFn({ method: "GET" })
  .validator(z.object({ jobId: z.string().uuid() }))
  .handler(async ({ data: { jobId } }) => {
    const supabase = getServerClient();

    const [jobRes, appsRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", jobId).maybeSingle(),
      supabase.from("job_applications").select("id", { count: "exact", head: true }).eq("job_id", jobId),
    ]);

    if (jobRes.error || !jobRes.data) {
      return null;
    }

    const row = jobRes.data;

    return {
      id: row.id,
      store_id: row.store_id,
      author_profile_id: row.author_profile_id,
      title: row.title,
      company_name: row.company_name,
      company_logo_url: row.company_logo_url,
      category: row.category,
      location: row.location,
      workplace_type: row.workplace_type,
      contract_type: row.contract_type,
      salary_display: row.salary_display,
      salary_min_cents: row.salary_min_cents ? Number(row.salary_min_cents) : null,
      salary_max_cents: row.salary_max_cents ? Number(row.salary_max_cents) : null,
      description: row.description,
      requirements: row.requirements || [],
      benefits: row.benefits || [],
      contact_whatsapp: row.contact_whatsapp,
      contact_email: row.contact_email,
      is_featured: row.is_featured ?? false,
      status: row.status,
      created_at: row.created_at,
      applications_count: appsRes.count ?? 0,
    } as JobItemDTO;
  });

export const applyToJob = createServerFn({ method: "POST" })
  .validator(
    z.object({
      jobId: z.string().uuid(),
      candidateName: z.string().min(2, "Informe seu nome completo"),
      candidateEmail: z.string().email("E-mail inválido"),
      candidatePhone: z.string().min(8, "Telefone inválido"),
      resumeUrl: z.string().url("URL de currículo/LinkedIn inválida").optional().or(z.literal("")),
      coverLetter: z.string().max(2000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    const { data: job } = await supabase
      .from("jobs")
      .select("id, status, title")
      .eq("id", data.jobId)
      .maybeSingle();

    if (!job || job.status !== "active") {
      throw new Error("Esta vaga não está mais recebendo candidaturas.");
    }

    const { data: created, error } = await supabase
      .from("job_applications")
      .insert({
        job_id: data.jobId,
        candidate_profile_id: identity.customer_id || null,
        candidate_name: data.candidateName.trim(),
        candidate_email: data.candidateEmail.trim().toLowerCase(),
        candidate_phone: data.candidatePhone.trim(),
        resume_url: data.resumeUrl && data.resumeUrl.trim() ? data.resumeUrl.trim() : null,
        cover_letter: data.coverLetter?.trim() || null,
        status: "pending",
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Erro ao registrar candidatura no Supabase:", error);
      throw new Error("Não foi possível enviar sua candidatura. Tente novamente.");
    }

    return {
      success: true,
      applicationId: created.id,
      message: "Candidatura enviada com sucesso!",
    };
  });
