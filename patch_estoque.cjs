const fs = require('fs');

let code = fs.readFileSync('src/routes/workspace.estoque.index.tsx', 'utf8');

// 1. Add negativeCount to metrics
code = code.replace(
  /let criticalCount = 0;/,
  `let criticalCount = 0;\n    let negativeCount = 0;`
);
code = code.replace(
  /if \(onHand <= 5\) criticalCount\+\+;/,
  `if (onHand <= 5) criticalCount++;\n      if (onHand < 0) negativeCount++;`
);
code = code.replace(
  /criticalCount,/,
  `criticalCount,\n      negativeCount,`
);

// 2. Add 'negative' to filteredStock
code = code.replace(
  /if \(statusTab === "critical" && onHand > 5\) return false;/,
  `if (statusTab === "critical" && onHand > 5) return false;\n      if (statusTab === "negative" && onHand >= 0) return false;`
);

// 3. Add TabsTrigger for negative
code = code.replace(
  /<TabsTrigger value="critical">Crítico<\/TabsTrigger>/,
  `<TabsTrigger value="critical">Crítico</TabsTrigger>\n          <TabsTrigger value="negative" className="text-destructive font-bold">\n            <AlertTriangle className="h-4 w-4 mr-2" /> Em Aberto (Negativo)\n            {metrics.negativeCount > 0 && <Badge variant="destructive" className="ml-2">{metrics.negativeCount}</Badge>}\n          </TabsTrigger>`
);

fs.writeFileSync('src/routes/workspace.estoque.index.tsx', code);
console.log('Estoque UI patched');
