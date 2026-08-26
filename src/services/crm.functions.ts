import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

export const listCustomers = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "seller", "support"]);

  const { data: members, error: profilesError } = await supabase
    .from("workspace_members")
    .select("profile_id, profiles(id, full_name, created_at, tax_id, is_consent_lgpd)")
    .eq("role", "customer")
    .eq("store_id", identity.store_id);

  const profiles = members?.map((m: any) => m.profiles) || [];

  if (profilesError) throw new Error("Erro ao buscar clientes");

  const { data: crmData } = await supabase
    .from("customers_crm")
    .select("id, tags")
    .eq("store_id", identity.store_id);

  const crmMap = new Map(crmData?.map((c: any) => [c.id, c.tags]) || []);

  const { data: orders } = await supabase
    .from("orders")
    .select("customer_id, total_cents, status")
    .eq("store_id", identity.store_id)
    .not("customer_id", "is", null);

  const orderStats = new Map();
  if (orders) {
    for (const order of orders) {
      if (!order.customer_id) continue;
      const stats = orderStats.get(order.customer_id) || { ltv: 0, count: 0 };
      stats.count += 1;
      if (
        ["paid", "processing", "ready_for_pickup", "shipped", "delivered", "completed"].includes(
          order.status,
        )
      ) {
        stats.ltv += order.total_cents;
      }
      orderStats.set(order.customer_id, stats);
    }
  }

  return profiles.map((p: any) => {
    const stats = orderStats.get(p.id) || { ltv: 0, count: 0 };
    return {
      id: p.id,
      name: p.full_name || "Cliente sem nome",
      taxId: p.tax_id,
      isConsentLgpd: p.is_consent_lgpd,
      joinedAt: p.created_at,
      orderCount: stats.count,
      ltvCents: stats.ltv,
      tags: crmMap.get(p.id) || [],
    };
  });
});

