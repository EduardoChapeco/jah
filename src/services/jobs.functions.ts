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

export const listStoreJobApplications = createServerFn({ method: "GET" })
  .validator(z.object({ jobId: z.string().uuid().optional() }).optional())
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    if (!identity.customer_id) {
      return [];
    }

    let query = supabase
      .from("job_applications")
      .select("*, jobs!inner(id, title, company_name, author_profile_id, store_id)")
      .order("created_at", { ascending: false });

    if (data?.jobId) {
      query = query.eq("job_id", data.jobId);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("Erro ao buscar candidaturas do lojista:", error);
      return [];
    }

    return (rows || []).map((row: any) => ({
      id: row.id,
      job_id: row.job_id,
      job_title: row.jobs?.title || "Vaga",
      candidate_profile_id: row.candidate_profile_id,
      candidate_name: row.candidate_name,
      candidate_email: row.candidate_email,
      candidate_phone: row.candidate_phone,
      resume_url: row.resume_url,
      cover_letter: row.cover_letter,
      status: row.status,
      rating: row.rating || null,
      internal_notes: row.internal_notes || "",
      interview_at: row.interview_at || null,
      interview_meeting_url: row.interview_meeting_url || "",
      hired_role: row.hired_role || null,
      hired_salary_cents: row.hired_salary_cents ? Number(row.hired_salary_cents) : null,
      created_at: row.created_at,
    }));
  });

