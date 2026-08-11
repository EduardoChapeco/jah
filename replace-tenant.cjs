const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
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
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('@/lib/tenant') && !content.includes('@/lib/tenant.server')) {
    content = content.replace(/@\/lib\/tenant/g, '@/lib/tenant.server');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
fs.renameSync('./src/lib/tenant.ts', './src/lib/tenant.server.ts');
console.log('Done');
