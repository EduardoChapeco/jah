const fs = require('fs');
const path = require('path');

const dir = './src/services';
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.endsWith('.functions.ts')) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    let original = content;

    // Find all exports like `export const X = createServerFn`
    const exportMatches = [...content.matchAll(/export const ([a-zA-Z0-9_]+)\s*=\s*createServerFn/g)];
    
    for (const match of exportMatches) {
      const name = match[1];
      
      // We need to rename the internal function `name` to `_${name}`
      // And we need to rename `.handler(${name})` to `.handler(_${name})`
      
      // Rename function definition: function X( or async function X(
      const funcDefRegex = new RegExp(`(function\\s+)${name}\\b`, 'g');
      if (content.match(funcDefRegex)) {
        content = content.replace(funcDefRegex, `$1_${name}`);
        
        // Rename handler reference
        const handlerRegex = new RegExp(`\\.handler\\(${name}\\)`, 'g');
        content = content.replace(handlerRegex, `.handler(_${name})`);
      }
    }
    
    if (original !== content) {
      fs.writeFileSync(p, content, 'utf8');
      console.log('Updated ' + file);
    }
  }
});
