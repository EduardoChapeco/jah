import fs from 'fs';

const filePath = 'src/routes/_store.classificados.$id.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add getProfile import
if (!content.includes('getProfile')) {
  content = content.replace(
    'import { createDealProposal } from "@/services/deals.functions";',
    'import { createDealProposal } from "@/services/deals.functions";\nimport { getProfile } from "@/services/auth.functions";'
  );
} else if (!content.includes('import { getProfile }')) {
  content = content.replace(
    'import { createDealProposal } from "@/services/deals.functions";',
    'import { createDealProposal } from "@/services/deals.functions";\nimport { getProfile } from "@/services/auth.functions";'
  );
}

// 2. Remove accidentally pasted code inside ClassifiedDetailError
const lines = content.split('\n');
console.log('Original line count:', lines.length);

// Let's locate the error component closing and start of CATEGORY_LABELS
let errorStart = -1;
let categoryLabelsStart = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function ClassifiedDetailError(')) {
    errorStart = i;
  }
  if (lines[i].includes('const CATEGORY_LABELS: Record<string, string>')) {
    categoryLabelsStart = i;
    break;
  }
}

console.log('errorStart:', errorStart, 'categoryLabelsStart:', categoryLabelsStart);

// Inside ClassifiedDetailError, after <Link to="/classificados"> ... </Button> </div>, we should close the error component
// and drop the orphaned modal markup before CATEGORY_LABELS
const cleanErrorComponent = `function ClassifiedDetailError({ error }: { error: Error }) {
  if (isRedirect(error)) {
    throw error;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-4">
      <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-2">
        <Tag className="size-8 text-primary" />
      </div>
      <h1 className="text-xl font-bold text-foreground">Anúncio em Carregamento ou Indisponível</h1>
      <p className="text-xs text-muted-foreground max-w-md mx-auto">
        Não foi possível carregar os dados deste anúncio no momento. Tente novamente em instantes.
      </p>
      <div className="pt-2 flex items-center justify-center gap-3">
        <Button asChild variant="outline" className="rounded-xl text-xs">
          <Link to="/classificados">
            <ArrowLeft className="size-4 mr-1.5" />
            <span>Voltar aos Classificados</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
`;

const before = lines.slice(0, errorStart).join('\n');
const after = lines.slice(categoryLabelsStart).join('\n');

const newContent = before + '\n' + cleanErrorComponent + '\n' + after;
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Updated _store.classificados.$id.tsx successfully. New lines:', newContent.split('\n').length);
