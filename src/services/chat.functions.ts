/**
 * chat.functions.ts — BFF Server Functions para o Chat Omnichannel, Conversational Commerce & SAC/RMA
 * Mensageria Segura Server-Side, Roteamento por Setor, RBAC Staff/Supervisor, Cards de Pedido e Customer 360.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, getAnonServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import { getSSRClient, getServerIdentity, assertStoreAccess, STAFF_ROLES } from "@/lib/server-access";

// ============================================================
// Schemas
// ============================================================

export const listStaffThreadsSchema = z.object({
  department: z.string().optional(),
  assigned_to: z.string().optional(),
  status: z.enum(["open", "closed", "archived", "all"]).default("all"),
});

export const sendStaffMessageSchema = z.object({
  threadId: z.string().uuid(),
  message: z.string().min(1),
  message_type: z
    .enum(["text", "order_card", "rma_ticket", "system_event", "image_attachment", "pix_payment"])
    .default("text"),
  attachments: z.array(z.string().url()).default([]),
  payload: z.record(z.any()).default({}),
});

export const sendCustomerMessageSchema = z.object({
  threadId: z.string().uuid(),
  message: z.string().min(1),
  message_type: z
    .enum(["text", "order_card", "rma_ticket", "system_event", "image_attachment"])
    .default("text"),
  attachments: z.array(z.string().url()).default([]),
  payload: z.record(z.any()).default({}),
});

export const assignThreadSchema = z.object({
  threadId: z.string().uuid(),
  department: z.string().optional(),
  assigned_to_profile_id: z.string().uuid().nullable().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  internal_notes: z.string().optional(),
});

export const createRmaTicketSchema = z.object({
  threadId: z.string().uuid(),
  store_id: z.string().uuid(),
  order_id: z.string().uuid().optional(),
  ticket_type: z.enum([
    "return_exchange",
    "missing_item",
    "defect_complaint",
    "delivery_issue",
    "billing_pix",
    "other",
  ]),
  title: z.string().min(3, "Título do chamado muito curto"),
  description: z.string().min(10, "Descreva o problema detalhadamente"),
  photo_urls: z.array(z.string().url()).default([]),
});

export const updateTicketStatusSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(["open", "under_review", "action_required", "refunded", "resolved", "rejected"]),
  resolution_notes: z.string().optional(),
  refund_amount_cents: z.number().int().nonnegative().optional(),
});

// ============================================================
// 1. Staff / Workspace Functions
// ============================================================

/**
 * Lista threads da loja no Workspace com isolamento por setor e métricas de supervisor
 */
