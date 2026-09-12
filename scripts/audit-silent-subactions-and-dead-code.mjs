import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const servicesDir = path.join(projectRoot, "src", "services");

const files = fs.readdirSync(servicesDir).filter(f => f.endsWith(".functions.ts"));

console.log(`Auditing ${files.length} service function files for silent gaps, dead functions, and fake mutations...`);

const findings = [];

files.forEach(f => {
  const fullPath = path.join(servicesDir, f);
  const content = fs.readFileSync(fullPath, "utf8");

  // Encontrar todas as server functions
  // regex: export const (foo) = createServerFn({ method: ('GET'|'POST') })
  const fnRegex = /export\s+const\s+([a-zA-Z0-9_]+)\s*=\s*createServerFn\(\s*\{\s*method:\s*['"](GET|POST)['"]\s*\}\s*\)([\s\S]*?)(?=(?:export\s+const|\/\*|\Z))/g;
  
  let match;
  while ((match = fnRegex.exec(content)) !== null) {
    const fnName = match[1];
    const method = match[2];
    const body = match[3];

    // 1. Mutação POST sem chamada a db / getServerClient / rpc / fetch
    if (method === "POST") {
      const hasDb = body.includes("db.") || body.includes("getServerClient()") || body.includes("supabase.") || body.includes("rpc(") || body.includes("fetch(");
      const isMockOrStub = !hasDb && (body.includes("return { success: true") || body.includes("return { status: 'success'") || body.includes("return true"));
      if (isMockOrStub) {
        findings.push({ file: f, fnName, method, issue: "POST mutation returns success without DB or RPC call" });
      }
    }

    // 2. Contains TODO / FIXME / Not implemented
    if (body.includes("Not implemented") || body.includes("not implemented") || body.includes("TODO:") || body.includes("FIXME:")) {
      findings.push({ file: f, fnName, method, issue: "Contains TODO or 'Not implemented'" });
    }

    // 3. Catches silently without log or rethrow in mutations
    if (method === "POST" && /catch\s*\([^)]*\)\s*\{\s*(?:return|\})/.test(body) && !body.includes("throw") && !body.includes("console.error")) {
      findings.push({ file: f, fnName, method, issue: "Silent catch swallowing errors in mutation" });
    }
  }
});

console.log(`\nFound ${findings.length} potential issues in service functions:`);
findings.forEach((it, idx) => {
  console.log(`${idx + 1}. [${it.file}] -> ${it.fnName} (${it.method}): ${it.issue}`);
});
