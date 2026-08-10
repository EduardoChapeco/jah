import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://gnfhhvcgnswctzvjcefe.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduZmhodmNnbnN3Y3R6dmpjZWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTM1MTM1OSwiZXhwIjoyMTAwOTI3MzU5fQ.WwGeim59ZAFuOh-TlWqmLB7ejP8xI6uqNTNFCxih-iA";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: orgs } = await supabase.from("organizations").select("*");
  const { data: stores } = await supabase.from("stores").select("*");
  const { data: products } = await supabase.from("products").select("id, name, slug");
  const { data: categories } = await supabase.from("categories").select("id, name, slug");
  const { data: collections } = await supabase.from("collections").select("id, name, slug");

  console.log("Orgs:", JSON.stringify(orgs, null, 2));
  console.log("Stores:", JSON.stringify(stores, null, 2));
  console.log("Products:", JSON.stringify(products, null, 2));
  console.log("Categories:", JSON.stringify(categories, null, 2));
  console.log("Collections:", JSON.stringify(collections, null, 2));
}

run().catch(console.error);
