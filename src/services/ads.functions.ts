import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";
import { logAuditAction } from "./audit.functions";

export const getStoreAdCampaigns = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager"]);

  const { data: campaigns, error } = await supabase
    .from("ad_campaigns")
    .select("*, products(title, cover_url)")
    .eq("store_id", identity.store_id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return campaigns;
});

export const createAdCampaign = createServerFn({ method: "POST" })
  .validator(
    z.object({
      productId: z.string().uuid(),
      budgetCents: z.number().int().min(1000), // Min R$ 10
      type: z.enum(["fixed_banner", "dynamic_boost"]),
    }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ["owner", "admin"]);

    // 1. Create the Platform Invoice for this Ad Campaign
    const { data: invoice, error: invError } = await supabase
      .from("platform_invoices")
      .insert({
        store_id: identity.store_id,
        amount_cents: data.budgetCents,
        description: `Impulsionamento de Anúncio (${data.type})`,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days to pay
        status: "pending",
      })
      .select("id")
      .single();

    if (invError || !invoice) throw new Error("Erro ao gerar fatura para o impulsionamento.");

    // 2. Fetch product details
    const { data: product } = await supabase
      .from("products")
      .select("title, description, cover_url")
      .eq("id", data.productId)
      .single();

    if (!product) throw new Error("Produto não encontrado.");

    // 3. Create the Ad Campaign (starts as paused until invoice is paid)
    // For testing/mocking in this phase without webhooks, we can set it to active immediately 
    // or simulate payment. Let's set it to 'active' for now to see it in the UI, but in production,
    // a webhook listener would update this to active upon PIX payment.
    const { data: campaign, error: campError } = await supabase
      .from("ad_campaigns")
      .insert({
        store_id: identity.store_id,
        product_id: data.productId,
        type: data.type,
        budget_cents: data.budgetCents,
        status: "active", // Fake instant-payment for UX testing
        title: product.title,
        body: product.description,
        image_url: product.cover_url,
        target_url: `/produto/${product.title.toLowerCase().replace(/ /g, '-')}-${data.productId}`, // Basic slug fallback
      })
      .select("id")
      .single();

    if (campError) {
      // Rollback invoice
      await supabase.from("platform_invoices").delete().eq("id", invoice.id);
      throw new Error("Erro ao criar campanha: " + campError.message);
    }

    await logAuditAction(identity, "CREATED_AD_CAMPAIGN", "ad_campaigns", campaign.id, {
      productId: data.productId,
      budgetCents: data.budgetCents,
    });

    return { status: "success", campaignId: campaign.id, invoiceId: invoice.id };
  });

export const trackAdEvent = createServerFn({ method: "POST" })
  .validator(
    z.object({ campaignId: z.string().uuid(), eventType: z.enum(["view", "click"]) }),
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();

    const { error } = await supabase.from("ad_events").insert({
      campaign_id: data.campaignId,
      event_type: data.eventType,
    });

    if (error) throw new Error(error.message);

    return { success: true };
  });
