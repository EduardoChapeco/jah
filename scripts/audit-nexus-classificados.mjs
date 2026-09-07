import fs from 'fs';
import path from 'path';

function checkFolder(dirName) {
  const dir = path.resolve(dirName);
  if (!fs.existsSync(dir)) return;
  function walk(d) {
    let files = [];
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const res = path.resolve(d, e.name);
      if (e.isDirectory()) files = files.concat(walk(res));
      else if (e.name.endsWith('.tsx') || e.name.endsWith('.ts')) files.push(res);
    }
    return files;
  }
  const files = walk(dir);
  const broken = new Set();
  for (const f of files) {
    const c = fs.readFileSync(f, 'utf8');
    const matches = c.matchAll(/from\s+["'](@\/[^"']+)["']/g);
    for (const m of matches) {
      const imp = m[1];
      const rel = imp.replace('@/', 'src/');
      const exts = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];
      let exists = false;
      for (const ext of exts) {
        if (fs.existsSync(path.resolve(rel + ext))) { exists = true; break; }
      }
      if (!exists) broken.add(imp);
    }
  }
  console.log('Folder:', dirName, '| Total files:', files.length, '| Broken @/ targets:', broken.size);
  if (broken.size > 0) {
    console.log('  Samples:', Array.from(broken).slice(0, 10));
  }
}

checkFolder('src/modules/nexus');
checkFolder('src/components/classificados');