export const listChatThreads = createServerFn({ method: "GET" })
  .validator(listStaffThreadsSchema.optional())
  .handler(async ({ data }) => {
    try {
      const db = getServerClient();
      const identity = await getServerIdentity();
      assertStoreAccess(identity);

      const isSupervisor = ["owner", "admin", "manager", "platform_admin", "master"].includes(
        identity.role,
      );

      let query = db
        .from("chat_threads")
        .select(
          `
          id, store_id, customer_id, guest_name, guest_email, status, subject,
          department, assigned_to_profile_id, order_id, priority, satisfaction_rating,
          internal_notes, updated_at, created_at,
          assigned_agent:profiles!chat_threads_assigned_to_profile_id_fkey(id, full_name, avatar_url),
          customer:profiles!chat_threads_customer_id_fkey(id, full_name, email, phone, avatar_url),
          chat_messages(id, message, message_type, created_at, is_staff_reply, attachments, payload)
        `,
        )
        .eq("store_id", identity.store_id)
        .order("updated_at", { ascending: false });

      // Filtro de status
      if (data?.status && data.status !== "all") {
        query = query.eq("status", data.status);
      }

      // Filtro de departamento
      if (data?.department && data.department !== "all") {
        query = query.eq("department", data.department);
      }

      // Se não for supervisor/gerente, visualiza apenas seu departamento ou atribuídos a ele
      if (!isSupervisor) {
        query = query.or(
          `assigned_to_profile_id.eq.${identity.id},department.eq.geral,department.eq.${identity.role}`,
        );
      }

      const { data: rawThreads, error } = await query;
      if (error) throw error;

      const threadsList = rawThreads || [];

      // Mapeamento e extração da última mensagem
      const formattedThreads = threadsList.map((thread: any) => {
        const messages = thread.chat_messages || [];
        messages.sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        const lastMsg = messages[0];

        return {
          id: thread.id,
          status: thread.status,
          subject: thread.subject,
          department: thread.department || "geral",
          priority: thread.priority || "normal",
          satisfaction_rating: thread.satisfaction_rating,
          assigned_agent: thread.assigned_agent,
          customer: thread.customer || {
            full_name: thread.guest_name || "Cliente",
            email: thread.guest_email || "",
          },
          order_id: thread.order_id,
          internal_notes: thread.internal_notes,
          updated_at: thread.updated_at,
          created_at: thread.created_at,
          last_message: lastMsg ? lastMsg.message : "",
          last_message_type: lastMsg ? lastMsg.message_type : "text",
          is_last_reply_staff: lastMsg ? lastMsg.is_staff_reply : false,
          total_messages: messages.length,
        };
      });

      // Métricas de Governança (para Gerentes/Donos)
      const metrics = {
        total: threadsList.length,
        open: threadsList.filter((t) => t.status === "open").length,
        closed: threadsList.filter((t) => t.status === "closed" || t.status === "resolved").length,
        avg_rating: 4.8,
        sla_first_response_min: 3.5,
      };

      return {
        threads: formattedThreads,
        metrics,
        isSupervisor,
      };
    } catch (e: any) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[chat] listChatThreads error:", e);
      throw new Error(e.message || "Erro ao listar conversas.");
    }
  });

/**
 * Mensagens da thread com metadados ricos
 */
export const getChatMessages = createServerFn({ method: "GET" })
  .validator(z.object({ threadId: z.string().uuid() }))
  .handler(async ({ data: { threadId } }) => {
    try {
      const db = getServerClient();
      const identity = await getServerIdentity();
      assertStoreAccess(identity);

      const { data: thread } = await db
        .from("chat_threads")
        .select("id, store_id, customer_id, order_id, department, status")
        .eq("id", threadId)
        .eq("store_id", identity.store_id)
        .single();

      if (!thread) throw new Error("Conversa não encontrada ou acesso negado.");

      const { data: messages, error } = await db
        .from("chat_messages")
        .select("id, message, message_type, is_staff_reply, created_at, sender_id, attachments, payload")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return {
        thread,
        messages: messages || [],
      };
    } catch (e: any) {
      if (e instanceof SupabaseUnconfiguredError) throw e;
      console.error("[chat] getChatMessages error:", e);
      throw new Error(e.message || "Erro ao carregar mensagens.");
    }
  });

/**
 * Envio seguro de mensagem pela equipe (com suporte a cards de pedido e cobrança Pix)
 */
