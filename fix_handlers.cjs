const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  // Replace occurrences of NameHandler with Name EXCEPT in export const fooHandler
  // Wait, I already removed them from exports, so I can just replace everywhere!
  content = content.replace(/\b([a-zA-Z0-9_]+)Handler\b/g, '$1');

  if (original !== content) {
    fs.writeFileSync(f, content, 'utf8');
    console.log('Updated ' + f);
  }
});
