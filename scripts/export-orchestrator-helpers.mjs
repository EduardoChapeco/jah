import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('src/services/api-orchestrator.functions.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'async function getNextActiveKey(provider: ApiProvider)',
  'export async function getNextActiveKey(provider: ApiProvider)'
);

content = content.replace(
  'async function markKeyError(keyId: string, errorMessage: string)',
  'export async function markKeyError(keyId: string, errorMessage: string)'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Exported getNextActiveKey and markKeyError in api-orchestrator.functions.ts');