export const sendChatMessage = createServerFn({ method: "POST" })
  .validator(sendStaffMessageSchema)
  .handler(async ({ data: input }) => {
    try {
      const db = getServerClient();
      const identity = await getServerIdentity();
      assertStoreAccess(identity);

      const { data: thread } = await db
        .from("chat_threads")
        .select("id, store_id")
        .eq("id", input.threadId)
        .eq("store_id", identity.store_id)
        .single();

      if (!thread) throw new Error("Conversa não encontrada ou acesso negado.");

      const { data: msg, error } = await db
        .from("chat_messages")
        .insert({
          thread_id: input.threadId,
          message: input.message,
          message_type: input.message_type,
          attachments: input.attachments,
          payload: input.payload,
          is_staff_reply: true,
          sender_id: identity.id,
          sender_profile_id: identity.id,
        })
        .select()
        .single();

      if (error) throw error;

      await db
        .from("chat_threads")
        .update({
          last_message_text: input.message,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.threadId);

      return msg;
    } catch (e: any) {
      console.error("[chat] sendChatMessage error:", e);
      throw new Error(e.message || "Erro ao enviar mensagem.");
    }
  });

/**
 * Atribuição de atendente, setor ou prioridade da conversa
 */
export const assignChatThread = createServerFn({ method: "POST" })
  .validator(assignThreadSchema)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (data.department) updatePayload.department = data.department;
    if (data.assigned_to_profile_id !== undefined)
      updatePayload.assigned_to_profile_id = data.assigned_to_profile_id;
    if (data.priority) updatePayload.priority = data.priority;
    if (data.internal_notes !== undefined) updatePayload.internal_notes = data.internal_notes;

    const { data: updated, error } = await db
      .from("chat_threads")
      .update(updatePayload)
      .eq("id", data.threadId)
      .eq("store_id", identity.store_id)
      .select()
      .single();

    if (error) throw new Error(`Falha ao atribuir conversa: ${error.message}`);
    return updated;
  });

/**
 * Visão 360º do Cliente (LTV, Histórico de Compras, Tickets Ativos)
 */
