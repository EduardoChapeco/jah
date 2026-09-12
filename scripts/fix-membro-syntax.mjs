import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = path.resolve(__dirname, "../src/routes/_store.membro.$id.tsx");
let content = fs.readFileSync(file, "utf8");
const lines = content.split("\n");

console.log("Before:");
for (let i = 1684; i <= 1690; i++) {
  console.log(`${i}: ${lines[i]}`);
}

lines[1686] = "  )}";
lines[1687] = " </div>";

console.log("After:");
for (let i = 1684; i <= 1690; i++) {
  console.log(`${i}: ${lines[i]}`);
}

fs.writeFileSync(file, lines.join("\n"), "utf8");
console.log("File written successfully!");
