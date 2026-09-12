import fs from 'fs';
import * as babel from '@babel/parser';

const code = fs.readFileSync('src/routes/_store.classificados.$id.tsx', 'utf8');
const lines = code.split('\n');

// Let's test adding </div> before line 2553, or testing parts of JSX
for (let tag of ['div', 'Dialog', 'DialogContent', 'Button', 'Textarea', 'Input']) {
  const testLines = [...lines];
  testLines.splice(2552, 0, `</${tag}>`);
  try {
    babel.parse(testLines.join('\n'), { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    console.log(`FOUND! Adding </${tag}> fixes the syntax!`);
  } catch (err) {
    // try other
  }
}
