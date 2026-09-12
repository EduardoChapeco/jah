import fs from 'fs';
import * as babel from '@babel/parser';

function checkFile(filePath) {
  console.log('--- Checking:', filePath);
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    babel.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
    console.log('No syntax errors in', filePath);
  } catch (err) {
    console.error('Syntax error in', filePath, ':', err.message, 'at line', err.loc?.line, 'col', err.loc?.column);
  }
}

checkFile('src/routes/_store.conta.empresa.tsx');
checkFile('src/routes/_store.classificados.$id.tsx');
