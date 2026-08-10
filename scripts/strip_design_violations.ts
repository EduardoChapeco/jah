import * as fs from "fs";
import * as path from "path";

const SRC_DIR = path.resolve(process.cwd(), "src");

// These regexes target specific words inside className="..." strings
// We need to match className attribute contents.
const CLASSNAME_REGEX = /className=(?:\{`([^`]+)`\}|"([^"]+)"|\{'([^']+)'\})/g;

// Terms to completely eradicate:
const FORBIDDEN_CLASSES = [
  // Gradients
  /bg-gradient-to-[a-z]+/g,
  /from-[a-z]+-\d+(?:\/\d+)?/g,
  /via-[a-z]+-\d+(?:\/\d+)?/g,
  /to-[a-z]+-\d+(?:\/\d+)?/g,
  /from-transparent/g,
  /via-transparent/g,
  /to-transparent/g,
  /from-black\/\d+/g,
  /via-black\/\d+/g,
  /from-white\/\d+/g,
  /via-white\/\d+/g,
  /to-white\/\d+/g,

  // Rounded corners (large)
  /rounded-lg/g,
  /rounded-xl/g,
  /rounded-2xl/g,
  /rounded-3xl/g,

  // Big shadows (glass/saas)
  /shadow-lg/g,
  /shadow-xl/g,
  /shadow-2xl/g,

  // Specific bad colors
  /border-pink-\d+(?:\/\d+)?/g,
  /text-pink-\d+(?:\/\d+)?/g,
  /bg-pink-\d+(?:\/\d+)?/g,

  /border-purple-\d+(?:\/\d+)?/g,
  /text-purple-\d+(?:\/\d+)?/g,
  /bg-purple-\d+(?:\/\d+)?/g,

  /border-indigo-\d+(?:\/\d+)?/g,
  /text-indigo-\d+(?:\/\d+)?/g,
  /bg-indigo-\d+(?:\/\d+)?/g,
];

function processFile(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  let newContent = content;

  let modified = false;

  // We find all className="...", className={`...`} etc.
  newContent = newContent.replace(
    CLASSNAME_REGEX,
    (match, backtickClasses, doubleQuoteClasses, singleQuoteClasses) => {
      let classesStr = backtickClasses || doubleQuoteClasses || singleQuoteClasses;
      if (!classesStr) return match;

      let modifiedClassesStr = classesStr;
      for (const regex of FORBIDDEN_CLASSES) {
        modifiedClassesStr = modifiedClassesStr.replace(regex, "");
      }

      // Clean up double spaces caused by removals
      modifiedClassesStr = modifiedClassesStr.replace(/\s+/g, " ").trim();

      if (modifiedClassesStr !== classesStr) {
        modified = true;
        if (backtickClasses) {
          return `className={\`${modifiedClassesStr}\`}`;
        } else if (doubleQuoteClasses) {
          return `className="${modifiedClassesStr}"`;
        } else {
          return `className={'${modifiedClassesStr}'}`;
        }
      }

      return match;
    },
  );

  // Also clean up hardcoded colors outside classNames
  const hardcodedPink = newContent.replace(
    /pink:\s*["']#[a-fA-F0-9]{6}["']/g,
    'pink: "var(--color-primary)"',
  );
  if (hardcodedPink !== newContent) {
    newContent = hardcodedPink;
    modified = true;
  }

  if (modified) {
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

console.log("Starting design sweep...");
walkDir(SRC_DIR);
console.log("Sweep complete!");
