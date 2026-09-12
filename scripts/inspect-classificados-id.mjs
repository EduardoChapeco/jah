import fs from 'fs';

const lines = fs.readFileSync('src/routes/_store.classificados.$id.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (
    l.includes('proposalOpen') ||
    l.includes('handleDirectBuy') ||
    l.includes('handleDirectBooking') ||
    l.includes('handleBookService') ||
    l.includes('Comprar') ||
    l.includes('Negociar') ||
    l.includes('Proposta') ||
    l.includes('Agendar')
  ) {
    console.log(`${i + 1}: ${l.trim().slice(0, 100)}`);
  }
});
