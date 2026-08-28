const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath, fileList);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const targetDirs = [
  path.join(__dirname, '../src/routes'),
  path.join(__dirname, '../src/components'),
];

let filesModified = 0;

const colorMappings = [
  // RED -> Destructive
  { regex: /text-red-[1-9]00/g, replacement: 'text-destructive' },
  { regex: /bg-red-[1-9]00(\/[0-9]+)?/g, replacement: 'bg-destructive$1' },
  { regex: /border-red-[1-9]00/g, replacement: 'border-destructive' },
  { regex: /ring-red-[1-9]00/g, replacement: 'ring-destructive' },
  
  // GREEN -> Success
  { regex: /text-green-[1-9]00/g, replacement: 'text-success' },
  { regex: /bg-green-[1-9]00(\/[0-9]+)?/g, replacement: 'bg-success$1' },
  { regex: /border-green-[1-9]00/g, replacement: 'border-success' },
  { regex: /ring-green-[1-9]00/g, replacement: 'ring-success' },

  // YELLOW/ORANGE -> Warning
  { regex: /text-(yellow|orange)-[1-9]00/g, replacement: 'text-warning' },
  { regex: /bg-(yellow|orange)-[1-9]00(\/[0-9]+)?/g, replacement: 'bg-warning$2' },
  { regex: /border-(yellow|orange)-[1-9]00/g, replacement: 'border-warning' },

  // BLUE -> Info (or primary, but let's use info as it's typically used for links/info)
  { regex: /text-blue-[1-9]00/g, replacement: 'text-info' },
  { regex: /bg-blue-[1-9]00(\/[0-9]+)?/g, replacement: 'bg-info$1' },
  { regex: /border-blue-[1-9]00/g, replacement: 'border-info' },

  // PURPLE/PINK/INDIGO/TEAL/CYAN -> Primary or Muted
  { regex: /text-(purple|pink|indigo|teal|cyan)-[1-9]00/g, replacement: 'text-primary' },
  { regex: /bg-(purple|pink|indigo|teal|cyan)-[1-9]00(\/[0-9]+)?/g, replacement: 'bg-primary$2' },
  { regex: /border-(purple|pink|indigo|teal|cyan)-[1-9]00/g, replacement: 'border-primary' },
];

for (const dir of targetDirs) {
  if (!fs.existsSync(dir)) continue;
  
  const files = walk(dir);
  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;
    
    // Remove shadows (except in business-location-picker)
    if (!file.includes('business-location-picker.tsx')) {
        const newContent = content.replace(/\s*shadow-(sm|md|lg|xl|2xl|inner|popover)/g, '');
        if (newContent !== content) {
            content = newContent;
            modified = true;
        }
    }
    
    // Replace colors
    for (const mapping of colorMappings) {
        const newContent = content.replace(mapping.regex, mapping.replacement);
        if (newContent !== content) {
            content = newContent;
            modified = true;
        }
    }
    
    if (modified) {
        fs.writeFileSync(file, content, 'utf-8');
        filesModified++;
    }
  }
}

console.log(`Successfully cleaned up Design System violations in ${filesModified} files.`);
