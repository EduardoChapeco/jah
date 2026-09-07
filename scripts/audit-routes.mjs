import fs from 'fs';
import path from 'path';

const routesDir = path.resolve('src', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.startsWith('workspace.'));

const grouped = {};
for (const f of files) {
  const parts = f.split('.');
  const group = parts[1] || 'root';
  if (!grouped[group]) grouped[group] = [];
  grouped[group].push(f);
}

console.log('Workspace Route Groups:');
for (const [grp, rts] of Object.entries(grouped)) {
  console.log(`\n[Group: ${grp}] (${rts.length} routes)`);
  rts.slice(0, 10).forEach(r => console.log('   - ' + r));
  if (rts.length > 10) console.log(`     ... and ${rts.length - 10} more`);
}
