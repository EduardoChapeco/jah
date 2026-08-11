const fs = require('fs');
let content = fs.readFileSync('src/services/shipping.functions.ts', 'utf8');

// The file got extremely messed up around line 200+. Let's just find the `_deleteShippingZone` and `export const calculateShipping`.

const fixStr = `  .handler(async ({ data }) => _calculateShipping(data));

// ---------------------------------------------------------------------------

export async function _listShippingZones() {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  if (!identity.store_id) return [];
  assertStoreAccess(identity, ["owner", "admin", "manager"]);

  const { data: zones } = await supabase
    .from("shipping_zones")
    .select("*, shipping_rates(*)")
    .eq("store_id", identity.store_id);

  return zones || [];
}

export const listShippingZones = createServerFn({ method: "GET" }).handler(
  _listShippingZones as any
);

// ---------------------------------------------------------------------------

export async function _upsertShippingZone(data: {
  id?: string;
  name: string;
  regions: string[];
  is_active: boolean;
}) {
  const supabase = getServerClient();
  const identity = await getServerIdentity();
  assertStoreAccess(identity, ["owner", "admin", "manager"]);

  const payload = { ...data, store_id: identity.store_id };

  const { data: zone, error } = await supabase
    .from("shipping_zones")
    .upsert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return zone;
}

export const upsertShippingZone = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().uuid().optional(),
      name: z.string(),
      regions: z.array(z.string()),
      is_active: z.boolean(),
    }),
  )
  .handler(async ({ data }) => _upsertShippingZone(data));

// ---------------------------------------------------------------------------

export async function _deleteShippingZone`;

// Regex replace everything between the end of calculateShipping validator to _deleteShippingZone
content = content.replace(/zipcode:\s*z\.string\(\)\.min\(8\),\s*\}\),\s*\)[\s\S]*?export\s+async\s+function\s+_deleteShippingZone/g, `zipcode: z.string().min(8),\n    }),\n  )\n${fixStr}`);

fs.writeFileSync('src/services/shipping.functions.ts', content);
console.log('Fixed shipping.functions.ts definitively');
