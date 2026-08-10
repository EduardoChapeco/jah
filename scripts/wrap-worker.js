import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'dist/_worker.js/index.js');
if (!fs.existsSync(file)) {
  console.error(`File not found: ${file}`);
  process.exit(1);
}

let content = fs.readFileSync(file, 'utf-8');

if (!content.includes('globalThis.process = { env: env };')) {
  content = content.replace(
    'async fetch(cfReq, env, context) {',
    'async fetch(cfReq, env, context) {\n\t\tglobalThis.process = { env: env };\n'
  );
  fs.writeFileSync(file, content);
  console.log('Successfully injected process.env into Cloudflare worker.');
} else {
  console.log('Worker already wrapped.');
}
