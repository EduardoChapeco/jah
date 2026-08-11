const fs = require('fs');
const path = require('path');

const dir = './src/services';
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.endsWith('.functions.ts')) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    let original = content;

    const exportMatches = [...content.matchAll(/export const ([a-zA-Z0-9_]+)\s*=\s*createServerFn/g)];
    
    for (const match of exportMatches) {
      const name = match[1];
      
      // We know there's a function `_${name}` now.
      // Any references to `name` inside the `.handler(...)` block should be `_${name}`.
      // Wait, let's just globally replace `=> name(` with `=> _${name}(`
      // and `.handler(name)` with `.handler(_${name})` just in case.
      
      const arrowRegex = new RegExp(`=>\\s*${name}\\s*\\(`, 'g');
      content = content.replace(arrowRegex, `=> _${name}(`);
      
      // Also, sometimes they do `.handler(async () => { return name() })`
      const callRegex = new RegExp(`\\b${name}\\s*\\(`, 'g');
      // But wait! If we do `name(` globally, we might replace `name(` where `name` is the exported function used somewhere else?
      // No, inside `.functions.ts` files, no one calls the exported functions. They call the internal ones.
      // So replacing `name(` with `_${name}(` globally is completely safe!
      content = content.replace(callRegex, `_${name}(`);
      
      // Wait, what if the function definition `async function name(` was missed?
      const funcDefRegex = new RegExp(`(?:async\\s+)?function\\s+${name}\\b`, 'g');
      content = content.replace(funcDefRegex, (m) => m.replace(name, `_${name}`));
    }
    
    if (original !== content) {
      fs.writeFileSync(p, content, 'utf8');
      console.log('Updated ' + file);
    }
  }
});
