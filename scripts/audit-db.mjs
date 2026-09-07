import fs from 'fs';
import path from 'path';

const migDir = path.resolve(process.cwd(), 'supabase', 'migrations');
const files = fs.readdirSync(migDir).filter(f => f.endsWith('.sql'));

const createdTables = new Set();
for (const f of files) {
  const content = fs.readFileSync(path.join(migDir, f), 'utf8');
  const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    createdTables.add(match[1].toLowerCase());
  }
}

console.log('Total unique tables created in jah migrations:', createdTables.size);

// Check travelagencias tables
const refTypesPath = path.resolve(process.cwd(), '..', 'projetos-referencias', 'travelagencias', 'src', 'types', 'supabase.ts');
if (fs.existsSync(refTypesPath)) {
  const content = fs.readFileSync(refTypesPath, 'utf8');
  const matches = content.match(/(\w+):\s*{\s*Row:\s*{/g);
  if (matches) {
    const travelTables = matches.map(m => m.split(':')[0].trim().toLowerCase());
    console.log('Total tables in travelagencias:', travelTables.length);
    const inJah = travelTables.filter(t => createdTables.has(t));
    const missingInJah = travelTables.filter(t => !createdTables.has(t));
    console.log('Travelagencias tables present in jah migrations:', inJah.length);
    console.log('Travelagencias tables NOT in jah migrations:', missingInJah.length);
    console.log('Sample missing tables (first 30):', missingInJah.slice(0, 30));
  }
}

// Check classificadoswaesy tables
const classTypesPath = path.resolve(process.cwd(), '..', 'projetos-referencias', 'classificadoswaesy', 'src', 'integrations', 'supabase', 'types.ts');
if (fs.existsSync(classTypesPath)) {
  const content = fs.readFileSync(classTypesPath, 'utf8');
  const matches = content.match(/(\w+):\s*{\s*Row:\s*{/g);
  if (matches) {
    const classTables = matches.map(m => m.split(':')[0].trim().toLowerCase());
    console.log('Total tables in classificadoswaesy:', classTables.length);
    const inJah = classTables.filter(t => createdTables.has(t));
    const missingInJah = classTables.filter(t => !createdTables.has(t));
    console.log('Classificados tables present in jah migrations:', inJah.length);
    console.log('Classificados tables NOT in jah migrations:', missingInJah.length);
    console.log('Sample missing tables (first 30):', missingInJah.slice(0, 30));
  }
}