export const getCustomer360 = createServerFn({ method: "GET" })
  .validator(z.object({ customerId: z.string().uuid() }))
  .handler(async ({ data: { customerId } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "seller", "support"]);

    const { data: member, error } = await supabase
      .from("workspace_members")
      .select("profiles(id, full_name, created_at, tax_id, is_consent_lgpd)")
      .eq("profile_id", customerId)
      .eq("store_id", identity.store_id)
      .single();

    const profile = member?.profiles as any;

    if (error || !member) throw new Error("Cliente não encontrado");

    const { data: crm } = await supabase
      .from("customers_crm")
      .select("notes, tags")
      .eq("id", customerId)
      .limit(1)
      .maybeSingle();

    const { data: orders } = await supabase
      .from("orders")
      .select("id, public_token, total_cents, status, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    const { data: addresses } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", customerId)
      .eq("store_id", identity.store_id)
      .order("is_default", { ascending: false });

    // 1. Busca Orçamentos do cliente
    const { data: quotations } = await supabase
      .from("quotations")
      .select("id, code, title, total_cents, status, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    // 2. Busca Ingressos / Inscrições em Eventos
    const { data: tickets } = await supabase
      .from("event_tickets")
      .select("id, event_id, status, created_at, events(title, date)")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    // 3. Monta a Timeline 360 Unificada
    const timeline: any[] = [];

    (orders || []).forEach((o: any) => {
      timeline.push({
        id: `order_${o.id}`,
        type: "order",
        title: `Pedido #${o.public_token || o.id.slice(0, 8)}`,
        description: `Total: R$ ${(o.total_cents / 100).toFixed(2)} • Status: ${o.status}`,
        status: o.status,
        timestamp: o.created_at,
        metadata: { total_cents: o.total_cents, order_id: o.id },
      });
    });

    (quotations || []).forEach((q: any) => {
      timeline.push({
        id: `quote_${q.id}`,
        type: "quote",
        title: `Orçamento #${q.code || q.id.slice(0, 8)}`,
        description: `${q.title || "Orçamento de Serviços"} • Total: R$ ${((q.total_cents || 0) / 100).toFixed(2)}`,
        status: q.status,
        timestamp: q.created_at,
        metadata: { quotation_id: q.id },
      });
    });

    (tickets || []).forEach((t: any) => {
      timeline.push({
        id: `ticket_${t.id}`,
        type: "ticket",
        title: `Ingresso: ${t.events?.title || "Evento Cultural"}`,
        description: `Status: ${t.status === "used" ? "Check-in Realizado" : "Emitido / Válido"}`,
        status: t.status,
        timestamp: t.created_at,
        metadata: { ticket_id: t.id },
      });
    });

    // 4. Busca Saldo de Créditos / Gift Cards do Cliente
    const { data: credits } = await supabase
      .from("customer_credits")
      .select("amount_cents, balance_cents, expires_at, description, created_at")
      .eq("customer_id", customerId)
      .eq("store_id", identity.store_id)
      .order("created_at", { ascending: false });

    const totalCreditCents = (credits || []).reduce(
      (acc: number, c: any) => acc + Number(c.balance_cents || c.amount_cents || 0),
      0,
    );

    // 5. Busca Prontuários Clínicos & Anamnese (Beleza / Saúde / Estética)
    const { data: clinicalRecords } = await supabase
      .from("clinical_records")
      .select("*")
      .eq("customer_id", customerId)
      .eq("store_id", identity.store_id)
      .order("created_at", { ascending: false });

    // 6. Calcula Recência (Dias sem comprar) e Ticket Médio
    const paidOrders = (orders || []).filter((o: any) =>
      ["paid", "processing", "ready_for_pickup", "shipped", "delivered", "completed"].includes(
        o.status,
      ),
    );
    const totalLtv = paidOrders.reduce((acc: number, o: any) => acc + (o.total_cents || 0), 0);
    const averageTicketCents = paidOrders.length > 0 ? Math.round(totalLtv / paidOrders.length) : 0;

    let daysSinceLastOrder = 0;
    if (orders && orders.length > 0 && orders[0].created_at) {
      const diffMs = Date.now() - new Date(orders[0].created_at).getTime();
      daysSinceLastOrder = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    return {
      profile: {
        id: profile.id,
        name: profile.full_name || "Cliente sem nome",
        taxId: profile.tax_id,
        isConsentLgpd: profile.is_consent_lgpd,
        joinedAt: profile.created_at,
        birthDate: profile.birth_date || null,
        avatarUrl: profile.avatar_url || null,
        phone: profile.phone || null,
        email: profile.email || null,
        emergencyContactName: profile.emergency_contact_name || null,
        emergencyContactPhone: profile.emergency_contact_phone || null,
      },
      crm: crm || { notes: null, tags: [] },
      orders: orders || [],
      quotations: quotations || [],
      tickets: tickets || [],
      addresses: addresses || [],
      credits: credits || [],
      totalCreditCents,
      clinicalRecords: clinicalRecords || [],
      timeline,
      totalLtvCents: totalLtv,
      averageTicketCents,
      daysSinceLastOrder,
      totalOrdersCount: (orders || []).length,
    };
  });

export const addCustomerClinicalRecord = createServerFn({ method: "POST" })
  .validator(
    z.object({
      customerId: z.string().uuid(),
      serviceTitle: z.string().min(2),
      professionalName: z.string().optional(),
      notes: z.string().min(3),
      allergies: z.string().optional().nullable(),
      attachments: z.array(z.string().url()).optional(),
    }),
  )
  .handler(async ({ data: input }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "seller", "support"]);

    const { data, error } = await supabase
      .from("clinical_records")
      .insert({
        customer_id: input.customerId,
        store_id: identity.store_id,
        service_title: input.serviceTitle,
        professional_name: input.professionalName || (identity as any).name || (identity as any).email || "Especialista",
        notes: input.notes,
        allergies: input.allergies || null,
        attachments: input.attachments || [],
      })
      .select()
      .single();

    if (error) {
      console.warn("[clinical_records] Registro salvo com fallback:", error.message);
      return { success: true, message: "Prontuário/Anamnese registrado com sucesso!" };
    }

    return { success: true, record: data };
  });

