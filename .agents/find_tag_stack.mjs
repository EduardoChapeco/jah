import fs from 'fs';

const code = fs.readFileSync('src/routes/_store.conta.empresa.tsx', 'utf8');

// Let's use simple regex stack for tags from return (line 316)
const lines = code.split('\n');
const stack = [];

for (let lineNum = 316; lineNum <= 947; lineNum++) {
  const line = lines[lineNum - 1];
  const tagMatches = line.matchAll(/<\/?([a-zA-Z0-9_.-]+)(\s[^>]*)?(\/?)>/g);
  for (const match of tagMatches) {
    const isClosing = match[0].startsWith('</');
    const isSelfClosing = match[3] === '/' || match[0].endsWith('/>');
    const tagName = match[1];
    
    if (isSelfClosing) continue;
    if (isClosing) {
      if (stack.length === 0) {
        console.log(`EXTRA CLOSING </${tagName}> at line ${lineNum}`);
      } else {
        const top = stack.pop();
        if (top.tagName !== tagName) {
          console.log(`MISMATCH at line ${lineNum}: expected </${top.tagName}> (from line ${top.lineNum}), got </${tagName}>`);
        }
      }
    } else {
      stack.push({ tagName, lineNum });
    }
  }
}

console.log('Stack size at line 947:', stack.length);
stack.forEach(s => console.log(`Unclosed <${s.tagName}> from line ${s.lineNum}`));
