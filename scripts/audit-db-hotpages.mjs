import { createClient } from "@supabase/supabase-js";

const url = "https://jfuebqmltksyznovhlwa.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmdWVicW1sdGtzeXpub3ZobHdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjM5NDE5NywiZXhwIjoyMTAxOTcwMTk3fQ.fQA4JVYOoEAuTltYvqNBeYArVKK6N9Zfz7fZiNXMoQs";
const supabase = createClient(url, key);

async function main() {
  const { data, error } = await supabase
    .from("hotpages")
    .select("id, slug, title, target_route, template_type, cover_image_url")
    .order("sort_order");

  if (error) {
    console.error("DB Query error:", error);
    return;
  }

  console.log("Current hotpages in DB:");
  data.forEach(h => {
    console.log(`- [${h.id}] slug: "${h.slug}" | title: "${h.title}" | target_route: "${h.target_route}" | cover: ${h.cover_image_url ? "YES" : "null"}`);
  });
}

main();
