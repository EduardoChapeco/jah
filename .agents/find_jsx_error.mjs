import fs from 'fs';

function checkJsxBalance(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const lines = code.split('\n');
  let openDivs = 0;
  let history = [];
  
  // Track open tags and braces
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Simple heuristic: count occurrences of <div> vs </div>
    const divsOpen = (line.match(/<div(\s|>)/g) || []).length;
    const divsClose = (line.match(/<\/div>/g) || []).length;
    openDivs += divsOpen - divsClose;
    if (i > lines.length - 100 || (i >= 900 && i <= 960)) {
      // console.log(`Line ${i+1}: openDivs=${openDivs} | ${line.slice(0, 40)}`);
    }
  }
}

// Let's print lines 920-960 of _store.conta.empresa.tsx
const code1 = fs.readFileSync('src/routes/_store.conta.empresa.tsx', 'utf8');
const lines1 = code1.split('\n');
console.log('=== _store.conta.empresa.tsx lines 930-960 ===');
for (let i = 930; i <= 960; i++) {
  console.log(`${i+1}: ${lines1[i]}`);
}

// Let's print lines 2530-2560 of _store.classificados.$id.tsx
const code2 = fs.readFileSync('src/routes/_store.classificados.$id.tsx', 'utf8');
const lines2 = code2.split('\n');
console.log('=== _store.classificados.$id.tsx lines 2530-2560 ===');
for (let i = 2530; i < lines2.length; i++) {
  console.log(`${i+1}: ${lines2[i]}`);
}
