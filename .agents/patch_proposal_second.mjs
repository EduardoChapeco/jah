import fs from 'fs';

const filePath = 'src/routes/_store.classificados.$id.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `                  className="rounded-xl text-xs bg-background resize-none leading-relaxed"
                />
              </div>

              <Button
                onClick={handleSendProposal}`;

const targetStr2 = ` className="rounded-xl text-xs bg-background resize-none leading-relaxed"
 />
 </div>

 <Button
 onClick={handleSendProposal}`;

const customBlock = ` className="rounded-xl text-xs bg-background resize-none leading-relaxed"
 />
 </div>

 {/* Perguntas Personalizadas configuradas pela Empresa/Vendedor */}
 {classified?.store?.custom_inquiry_fields && classified.store.custom_inquiry_fields.length > 0 && (
 <div className="space-y-3 pt-2.5 pb-1 border-t border-border/40">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-foreground">
 Perguntas Adicionais do Vendedor
 </span>
 <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded font-medium">
 Personalizado pela loja
 </span>
 </div>
 {classified.store.custom_inquiry_fields.map((field: any) => (
 <div key={field.id} className="space-y-1">
 <label className="text-xs font-medium text-foreground flex items-center gap-1">
 <span>{field.label}</span>
 {field.required && <span className="text-rose-500 font-bold">*</span>}
 </label>
 {field.type === "textarea" ? (
 <Textarea
 value={customAnswers[field.id] || ""}
 onChange={(e) => setCustomAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))}
 placeholder="Sua resposta..."
 rows={2}
 className="rounded-xl text-xs bg-background resize-none leading-relaxed"
 />
 ) : field.type === "checkbox" ? (
 <label className="flex items-center gap-2 cursor-pointer pt-0.5">
 <input
 type="checkbox"
 checked={!!customAnswers[field.id]}
 onChange={(e) => setCustomAnswers((prev) => ({ ...prev, [field.id]: e.target.checked }))}
 className="size-4 rounded accent-primary"
 />
 <span className="text-xs text-muted-foreground">{field.label}</span>
 </label>
 ) : (
 <Input
 type="text"
 value={customAnswers[field.id] || ""}
 onChange={(e) => setCustomAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))}
 placeholder="Sua resposta..."
 className="h-9 rounded-xl text-xs bg-background"
 />
 )}
 </div>
 ))}
 </div>
 )}

 <Button
 onClick={handleSendProposal}`;

const isCRLF = content.includes('\r\n');
const normalizedTarget = isCRLF ? targetStr2.replace(/\n/g, '\r\n') : targetStr2;
const normalizedReplacement = isCRLF ? customBlock.replace(/\n/g, '\r\n') : customBlock;

if (content.includes(normalizedTarget)) {
  content = content.replace(normalizedTarget, normalizedReplacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully patched second proposal dialog with custom fields!');
} else {
  console.log('Could not find normalizedTarget');
}
