import fs from 'node:fs';
import path from 'node:path';

const fileReplacements = [
  {
    file: 'src/routes/reclamar.novo.tsx',
    subs: [[/JAH Reclamar/g, 'Wider Reclamar']],
  },
  {
    file: 'src/routes/claim.reivindicar.$entityId.tsx',
    subs: [[/JAH Trust & Compliance/g, 'Wider Trust & Compliance']],
  },
  {
    file: 'src/routes/_store.motorista.$slug.tsx',
    subs: [[/na JAH/g, 'na Wider']],
  },
  {
    file: 'src/routes/_store.entrar.tsx',
    subs: [[/Instalar JAH App/g, 'Instalar Wider App']],
  },
  {
    file: 'src/routes/workspace.pdv.cozinha.tsx',
    subs: [[/JAH Cozinha Inteligente/g, 'Wider Cozinha Inteligente']],
  },
  {
    file: 'src/routes/api.pwa.manifest[.]json.ts',
    subs: [[/JAH — Master OS/g, 'Wider — Master OS']],
  },
  {
    file: 'src/routes/admin-master.logistica.tsx',
    subs: [[/JAH Log/g, 'Wider Log']],
  },
  {
    file: 'src/lib/whatsapp.ts',
    subs: [
      [/portal JAH/g, 'portal Wider'],
      [/guia JAH/g, 'guia Wider'],
    ],
  },
  {
    file: 'src/lib/classifieds/semantics.ts',
    subs: [[/Garantia JAH/g, 'Garantia Wider']],
  },
  {
    file: 'src/components/tourism/vouchers/templates/template-voucher-a4.tsx',
    subs: [[/JAH TravelOS/g, 'Wider TravelOS']],
  },
  {
    file: 'src/components/studio/carousel-wizard-modal.tsx',
    subs: [[/JAH Creative Studio/g, 'Wider Creative Studio']],
  },
  {
    file: 'src/components/studio/slide-renderer.tsx',
    subs: [[/'JAH Store'/g, "'Wider Store'"]],
  },
  {
    file: 'src/components/studio/studio-canvas.tsx',
    subs: [[/PROMOÇÃO JAH/g, 'PROMOÇÃO WIDER']],
  },
  {
    file: 'src/components/studio/video-studio-editor.tsx',
    subs: [
      [/JAH Video Studio/g, 'Wider Video Studio'],
      [/Vídeo Promocional JAH/g, 'Vídeo Promocional Wider'],
    ],
  },
  {
    file: 'src/components/office/contract-editor-sheet.tsx',
    subs: [
      [/'Minha Loja JAH'/g, "'Minha Loja Wider'"],
      [/JAH Office Suite/g, 'Wider Office Suite'],
    ],
  },
  {
    file: 'src/components/commerce/dynamic-sections/reputation-badges-strip.tsx',
    subs: [[/JAH Trust Center/g, 'Wider Trust Center']],
  },
  {
    file: 'src/components/commerce/dynamic-sections/portal-carnes-bills-widget.tsx',
    subs: [[/JAH EXPERIENCIAS DIGITAIS/g, 'WIDER EXPERIENCIAS DIGITAIS']],
  },
  {
    file: 'src/services/builder-exporter.ts',
    subs: [
      [/Experiência Interativa JAH/g, 'Experiência Interativa Wider'],
      [/Loja Certificada JAH/g, 'Loja Certificada Wider'],
      [/JAH Standalone Experience/g, 'Wider Standalone Experience'],
    ],
  },
];

for (const { file, subs } of fileReplacements) {
  const p = path.resolve(file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    for (const [from, to] of subs) {
      content = content.replace(from, to);
    }
    fs.writeFileSync(p, content, 'utf8');
    console.log(`Fine-grain rebranded: ${file}`);
  }
}
