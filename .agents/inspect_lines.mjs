import fs from 'fs';
const c = fs.readFileSync('src/routes/_store.classificados.$id.tsx', 'utf8');
const idx = c.indexOf('Enviar Proposta de Negociação');
console.log(c.slice(idx, idx + 1600));
