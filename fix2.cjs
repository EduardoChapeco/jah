const fs = require('fs');
const path = require('path');

const dir = './src/services';
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.endsWith('.functions.ts')) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    
    // Replace export const fooHandler = createServerFn
    content = content.replace(/export\s+const\s+([a-zA-Z0-9_]+)Handler\s*=\s*createServerFn/g, 'export const $1 = createServerFn');
    
    fs.writeFileSync(p, content, 'utf8');
    console.log('Updated ' + file);
  }
});
