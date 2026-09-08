import fs from 'node:fs';
import path from 'node:path';

const routesDir = path.join(process.cwd(), 'src', 'routes');
const allFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

console.log('Total Route Files:', allFiles.length);

const categories = {};
allFiles.forEach(f => {
  const parts = f.split('.');
  const prefix = parts[0];
  categories[prefix] = (categories[prefix] || 0) + 1;
});
console.log('Route Categories:', JSON.stringify(categories, null, 2));

const issues = {
  compressiveGrids: [],
  unsafeLoaders: [],
  mobileLeaks: [],
  verboseHeaders: [],
  unhandledPostgrestRelations: []
};

allFiles.forEach(file => {
  const fullPath = path.join(routesDir, file);
  const content = fs.readFileSync(fullPath, 'utf8');

  // Check compressive grids
  const gridMatches = [...content.matchAll(/className=["'][^"']*?\bgrid-cols-([3-9]|1[0-2])\b[^"']*?["']/g)];
  gridMatches.forEach(m => {
    const classStr = m[0];
    if (!classStr.includes('sm:') && !classStr.includes('md:') && !classStr.includes('lg:')) {
      issues.compressiveGrids.push({ file, classStr });
    }
  });

  // Check loaders with await without try/catch or .catch
  if (content.includes('loader:') && content.includes('await')) {
    const loaderMatch = content.match(/loader:\s*async\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\s*\},?\s*(?:component|errorComponent|pendingComponent|\})/);
    if (loaderMatch) {
      const loaderBody = loaderMatch[1];
      if (!loaderBody.includes('try') && !loaderBody.includes('catch(') && !loaderBody.includes('.catch(')) {
        issues.unsafeLoaders.push(file);
      }
    }
  }

  // Check verbose headers
  const h1Matches = [...content.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];
  h1Matches.forEach(h => {
    const raw = h[1].replace(/<[^>]+>/g, '').trim();
    if (raw.length > 35 && !raw.includes('{')) {
      issues.verboseHeaders.push({ file, text: raw });
    }
  });

  // Check potential invalid postgrest relation syntax (e.g. profiles!something)
  const relMatches = [...content.matchAll(/\b([a-zA-Z0-9_]+)![a-zA-Z0-9_]+\b/g)];
  relMatches.forEach(r => {
    issues.unhandledPostgrestRelations.push({ file, relation: r[0] });
  });
});

console.log('\n--- AUDIT SUMMARY ---');
console.log(`Compressive Grids without Breakpoints: ${issues.compressiveGrids.length}`);
issues.compressiveGrids.forEach(cg => console.log(`  [${cg.file}] -> ${cg.classStr}`));

console.log(`\nUnsafe Loaders: ${issues.unsafeLoaders.length}`);
issues.unsafeLoaders.forEach(ul => console.log(`  [${ul}]`));

console.log(`\nVerbose H1 Headers: ${issues.verboseHeaders.length}`);
issues.verboseHeaders.forEach(vh => console.log(`  [${vh.file}] -> "${vh.text}"`));

console.log(`\nExplicit PostgREST Relation Overrides: ${issues.unhandledPostgrestRelations.length}`);
issues.unhandledPostgrestRelations.slice(0, 10).forEach(r => console.log(`  [${r.file}] -> ${r.relation}`));
