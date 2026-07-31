import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";
import { logAuditAction } from "./audit.functions";

export const listAdminTickets = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "seller", "support"]);

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("id, customer_id, subject, status, priority, created_at, updated_at, profiles!tickets_customer_id_fkey(full_name)")
    .eq("store_id", identity.store_id)
    .order("updated_at", { ascending: false });

  if (error || !tickets) return [];

  return tickets.map(t => ({
    ...t,
    customerName: (t.profiles as any)?.full_name || "Cliente",
  }));
});

export const listCustomerTickets = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  if (!identity.id) return [];

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, subject, status, updated_at")
    .eq("customer_id", identity.id)
    .eq("store_id", identity.store_id)
    .order("updated_at", { ascending: false });

  return tickets || [];
});

export const getTicketThread = createServerFn({ method: "GET" })
  .validator(z.object({ ticketId: z.string().uuid() }))
  .handler(async ({ data: { ticketId } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    
    // We must ensure the user has access. If it's a customer, they must own the ticket.
    // If it's a store employee, they must belong to the store of the ticket.
    const { data: ticket, error: tErr } = await supabase
      .from("tickets")
      .select("store_id, customer_id, status")
      .eq("id", ticketId)
      .single();

    if (tErr || !ticket) throw new Error("Ticket não encontrado");

    if (ticket.store_id === identity.store_id) {
      // Employee logic
      assertStoreAccess(identity, ["owner", "admin", "manager", "seller", "support"]);
    } else {
      // Customer logic
      if (ticket.customer_id !== identity.id) {
        throw new Error("Acesso negado ao ticket");
      }
    }

    const { data: messages, error: mErr } = await supabase
      .from("ticket_messages")
      .select("id, sender_id, content, is_internal_note, created_at, profiles(full_name)")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (mErr) throw new Error("Erro ao carregar mensagens");

    return {
       ticketStatus: ticket.status,
       messages: messages.map(m => ({
         id: m.id,
         content: m.content,
         isInternal: m.is_internal_note,
         createdAt: m.created_at,
         isMe: m.sender_id === identity.id,
         senderName: (m.profiles as any)?.full_name || "Desconhecido"
       }))
    };
  });

export const sendTicketMessage = createServerFn({ method: "POST" })
  .validator(z.object({
    ticketId: z.string().uuid(),
    content: z.string().min(1),
    isInternal: z.boolean().optional().default(false)
  }))
  .handler(async ({ data: { ticketId, content, isInternal } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    
    if (!identity.id) throw new Error("Usuário não autenticado");

    // Fetch ticket context to update status correctly
    const { data: ticket } = await supabase
      .from("tickets")
      .select("store_id, customer_id")
      .eq("id", ticketId)
      .single();

    if (!ticket) throw new Error("Ticket não encontrado");

    const isCustomer = identity.id === ticket.customer_id;
    
    // Store employees only can send internal notes
    if (isInternal && isCustomer) {
      throw new Error("Clientes não podem enviar notas internas.");
    }

    const { error: insertErr } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticketId,
        sender_id: identity.id,
        content,
        is_internal_note: isInternal
      });

    if (insertErr) throw new Error("Erro ao enviar mensagem");

    // Update ticket status automatically based on who replied
    if (!isInternal) {
      const newStatus = isCustomer ? "open" : "waiting_customer";
      await supabase
        .from("tickets")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", ticketId);
    }

    return { status: "success" };
  });
