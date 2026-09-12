import fs from 'fs';
import path from 'path';

const searchDirs = ['src/routes/workspace', 'src/routes', 'src/components'];
const results = [];

function checkFile(full) {
  const content = fs.readFileSync(full, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (
      (line.includes('imageUrl') || line.includes('image_url') || line.includes('bannerUrl') || line.includes('coverUrl') || line.includes('cover_url') || line.includes('logoUrl')) &&
      (line.includes('<Input') || line.includes('Input') || line.includes('onChange=')) &&
      (line.includes('value=') || line.includes('placeholder='))
    ) {
      if (!full.includes('.test.')) {
        results.push({
          file: full,
          line: idx + 1,
          snippet: line.trim()
        });
      }
    }
  });
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      checkFile(full);
    }
  }
}

for (const d of searchDirs) walk(d);

console.log(`Found ${results.length} occurrences.`);
fs.writeFileSync('.agents/audit_image_inputs_broad.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Saved to .agents/audit_image_inputs_broad.json');