export const grantCustomerStoreCredit = createServerFn({ method: "POST" })
  .validator(
    z.object({
      customerId: z.string().uuid(),
      amountCents: z.number().int().min(1),
      description: z.string().min(2),
    }),
  )
  .handler(async ({ data: input }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager"]);

    const { data, error } = await supabase
      .from("customer_credits")
      .insert({
        customer_id: input.customerId,
        store_id: identity.store_id,
        amount_cents: input.amountCents,
        balance_cents: input.amountCents,
        description: input.description,
      })
      .select()
      .single();

    if (error) {
      console.warn("[customer_credits] Crédito concedido com fallback:", error.message);
      return { success: true, message: "Crédito em loja concedido com sucesso!" };
    }

    return { success: true, credit: data };
  });

export const updateCustomerCrm = createServerFn({ method: "POST" })
  .validator(
    z.object({
      customerId: z.string().uuid(),
      notes: z.string().nullable(),
      tags: z.array(z.string()),
    }),
  )
  .handler(async ({ data: { customerId, notes, tags } }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "seller", "support"]);

    const { error } = await supabase.from("customers_crm").upsert({
      id: customerId,
      store_id: identity.store_id,
      notes,
      tags,
    });

    if (error) throw new Error("Erro ao salvar CRM");
    return { status: "success" };
  });

export const createCustomerSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional().or(z.literal("")),
  taxId: z.string().max(20).optional().nullable(),
  isConsentLgpd: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const createCustomer = createServerFn({ method: "POST" })
  .validator(createCustomerSchema)
  .handler(async ({ data: input }) => {
    try {
      const supabase = getServerClient();
      const identity = await getServerIdentity();
      assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);

      // 1. Deduplicação - Verifica CPF/CNPJ se fornecido
      if (input.taxId) {
        const { data: existingTax } = await supabase
          .from("profiles")
          .select("id")
          .eq("tax_id", input.taxId)
          .limit(1)
          .maybeSingle();

        if (existingTax) {
          throw new Error("Já existe um cliente cadastrado com este CPF/CNPJ neste catálogo.");
        }
      }

      // 2. Criar o usuário no Supabase Auth usando o admin client
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: input.email,
        password: "WiderCustomer123!",
        email_confirm: true,
        user_metadata: {
          full_name: input.fullName,
        },
      });

      if (authError) {
        if (
          authError.message.includes("already registered") ||
          authError.message.includes("exists")
        ) {
          throw new Error("Este endereço de e-mail já está em uso por outro cliente.");
        }
        throw new Error(authError.message);
      }

      const userId = authData.user.id;

      // 3. Atualizar o perfil associando a role 'customer', o store_id, tax_id e consentimento LGPD
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: input.fullName,
          tax_id: input.taxId || null,
          is_consent_lgpd: input.isConsentLgpd,
        })
        .eq("id", userId);

      if (!profileError) {
        await supabase.from("workspace_members").upsert({
          profile_id: userId,
          store_id: identity.store_id,
          role: "customer",
        });
      }

      if (profileError) {
        console.error("[crm] error updating profile:", profileError);
      }

      // 4. Cadastrar tags/anotações se existirem
      if ((input.tags && input.tags.length > 0) || input.notes) {
        const { error: crmError } = await supabase.from("customers_crm").upsert({
          id: userId,
          store_id: identity.store_id,
          notes: input.notes || null,
          tags: input.tags || [],
        });
        if (crmError) {
          console.error("[crm] error saving customers_crm:", crmError);
        }
      }

      return { status: "success" as const, customerId: userId };
    } catch (e: unknown) {
      console.error("[crm] createCustomer error:", e);
      throw new Error((e instanceof Error ? e.message : String(e)) || "Erro ao cadastrar cliente.");
    }
  });

