const fs = require("fs");
const path = require("path");
const SRC_DIR = path.join(process.cwd(), "src");

const map = {
  "bg-red": "bg-destructive",
  "text-red": "text-destructive",
  "bg-green": "bg-success",
  "text-green": "text-success",
  "bg-yellow": "bg-warning",
  "text-yellow": "text-warning",
  "bg-orange": "bg-warning",
  "text-orange": "text-warning",
  "bg-blue": "bg-primary",
  "text-blue": "text-primary",
  "bg-pink": "bg-accent",
  "text-pink": "text-accent",
  "bg-purple": "bg-accent",
  "text-purple": "text-accent",
  "bg-indigo": "bg-accent",
  "text-indigo": "text-accent",
  "bg-teal": "bg-accent",
  "text-teal": "text-accent",
};

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkDir(filePath);
    } else if (filePath.endsWith(".tsx") || filePath.endsWith(".ts")) {
      let content = fs.readFileSync(filePath, "utf-8");
      let changed = false;
      for (const [key, val] of Object.entries(map)) {
        const regex = new RegExp(`\\b${key}-[0-9]{2,3}\\b`, "g");
        if (regex.test(content)) {
          content = content.replace(regex, val);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(filePath, content, "utf-8");
        console.log("Fixed", filePath);
      }
    }
  }
}

walkDir(SRC_DIR);
