import * as fs from "fs";
import * as path from "path";

const SRC_DIR = path.resolve(process.cwd(), "src");

// Matches patterns like: new Date(X).toLocaleDateString(...) or new Date(X).toLocaleDateString()
// It handles optional locale and options arguments by capturing everything up to the closing paren of toLocaleDateString
const DATE_REGEX = /new\s+Date\(([^)]+)\)\.toLocaleDateString\(([^)]*)\)/g;

function processFile(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  let newContent = content;
  let modified = false;

  newContent = newContent.replace(DATE_REGEX, (match, dateArg, localeArgs) => {
    modified = true;
    return `formatDate(${dateArg})`;
  });

  if (modified) {
    // Add import if missing
    if (
      !newContent.includes("import { formatDate }") &&
      !newContent.includes("import { formatDate,")
    ) {
      // Find the last import
      const lastImportIndex = newContent.lastIndexOf("import ");
      if (lastImportIndex !== -1) {
        const endOfLastImport = newContent.indexOf("\n", lastImportIndex);

        // Calculate relative path to src/lib/datetime
        const dir = path.dirname(filePath);
        let relativePath = path
          .relative(dir, path.join(SRC_DIR, "lib", "datetime"))
          .replace(/\\/g, "/");
        if (!relativePath.startsWith(".")) {
          relativePath = "./" + relativePath;
        }

        const importStmt = `\nimport { formatDate } from "${relativePath}";`;
        newContent =
          newContent.slice(0, endOfLastImport) + importStmt + newContent.slice(endOfLastImport);
      } else {
        // No imports at all
        newContent = `import { formatDate } from "@/lib/datetime";\n` + newContent;
      }
    }

    fs.writeFileSync(filePath, newContent, "utf-8");
    console.log(`[MODIFIED] ${path.relative(process.cwd(), filePath)}`);
  }
}

function walkDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith(".tsx") || fullPath.endsWith(".ts")) {
      processFile(fullPath);
    }
  }
}

console.log("Starting date refactor sweep...");
walkDir(SRC_DIR);
console.log("Sweep complete!");
