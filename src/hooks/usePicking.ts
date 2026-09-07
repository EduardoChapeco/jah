import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PickingBatch {
  id: string;
  company_id: string;
  batch_number: string;
  mode: string;
  status: string;
  zone: string | null;
  channel: string | null;
  picker_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  photo_url: string | null;
  sealed: boolean;
  label_printed: boolean;
  notes: string | null;
  created_at: string;
}

export interface PickingItem {
  id: string;
  batch_id: string;
  order_id: string | null;
  product_id: string | null;
  product_name: string;
  quantity_requested: number;
  quantity_picked: number | null;
  location_code: string | null;
  status: string;
  substitute_product_id: string | null;
  substitute_name: string | null;
  substitute_accepted: boolean | null;
  picked_at: string | null;
  picker_notes: string | null;
  sort_order: number;
  created_at: string;
}

export function usePickingBatches(companyId: string | undefined) {
  return useQuery({
    queryKey: ["picking-batches", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("picking_batches")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as unknown as PickingBatch[];
    },
  });
}

export function usePickingItems(batchId: string | undefined) {
  return useQuery({
    queryKey: ["picking-items", batchId],
    enabled: !!batchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("picking_items")
        .select("*")
        .eq("batch_id", batchId!)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as unknown as PickingItem[];
    },
  });
}

export function useCreatePickingBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (batch: {
      company_id: string;
      mode: string;
      zone?: string;
      channel?: string;
      picker_id?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("picking_batches")
        .insert(batch as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as PickingBatch;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["picking-batches", v.company_id] });
    },
  });
}

export function useAddPickingItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Array<{
      batch_id: string;
      order_id?: string;
      product_id?: string;
      product_name: string;
      quantity_requested: number;
      location_code?: string;
      sort_order?: number;
    }>) => {
      const { data, error } = await supabase
        .from("picking_items")
        .insert(items as any)
        .select();
      if (error) throw error;
      return (data || []) as unknown as PickingItem[];
    },
    onSuccess: (data) => {
      if (data.length > 0) {
        qc.invalidateQueries({ queryKey: ["picking-items", data[0].batch_id] });
      }
    },
  });
}

export function useUpdatePickingItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      batch_id,
      ...updates
    }: {
      id: string;
      batch_id: string;
      status?: string;
      quantity_picked?: number;
      substitute_name?: string;
      substitute_accepted?: boolean;
      picked_at?: string;
      picker_notes?: string;
    }) => {
      const { error } = await supabase
        .from("picking_items")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
      return batch_id;
    },
    onSuccess: (batchId) => {
      qc.invalidateQueries({ queryKey: ["picking-items", batchId] });
    },
  });
}

export function useUpdatePickingBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      company_id,
      ...updates
    }: {
      id: string;
      company_id: string;
      status?: string;
      started_at?: string;
      completed_at?: string;
      photo_url?: string;
      sealed?: boolean;
      label_printed?: boolean;
      picker_id?: string;
    }) => {
      const { error } = await supabase
        .from("picking_batches")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
      return company_id;
    },
    onSuccess: (companyId) => {
      qc.invalidateQueries({ queryKey: ["picking-batches", companyId] });
    },
  });
}
