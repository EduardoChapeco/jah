import fs from 'fs';
import path from 'path';

const searchDirs = ['src/services', 'src/routes', 'src/lib', 'src/components'];
const results = [];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else if (f.endsWith('.ts') || f.endsWith('.tsx')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Look for common mock/fallback patterns
        if (
          (line.includes('FALLBACK') || line.includes('fallback') || line.includes('MOCK') || line.includes('mock') || line.includes('placeholder')) &&
          (line.includes('return') || line.includes('const') || line.includes('= [') || line.includes('|| ['))
        ) {
          results.push({
            file: full,
            line: idx + 1,
            content: line.trim()
          });
        }
      });
    }
  }
}

for (const d of searchDirs) {
  if (fs.existsSync(d)) walk(d);
}

console.log(`Found ${results.length} potential fallback/mock lines.`);
fs.writeFileSync('.agents/audit_fallbacks.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Saved to .agents/audit_fallbacks.json');
