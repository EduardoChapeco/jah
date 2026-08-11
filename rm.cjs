const fs = require('fs');

const files = [
  'src/routes/_store.classificado.$id.tsx',
  'src/routes/_store.conta.classificados.$id.tsx',
  'src/routes/_store.conta.classificados.novo.tsx',
  'src/routes/workspace.configuracoes.fretes.tabelas.tsx',
  'src/routes/workspace.configuracoes.fretes.index.tsx',
  'src/routes/workspace.agenda.servicos.$id.tsx',
  'src/routes/workspace.agenda.servicos.novo.tsx',
];

for (const file of files) {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log('Deleted ' + file);
    }
  } catch(e) {}
}

// Fix feed.tsx error: Property 'map' does not exist on type '{ status: "empty"
let feed = fs.readFileSync('src/routes/feed.tsx', 'utf8');
feed = feed.replace(/offers\.map/g, '(offers.data || []).map');
fs.writeFileSync('src/routes/feed.tsx', feed);

// Fix checkout-hub.tsx error: Property 'customer_id' does not exist on type 'ServerIdentity'.
let chub = fs.readFileSync('src/routes/checkout-hub.tsx', 'utf8');
chub = chub.replace(/user\.customer_id/g, 'user.id');
chub = chub.replace(/user\.session_token/g, '""');
chub = chub.replace(/menu=\{menuItems\}/g, 'menuItems={menuItems}');
chub = chub.replace(/storeName=\{store\.name\}/g, 'store={store}');
fs.writeFileSync('src/routes/checkout-hub.tsx', chub);

// Fix api/webhooks/payment.ts error: Cannot find module '@tanstack/react-start/api'
let webhook = fs.readFileSync('src/routes/api/webhooks/payment.ts', 'utf8');
webhook = webhook.replace(/@tanstack\/react-start\/api/g, '@tanstack/start/api');
fs.writeFileSync('src/routes/api/webhooks/payment.ts', webhook);

// Fix store.functions.ts 
let storeF = fs.readFileSync('src/services/store.functions.ts', 'utf8');
storeF = storeF.replace(/const _getPaymentSettings = async \(\) => \{ return null; \};\n/g, '');
storeF = storeF.replace(/\.handler\(_getPaymentSettings as any\)/g, '.handler(_getPaymentSettings)');
fs.writeFileSync('src/services/store.functions.ts', storeF);

// Fix shipping.functions.ts
let shipF = fs.readFileSync('src/services/shipping.functions.ts', 'utf8');
shipF = shipF.replace(/const _listShippingZones = async \(\) => \{ return \[\]; \};\n/g, '');
shipF = shipF.replace(/\.handler\(_listShippingZones as any\)/g, '.handler(_listShippingZones)');
fs.writeFileSync('src/services/shipping.functions.ts', shipF);

console.log('Done fixing');
