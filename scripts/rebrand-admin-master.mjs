import fs from 'node:fs';
import path from 'node:path';

const files = [
  'src/routes/admin-master.tsx',
  'src/routes/admin-master.termos.tsx',
  'src/routes/admin-master.logistica.tsx',
  'src/routes/admin-master.integracoes.tsx',
  'src/routes/admin-master.curadoria.tsx',
  'src/routes/admin-master.tokens.tsx',
];

for (const rel of files) {
  const fullPath = path.resolve(rel);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/JAH Master/g, 'Wider Master');
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${rel}`);
  }
}
