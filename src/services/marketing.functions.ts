import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

/**
 * Scans for carts that haven't been updated in 2 hours and converts them 
 * to abandoned carts if they haven't been already.
 */
export const scanAbandonedCarts = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager"]);

  // In a real Cron job, this runs automatically. 
  // Here we trigger it from the Admin panel to simulate the scan.
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  // Find carts from this store that are older than 2 hours and not attached to an order
  const { data: stagnantCarts, error: cartsErr } = await supabase
    .from("carts")
    .select("id, customer_id, updated_at")
    .eq("store_id", identity.store_id)
    .lt("updated_at", twoHoursAgo);

  if (cartsErr || !stagnantCarts || stagnantCarts.length === 0) {
    return { scanned: 0, newAbandons: 0 };
  }

  // Ensure they haven't already been marked
  let newAbandonsCount = 0;
  for (const cart of stagnantCarts) {
    const { data: existing } = await supabase
       .from("abandoned_carts")
       .select("id")
       .eq("cart_id", cart.id)
       .maybeSingle();

    if (!existing) {
       // Take a snapshot of the cart items (for marketing emails)
       const { data: items } = await supabase
         .from("cart_items")
         .select("*, product_variants(*, products(title))")
         .eq("cart_id", cart.id);

       await supabase.from("abandoned_carts").insert({
          store_id: identity.store_id,
          cart_id: cart.id,
          customer_id: cart.customer_id,
          status: "abandoned",
          cart_snapshot: { items: items || [] }
       });
       newAbandonsCount++;
    }
  }

  return { scanned: stagnantCarts.length, newAbandons: newAbandonsCount };
});

export const listAbandonedCarts = createServerFn({ method: "GET" }).handler(async () => {
   const supabase = getServerClient();
   const identity = await getServerIdentity();
   assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);

   const { data: carts, error } = await supabase
     .from("abandoned_carts")
     .select("*, profiles!abandoned_carts_customer_id_fkey(full_name, email, phone)")
     .eq("store_id", identity.store_id)
     .order("created_at", { ascending: false });

   if (error || !carts) return [];

   return carts.map((c) => ({
      id: c.id,
      cartId: c.cart_id,
      status: c.status,
      recoveryAttempts: c.recovery_attempts,
      customerName: c.profiles?.full_name || "Visitante Anônimo",
      customerEmail: c.profiles?.email,
      customerPhone: c.profiles?.phone,
      snapshot: c.cart_snapshot,
      createdAt: c.created_at,
   }));
});

export const markRecoveryAttempt = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data: { id } }) => {
     const supabase = getServerClient();
     const identity = await getServerIdentity();
     assertStoreAccess(identity, ["owner", "admin", "manager", "seller"]);

     // Fetch current to increment
     const { data: cart } = await supabase
       .from("abandoned_carts")
       .select("recovery_attempts")
       .eq("id", id)
       .eq("store_id", identity.store_id)
       .single();
     
     if (cart) {
        await supabase
          .from("abandoned_carts")
          .update({ 
             recovery_attempts: cart.recovery_attempts + 1,
             last_attempt_at: new Date().toISOString()
          })
          .eq("id", id)
          .eq("store_id", identity.store_id);
     }

     return { success: true };
  });

/**
 * Gamification "Match Time" Engine
 * Pulls 5 random active variants from the store to show in the Tinder-style UI.
 */
export const generateMatchTimeOffers = createServerFn({ method: "GET" }).handler(async () => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();
    
    // Select a few random products that have stock
    const { data: variants, error } = await supabase
      .from("product_variants")
      .select("id, price_cents, canonical_name, products!inner(id, title, store_id, is_active), product_media(url)")
      .eq("products.store_id", identity.store_id)
      .eq("products.is_active", true)
      .limit(20);

    if (error || !variants) return [];

    // Shuffle and pick 5
    const shuffled = variants.sort(() => 0.5 - Math.random()).slice(0, 5);

    return shuffled.map((v) => {
       const originalPrice = v.price_cents;
       // Create an artificial flash discount of 15% to 30% for the match
       const discountFactor = (Math.floor(Math.random() * (30 - 15 + 1)) + 15) / 100;
       const matchPrice = Math.floor(originalPrice * (1 - discountFactor));

       return {
          variantId: v.id,
          productId: (v.products as any)?.id,
          title: (v.products as any)?.title,
          variantName: v.canonical_name,
          image: v.product_media?.[0]?.url || null,
          originalPrice,
          matchPrice,
          discountPercentage: Math.floor(discountFactor * 100)
       };
    });
});
