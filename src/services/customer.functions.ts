import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSSRClient } from "@/lib/server-access";

const AddressSchema = z.object({
  zipcode: z.string().min(8),
  street: z.string().min(2),
  number: z.string().min(1),
  complement: z.string().optional(),
  neighborhood: z.string().min(2),
  city: z.string().min(2),
  state: z.string().length(2),
});

export const getCustomerAddresses = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const ssrClient = await getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();
    if (!user) return [];
    const { data } = await ssrClient
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    return data || [];
  } catch (err) {
    console.warn("[customer.functions] getCustomerAddresses error:", err);
    return [];
  }
});

export const addCustomerAddress = createServerFn({ method: "POST" })
  .validator(AddressSchema)
  .handler(async ({ data: params }) => {
    const ssrClient = await getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();
    if (!user) throw new Error("Não autorizado");
    const { resolveTenantStoreId } = await import("@/lib/tenant.server");
    const storeId = await resolveTenantStoreId();
    const store = storeId ? { id: storeId } : null;
    if (!store) throw new Error("Loja não encontrada");

    // Check if it's the first address to make it default
    const existing = await getCustomerAddresses();
    const isDefault = existing.length === 0;

    const { error } = await ssrClient.from("customer_addresses").insert({
      customer_id: user.id,
      store_id: store.id,
      ...params,
      is_default: isDefault,
    });

    if (error) throw new Error(error.message);
    return { status: "success" };
  });

export const deleteCustomerAddress = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
    const ssrClient = await getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();
    if (!user) throw new Error("Não autorizado");
    const { error } = await ssrClient
      .from("customer_addresses")
      .delete()
      .eq("id", id)
      .eq("customer_id", user.id);

    if (error) throw new Error(error.message);
    return { status: "success" };
  });

export async function _setDefaultAddress(id: string) {
  const ssrClient = await getSSRClient();
  const {
    data: { user },
  } = await ssrClient.auth.getUser();
  if (!user) throw new Error("Não autorizado");

  // Unset current default
  const { error: unsetError } = await ssrClient
    .from("customer_addresses")
    .update({ is_default: false })
    .eq("customer_id", user.id);

  if (unsetError) throw new Error(unsetError.message);

  // Set new default
  const { error } = await ssrClient
    .from("customer_addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("customer_id", user.id);

  if (error) throw new Error(error.message);
  return { status: "success" as const };
}

export const setDefaultAddress = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => _setDefaultAddress(id));
