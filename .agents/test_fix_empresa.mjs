import fs from 'fs';
import * as babel from '@babel/parser';

const code = fs.readFileSync('src/routes/_store.conta.empresa.tsx', 'utf8');
const lines = code.split('\n');

// In line 776, add </div> and )}
const testLines = [...lines];
testLines.splice(776, 0, '          </div>', '        )}');

try {
  babel.parse(testLines.join('\n'), { sourceType: 'module', plugins: ['typescript', 'jsx'] });
  console.log('FOUND! Adding </div> and )} at line 776 fixes _store.conta.empresa.tsx completely!');
} catch (err) {
  console.log('Still error in _store.conta.empresa.tsx:', err.message, 'at', err.loc);
}
