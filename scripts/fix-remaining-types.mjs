import fs from 'fs';

// 1. Fix src/types/wms-workflows-reputation.ts
{
  let file = fs.readFileSync('src/types/wms-workflows-reputation.ts', 'utf8');
  file = file.replace('settings: Record<string, unknown>;', 'settings: Record<string, any>;');
  fs.writeFileSync('src/types/wms-workflows-reputation.ts', file, 'utf8');
  console.log('Fixed wms-workflows-reputation.ts');
}

// 2. Fix src/types/gastronomy-pos.ts
{
  let file = fs.readFileSync('src/types/gastronomy-pos.ts', 'utf8');
  file = file.replaceAll('metadata: Record<string, unknown>;', 'metadata: Record<string, any>;');
  fs.writeFileSync('src/types/gastronomy-pos.ts', file, 'utf8');
  console.log('Fixed gastronomy-pos.ts');
}

// 3. Fix src/services/simlab.functions.ts
{
  let file = fs.readFileSync('src/services/simlab.functions.ts', 'utf8');
  file = file.replace("stimulus?.experiment_id || 'exp-batch'", "(stimulus as any)?.experiment_id || 'exp-batch'");
  fs.writeFileSync('src/services/simlab.functions.ts', file, 'utf8');
  console.log('Fixed simlab.functions.ts');
}

// 4. Fix src/services/support-tickets.functions.ts
{
  let file = fs.readFileSync('src/services/support-tickets.functions.ts', 'utf8');
  file = file.replace('${identity.name || "Supervisor"}', 'Supervisor');
  fs.writeFileSync('src/services/support-tickets.functions.ts', file, 'utf8');
  console.log('Fixed support-tickets.functions.ts');
}
