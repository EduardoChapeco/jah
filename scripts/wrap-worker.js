import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "dist/_worker.js/index.js");
if (!fs.existsSync(file)) {
  console.error(`File not found: ${file}`);
  process.exit(1);
}

let content = fs.readFileSync(file, "utf-8");

const fallbackEnv = {
  VITE_SUPABASE_URL: "https://jfuebqmltksyznovhlwa.supabase.co",
  SUPABASE_URL: "https://jfuebqmltksyznovhlwa.supabase.co",
  VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmdWVicW1sdGtzeXpub3ZobHdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzOTQxOTcsImV4cCI6MjEwMTk3MDE5N30.14RG8TsXNmyauTp1L-VA2UJNC6jrU9tYj8Vk4RXH0Hc",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmdWVicW1sdGtzeXpub3ZobHdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzOTQxOTcsImV4cCI6MjEwMTk3MDE5N30.14RG8TsXNmyauTp1L-VA2UJNC6jrU9tYj8Vk4RXH0Hc",
  VITE_SITE_URL: "https://jah-d9m.pages.dev",
};

const injection = `async fetch(cfReq, env, context) {
\t\tconst mergedEnv = Object.assign({}, ${JSON.stringify(fallbackEnv)}, env || {});
\t\tglobalThis.process = { env: mergedEnv };
\t\tglobalThis.__env__ = mergedEnv;
`;

if (!content.includes("globalThis.__env__ = mergedEnv;")) {
  if (content.includes("async fetch(cfReq, env, context) {")) {
    content = content.replace("async fetch(cfReq, env, context) {", injection);
    fs.writeFileSync(file, content);
    console.log("Successfully injected packaged Supabase environment into Cloudflare worker.");
  } else {
    console.warn("Could not find fetch entrypoint in worker.");
  }
} else {
  console.log("Worker already wrapped with packaged environment.");
}
