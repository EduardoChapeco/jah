import fs from 'fs';

const code = fs.readFileSync('src/routes/_store.conta.empresa.tsx', 'utf8');
const lines = code.split('\n');

let returnLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('return (') && returnLine === -1 && i > 300) {
    returnLine = i;
    console.log('Component return at line', i + 1, lines[i]);
  }
}

// Let's trace JSX tags starting from returnLine
import * as babel from '@babel/parser';

// Let's print lines around returnLine to line 950
for (let i = returnLine; i <= 950; i++) {
  const line = lines[i];
  if (line.includes('activeTab ===') || line.includes('return (') || i === 946) {
    console.log(`Line ${i+1}: ${line.trim()}`);
  }
}
