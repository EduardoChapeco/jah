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
  let changed = false;

  // 1. Delete test files
  if (f.endsWith('.test.ts')) {
    fs.unlinkSync(f);
    console.log('Deleted ' + f);
    return;
  }

  // 2. Replace tenant imports
  if (f.endsWith('.functions.ts')) {
    if (content.includes('@/lib/tenant')) {
      content = content.replace(/@\/lib\/tenant(\b|(?!\.server))/g, '@/lib/tenant.server');
      changed = true;
    }
  }

  // 3. Remove export from *Handler in events and product functions
  if (f.replace(/\\/g, '/').endsWith('services/events.functions.ts') || f.replace(/\\/g, '/').endsWith('services/product.functions.ts')) {
    const original = content;
    content = content.replace(/^export\s+(async\s+)?function\s+([a-zA-Z0-9_]+Handler\b)/gm, (match, p1, p2) => {
      return (p1 || '') + 'function ' + p2;
    });
    if (original !== content) changed = true;
  }

  if (changed) {
    fs.writeFileSync(f, content, 'utf8');
    console.log('Updated ' + f);
  }
});

// Delete tenant.ts if it exists
if (fs.existsSync('./src/lib/tenant.ts')) {
  fs.unlinkSync('./src/lib/tenant.ts');
  console.log('Deleted src/lib/tenant.ts');
}
