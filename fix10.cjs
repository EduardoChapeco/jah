const fs = require('fs');

// 1. Fix cart.functions.ts
let cart = fs.readFileSync('src/services/cart.functions.ts', 'utf8');
cart = cart.replace(/identity\?\.id as string \| undefined/g, 'identity?.id || undefined');
fs.writeFileSync('src/services/cart.functions.ts', cart);

// 2. Fix shipping.functions.ts
let ship = fs.readFileSync('src/services/shipping.functions.ts', 'utf8');
ship = ship.replace(/listShippingZonesHandler/g, '_listShippingZones');
fs.writeFileSync('src/services/shipping.functions.ts', ship);

console.log('Final final fixes applied.');
