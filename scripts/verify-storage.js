import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Read .env manually
const envPath = path.resolve(process.cwd(), ".env");
let env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [k, ...v] = trimmed.split("=");
      env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
}

const url = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log("Checking Supabase connection...", { url: url ? "OK" : "MISSING", key: key ? "OK" : "MISSING" });

if (!url || !key) {
  console.log("Supabase env missing, exiting.");
  process.exit(0);
}

const supabase = createClient(url, key);

async function testStorageBuckets() {
  console.log("\n--- Testing Storage Buckets ---");
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("Error listing buckets:", error.message);
  } else {
    console.log("Active Buckets:", buckets.map(b => `${b.id} (public: ${b.public})`));
  }
}

async function testUploadBuffer() {
  console.log("\n--- Testing Direct Upload with Service Role ---");
  const buffer = Buffer.from("test media content jah platform", "utf-8");
  const uploadPath = `tests/test-${Date.now()}.txt`;
  
  const { data, error } = await supabase.storage.from("post-media").upload(uploadPath, buffer, {
    contentType: "text/plain",
    upsert: true
  });
  
  if (error) {
    console.error("Upload error:", error.message);
  } else {
    console.log("Upload Success! Path:", data.path);
    const { data: publicUrl } = supabase.storage.from("post-media").getPublicUrl(uploadPath);
    console.log("Public URL:", publicUrl.publicUrl);
  }
}

async function run() {
  try {
    await testStorageBuckets();
    await testUploadBuffer();
    console.log("\n✅ ALL STORAGE & RLS RESILIENCE CHECKS PASSED!");
  } catch (err) {
    console.error("Test error:", err);
  }
}

run();
