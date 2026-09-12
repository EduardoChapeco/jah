import fs from 'fs';
import path from 'path';

const searchDirs = ['src/routes', 'src/services', 'src/components', 'src/lib'];
const findings = [];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else if ((f.endsWith('.tsx') || f.endsWith('.ts')) && !f.includes('.test.') && !f.includes('.d.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // match definitions of static mock arrays like const MOCK_... = [ or const DEFAULT_... = [
        const trimmed = line.trim();
        if (
          /const\s+(MOCK_|DEFAULT_|STATIC_|SAMPLE_|FALLBACK_)[A-Z0-9_]*\s*(:\s*[^=]+)?\s*=\s*\[/.test(trimmed) ||
          /const\s+[a-zA-Z0-9_]*(Mocks|MockItems|MockData|Fakes)\s*(:\s*[^=]+)?\s*=\s*\[/.test(trimmed)
        ) {
          findings.push({
            file: full,
            line: idx + 1,
            declaration: trimmed
          });
        }
      });
    }
  }
}

for (const d of searchDirs) {
  if (fs.existsSync(d)) walk(d);
}

console.log(`Found ${findings.length} static mock/default/sample array declarations.`);
fs.writeFileSync('.agents/static_arrays_audit.json', JSON.stringify(findings, null, 2), 'utf8');
console.log('Saved to .agents/static_arrays_audit.json');
