const fs = require("fs");
const path = require("path");

const target = path.join(process.cwd(), "src", "lib", "routes.ts");
let content = fs.readFileSync(target, "utf-8");

// The instruction is to remove phantom routes ("Em breve" / planned)
// We will filter out any line that contains `planned: true` or `navPlanned: true`
// But we must NOT delete the interface definitions `planned?: boolean;` or `navPlanned?: boolean;`
// We will also remove the "Em breve" badge if it exists.

const lines = content.split("\n");
const filtered = lines.filter((line) => {
  // If the line has `planned: true` or `navPlanned: true` (which means it's an unreleased feature)
  // we actually might need to remove the whole object!
  // Wait, if it's an object `{ path: "/admin/...", label: "...", planned: true }`,
  // filtering just the line will create a syntax error because of `{ path: ..., label: ... }`!
  return true;
});

// Since removing a line inside an object breaks the array, we must just replace `planned: true` with nothing,
// OR we must accept that `planned: true` means the route is not ready and should be removed.
// Actually, to be safe and "melhorar o que existe", let's just remove the `planned` flag and let the routes exist,
// OR we can just remove the `planned: true` property so they are visible but maybe they don't have functionality?
// The user rule says: "Funcionalidades planejadas não devem vazar para o registro de rotas se a infraestrutura/persistência não estiver validada."
// Let's use a regex to remove entire route objects that have `planned: true` or `navPlanned: true`.

// Using regex to remove objects in the array that contain `planned: true`
// Example: { path: '/xyz', label: '...', planned: true },
content = content.replace(/\{[^}]*planned:\s*true[^}]*\},\r?\n?/g, "");
content = content.replace(/\{[^}]*navPlanned:\s*true[^}]*\},\r?\n?/g, "");

fs.writeFileSync(target, content, "utf-8");
console.log("Routes cleaned safely!");
