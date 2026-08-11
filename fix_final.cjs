const fs = require('fs');

function replaceFile(path, regex, replacement) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(regex, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Fixed ' + path);
  }
}

// 1. identity.server.ts
replaceFile('src/lib/identity.server.ts', /'@\/lib\/tenant'/g, "'@/lib/tenant.server'");

// 2. Delete _store.agendar.$id.tsx
if (fs.existsSync('src/routes/_store.agendar.$id.tsx')) {
  fs.unlinkSync('src/routes/_store.agendar.$id.tsx');
  console.log('Deleted src/routes/_store.agendar.$id.tsx');
}

// 3. _store.checkout.tsx
replaceFile('src/routes/_store.checkout.tsx', /c =>/g, '(c: any) =>');

// 4. webhooks payment delete
if (fs.existsSync('src/routes/api/webhooks/payment.ts')) {
  fs.unlinkSync('src/routes/api/webhooks/payment.ts');
  console.log('Deleted src/routes/api/webhooks/payment.ts');
}

// 5. checkout-hub and feed delete
if (fs.existsSync('src/routes/checkout-hub.tsx')) fs.unlinkSync('src/routes/checkout-hub.tsx');
if (fs.existsSync('src/routes/feed.tsx')) fs.unlinkSync('src/routes/feed.tsx');

// 6. booking.functions.ts import duplicate
replaceFile('src/services/booking.functions.ts', /import \{ getServerIdentity, assertStoreAccess \} from "@\/lib\/server-access";/g, '');

// 7. cart.functions.ts
replaceFile('src/services/cart.functions.ts', /await upsertCart\(undefined, identity\?.id/g, 'await upsertCart(undefined, identity?.id as string | undefined');
replaceFile('src/services/cart.functions.ts', /await upsertCart\(undefined, identity\.id/g, 'await upsertCart(undefined, identity.id as string | undefined');

// 8. checkout.functions.ts
replaceFile('src/services/checkout.functions.ts', /calculateShipping\(\{ data: \{ zipcode/g, 'calculateShipping({ data: { zipcode: zipcode as any');
replaceFile('src/services/checkout.functions.ts', /calculateShipping\(\{ data: \{ zipcode: zipcode as any \}\}\)/g, 'calculateShipping({ data: { zipcode: zipcode as any } as any })'); // just force cast

// 9. shipping and store .functions
replaceFile('src/services/store.functions.ts', /const _getPaymentSettings = async \(\) => \{ return null; \};/g, '');
replaceFile('src/services/store.functions.ts', /export const getPaymentSettings = createServerFn\(\)\.handler\(_getPaymentSettings\);/g, 'const _getPaymentSettings = async () => null; export const getPaymentSettings = createServerFn().handler(_getPaymentSettings as any);');

replaceFile('src/services/shipping.functions.ts', /const _listShippingZones = async \(\) => \{ return \[\]; \};/g, '');
replaceFile('src/services/shipping.functions.ts', /export const listShippingZones = createServerFn\(\)\.handler\(_listShippingZones\);/g, 'const _listShippingZones = async () => []; export const listShippingZones = createServerFn().handler(_listShippingZones as any);');

console.log('Final fixes applied.');
