import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getIdentity } from "./identity.functions";

export const listUserReceivables = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getIdentity();
  if (!identity?.id) throw new Error("Não autenticado");

  const { data, error } = await supabase
    .from("receivables")
    .select(
      `
      *,
      creditor:creditor_id (id, full_name, avatar_url),
      debtor:debtor_id (id, full_name, avatar_url),
      installments:receivable_installments (*)
    `,
    )
    .or(`creditor_id.eq.${identity.id},debtor_id.eq.${identity.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[receivables] listUserReceivables error:", error);
    throw new Error("Erro ao carregar cobranças e parcelas.");
  }

  return data || [];
});

export const registerInstallmentPayment = createServerFn({ method: "POST" })
  .validator(
    z.object({
      installmentId: z.string().uuid(),
      paymentMethod: z.string().default("PIX"),
      paymentProofUrl: z.string().optional(),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data: input }) => {
    const supabase = getServerClient();
    const identity = await getIdentity();
    if (!identity?.id) throw new Error("Não autenticado");

    // Fetch installment
    const { data: inst, error: instErr } = await supabase
      .from("receivable_installments")
      .select("*, receivable:receivable_id(*)")
      .eq("id", input.installmentId)
      .single();

    if (instErr || !inst) throw new Error("Parcela não encontrada.");

    const receivable = inst.receivable as any;
    if (receivable.creditor_id !== identity.id && receivable.debtor_id !== identity.id) {
      throw new Error("Acesso negado.");
    }

    // Update installment
    const { data: updatedInst, error: upErr } = await supabase
      .from("receivable_installments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        payment_method: input.paymentMethod,
        payment_proof_url: input.paymentProofUrl,
        notes: input.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inst.id)
      .select()
      .single();

    if (upErr) throw new Error("Erro ao registrar quitação da parcela.");

    // Check if all installments are paid to settle receivable
    const { data: allInsts } = await supabase
      .from("receivable_installments")
      .select("status")
      .eq("receivable_id", receivable.id);

    const allSettled = allInsts?.every((i) => i.status === "paid" || i.status === "waived");
    if (allSettled) {
      await supabase
        .from("receivables")
        .update({ status: "settled", updated_at: new Date().toISOString() })
        .eq("id", receivable.id);
    }

    return updatedInst;
  });
