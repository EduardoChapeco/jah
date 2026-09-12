import fs from 'fs';
const content = fs.readFileSync('src/routes/_store.classificados.$id.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('proposalOpen') || line.includes('Enviar Proposta') || line.includes('DialogContent') || line.includes('handleSendProposal')) {
    console.log((idx + 1) + ': ' + line.trim().slice(0, 80));
  }
});
