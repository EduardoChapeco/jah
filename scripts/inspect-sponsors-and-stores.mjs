import { createClient } from "@supabase/supabase-js";

const url = "https://jfuebqmltksyznovhlwa.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmdWVicW1sdGtzeXpub3ZobHdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjM5NDE5NywiZXhwIjoyMTAxOTcwMTk3fQ.fQA4JVYOoEAuTltYvqNBeYArVKK6N9Zfz7fZiNXMoQs";
const supabase = createClient(url, key);

async function inspect() {
  console.log("Checking sponsors table...");
  const { data: sponsors, error: spErr } = await supabase.from("sponsors").select("*").limit(2);
  if (spErr) {
    console.error("sponsors error:", spErr);
  } else {
    console.log("sponsors sample columns:", sponsors.length > 0 ? Object.keys(sponsors[0]) : "table empty, cols unknown");
  }

  console.log("Checking stores table...");
  const { data: stores, error: stErr } = await supabase.from("stores").select("*").limit(1);
  if (stErr) {
    console.error("stores error:", stErr);
  } else {
    console.log("stores sample columns:", stores.length > 0 ? Object.keys(stores[0]) : "table empty");
  }
}

inspect().catch(console.error);
