import fs from 'fs';
import path from 'path';

const searchDirs = ['src/routes', 'src/components'];
const results = [];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else if (f.endsWith('.tsx') && !f.includes('.test.')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Look for URL inputs for images/banners/logos
        if (
          (line.includes('placeholder="https://') || line.includes("placeholder='https://") || line.includes('URL da imagem') || line.includes('URL da foto') || line.includes('URL do banner') || line.includes('URL do logo')) &&
          (line.includes('<Input') || line.includes('<input'))
        ) {
          results.push({
            file: full,
            line: idx + 1,
            snippet: line.trim()
          });
        }
      });
    }
  }
}

for (const d of searchDirs) {
  if (fs.existsSync(d)) walk(d);
}

console.log(`Found ${results.length} image URL text inputs.`);
fs.writeFileSync('.agents/audit_image_url_inputs.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Saved to .agents/audit_image_url_inputs.json');
