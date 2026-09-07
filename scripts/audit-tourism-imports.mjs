import fs from 'fs';
import path from 'path';

const tourismDir = path.resolve('src/components/tourism');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walk(res));
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      files.push(res);
    }
  }
  return files;
}

const files = walk(tourismDir);
const brokenTargets = new Map();

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const importMatches = content.matchAll(/from\s+["'](@\/[^"']+)["']/g);
  for (const m of importMatches) {
    const importPath = m[1];
    const rel = importPath.replace('@/', 'src/');
    const extensions = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];
    let exists = false;
    for (const ext of extensions) {
      if (fs.existsSync(path.resolve(rel + ext))) {
        exists = true;
        break;
      }
    }
    if (!exists) {
      brokenTargets.set(importPath, (brokenTargets.get(importPath) || 0) + 1);
    }
  }
}

console.log('Distinct broken targets count:', brokenTargets.size);
for (const [target, count] of brokenTargets.entries()) {
  console.log(`  ${target} (${count} occurrences)`);
}