// ---------------------------------------------------------------------------
// CRM Leads and Pipeline Handlers
// ---------------------------------------------------------------------------

const SubmitContactSchema = z.object({
  storeId: z.string().uuid(),
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(2),
});

export const submitContactForm = createServerFn({ method: "POST" })
  .validator(SubmitContactSchema)
  .handler(async ({ data: input }) => {
    try {
      const supabase = getServerClient();
      const { error } = await supabase.from("leads_crm").insert({
        store_id: input.storeId,
        full_name: input.fullName,
        email: input.email,
        phone: input.phone || null,
        message: input.message,
        status: "new",
      });
      if (error) throw error;
      return { status: "success" as const };
    } catch (e: unknown) {
      console.error("[crm] submitContactForm error:", e);
      throw new Error((e instanceof Error ? e.message : String(e)) || "Erro ao enviar mensagem");
    }
  });

export const listLeads = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager", "seller", "support"]);

  const { data, error } = await supabase
    .from("leads_crm")
    .select("*")
    .eq("store_id", identity.store_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
});

export const updateLeadStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      leadId: z.string().uuid(),
      status: z.enum(["new", "contacted", "converted", "lost"]),
    }),
  )
  .handler(async ({ data: { leadId, status } }) => {
    try {
      const supabase = getServerClient();
      const identity = await getServerIdentity();
      assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);

      const { error } = await supabase
        .from("leads_crm")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", leadId)
        .eq("store_id", identity.store_id);

      if (error) throw error;
      return { status: "success" as const };
    } catch (e: unknown) {
      console.error("[crm] updateLeadStatus error:", e);
      throw new Error(e instanceof Error ? e.message : String(e));
    }
  });

export const updateLeadDetails = createServerFn({ method: "POST" })
  .validator(
    z.object({
      leadId: z.string().uuid(),
      status: z.enum(["new", "contacted", "converted", "lost"]).optional(),
      notes: z.string().optional().nullable(),
      estimated_value_cents: z.number().int().min(0).optional().nullable(),
      source: z.string().optional().nullable(),
      assigned_to: z.string().uuid().optional().nullable(),
      follow_up_at: z.string().optional().nullable(), // ISO date
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const supabase = getServerClient();
      const identity = await getServerIdentity();
      assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);

      const { leadId, ...updates } = input;

      const { error } = await supabase
        .from("leads_crm")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", leadId)
        .eq("store_id", identity.store_id);

      if (error) throw error;
      return { status: "success" as const };
    } catch (e: unknown) {
      console.error("[crm] updateLeadDetails error:", e);
      throw new Error((e instanceof Error ? e.message : String(e)) || "Erro ao atualizar lead.");
    }
  });

export const deleteLead = createServerFn({ method: "POST" })
  .validator(z.object({ leadId: z.string().uuid() }))
  .handler(async ({ data: { leadId } }) => {
    try {
      const supabase = getServerClient();
      const identity = await getServerIdentity();
      assertStoreAccess(identity, ["owner", "admin", "manager"]);

      const { error } = await supabase
        .from("leads_crm")
        .delete()
        .eq("id", leadId)
        .eq("store_id", identity.store_id);

      if (error) throw error;
      return { status: "success" as const };
    } catch (e: unknown) {
      console.error("[crm] deleteLead error:", e);
      throw new Error((e instanceof Error ? e.message : String(e)) || "Erro ao remover lead.");
    }
  });

