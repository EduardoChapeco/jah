import fs from 'fs';

const code = fs.readFileSync('src/routes/_store.classificados.$id.tsx', 'utf8');
const lines = code.split('\n');

const stack = [];

for (let lineIdx = 478; lineIdx < lines.length; lineIdx++) {
  const line = lines[lineIdx];
  const tagMatches = line.matchAll(/<\/?([a-zA-Z0-9_.-]+)(\s[^>]*)?(\/?)>/g);
  for (const match of tagMatches) {
    const isClosing = match[0].startsWith('</');
    const isSelfClosing = match[3] === '/' || match[0].endsWith('/>');
    const tagName = match[1];

    // ignore non-HTML components or treat all tags uniformly
    if (isSelfClosing) continue;
    if (isClosing) {
      if (stack.length === 0) {
        console.log(`EXTRA CLOSING </${tagName}> at line ${lineIdx + 1}`);
      } else {
        const top = stack.pop();
        if (top.tagName !== tagName) {
          console.log(`MISMATCH at line ${lineIdx + 1}: expected </${top.tagName}> (from line ${top.lineNum}), got </${tagName}>`);
        }
      }
    } else {
      stack.push({ tagName, lineNum: lineIdx + 1 });
    }
  }
}

console.log('Final unclosed tags in _store.classificados.$id.tsx:');
stack.forEach(s => console.log(`Unclosed <${s.tagName}> from line ${s.lineNum}`));
