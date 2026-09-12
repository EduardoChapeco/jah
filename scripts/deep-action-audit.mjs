import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const routesDir = path.join(projectRoot, "src", "routes");
const componentsDir = path.join(projectRoot, "src", "components");
const servicesDir = path.join(projectRoot, "src", "services");

function getFilesRecursively(dir, filterExt = [".ts", ".tsx"]) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath, filterExt));
    } else if (filterExt.some((ext) => file.endsWith(ext))) {
      results.push(filePath);
    }
  }
  return results;
}

const routeFiles = getFilesRecursively(routesDir);
const componentFiles = getFilesRecursively(componentsDir);
const allFiles = [...routeFiles, ...componentFiles];

// 1. Mapear todas as Server Functions exportadas em src/services/*.functions.ts
const exportedServerFns = new Map(); // name -> filePath
const serviceFiles = fs.readdirSync(servicesDir).filter(f => f.endsWith('.functions.ts'));

serviceFiles.forEach(f => {
  const fullPath = path.join(servicesDir, f);
  const content = fs.readFileSync(fullPath, 'utf8');

  // match `export const foo = createServerFn`
  const matches = [...content.matchAll(/export\s+const\s+([a-zA-Z0-9_]+)\s*=\s*createServerFn/g)];
  matches.forEach(m => {
    exportedServerFns.set(m[1], f);
  });
});

console.log(`Total Server Functions defined: ${exportedServerFns.size}`);

// 2. Mapear quantas vezes cada Server Function é chamada no frontend (routes & components)
const fnUsageCount = new Map();
for (const fnName of exportedServerFns.keys()) {
  fnUsageCount.set(fnName, 0);
}

allFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  for (const fnName of exportedServerFns.keys()) {
    // regex para chamada ou import
    const regex = new RegExp(`\\b${fnName}\\b`, 'g');
    const matches = content.match(regex);
    if (matches) {
      fnUsageCount.set(fnName, fnUsageCount.get(fnName) + matches.length);
    }
  }
});

const uncalledServerFns = [];
for (const [fnName, count] of fnUsageCount.entries()) {
  if (count === 0) {
    uncalledServerFns.push({ fnName, file: exportedServerFns.get(fnName) });
  }
}

console.log(`\n--- 1. UNUSED / UNCALLED SERVER FUNCTIONS (${uncalledServerFns.length}) ---`);
uncalledServerFns.slice(0, 30).forEach(item => {
  console.log(`  [${item.file}] -> ${item.fnName}`);
});

// 3. Procurar por botões em rotas que possuem handlers vazios ou apenas toasts
const fakeButtons = [];
routeFiles.forEach(f => {
  const relPath = path.relative(projectRoot, f).replace(/\\/g, '/');
  const content = fs.readFileSync(f, 'utf8');

  // match function declarations in the file
  // find buttons that do `onClick={() => ...}`
  const buttonMatches = [...content.matchAll(/<Button[^>]*?onClick=\{([^}]+)\}[^>]*?>([\s\S]*?)<\/Button>/g)];
  buttonMatches.forEach(bm => {
    const handler = bm[1].trim();
    const children = bm[2].replace(/<[^>]+>/g, '').trim();

    // Se o handler for () => toast(...)
    if (/^\(\)\s*=>\s*toast\.(success|info|error)\([^)]+\)$/.test(handler)) {
      fakeButtons.push({ file: relPath, handler, children, reason: 'inline-toast-no-backend' });
    }
    // Se o handler for () => {}
    if (/^\(\)\s*=>\s*\{\s*\}$/.test(handler)) {
      fakeButtons.push({ file: relPath, handler, children, reason: 'empty-no-op' });
    }
  });
});

console.log(`\n--- 2. FAKE BUTTONS / NO-OP ACTIONS IN ROUTES (${fakeButtons.length}) ---`);
fakeButtons.forEach(b => {
  console.log(`  [${b.file}] (${b.reason}) -> "${b.children}" : ${b.handler}`);
});

// 4. Procurar por handlers em rotas que têm nomes de ação mas não usam mutate/await/rpc
const suspectHandlers = [];
routeFiles.forEach(f => {
  const relPath = path.relative(projectRoot, f).replace(/\\/g, '/');
  const content = fs.readFileSync(f, 'utf8');

  // Procura por const handle[A-Z]\w+ = async (...) ou const handle[A-Z]\w+ = (...)
  const handlerFuncs = [...content.matchAll(/(const\s+(handle[a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\s*\};)/g)];
  handlerFuncs.forEach(hf => {
    const name = hf[2];
    const body = hf[3];

    // Se o handler tem 'handleDelete', 'handleSave', 'handleCreate', 'handleConfirm', 'handleApprove', 'handleCancel', 'handleReject'
    if (/handle(Delete|Save|Create|Confirm|Approve|Cancel|Reject|Update|Submit|Action)/i.test(name)) {
      // Verifica se o corpo NÃO tem await, NÃO tem .then, NÃO tem mutate, e tem toast.success
      if (!body.includes('await') && !body.includes('.then') && !body.includes('mutate') && body.includes('toast.success')) {
        suspectHandlers.push({ file: relPath, name, reason: 'toast-success-without-await-or-mutate' });
      }
    }
  });
});

console.log(`\n--- 3. SUSPECT HANDLERS (Fake mutators with toast.success without async persistence) (${suspectHandlers.length}) ---`);
suspectHandlers.forEach(sh => {
  console.log(`  [${sh.file}] -> ${sh.name} (${sh.reason})`);
});