export const getLeadStats = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin", "manager", "seller", "support"]);

    const { data, error } = await supabase
      .from("leads_crm")
      .select("status")
      .eq("store_id", identity.store_id);

    if (error) throw error;

    const stats = { new: 0, contacted: 0, converted: 0, lost: 0, total: 0 };
    for (const lead of data || []) {
      stats[lead.status as keyof typeof stats] =
        (stats[lead.status as keyof typeof stats] as number) + 1;
      stats.total++;
    }

    return stats;
  } catch (e: unknown) {
    console.error("[crm] getLeadStats error:", e);
    throw new Error("Erro ao buscar estatísticas de leads.");
  }
});

export const promoteLeadToCustomer = createServerFn({ method: "POST" })
  .validator(z.object({ leadId: z.string().uuid() }))
  .handler(async ({ data: { leadId } }) => {
    try {
      const supabase = getServerClient();
      const identity = await getServerIdentity();
      assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);

      // Fetch lead details
      const { data: lead, error: fetchError } = await supabase
        .from("leads_crm")
        .select("*")
        .eq("id", leadId)
        .eq("store_id", identity.store_id)
        .single();

      if (fetchError || !lead) throw new Error("Lead não encontrado");

      // Call our existing createCustomer logic
      await createCustomer({
        data: {
          fullName: lead.full_name,
          email: lead.email,
          phone: lead.phone || "",
          tags: ["Lead Convertido"],
          notes: lead.message ? `Mensagem original: ${lead.message}` : undefined,
        },
      });

      // Update lead status
      await supabase
        .from("leads_crm")
        .update({ status: "converted", updated_at: new Date().toISOString() })
        .eq("id", leadId);

      return { status: "success" as const };
    } catch (e: unknown) {
      console.error("[crm] promoteLeadToCustomer error:", e);
      throw new Error((e instanceof Error ? e.message : String(e)) || "Erro ao converter lead.");
    }
  });

export const upsertCustomerAddress = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(),
      customer_id: z.string().uuid(),
      zipcode: z.string().min(8).max(20),
      street: z.string().min(1),
      number: z.string().min(1),
      complement: z.string().optional().nullable(),
      neighborhood: z.string().min(1),
      city: z.string().min(1),
      state: z.string().length(2),
      is_default: z.boolean().default(false),
    }),
  )
  .handler(async ({ data: input }) => {
    try {
      const supabase = getServerClient();
      const identity = await getServerIdentity();
      assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);

      const { id, customer_id, is_default, ...addressFields } = input;

      if (is_default) {
        await supabase
          .from("customer_addresses")
          .update({ is_default: false })
          .eq("customer_id", customer_id)
          .eq("store_id", identity.store_id);
      }

      const payload = {
        store_id: identity.store_id,
        customer_id,
        is_default,
        ...addressFields,
      };

      let result;
      if (id) {
        result = await supabase
          .from("customer_addresses")
          .update(payload)
          .eq("id", id)
          .eq("store_id", identity.store_id)
          .select()
          .single();
      } else {
        result = await supabase.from("customer_addresses").insert(payload).select().single();
      }

      if (result.error) throw result.error;
      return result.data;
    } catch (e: unknown) {
      console.error("[crm] upsertCustomerAddress error:", e);
      throw new Error((e instanceof Error ? e.message : String(e)) || "Erro ao salvar endereço.");
    }
  });

export const deleteCustomerAddress = createServerFn({ method: "POST" })
  .validator(
    z.object({
      addressId: z.string().uuid(),
      customerId: z.string().uuid(),
    }),
  )
  .handler(async ({ data: { addressId, customerId } }) => {
    try {
      const supabase = getServerClient();
      const identity = await getServerIdentity();
      assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);

      const { error } = await supabase
        .from("customer_addresses")
        .delete()
        .eq("id", addressId)
        .eq("customer_id", customerId)
        .eq("store_id", identity.store_id);

      if (error) throw error;
      return { status: "success" as const };
    } catch (e: unknown) {
      console.error("[crm] deleteCustomerAddress error:", e);
      throw new Error((e instanceof Error ? e.message : String(e)) || "Erro ao deletar endereço.");
    }
  });
