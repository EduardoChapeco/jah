import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Ler o .env.local do pai
const envPath = path.resolve(".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
envContent.split("\n").forEach((line) => {
  if (line.includes("=")) {
    const [key, ...rest] = line.split("=");
    let value = rest.join("=").trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    envVars[key.trim()] = value;
  }
});

const PROJECT_REF = envVars.PROJECT_REF;
const DB_PASSWORD = envVars.DB_PASSWORD;

if (!PROJECT_REF || !DB_PASSWORD) {
  console.error("Missing PROJECT_REF or DB_PASSWORD in .env.local");
  process.exit(1);
}

const connectionString = `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(DB_PASSWORD)}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`;
const sql = postgres(connectionString);

async function run() {
  try {
    console.log("Connecting to Supabase Postgres...");

    // Billing Settings
    await sql`
      CREATE TABLE IF NOT EXISTS public.platform_billing_settings (
          store_id UUID PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
          fee_percentage NUMERIC(5,2) NOT NULL DEFAULT 5.00,
          monthly_fee_cents INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    console.log("Created platform_billing_settings");

    // Invoices
    await sql`
      CREATE TABLE IF NOT EXISTS public.platform_invoices (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          store_id UUID NOT NULL REFERENCES public.stores(id),
          period_start TIMESTAMPTZ NOT NULL,
          period_end TIMESTAMPTZ NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'overdue', 'canceled', 'draft')),
          total_sales_cents INTEGER NOT NULL DEFAULT 0,
          platform_fee_cents INTEGER NOT NULL DEFAULT 0,
          monthly_fee_cents INTEGER NOT NULL DEFAULT 0,
          due_date TIMESTAMPTZ NOT NULL,
          paid_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    console.log("Created platform_invoices");

    // Transactions
    await sql`
      CREATE TABLE IF NOT EXISTS public.store_transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          store_id UUID NOT NULL REFERENCES public.stores(id),
          invoice_id UUID REFERENCES public.platform_invoices(id),
          order_id UUID REFERENCES public.orders(id),
          type TEXT NOT NULL CHECK (type IN ('sale', 'refund', 'ad_spend', 'subscription')),
          amount_cents INTEGER NOT NULL,
          fee_cents INTEGER NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    console.log("Created store_transactions");

    // Ads
    await sql`
      CREATE TABLE IF NOT EXISTS public.ad_campaigns (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          store_id UUID NOT NULL REFERENCES public.stores(id),
          target_type TEXT NOT NULL CHECK (target_type IN ('product', 'event', 'store')),
          target_id UUID NOT NULL,
          budget_cents INTEGER NOT NULL,
          consumed_cents INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL CHECK (status IN ('active', 'exhausted', 'paused', 'canceled')),
          start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
          end_date TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    console.log("Created ad_campaigns");

    await sql`
      CREATE TABLE IF NOT EXISTS public.ad_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          campaign_id UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
          event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click')),
          cost_cents INTEGER NOT NULL,
          viewer_id UUID REFERENCES public.profiles(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `;
    console.log("Created ad_events");

    // Enable RLS
    await sql`ALTER TABLE public.platform_billing_settings ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.platform_invoices ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.store_transactions ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;`;
    await sql`ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;`;

    console.log("RLS enabled. Add specific policies as needed.");
    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await sql.end();
  }
}

run();
