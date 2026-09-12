import fs from 'fs';
import path from 'path';

// 1. Patch _store.diretorio.$id.tsx
const dirPath = path.resolve('src/routes/_store.diretorio.$id.tsx');
let dirContent = fs.readFileSync(dirPath, 'utf-8').replace(/\r\n/g, '\n');

if (!dirContent.includes('getIdentity')) {
  dirContent = dirContent.replace(
    'import { getMuralFeed, getCompanyEmployerStats }',
    'import { getIdentity } from "@/services/identity.functions";\nimport { getMuralFeed, getCompanyEmployerStats }'
  );
}

dirContent = dirContent.replace(
  '        employerStatsRes,\n      ] = await Promise.all([',
  '        employerStatsRes,\n        identityRes,\n      ] = await Promise.all(['
);

dirContent = dirContent.replace(
  '        targetStore\n          ? getCompanyEmployerStats({ data: { storeId: targetStore, companyName: listing.business_name || listing.name } }).catch(() => null)\n          : Promise.resolve(null),\n      ]);',
  '        targetStore\n          ? getCompanyEmployerStats({ data: { storeId: targetStore, companyName: listing.business_name || listing.name } }).catch(() => null)\n          : Promise.resolve(null),\n        getIdentity().catch(() => null),\n      ]);'
);

dirContent = dirContent.replace(
  '      const combinedReviews = [...dealReviews, ...publicReviews];',
  `      const combinedReviews = [...dealReviews, ...publicReviews];
      const isOwner = Boolean(
        identityRes?.id &&
        (listing.owner_id === identityRes.id ||
         listing.user_id === identityRes.id ||
         identityRes.store_id === targetStore ||
         identityRes.role === "admin")
      );`
);

dirContent = dirContent.replace(
  '        employerStats: employerStatsRes || null,\n      };',
  '        employerStats: employerStatsRes || null,\n        isOwner,\n      };'
);

dirContent = dirContent.replace(
  '  const employerStats = data?.employerStats ?? null;',
  '  const employerStats = data?.employerStats ?? null;\n  const isOwner = data?.isOwner ?? false;'
);

dirContent = dirContent.replace(
  '      employerStats={employerStats}\n      source="directory"',
  '      employerStats={employerStats}\n      isOwner={isOwner}\n      source="directory"'
);

fs.writeFileSync(dirPath, dirContent, 'utf-8');
console.log('Patched _store.diretorio.$id.tsx successfully!');

// 2. Patch _store.perfil-da-loja.tsx
const perfilPath = path.resolve('src/routes/_store.perfil-da-loja.tsx');
let perfilContent = fs.readFileSync(perfilPath, 'utf-8').replace(/\r\n/g, '\n');

if (!perfilContent.includes('getIdentity')) {
  perfilContent = perfilContent.replace(
    'import { getMuralFeed, getCompanyEmployerStats }',
    'import { getIdentity } from "@/services/identity.functions";\nimport { getMuralFeed, getCompanyEmployerStats }'
  );
}

perfilContent = perfilContent.replace(
  '        employerStatsRes,\n      ] = await Promise.all([',
  '        employerStatsRes,\n        identityRes,\n      ] = await Promise.all(['
);

perfilContent = perfilContent.replace(
  '        targetStore\n          ? getCompanyEmployerStats({ data: { storeId: targetStore } }).catch(() => null)\n          : Promise.resolve(null),\n      ]);',
  '        targetStore\n          ? getCompanyEmployerStats({ data: { storeId: targetStore } }).catch(() => null)\n          : Promise.resolve(null),\n        getIdentity().catch(() => null),\n      ]);'
);

perfilContent = perfilContent.replace(
  '      return {\n        profile,',
  `      const isOwner = Boolean(
        identityRes?.id &&
        (profile?.owner_id === identityRes.id ||
         profile?.user_id === identityRes.id ||
         identityRes.store_id === profile?.id ||
         identityRes.role === "admin")
      );

      return {
        profile,`
);

perfilContent = perfilContent.replace(
  '        employerStats: employerStatsRes || null,\n        builderTree:',
  '        employerStats: employerStatsRes || null,\n        isOwner,\n        builderTree:'
);

perfilContent = perfilContent.replace(
  '  const { profile, catalog, categories, jobs, hotpages, banners, posts, reviews, sponsors, employerStats, builderTree } =',
  '  const { profile, catalog, categories, jobs, hotpages, banners, posts, reviews, sponsors, employerStats, builderTree, isOwner } ='
);

perfilContent = perfilContent.replace(
  '      initialTab={search.aba || "catalogo"}\n      source="storefront"',
  '      initialTab={search.aba || "vitrine"}\n      isOwner={isOwner ?? false}\n      source="storefront"'
);

fs.writeFileSync(perfilPath, perfilContent, 'utf-8');
console.log('Patched _store.perfil-da-loja.tsx successfully!');
