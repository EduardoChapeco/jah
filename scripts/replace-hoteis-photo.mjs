import fs from 'fs';

const file = 'src/routes/workspace.turismo.hoteis.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<Label className="text-[10px] font-semibold text-foreground">URL da Foto do Quarto</Label>
 <Input
 value={room.cover_photo_url || ""}
 onChange={(e) => handleUpdateRoomCategory(room.id, { cover_photo_url: e.target.value })}
 placeholder="https://..."
 className="h-8 rounded-lg bg-background text-xs"
 />`;

const replacement = `<Label className="text-[10px] font-semibold text-foreground">Foto do Quarto</Label>
 <ImageUpload
 value={room.cover_photo_url || ""}
 onChange={(url) => handleUpdateRoomCategory(room.id, { cover_photo_url: url })}
 onRemove={() => handleUpdateRoomCategory(room.id, { cover_photo_url: "" })}
 bucket="destination-media"
 aspectPreset="widescreen"
 helperText="Upload da foto do quarto"
 />`;

const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = target.replace(/\r\n/g, '\n');
const normalizedReplacement = replacement.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
  const updated = normalizedContent.replace(normalizedTarget, normalizedReplacement);
  fs.writeFileSync(file, updated, 'utf8');
  console.log('Successfully updated hoteis room photo to ImageUpload!');
} else {
  console.error('Could not find target block in hoteis.tsx');
}
