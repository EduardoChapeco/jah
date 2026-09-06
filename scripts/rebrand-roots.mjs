import fs from 'node:fs';
import path from 'node:path';

// 1. __root.tsx
const rootPath = path.resolve('src/routes/__root.tsx');
let rootContent = fs.readFileSync(rootPath, 'utf8');
rootContent = rootContent.replace(
  'const storeName = brand?.platform_name || store?.name || "JAH";',
  'const storeName = (brand?.platform_name && brand.platform_name !== "JAH") ? brand.platform_name : (store?.name && store.name !== "JAH" ? store.name : "Wider");'
);
rootContent = rootContent.replace(
  '`${storeName} Master OS`',
  '`${storeName} OS`'
);
fs.writeFileSync(rootPath, rootContent, 'utf8');
console.log('Updated __root.tsx');

// 2. _store.entrar.tsx
const entrarPath = path.resolve('src/routes/_store.entrar.tsx');
let entrarContent = fs.readFileSync(entrarPath, 'utf8');
entrarContent = entrarContent.replace(
  '{brand?.platform_name || "JAH"}',
  '{brand?.platform_name && brand.platform_name !== "JAH" ? brand.platform_name : "Wider"}'
);
fs.writeFileSync(entrarPath, entrarContent, 'utf8');
console.log('Updated _store.entrar.tsx');

// 3. api.pwa.manifest[.]json.ts
const pwaPath = path.resolve('src/routes/api.pwa.manifest[.]json.ts');
let pwaContent = fs.readFileSync(pwaPath, 'utf8');
pwaContent = pwaContent.replace('short_name: "JAH",', 'short_name: "Wider",');
pwaContent = pwaContent.replace('name: "JAH Master OS",', 'name: "Wider OS",');
fs.writeFileSync(pwaPath, pwaContent, 'utf8');
console.log('Updated api.pwa.manifest[.]json.ts');

// 4. admin-master.marca.tsx
const marcaPath = path.resolve('src/routes/admin-master.marca.tsx');
let marcaContent = fs.readFileSync(marcaPath, 'utf8');
marcaContent = marcaContent.replace(/\{platformName \|\| "JAH"\}/g, '{platformName || "Wider"}');
marcaContent = marcaContent.replace(/initialBrand\.platform_name \|\| "JAH"/g, 'initialBrand.platform_name || "Wider"');
marcaContent = marcaContent.replace('— Master OS', '— Wider OS');
fs.writeFileSync(marcaPath, marcaContent, 'utf8');
console.log('Updated admin-master.marca.tsx');
