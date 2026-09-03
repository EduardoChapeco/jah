import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, getAnonServerClient } from "@/lib/supabase";
import { getServerIdentity } from "@/lib/server-access";

const AddressSchema = z.object({
  id: z.string().optional(),
  zipcode: z.string().min(8),
  street: z.string().min(2),
  number: z.string().min(1),
  complement: z.string().optional(),
  neighborhood: z.string().min(2),
  city: z.string().min(2),
  state: z.string().length(2),
  is_default: z.boolean().default(false),
});

export const getCustomerAddresses = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const identity = await getServerIdentity();
    if (!identity.id) return [];

    const supabase = getServerClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("city, state, resume_data")
      .eq("id", identity.id)
      .maybeSingle();

    const storedAddresses: any[] = (profile?.resume_data as any)?.addresses || [];
    if (storedAddresses.length > 0) {
      return storedAddresses;
    }

    if (profile?.city) {
      return [
        {
          id: "default-profile-addr",
          zipcode: "89800-000",
          street: "Endereço Principal",
          number: "S/N",
          neighborhood: "Centro",
          city: profile.city,
          state: profile.state || "SC",
          is_default: true,
          created_at: new Date().toISOString(),
        },
      ];
    }

    return [];
  } catch (err) {
    console.warn("[customer.functions] getCustomerAddresses error:", err);
    return [];
  }
});

export const addCustomerAddress = createServerFn({ method: "POST" })
  .validator(AddressSchema)
  .handler(async ({ data: params }) => {
    const identity = await getServerIdentity();
    if (!identity.id) throw new Error("Não autorizado");

    const supabase = getServerClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("resume_data")
      .eq("id", identity.id)
      .maybeSingle();

    const existingResume = (profile?.resume_data as any) || {};
    const existingAddresses: any[] = existingResume.addresses || [];

    const newAddress = {
      id: params.id || crypto.randomUUID(),
      ...params,
      is_default: existingAddresses.length === 0 ? true : Boolean(params.is_default),
      created_at: new Date().toISOString(),
    };

    let updatedAddresses = [...existingAddresses];
    if (newAddress.is_default) {
      updatedAddresses = updatedAddresses.map((a) => ({ ...a, is_default: false }));
    }
    updatedAddresses.push(newAddress);

    const { error } = await supabase
      .from("profiles")
      .update({
        resume_data: {
          ...existingResume,
          addresses: updatedAddresses,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", identity.id);

    if (error) throw new Error(error.message);
    return { status: "success" };
  });

export const deleteCustomerAddress = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data: { id } }) => {
    const identity = await getServerIdentity();
    if (!identity.id) throw new Error("Não autorizado");

    const supabase = getServerClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("resume_data")
      .eq("id", identity.id)
      .maybeSingle();

    const existingResume = (profile?.resume_data as any) || {};
    const existingAddresses: any[] = existingResume.addresses || [];

    const filtered = existingAddresses.filter((a) => a.id !== id);

    const { error } = await supabase
      .from("profiles")
      .update({
        resume_data: {
          ...existingResume,
          addresses: filtered,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", identity.id);

    if (error) throw new Error(error.message);
    return { status: "success" };
  });

export async function _setDefaultAddress(id: string) {
  const identity = await getServerIdentity();
  if (!identity.id) throw new Error("Não autorizado");

  const supabase = getServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("resume_data")
    .eq("id", identity.id)
    .maybeSingle();

  const existingResume = (profile?.resume_data as any) || {};
  const existingAddresses: any[] = existingResume.addresses || [];

  const updated = existingAddresses.map((a) => ({
    ...a,
    is_default: a.id === id,
  }));

  const { error } = await supabase
    .from("profiles")
    .update({
      resume_data: {
        ...existingResume,
        addresses: updated,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", identity.id);

  if (error) throw new Error(error.message);
  return { status: "success" as const };
}

export const setDefaultAddress = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data: { id } }) => _setDefaultAddress(id));
