import fs from 'fs';
import path from 'path';

const refTravel = path.resolve('..', 'projetos-referencias', 'travelagencias', 'src');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// 1. Integrations Supabase Client
ensureDir('src/integrations/supabase');
fs.writeFileSync('src/integrations/supabase/client.ts', `export { supabase } from "@/lib/supabase";\n`);
console.log('Created src/integrations/supabase/client.ts');

// 2. agency-context.tsx
if (fs.existsSync(path.join(refTravel, 'lib', 'agency-context.tsx'))) {
  fs.copyFileSync(path.join(refTravel, 'lib', 'agency-context.tsx'), path.resolve('src/lib/agency-context.tsx'));
  console.log('Copied src/lib/agency-context.tsx');
}

// 3. Shims for services: proposals, crm, boarding, trips, vouchers, quotes, reaccommodation, rooming, proposal-storage
const servicesToShim = [
  'proposals', 'crm', 'boarding', 'trips', 'vouchers', 'quotes', 'reaccommodation', 'rooming', 'proposal-storage'
];
ensureDir('src/services');
for (const s of servicesToShim) {
  const target = `src/services/${s}.ts`;
  fs.writeFileSync(target, `export * from "@/services/tourism/${s}";\n`);
  console.log(`Created shim: ${target}`);
}

// 4. Shims for lib: formatters, pricing, adapters
ensureDir('src/lib');
fs.writeFileSync('src/lib/formatters.ts', `export * from "@/lib/tourism/formatters";\n`);
fs.writeFileSync('src/lib/pricing.ts', `export * from "@/lib/tourism/pricing";\n`);
fs.writeFileSync('src/lib/adapters.ts', `export * from "@/lib/tourism/adapters";\n`);

ensureDir('src/utils');
fs.writeFileSync('src/utils/pricing.ts', `export * from "@/lib/tourism/pricing";\n`);

// 5. Shims for components/studio and components/proposals
ensureDir('src/components/studio/sections');
const sections = [
  'SectionCover', 'SectionTravelers', 'SectionFlights', 'SectionHotels', 
  'SectionTransfers', 'SectionTours', 'SectionItinerary', 'SectionMap', 
  'SectionIncludes', 'SectionFinancial'
];
for (const sec of sections) {
  fs.writeFileSync(`src/components/studio/sections/${sec}.tsx`, `export * from "@/components/tourism/studio/sections/${sec}";\n`);
}

const studioComps = [
  'StudioSidebar', 'StudioFrame', 'StudioFormatPicker', 'StudioTemplatePicker', 
  'StudioToolbar', 'StudioUnsplashPicker', 'StudioMapWidget'
];
for (const comp of studioComps) {
  fs.writeFileSync(`src/components/studio/${comp}.tsx`, `export * from "@/components/tourism/studio/${comp}";\n`);
}

ensureDir('src/components/proposals/templates');
fs.writeFileSync('src/components/proposals/ProposalFormFields.tsx', `export * from "@/components/tourism/proposals/ProposalFormFields";\n`);
fs.writeFileSync('src/components/proposals/templates/index.ts', `export * from "@/components/tourism/proposals/templates/index";\n`);
fs.writeFileSync('src/components/proposals/ProposalStudio.tsx', `export * from "@/components/tourism/proposals/ProposalStudio";\n`);

// 6. UI Field component shim
ensureDir('src/components/ui');
if (fs.existsSync(path.join(refTravel, 'components', 'ui', 'field.tsx'))) {
  fs.copyFileSync(path.join(refTravel, 'components', 'ui', 'field.tsx'), path.resolve('src/components/ui/field.tsx'));
  console.log('Copied src/components/ui/field.tsx');
}
if (fs.existsSync(path.join(refTravel, 'components', 'ui', 'searchable-select.tsx'))) {
  fs.copyFileSync(path.join(refTravel, 'components', 'ui', 'searchable-select.tsx'), path.resolve('src/components/ui/searchable-select.tsx'));
  console.log('Copied src/components/ui/searchable-select.tsx');
}

// 7. use-confirm hook
if (fs.existsSync(path.join(refTravel, 'hooks', 'use-confirm.tsx'))) {
  ensureDir('src/hooks');
  fs.copyFileSync(path.join(refTravel, 'hooks', 'use-confirm.tsx'), path.resolve('src/hooks/use-confirm.tsx'));
  console.log('Copied src/hooks/use-confirm.tsx');
}

console.log('Todos os shims e conexões canônicas foram configurados com sucesso!');
