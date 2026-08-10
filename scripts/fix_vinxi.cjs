const fs = require('fs');
const path = require('path');

const vinxiPath = path.resolve('node_modules', 'vinxi', 'package.json');
const tRoutesPath = path.resolve('node_modules', '@tanstack', 'start-api-routes', 'node_modules', 'vinxi', 'package.json');

function patch(p) {
  if (fs.existsSync(p)) {
    const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (pkg.exports && pkg.exports['./routes']) {
      pkg.exports['./routes'] = {
        import: "./types/routes.d.ts",
        default: "./types/routes.d.ts",
        types: "./types/routes.d.ts"
      };
      fs.writeFileSync(p, JSON.stringify(pkg, null, 2));
      console.log(`Patched ${p}`);
    }
  }
}

patch(vinxiPath);
patch(tRoutesPath);