export const updateJobApplication = createServerFn({ method: "POST" })
  .validator(
    z.object({
      applicationId: z.string().uuid(),
      status: z.enum([
        "pending",
        "reviewed",
        "shortlisted",
        "interview_scheduled",
        "approved",
        "rejected",
        "hired",
      ]),
      rating: z.number().int().min(1).max(5).optional().nullable(),
      internalNotes: z.string().optional().nullable(),
      interviewAt: z.string().optional().nullable(),
      interviewMeetingUrl: z.string().url().optional().or(z.literal("")).nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    if (!identity.customer_id) {
      throw new Error("Não autorizado.");
    }

    const { data: updated, error } = await supabase
      .from("job_applications")
      .update({
        status: data.status,
        rating: data.rating !== undefined ? data.rating : undefined,
        internal_notes: data.internalNotes !== undefined ? data.internalNotes : undefined,
        interview_at: data.interviewAt !== undefined ? data.interviewAt : undefined,
        interview_meeting_url:
          data.interviewMeetingUrl !== undefined ? data.interviewMeetingUrl : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.applicationId)
      .select("id, status")
      .single();

    if (error) {
      console.error("Erro ao atualizar candidatura:", error);
      throw new Error("Erro ao atualizar candidatura do candidato.");
    }

    return { success: true, application: updated };
  });

export const hireJobCandidate = createServerFn({ method: "POST" })
  .validator(
    z.object({
      applicationId: z.string().uuid(),
      role: z.string().min(2, "Cargo é obrigatório"),
      salaryCents: z.number().int().min(0, "Salário inválido"),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    if (!identity.customer_id) {
      throw new Error("Não autorizado.");
    }

    const { data: app, error } = await supabase
      .from("job_applications")
      .update({
        status: "hired",
        hired_role: data.role,
        hired_salary_cents: data.salaryCents,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.applicationId)
      .select("id, candidate_name, candidate_email")
      .single();

    if (error) {
      console.error("Erro ao contratar candidato:", error);
      throw new Error("Não foi possível concluir a contratação.");
    }

    return {
      success: true,
      message: `Candidato ${app.candidate_name} contratado com sucesso como ${data.role}!`,
    };
  });

export const listMyJobApplications = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getCurrentIdentity();

  if (!identity.customer_id) {
    return [];
  }

  const { data: rows, error } = await supabase
    .from("job_applications")
    .select("*, jobs(id, title, company_name, company_logo_url, location, workplace_type, contract_type, salary_display)")
    .eq("candidate_profile_id", identity.customer_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar candidaturas do usuário:", error);
    return [];
  }

  return (rows || []).map((row: any) => ({
    id: row.id,
    job_id: row.job_id,
    job_title: row.jobs?.title || "Vaga",
    company_name: row.jobs?.company_name || "Empresa",
    company_logo_url: row.jobs?.company_logo_url || null,
    location: row.jobs?.location || "Local",
    workplace_type: row.jobs?.workplace_type || "Presencial",
    contract_type: row.jobs?.contract_type || "CLT",
    salary_display: row.jobs?.salary_display || "A combinar",
    status: row.status,
    interview_at: row.interview_at,
    interview_meeting_url: row.interview_meeting_url,
    created_at: row.created_at,
  }));
});

export const withdrawJobApplication = createServerFn({ method: "POST" })
  .validator(z.object({ applicationId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getCurrentIdentity();

    if (!identity.customer_id) {
      throw new Error("Não autorizado.");
    }

    const { error } = await supabase
      .from("job_applications")
      .delete()
      .eq("id", data.applicationId)
      .eq("candidate_profile_id", identity.customer_id);

    if (error) {
      throw new Error("Erro ao cancelar candidatura.");
    }

    return { success: true, message: "Candidatura cancelada com sucesso." };
  });

export const createStoreJob = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string().min(3, "Título muito curto"),
      company_name: z.string().min(2, "Nome da empresa obrigatório"),
      company_logo_url: z.string().optional().nullable(),
      category: z.enum(["clt", "pj", "estagio", "tech", "comercial", "operacional", "saude", "outros"]).default("comercial"),
      location: z.string().min(2, "Localização é obrigatória"),
      workplace_type: z.enum(["Presencial", "Híbrido", "Remoto"]).default("Presencial"),
      contract_type: z.enum(["CLT", "PJ", "Estágio", "Freelancer", "Temporário"]).default("CLT"),
      salary_display: z.string().default("A combinar"),
      description: z.string().min(10, "Descrição detalhada obrigatória"),
      requirements: z.array(z.string()).default([]),
      benefits: z.array(z.string()).default([]),
      contact_whatsapp: z.string().optional().nullable(),
      contact_email: z.string().email().optional().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const { getServerIdentity } = await import("@/lib/server-access");
    const identity = await getServerIdentity();

    const { data: created, error } = await supabase
      .from("jobs")
      .insert({
        store_id: identity.store_id || null,
        author_profile_id: identity.id || null,
        title: data.title.trim(),
        company_name: data.company_name.trim(),
        company_logo_url: data.company_logo_url || null,
        category: data.category,
        location: data.location.trim(),
        workplace_type: data.workplace_type,
        contract_type: data.contract_type,
        salary_display: data.salary_display.trim(),
        description: data.description.trim(),
        requirements: data.requirements,
        benefits: data.benefits,
        contact_whatsapp: data.contact_whatsapp || null,
        contact_email: data.contact_email || null,
        status: "active",
        is_featured: false,
      })
      .select("id, title")
      .single();

    if (error) {
      console.error("Erro ao publicar vaga:", error);
      throw new Error("Não foi possível publicar a vaga de emprego.");
    }

    return {
      success: true,
      job: created,
      message: "Vaga de emprego publicada com sucesso no ecossistema!",
    };
  });

export const listMyStoreJobs = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const { getServerIdentity } = await import("@/lib/server-access");
  const { store_id } = await getServerIdentity();

  if (!store_id) return [];

  const { data: rows, error } = await supabase
    .from("jobs")
    .select("*, job_applications(id)")
    .eq("store_id", store_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar vagas da loja:", error);
    return [];
  }

  return (rows || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    company_name: row.company_name,
    category: row.category,
    location: row.location,
    workplace_type: row.workplace_type,
    contract_type: row.contract_type,
    salary_display: row.salary_display,
    status: row.status,
    created_at: row.created_at,
    applications_count: row.job_applications?.length || 0,
  }));
});


