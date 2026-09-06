import fs from 'node:fs';
import path from 'node:path';

const replacements = [
  { from: /JAH Turismo/g, to: 'Wider Turismo' },
  { from: /JAH SimLab/g, to: 'Wider SimLab' },
  { from: /JAH Hub/g, to: 'Wider Hub' },
  { from: /JAH OS/g, to: 'Wider OS' },
  { from: /JAH Root/g, to: 'Wider Root' },
  { from: /JAH Studio/g, to: 'Wider Studio' },
  { from: /JAH PWA/g, to: 'Wider PWA' },
  { from: /JAH Web App/g, to: 'Wider Web App' },
  { from: /JAH Universal Experience Builder/g, to: 'Wider Universal Experience Builder' },
  { from: /JAH Universal Experience OS/g, to: 'Wider Universal Experience OS' },
  { from: /window\.__JAH_EXPERIENCE_NODES__/g, to: 'window.__WIDER_EXPERIENCE_NODES__' },
  { from: /Cliente JAH/g, to: 'Cliente Wider' },
  { from: /Membro JAH/g, to: 'Membro Wider' },
  { from: /Morador Verificado JAH/g, to: 'Morador Verificado Wider' },
  { from: /Loja Oficial JAH/g, to: 'Loja Oficial Wider' },
  { from: /Redação JAH/g, to: 'Redação Wider' },
  { from: /Gestão RH JAH/g, to: 'Gestão RH Wider' },
  { from: /JAH Pulse Multi-Signal v1/g, to: 'Wider Pulse Multi-Signal v1' },
  { from: /JAH AI Assistant/g, to: 'Wider AI Assistant' },
  { from: /ecossistema JAH/g, to: 'ecossistema Wider' },
  { from: /ecossistema de compras e serviços JAH/g, to: 'ecossistema de compras e serviços Wider' },
  { from: /administração do JAH/g, to: 'administração da Wider' },
  { from: /Bem-vindo\(a\) ao JAH!/g, to: 'Bem-vindo(a) ao Wider!' },
  { from: /Portal do Funcionário JAH/g, to: 'Portal do Funcionário Wider' },
  { from: /JAH_VOUCHER_/g, to: 'WIDER_VOUCHER_' },
  { from: /JAH-VCH:/g, to: 'WIDER-VCH:' },
  { from: /WMS Expedição & Picking \| JAH/g, to: 'WMS Expedição & Picking | Wider OS' },
  { from: /Editor de App PWA \| JAH/g, to: 'Editor de App PWA | Wider OS' },
  { from: /Espelho de Ponto Eletrônico \| Gestão RH JAH/g, to: 'Espelho de Ponto Eletrônico | Gestão RH Wider OS' },
  { from: /Console de Amostragem Sintética & Focus Group \| JAH SimLab/g, to: 'Console de Amostragem Sintética & Focus Group | Wider SimLab' },
  { from: /Radar Global de Destinos & IA \| JAH Turismo/g, to: 'Radar Global de Destinos & IA | Wider Turismo' },
  { from: /Nova Matéria \| Redação JAH \| Workspace Wider OS/g, to: 'Nova Matéria | Redação | Workspace Wider OS' },
  { from: />JAH</g, to: '>Wider<' },
  { from: /"JAH"/g, to: '"Wider"' },
  { from: /'JAH'/g, to: "'Wider'" },
  { from: /\| JAH/g, to: '| Wider OS' },
  { from: /O JAH é/g, to: 'O Wider é' },
  { from: /do JAH/g, to: 'do Wider' },
  { from: /no JAH/g, to: 'no Wider' },
  { from: /ao JAH/g, to: 'ao Wider' },
  { from: /JAH Matriz/g, to: 'Wider Matriz' },
  { from: /Ecossistema JAH/g, to: 'Ecossistema Wider' },
];

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
        processDir(full);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.json'))) {
      // Don't modify database passwords or connection URLs
      let text = fs.readFileSync(full, 'utf8');
      let changed = false;
      for (const { from, to } of replacements) {
        if (from.test(text)) {
          text = text.replace(from, to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(full, text, 'utf8');
        console.log(`Rebranded: ${path.relative('.', full)}`);
      }
    }
  }
}

processDir(path.resolve('src'));
console.log('Universal Rebranding to Wider completed across src/');
