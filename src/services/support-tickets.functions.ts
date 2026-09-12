import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

// ---------------------------------------------------------------------------
// Types & Schemas
// ---------------------------------------------------------------------------

export type TicketCategory = "finance" | "system_bug" | "integration" | "tourism" | "account" | "other";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export interface SupportTicketItem {
 id: string;
 store_id: string;
 ticket_number: number;
 ticket_code?: string;
 subject: string;
 category: TicketCategory;
 priority: TicketPriority;
 status: TicketStatus;
 customer_id?: string | null;
 customer_name?: string | null;
 order_id?: string | null;
 booking_id?: string | null;
 tour_id?: string | null;
 attachment_urls?: string[];
 sla_due_at?: string | null;
 sla_minutes?: number;
 timer_spent_seconds?: number;
 created_at: string;
 updated_at: string;
}

export interface SupportMessageItem {
 id: string;
 ticket_id: string;
 sender_profile_id?: string | null;
 is_staff_reply: boolean;
 message: string;
 attachment_url?: string | null;
 created_at: string;
}

export const CreateSupportTicketSchema = z.object({
 store_id: z.string().uuid(),
 subject: z.string().min(4, "Assunto deve ter pelo menos 4 caracteres"),
 category: z.enum(["finance", "system_bug", "integration", "tourism", "account", "other"]),
 priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
 initial_message: z.string().min(5, "Descreva o problema em detalhes"),
 attachment_url: z.string().optional().nullable(),
 attachment_urls: z.array(z.string()).default([]),
 customer_id: z.string().uuid().optional().nullable(),
 customer_name: z.string().optional().nullable(),
 order_id: z.string().uuid().optional().nullable(),
 booking_id: z.string().uuid().optional().nullable(),
 tour_id: z.string().uuid().optional().nullable(),
 sla_minutes: z.number().int().min(15).default(1440),
});

export const AddTicketMessageSchema = z.object({
 ticket_id: z.string().uuid(),
 message: z.string().min(2, "Mensagem não pode ser vazia"),
 attachment_url: z.string().optional().nullable(),
});

// ---------------------------------------------------------------------------
// Server Functions
// ---------------------------------------------------------------------------

export const listSupportTickets = createServerFn({ method: "GET" })
 .validator(
 z.object({
 store_id: z.string().uuid(),
 status: z.string().optional(),
 })
 )
 .handler(async ({ data }): Promise<SupportTicketItem[]> => {
 const identity = await getServerIdentity();
 assertStoreAccess(identity);

 const db = getServerClient();
 let query = db
 .from("operator_support_tickets")
 .select("*")
 .eq("store_id", data.store_id)
 .order("updated_at", { ascending: false });

 if (data.status && data.status !== "all") {
 query = query.eq("status", data.status);
 }

 const { data: tickets, error } = await query;
 if (error) throw error;
 return (tickets || []) as SupportTicketItem[];
 });

export const getSupportTicketDetails = createServerFn({ method: "GET" })
 .validator(z.object({ ticket_id: z.string().uuid() }))
 .handler(async ({ data }) => {
 const identity = await getServerIdentity();
 assertStoreAccess(identity);

 const db = getServerClient();

 // 1. Ticket
 const { data: ticket, error: tErr } = await db
 .from("operator_support_tickets")
 .select("*")
 .eq("id", data.ticket_id)
 .single();

 if (tErr || !ticket) throw new Error("Chamado não encontrado.");

 // 2. Mensagens da Thread
 const { data: messages, error: mErr } = await db
 .from("operator_support_messages")
 .select("*")
 .eq("ticket_id", data.ticket_id)
 .order("created_at", { ascending: true });

 if (mErr) throw mErr;

 return {
 ticket: ticket as SupportTicketItem,
 messages: (messages || []) as SupportMessageItem[],
 };
 });

