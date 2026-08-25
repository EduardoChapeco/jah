import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "dist/_worker.js/index.js");
if (!fs.existsSync(file)) {
  console.error(`File not found: ${file}`);
  process.exit(1);
}

let content = fs.readFileSync(file, "utf-8");

let secrets = {};
const secretsPath = path.join(process.cwd(), ".env.secrets");
if (fs.existsSync(secretsPath)) {
  const lines = fs.readFileSync(secretsPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const k = match[1].trim();
      let v = match[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      secrets[k] = v;
    }
  }
}

const fallbackEnv = {
  VITE_SUPABASE_URL: secrets.VITE_SUPABASE_URL || "https://jfuebqmltksyznovhlwa.supabase.co",
  SUPABASE_URL: secrets.VITE_SUPABASE_URL || "https://jfuebqmltksyznovhlwa.supabase.co",
  VITE_SUPABASE_ANON_KEY: secrets.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmdWVicW1sdGtzeXpub3ZobHdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzOTQxOTcsImV4cCI6MjEwMTk3MDE5N30.14RG8TsXNmyauTp1L-VA2UJNC6jrU9tYj8Vk4RXH0Hc",
  SUPABASE_ANON_KEY: secrets.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmdWVicW1sdGtzeXpub3ZobHdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzOTQxOTcsImV4cCI6MjEwMTk3MDE5N30.14RG8TsXNmyauTp1L-VA2UJNC6jrU9tYj8Vk4RXH0Hc",
  SUPABASE_SERVICE_ROLE_KEY: secrets.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmdWVicW1sdGtzeXpub3ZobHdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjM5NDE5NywiZXhwIjoyMTAxOTcwMTk3fQ.fQA4JVYOoEAuTltYvqNBeYArVKK6N9Zfz7fZiNXMoQs",
  VITE_SITE_URL: "https://jah-d9m.pages.dev",
};

const injection = `async fetch(cfReq, env, context) {
		const mergedEnv = Object.assign({}, ${JSON.stringify(fallbackEnv)}, env || {});
		if (typeof globalThis.process === "undefined") {
			globalThis.process = { env: mergedEnv };
		} else {
			globalThis.process.env = Object.assign({}, globalThis.process.env || {}, mergedEnv);
		}
		globalThis.__env__ = mergedEnv;
`;

if (content.includes("async fetch(cfReq, env, context) {")) {
  content = content.replace(/async fetch\(cfReq, env, context\) \{[\s\S]*?globalThis\.__env__ = mergedEnv;\n/, injection);
  if (!content.includes("globalThis.__env__ = mergedEnv;")) {
    content = content.replace("async fetch(cfReq, env, context) {", injection);
  }
  fs.writeFileSync(file, content);
  console.log("Successfully injected packaged Supabase environment into Cloudflare worker.");
} else {
  console.warn("Could not find fetch entrypoint in worker.");
}
