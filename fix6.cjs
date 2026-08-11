const fs = require('fs');

let ship = fs.readFileSync('src/services/shipping.functions.ts', 'utf8');

if (ship.includes('.select("*, shipping_rates(*)")\n  name: string;')) {
  ship = ship.replace(
    '.select("*, shipping_rates(*)")\n  name: string;',
    `.eq("store_id", identity.store_id);\n\n  return zones || [];\n}\n\nexport const listShippingZones = createServerFn({ method: "GET" }).handler(\n  _listShippingZones as any\n);\n\n// ---------------------------------------------------------------------------\n\nexport async function _upsertShippingZone(data: {\n  id?: string;\n  name: string;`
  );
  fs.writeFileSync('src/services/shipping.functions.ts', ship);
  console.log('Fixed shipping.functions.ts');
}

// And check checkout.functions.ts
let check = fs.readFileSync('src/services/checkout.functions.ts', 'utf8');
check = check.replace(/calculateShipping\(\{ data: \{ zipcode/g, 'calculateShipping({ data: { zipcode: zipcode as any');
check = check.replace(/calculateShipping\(\{ data: \{ zipcode: zipcode as any as any/g, 'calculateShipping({ data: { zipcode: zipcode as any');
check = check.replace(/calculateShipping\(\{ data: \{ zipcode: zipcode as any \}\}\)/g, 'calculateShipping({ data: { zipcode: zipcode as any } as any })');
fs.writeFileSync('src/services/checkout.functions.ts', check);

console.log('Done.');