export const createSupportTicket = createServerFn({ method: "POST" })
 .validator(CreateSupportTicketSchema)
 .handler(async ({ data }) => {
 const identity = await getServerIdentity();
 assertStoreAccess(identity);
 if (data.store_id !== identity.store_id && !(identity.role === "platform_admin")) {
 throw new Error("Acesso não autorizado para esta organização.");
 }

 const db = getServerClient();

 // 1. Criar Ticket com Código Único e SLA
 const ticketCode = `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
 const slaDueAt = new Date(Date.now() + (data.sla_minutes || 1440) * 60 * 1000).toISOString();

 const { data: ticket, error: tErr } = await db
 .from("operator_support_tickets")
 .insert({
 store_id: data.store_id,
 created_by_profile_id: identity.id,
 ticket_code: ticketCode,
 subject: data.subject.trim(),
 category: data.category,
 priority: data.priority,
 status: "open",
 customer_id: data.customer_id || null,
 customer_name: data.customer_name?.trim() || null,
 order_id: data.order_id || null,
 booking_id: data.booking_id || null,
 tour_id: data.tour_id || null,
 attachment_urls: data.attachment_urls || (data.attachment_url ? [data.attachment_url] : []),
 sla_due_at: slaDueAt,
 sla_minutes: data.sla_minutes || 1440,
 })
 .select()
 .single();

 if (tErr) throw tErr;

 // 2. Criar Primeira Mensagem
 const { error: mErr } = await db
 .from("operator_support_messages")
 .insert({
 ticket_id: ticket.id,
 sender_profile_id: identity.id,
 is_staff_reply: false,
 message: data.initial_message.trim(),
 attachment_url: data.attachment_url || (data.attachment_urls?.[0] ?? null),
 });

 if (mErr) throw mErr;

 return ticket;
 });

export const addSupportTicketMessage = createServerFn({ method: "POST" })
 .validator(AddTicketMessageSchema)
 .handler(async ({ data }) => {
 const identity = await getServerIdentity();
 assertStoreAccess(identity);

 const db = getServerClient();

 const { data: ticket, error: tErr } = await db
 .from("operator_support_tickets")
 .select("store_id")
 .eq("id", data.ticket_id)
 .single();

 if (tErr || !ticket) throw new Error("Chamado não encontrado.");
 if (ticket.store_id !== identity.store_id && !(identity.role === "platform_admin")) {
 throw new Error("Acesso não autorizado a este chamado.");
 }

 const { data: msg, error: mErr } = await db
 .from("operator_support_messages")
 .insert({
 ticket_id: data.ticket_id,
 sender_profile_id: identity.id,
 is_staff_reply: false,
 message: data.message.trim(),
 attachment_url: data.attachment_url || null,
 })
 .select()
 .single();

 if (mErr) throw mErr;

 // Atualizar updated_at do ticket
 await db
 .from("operator_support_tickets")
 .update({ updated_at: new Date().toISOString() })
 .eq("id", data.ticket_id);

 return msg;
 });

export const updateSupportTicketStatus = createServerFn({ method: "POST" })
 .validator(
 z.object({
 ticket_id: z.string().uuid(),
 status: z.enum(["open", "in_progress", "resolved", "closed"]),
 })
 )
 .handler(async ({ data }) => {
 const identity = await getServerIdentity();
 assertStoreAccess(identity);

 const db = getServerClient();

 const { data: ticket, error: tErr } = await db
 .from("operator_support_tickets")
 .select("store_id")
 .eq("id", data.ticket_id)
 .single();

 if (tErr || !ticket) throw new Error("Chamado não encontrado.");
 if (ticket.store_id !== identity.store_id && !(identity.role === "platform_admin")) {
 throw new Error("Acesso não autorizado a este chamado.");
 }

 const { data: updated, error } = await db
 .from("operator_support_tickets")
 .update({
 status: data.status,
 updated_at: new Date().toISOString(),
 })
 .eq("id", data.ticket_id)
 .select()
 .single();

 if (error) throw error;
 return updated;
 });

// ---------------------------------------------------------------------------
// SUPERVISÃO, HANDOVER & GESTÃO DE SLAS DE SUPORTE
// ---------------------------------------------------------------------------

export const handoverSupportTicket = createServerFn({ method: "POST" })
 .validator(
 z.object({
 ticket_id: z.string().uuid(),
 target_operator_id: z.string().uuid(),
 reason: z.string().min(5, "Motivo da transferência é obrigatório."),
 internal_note: z.string().optional(),
 })
 )
 .handler(async ({ data }) => {
 const identity = await getServerIdentity();
 assertStoreAccess(identity, ["owner", "admin", "manager", "support"]);
 const db = getServerClient();

 const { data: ticket, error: tErr } = await db
 .from("operator_support_tickets")
 .select("store_id")
 .eq("id", data.ticket_id)
 .single();

 if (tErr || !ticket) throw new Error("Chamado não encontrado.");
 if (ticket.store_id !== identity.store_id && !(identity.role === "platform_admin")) {
 throw new Error("Acesso não autorizado a este chamado.");
 }

 // 1. Atualizar operador responsável
 const { data: updated, error } = await db
 .from("operator_support_tickets")
 .update({
 assigned_to: data.target_operator_id,
 updated_at: new Date().toISOString(),
 })
 .eq("id", data.ticket_id)
 .select()
 .single();

 if (error) throw new Error("Erro ao transferir chamado: " + error.message);

 // 2. Registrar mensagem de sistema / nota interna
 await db.from("operator_support_messages").insert({
 ticket_id: data.ticket_id,
 sender_profile_id: identity.id,
 is_staff_reply: true,
 message: `[TRANSFERÊNCIA DE ATENDIMENTO] Transferido por Supervisor. Motivo: ${data.reason}${data.internal_note ? ` | Nota: ${data.internal_note}` : ""}`,
 });

 return { status: "success", ticket: updated };
 });

export const escalateTicketSla = createServerFn({ method: "POST" })
 .validator(
 z.object({
 ticket_id: z.string().uuid(),
 escalation_reason: z.string().min(3),
 })
 )
 .handler(async ({ data }) => {
 const identity = await getServerIdentity();
 assertStoreAccess(identity, ["owner", "admin", "manager", "support"]);
 const db = getServerClient();

 const { data: ticket, error: tErr } = await db
 .from("operator_support_tickets")
 .select("store_id")
 .eq("id", data.ticket_id)
 .single();

 if (tErr || !ticket) throw new Error("Chamado não encontrado.");
 if (ticket.store_id !== identity.store_id && !(identity.role === "platform_admin")) {
 throw new Error("Acesso não autorizado a este chamado.");
 }

 const { data: updated, error } = await db
 .from("operator_support_tickets")
 .update({
 priority: "urgent",
 updated_at: new Date().toISOString(),
 })
 .eq("id", data.ticket_id)
 .select()
 .single();

 if (error) throw new Error("Erro ao escalar SLA do chamado: " + error.message);

 await db.from("operator_support_messages").insert({
 ticket_id: data.ticket_id,
 sender_profile_id: identity.id,
 is_staff_reply: true,
 message: `[ALERTA DE ESCALAÇÃO DE SLA] Prioridade elevada para URGENTE. Motivo: ${data.escalation_reason}`,
 });

 return { status: "success", ticket: updated };
 });

export const listSupervisionDashboardMetrics = createServerFn({ method: "GET" })
 .validator(z.object({ store_id: z.string().uuid() }))
 .handler(async ({ data }) => {
 const identity = await getServerIdentity();
 assertStoreAccess(identity, ["owner", "admin", "manager"]);
 if (data.store_id !== identity.store_id && !(identity.role === "platform_admin")) {
 throw new Error("Acesso não autorizado para esta organização.");
 }
 const db = getServerClient();

 const { data: tickets, error } = await db
 .from("operator_support_tickets")
 .select("id, status, priority, sla_due_at, created_at, updated_at")
 .eq("store_id", data.store_id);

 if (error) throw new Error("Erro ao calcular métricas de supervisão: " + error.message);

 const all = tickets || [];
 const openTickets = all.filter((t: any) => t.status === "open" || t.status === "in_progress");
 const now = Date.now();

 let withinSla = 0;
 let nearBreachSla = 0; // Menos de 60 min para estourar
 let breachedSla = 0;

 for (const t of openTickets as any[]) {
 if (!t.sla_due_at) {
 withinSla++;
 continue;
 }
 const due = new Date(t.sla_due_at).getTime();
 const diffMinutes = Math.floor((due - now) / 60000);

 if (diffMinutes < 0) {
 breachedSla++;
 } else if (diffMinutes <= 60) {
 nearBreachSla++;
 } else {
 withinSla++;
 }
 }

 return {
 totalTickets: all.length,
 activeTicketsCount: openTickets.length,
 resolvedTicketsCount: all.filter((t: any) => t.status === "resolved" || t.status === "closed").length,
 slaStatus: {
 withinSla,
 nearBreachSla,
 breachedSla,
 complianceRatePct: openTickets.length > 0 ? Math.round((withinSla / openTickets.length) * 100) : 100,
 },
 };
 });
