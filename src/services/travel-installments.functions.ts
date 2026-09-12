import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { getServerClient } from '@/lib/supabase';
import { getServerIdentity, assertStoreAccess } from '@/lib/server-access';
import type { TravelBookingInstallment } from '@/types/travel-installments';

export function calculateInstallmentPlan(
  totalAmount: number,
  installmentsCount: number,
  firstDueDate: Date
): Array<{ installment_number: number; amount: number; due_date: string }> {
  if (installmentsCount <= 0) installmentsCount = 1;
  const baseAmount = Math.floor((totalAmount / installmentsCount) * 100) / 100;
  const remainder = Math.round((totalAmount - baseAmount * installmentsCount) * 100) / 100;

  const plan = [];
  for (let i = 1; i <= installmentsCount; i++) {
    const dueDate = new Date(firstDueDate);
    dueDate.setMonth(dueDate.getMonth() + (i - 1));

    // O primeiro boleto/parcela absorve o arredondamento
    const amount = i === 1 ? baseAmount + remainder : baseAmount;

    plan.push({
      installment_number: i,
      amount,
      due_date: dueDate.toISOString().split('T')[0],
    });
  }
  return plan;
}

export const listBookingInstallments = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      storeId: z.string().uuid().optional(),
      tripId: z.string().uuid().optional(),
    }).optional()
  )
  .handler(async ({ data }): Promise<TravelBookingInstallment[]> => {
    const identity = await getServerIdentity();
    const effectiveStoreId = data?.storeId || identity.store_id;
    if (!effectiveStoreId) {
      throw new Error("Identificador da loja não fornecido.");
    }

    const db = getServerClient();
    let query = db
      .from('travel_booking_installments')
      .select('*')
      .eq('store_id', effectiveStoreId)
      .order('due_date', { ascending: true });

    if (data?.tripId) {
      query = query.eq('trip_id', data.tripId);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(`Erro ao listar parcelas do carnê: ${error.message}`);
    return (rows as any[]) || [];
  });

export const markInstallmentPaid = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      id: z.string().uuid(),
      payment_method: z.enum(['pix', 'boleto', 'cartao', 'transferencia', 'dinheiro']),
      transaction_reference: z.string().optional().nullable(),
    })
  )
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const identity = await getServerIdentity();
    assertStoreAccess(identity, ['owner', 'admin', 'manager', 'seller']);

    const db = getServerClient();

    // 1. Busca parcela para garantir que pertence à loja sob gestão
    const { data: installment, error: fetchErr } = await db
      .from('travel_booking_installments')
      .select('id, store_id')
      .eq('id', data.id)
      .single();

    if (fetchErr || !installment) {
      throw new Error("Parcela não encontrada.");
    }

    if (installment.store_id !== identity.store_id && !(identity.role === "platform_admin")) {
      throw new Error("Acesso não autorizado para esta loja.");
    }

    const { error } = await db
      .from('travel_booking_installments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method: data.payment_method,
        transaction_reference: data.transaction_reference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id);

    if (error) throw new Error(`Erro ao baixar parcela: ${error.message}`);
    return { success: true };
  });