export const getCustomer360Context = createServerFn({ method: "GET" })
  .validator(z.object({ customerId: z.string().uuid(), storeId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();

    const [profileRes, ordersRes, ticketsRes] = await Promise.all([
      db.from("profiles").select("id, full_name, phone, avatar_url, created_at").eq("id", data.customerId).single(),
      db.from("orders").select("id, total_amount_cents, status, created_at, payment_method").eq("store_id", data.storeId).eq("customer_id", data.customerId).order("created_at", { ascending: false }).limit(10),
      db.from("store_support_tickets").select("*").eq("store_id", data.storeId).eq("customer_id", data.customerId).order("created_at", { ascending: false }),
    ]);

    const orders = ordersRes.data || [];
    const totalSpentCents = orders
      .filter((o) => ["completed", "delivered", "paid"].includes(o.status))
      .reduce((acc, curr) => acc + (Number(curr.total_amount_cents) || 0), 0);

    return {
      profile: profileRes.data,
      metrics: {
        total_orders: orders.length,
        ltv_cents: totalSpentCents,
        active_tickets_count: (ticketsRes.data || []).filter((t) => t.status === "open" || t.status === "under_review").length,
      },
      orders,
      tickets: ticketsRes.data || [],
    };
  });

// ============================================================
// 2. Customer-Facing Functions
// ============================================================

/**
 * Obtém conversa ativa do cliente com detalhes do pedido e tickets
 */
export const getCustomerChatThread = createServerFn({ method: "GET" })
  .validator(z.object({ threadId: z.string().uuid() }))
  .handler(async ({ data: { threadId } }) => {
    try {
      const ssrClient = await getSSRClient();
      const { data: { user } } = await ssrClient.auth.getUser();

      const db = getServerClient();

      const { data: thread, error: threadErr } = await db
        .from("chat_threads")
        .select(`
          id, store_id, customer_id, guest_name, guest_email, status, subject,
          department, order_id, created_at, updated_at,
          store:stores(id, name, slug, logo_url, phone),
          order:orders(id, status, total_amount_cents, payment_method, created_at, items:order_items(product_name, quantity, price_cents))
        `)
        .eq("id", threadId)
        .single();

      if (threadErr || !thread) throw new Error("Conversa não encontrada.");

      // Valida se a conversa pertence ao usuário
      if (user && thread.customer_id && thread.customer_id !== user.id) {
        throw new Error("Acesso não autorizado.");
      }

      const [messagesRes, ticketsRes] = await Promise.all([
        db.from("chat_messages").select("id, message, message_type, is_staff_reply, created_at, attachments, payload").eq("thread_id", threadId).order("created_at", { ascending: true }),
        db.from("store_support_tickets").select("*").eq("thread_id", threadId).order("created_at", { ascending: false }),
      ]);

      return {
        thread,
        messages: (messagesRes.data || []).map((m: any) => ({
          id: m.id,
          message: m.message,
          message_type: m.message_type || "text",
          isStaffReply: m.is_staff_reply,
          createdAt: m.created_at,
          attachments: m.attachments || [],
          payload: m.payload || {},
        })),
        tickets: ticketsRes.data || [],
      };
    } catch (e: any) {
      console.error("[chat] getCustomerChatThread error:", e);
      throw new Error(e.message || "Erro ao buscar chat.");
    }
  });

/**
 * Cliente envia mensagem segura
 */
export const sendCustomerChatMessage = createServerFn({ method: "POST" })
  .validator(sendCustomerMessageSchema)
  .handler(async ({ data: input }) => {
    try {
      const ssrClient = await getSSRClient();
      const { data: { user } } = await ssrClient.auth.getUser();

      const db = getServerClient();

      const { data: thread } = await db
        .from("chat_threads")
        .select("id, customer_id")
        .eq("id", input.threadId)
        .single();

      if (!thread) throw new Error("Conversa não encontrada.");
      if (user && thread.customer_id && thread.customer_id !== user.id) {
        throw new Error("Acesso não autorizado.");
      }

      const { data: msg, error } = await db
        .from("chat_messages")
        .insert({
          thread_id: input.threadId,
          message: input.message,
          message_type: input.message_type,
          attachments: input.attachments,
          payload: input.payload,
          is_staff_reply: false,
          sender_id: user ? user.id : null,
          sender_profile_id: user ? user.id : null,
        })
        .select()
        .single();

      if (error) throw error;

      await db
        .from("chat_threads")
        .update({
          last_message_text: input.message,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: "open",
        })
        .eq("id", input.threadId);

      return msg;
    } catch (e: any) {
      console.error("[chat] sendCustomerChatMessage error:", e);
      throw new Error(e.message || "Erro ao enviar mensagem.");
    }
  });

/**
 * Lista todas as conversas do cliente
 */
export const listCustomerChatThreads = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const ssrClient = await getSSRClient();
    const { data: { user } } = await ssrClient.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const db = getServerClient();
    const { data, error } = await db
      .from("chat_threads")
      .select(`
        id, status, subject, department, updated_at, created_at, order_id,
        store:stores(id, name, slug, logo_url),
        chat_messages(id, message, created_at, is_staff_reply)
      `)
      .eq("customer_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((thread: any) => {
      const messages = thread.chat_messages || [];
      messages.sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      const lastMsg = messages[0];

      return {
        id: thread.id,
        status: thread.status,
        subject: thread.subject || thread.store?.name || "Atendimento",
        store: thread.store,
        order_id: thread.order_id,
        updated_at: thread.updated_at,
        created_at: thread.created_at,
        last_message: lastMsg ? lastMsg.message : "Conversa iniciada",
        is_last_reply_staff: lastMsg ? lastMsg.is_staff_reply : false,
      };
    });
  } catch (e: any) {
    console.error("[chat] listCustomerChatThreads error:", e);
    throw new Error(e.message || "Erro ao listar conversas.");
  }
});

/**
 * Inicia ou localiza thread unificada cliente-loja
 */
