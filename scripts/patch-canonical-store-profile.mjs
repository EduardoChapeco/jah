import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/commerce/canonical-store-profile-view.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add imports if missing
if (!content.includes('store-vitrine-sections-editor')) {
  content = content.replace(
    'import { BannerHeroCarousel }',
    `import {
  StoreVitrineSectionsEditor,
  DEFAULT_STORE_VITRINE_SECTIONS,
  type VitrineSectionConfig,
  type VitrineCardItem,
} from "@/components/commerce/store-vitrine-sections-editor";
import { ProceduralInfiniteFeed } from "@/components/commerce/procedural-infinite-feed";
import { ThreadsFeedCard } from "@/components/social/threads-feed-card";
import { BannerHeroCarousel }`
  );
}

// 2. Add icons to lucide-react import
if (!content.includes('Sparkles,')) {
  content = content.replace(
    '  FileCheck,\n} from "lucide-react";',
    `  FileCheck,
  Sparkles,
  Grid,
  List,
  Camera,
  Edit3,
} from "lucide-react";`
  );
}

// 3. Add isOwner to CanonicalStoreProfileViewProps
if (!content.includes('isOwner?: boolean;')) {
  content = content.replace(
    '  initialTab?: string;',
    '  initialTab?: string;\n  isOwner?: boolean;'
  );
}

// 4. Update default initialTab to "vitrine" and accept isOwner prop
content = content.replace(
  '  initialTab = "catalogo",\n  source = "storefront",',
  '  initialTab = "vitrine",\n  isOwner = false,\n  source = "storefront",'
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Patch 1 applied successfully!');
