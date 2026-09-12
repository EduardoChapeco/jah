import fs from 'fs';
import * as babel from '@babel/parser';

const code = fs.readFileSync('src/routes/_store.classificados.$id.tsx', 'utf8');

try {
  babel.parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });
  console.log('No error in babel parse!');
} catch (err) {
  console.log('Error at', err.loc);
  console.log('Message:', err.message);
}
