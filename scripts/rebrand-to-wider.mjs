import fs from 'node:fs';
import path from 'node:path';

const srcDir = path.resolve('src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk(srcDir);
let changedCount = 0;

const REPLACEMENTS = [
  { from: /\| Workspace JAH Master OS/g, to: '| Workspace Wider OS' },
  { from: /\| Admin JAH Master OS/g, to: '| Admin Wider OS' },
  { from: /\| JAH Master OS/g, to: '| Wider OS' },
  { from: /— JAH Master OS/g, to: '— Wider OS' },
  { from: /JAH Master OS — /g, to: 'Wider OS — ' },
  { from: /"JAH Master OS"/g, to: '"Wider OS"' },
  { from: /'JAH Master OS'/g, to: "'Wider OS'" },
  { from: /`JAH Master OS`/g, to: '`Wider OS`' },
  { from: /JAH Master OS/g, to: 'Wider OS' },
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  for (const { from, to } of REPLACEMENTS) {
    content = content.replace(from, to);
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log(`Updated: ${path.relative(process.cwd(), file)}`);
  }
});

console.log(`\nRebranding complete. Total files updated: ${changedCount}`);
