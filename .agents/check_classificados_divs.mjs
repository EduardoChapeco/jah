import fs from 'fs';

const code = fs.readFileSync('src/routes/_store.classificados.$id.tsx', 'utf8');
const lines = code.split('\n');

// Let's find return line for ClassifiedDetailPage
let returnLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('return (') && i > 300) {
    returnLine = i;
    console.log('Return line:', i + 1);
    break;
  }
}

// Let's count divs from returnLine to end
let openDivs = 0;
for (let i = returnLine; i < lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/<div(\s|>)/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  openDivs += opens - closes;
  if (i > lines.length - 30) {
    console.log(`${i+1}: openDivs=${openDivs} | ${line}`);
  }
}
