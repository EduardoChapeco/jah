import fs from 'fs';
import path from 'path';

const file = path.resolve('src/routes/_store.classificados.$id.tsx');
let content = fs.readFileSync(file, 'utf8');

const jobIdx = content.indexOf('<span>Falar com o Recrutador via WhatsApp</span>');
if (jobIdx !== -1) {
  const start = content.lastIndexOf('{(classified.contact_whatsapp', jobIdx);
  const end = content.indexOf(')}', jobIdx) + 2;
  const newJobBtn = `{(classified.contact_whatsapp || classified.whatsapp || classified.profiles?.phone) && (
                    <ProtectedContactButton
                      phone={classified.contact_whatsapp || classified.whatsapp || classified.profiles?.phone}
                      entityType="job"
                      entityId={classified.id}
                      entityTitle={classified.title}
                      storeId={(classified as any).store_id || null}
                      niche={classified.category || "empregos"}
                      customMessage={\`Olá! Vi a oportunidade de "\${classified.title}" no portal Wider e gostaria de me candidatar.\`}
                      variant="outline"
                      size="lg"
                      label="Falar com o Recrutador via WhatsApp"
                      className="w-full h-11 rounded-xl font-semibold text-xs border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                    />
                  )}`;
  content = content.substring(0, start) + newJobBtn + content.substring(end);
  console.log('Replaced job button!');
}

const genIdx = content.indexOf('Conversar no WhatsApp');
if (genIdx !== -1) {
  const start = content.lastIndexOf('{cleanPhone && (', genIdx);
  const end = content.indexOf(')}', genIdx) + 2;
  const newGenBtn = `{cleanPhone && (
                <ProtectedContactButton
                  phone={cleanPhone}
                  entityType="classified"
                  entityId={classified.id}
                  entityTitle={classified.title}
                  storeId={(classified as any).store_id || null}
                  niche={classified.category || "classificados"}
                  variant="outline"
                  size="lg"
                  label="Conversar no WhatsApp"
                  className="w-full h-11 font-bold border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs"
                />
              )}`;
  content = content.substring(0, start) + newGenBtn + content.substring(end);
  console.log('Replaced general button!');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Classificados buttons updated successfully!');
