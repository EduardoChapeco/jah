import fs from 'fs';

const code = fs.readFileSync('src/routes/_store.conta.empresa.tsx', 'utf8');
const lines = code.split('\n');

for (let i = 775; i < 946; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
