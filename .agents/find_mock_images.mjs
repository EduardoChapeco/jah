import fs from 'fs';
import path from 'path';

const searchDirs = ['src/services', 'src/routes', 'src/components', 'src/lib'];
const results = [];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else if (f.endsWith('.ts') || f.endsWith('.tsx')) {
      if (f.includes('.test.')) continue; // skip unit tests
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        const lower = line.toLowerCase();
        if (
          lower.includes('images.unsplash.com') ||
          lower.includes('via.placeholder.com') ||
          lower.includes('picsum.photos') ||
          lower.includes('mock_') ||
          lower.includes('fake_') ||
          lower.includes('mockdata') ||
          lower.includes('mockitems') ||
          lower.includes('mockproducts') ||
          lower.includes('mockevents') ||
          lower.includes('mockstores') ||
          lower.includes('mockleads') ||
          (lower.includes('fallback') && lower.includes('http'))
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

console.log(`Found ${results.length} placeholder/image mock lines in non-test code.`);
fs.writeFileSync('.agents/audit_mock_images.json', JSON.stringify(results, null, 2), 'utf8');
console.log('Saved to .agents/audit_mock_images.json');
