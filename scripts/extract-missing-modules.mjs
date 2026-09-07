import fs from 'fs';
import path from 'path';

const refDir = path.resolve('..', 'projetos-referencias');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.log('Source does not exist:', src);
    return;
  }
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
    fs.copyFileSync(src, dest);
    console.log('Copied file:', path.relative(process.cwd(), dest));
  }
}

console.log('=== EXTRAINDO MÓDULOS FALTANTES DOS DOSSIÊS ===');

// 1. KDS (Kitchen Display System) from wider
const kdsSrcComp = path.join(refDir, 'wider', 'src', 'components', 'kds');
const kdsDestComp = path.resolve('src', 'components', 'restaurante', 'kds');
copyRecursive(kdsSrcComp, kdsDestComp);

const kdsEngineSrc = path.join(refDir, 'wider', 'src', 'core', 'engines', 'kds.engine.ts');
const kdsEngineDest = path.resolve('src', 'lib', 'engines', 'kds.engine.ts');
copyRecursive(kdsEngineSrc, kdsEngineDest);

const kdsPagesSrc = path.join(refDir, 'wider', 'src', 'pages', 'os', 'kds');
const kdsPagesDest = path.resolve('src', 'components', 'restaurante', 'kds-pages');
copyRecursive(kdsPagesSrc, kdsPagesDest);

// 2. Picking WMS from classificadoswaesy
const pickingPageSrc = path.join(refDir, 'classificadoswaesy', 'src', 'pages', 'PickingPage.tsx');
const pickingPageDest = path.resolve('src', 'components', 'wms', 'PickingPage.tsx');
copyRecursive(pickingPageSrc, pickingPageDest);

const usePickingSrc = path.join(refDir, 'classificadoswaesy', 'src', 'hooks', 'usePicking.ts');
const usePickingDest = path.resolve('src', 'hooks', 'usePicking.ts');
copyRecursive(usePickingSrc, usePickingDest);

// 3. Garçom App & Mesas from classificadoswaesy
const garcomSrc = path.join(refDir, 'classificadoswaesy', 'src', 'pages', 'apps', 'GarcomApp.tsx');
const garcomDest = path.resolve('src', 'components', 'restaurante', 'GarcomApp.tsx');
copyRecursive(garcomSrc, garcomDest);

const mesasSrc = path.join(refDir, 'classificadoswaesy', '_sources', 'wider', 'src', 'pages', 'os', 'restaurant', 'OSMesasPage.tsx');
const mesasDest = path.resolve('src', 'components', 'restaurante', 'OSMesasPage.tsx');
copyRecursive(mesasSrc, mesasDest);

console.log('Extração dos módulos complementares concluída!');
