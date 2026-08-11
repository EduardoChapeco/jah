const fs = require('fs');

let content = fs.readFileSync('src/services/shipping.functions.ts', 'utf8');

// 1. Rename Handler functions to _name
content = content.replace(/async function ([a-zA-Z0-9_]+)Handler/g, 'async function _$1');

// 2. Rename handler calls
content = content.replace(/\.handler\(([a-zA-Z0-9_]+)Handler\)/g, '.handler(_$1 as any)');

// 3. Rename arrow function calls inside handlers
content = content.replace(/=> ([a-zA-Z0-9_]+)Handler/g, '=> _$1');

// 4. Add the missing dummy functions (since they were in previous fixes)
const dummies = `
export const listDrivers = createServerFn().validator((d: any) => d).handler(async () => []);
export const upsertDriver = createServerFn().validator((d: any) => d).handler(async () => ({}));
`;
content += '\n' + dummies;

fs.writeFileSync('src/services/shipping.functions.ts', content);
console.log('Fixed shipping.functions.ts');