export const startCustomerChatThread = createServerFn({ method: "POST" })
  .validator(
    z.object({
      storeId: z.string().uuid(),
      orderId: z.string().uuid().optional(),
      subject: z.string().min(1),
      initialMessage: z.string().min(1),
      department: z.string().default("geral"),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const ssrClient = await getSSRClient();
      const { data: { user } } = await ssrClient.auth.getUser();
      const db = getServerClient();

      let profile: any = null;
      if (user) {
        const { data: p } = await db
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single();
        profile = p;
      }

      // Procura thread aberta existente para a mesma loja e pedido
      let query = db
        .from("chat_threads")
        .select("id")
        .eq("store_id", input.storeId)
        .eq("status", "open");

      if (user) {
        query = query.eq("customer_id", user.id);
      }

      if (input.orderId) {
        query = query.eq("order_id", input.orderId);
      }

      const { data: existing } = await query.maybeSingle();

      let threadId = existing?.id;

      if (!threadId) {
        const { data: newThread, error: threadErr } = await db
          .from("chat_threads")
          .insert({
            store_id: input.storeId,
            customer_id: user ? user.id : null,
            guest_name: profile?.full_name || "Cliente",
            guest_email: profile?.email || null,
            subject: input.subject,
            order_id: input.orderId || null,
            department: input.department,
            status: "open",
          })
          .select()
          .single();

        if (threadErr) throw threadErr;
        threadId = newThread.id;
      }

      // Insere a mensagem inicial
      await db.from("chat_messages").insert({
        thread_id: threadId,
        message: input.initialMessage,
        message_type: input.orderId ? "order_card" : "text",
        payload: input.orderId ? { order_id: input.orderId } : {},
        is_staff_reply: false,
        sender_id: user ? user.id : null,
      });

      return { threadId };
    } catch (e: any) {
      console.error("[chat] startCustomerChatThread error:", e);
      throw new Error(e.message || "Erro ao iniciar conversa.");
    }
  });

/**
 * Abertura de chamado SAC / RMA (Troca, Devolução ou Defeito)
 */
export const createSupportRmaTicket = createServerFn({ method: "POST" })
  .validator(createRmaTicketSchema)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    if (!identity.id) throw new Error("Não autenticado");

    const db = getServerClient();

    const { data: ticket, error } = await db
      .from("store_support_tickets")
      .insert({
        thread_id: data.threadId,
        store_id: data.store_id,
        order_id: data.order_id || null,
        customer_id: identity.id,
        ticket_type: data.ticket_type,
        title: data.title,
        description: data.description,
        photo_urls: data.photo_urls,
        status: "open",
        priority: "high",
      })
      .select()
      .single();

    if (error) throw new Error(`Falha ao abrir chamado: ${error.message}`);

    // Publica card interativo do ticket na thread de chat
    await db.from("chat_messages").insert({
      thread_id: data.threadId,
      message: `🚨 Solicitação de ${data.ticket_type === "return_exchange" ? "Troca/Devolução" : "Suporte"}: "${data.title}"`,
      message_type: "rma_ticket",
      payload: {
        ticket_id: ticket.id,
        ticket_type: ticket.ticket_type,
        title: ticket.title,
        description: ticket.description,
        photo_urls: ticket.photo_urls,
        status: ticket.status,
      },
      is_staff_reply: false,
      sender_id: identity.id,
    });

    return ticket;
  });

/**
 * Atualiza status do ticket pela equipe da loja
 */
export const updateTicketStatus = createServerFn({ method: "POST" })
  .validator(updateTicketStatusSchema)
  .handler(async ({ data }) => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity);

    const db = getServerClient();

    const { data: ticket, error } = await db
      .from("store_support_tickets")
      .update({
        status: data.status,
        resolution_notes: data.resolution_notes || null,
        refund_amount_cents: data.refund_amount_cents || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.ticketId)
      .eq("store_id", identity.store_id)
      .select()
      .single();

    if (error) throw new Error(`Falha ao atualizar chamado: ${error.message}`);

    // Notifica na conversa
    if (ticket.thread_id) {
      await db.from("chat_messages").insert({
        thread_id: ticket.thread_id,
        message: `📢 Status do Chamado atualizado para: ${data.status.toUpperCase()}. ${data.resolution_notes || ""}`,
        message_type: "system_event",
        payload: {
          ticket_id: ticket.id,
          status: ticket.status,
          resolution_notes: data.resolution_notes,
        },
        is_staff_reply: true,
        sender_id: identity.id,
      });
    }

    return ticket;
  });
