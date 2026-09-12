import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/commerce/canonical-store-profile-view.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// 1. Add vitrineSections and postViewMode state right after isBioExpanded
const targetState = `  // Modal de Lightbox para fotos dos posts
  const [lightboxPost, setLightboxPost] = useState<any | null>(null);
  const [isBioExpanded, setIsBioExpanded] = useState(false);`;

const replacementState = `  // Modal de Lightbox para fotos dos posts
  const [lightboxPost, setLightboxPost] = useState<any | null>(null);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  // Estado de Seções Personalizáveis da Vitrine (Wix / App Builder Style)
  const [vitrineSections, setVitrineSections] = useState<VitrineSectionConfig[]>(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const cached = localStorage.getItem(\`store_vitrine_sections_\${store?.id}\`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {}
    return DEFAULT_STORE_VITRINE_SECTIONS;
  });
  const [isSectionsEditorOpen, setIsSectionsEditorOpen] = useState(false);
  const [postViewMode, setPostViewMode] = useState<"grid" | "feed">("grid");`;

content = content.replace(targetState, replacementState);

// 2. In the Header: Add edit logo / cover quick links when isOwner
const targetAvatar = `            <div className="size-28 sm:size-36 rounded-2xl ring-2 ring-border/60 bg-muted flex-shrink-0 overflow-hidden shadow-xs flex items-center justify-center">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={store.name || store.business_name}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-2xl sm:text-3xl font-extrabold bg-muted text-foreground font-mono">
                  {(store.name || store.business_name || "WD").slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          </div>`;

const replacementAvatar = `            <div className="size-28 sm:size-36 rounded-2xl ring-2 ring-border/60 bg-muted flex-shrink-0 overflow-hidden shadow-xs flex items-center justify-center">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={store.name || store.business_name}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-2xl sm:text-3xl font-extrabold bg-muted text-foreground font-mono">
                  {(store.name || store.business_name || "WD").slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            {isOwner && (
              <Link
                to="/workspace/marketing/brand-kit"
                search={{ storeId: store.id }}
                className="absolute inset-0 bg-black/40 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-xs font-semibold gap-1 cursor-pointer"
                title="Alterar Logo da Marca"
              >
                <Camera className="size-5" />
                <span className="text-[10px]">Alterar Logo</span>
              </Link>
            )}
          </div>`;

content = content.replace(targetAvatar, replacementAvatar);

const targetCover = `            {coverUrl ? (
              <img
                src={coverUrl}
                alt="Capa da empresa"
                className="h-full min-w-[1090px] object-cover flex-shrink-0 select-none rounded-2xl"
              />
            ) : (
              <div className="h-full min-w-[1090px] bg-gradient-to-r from-primary/10 via-muted/40 to-primary/15 flex items-center justify-center rounded-2xl">
                <Store className="size-8 text-primary/30" />
              </div>
            )}`;

const replacementCover = `            {coverUrl ? (
              <img
                src={coverUrl}
                alt="Capa da empresa"
                className="h-full min-w-[1090px] object-cover flex-shrink-0 select-none rounded-2xl"
              />
            ) : (
              <div className="h-full min-w-[1090px] bg-gradient-to-r from-primary/10 via-muted/40 to-primary/15 flex items-center justify-center rounded-2xl">
                <Store className="size-8 text-primary/30" />
              </div>
            )}
            {isOwner && (
              <Link
                to="/workspace/marketing/brand-kit"
                search={{ storeId: store.id }}
                className="absolute top-3 right-3 bg-background/85 hover:bg-background text-foreground backdrop-blur-md px-3 py-1.5 rounded-xl border border-border/60 text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Camera className="size-3.5" />
                <span>Alterar Capa</span>
              </Link>
            )}`;

content = content.replace(targetCover, replacementCover);

// 3. Replace Tab Bar with Monochromatic Apple HIG standard tabs (ZERO colored icons!)
const tabListStart = `        {/* ── 3. NAVEGAÇÃO POR ABAS NO PADRÃO DO PERFIL DE MEMBRO (Apple HIG) ── */}
        <div className="space-y-6 pt-2">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/40 text-xs font-semibold overflow-x-auto no-scrollbar border border-border/40">`;

// Find where the tab buttons end
const tabListEndIdx = content.indexOf('          </div>\n\n          {/* ── CONTEÚDO DA ABA 1: VITRINE / CARDÁPIO ── */}');

if (content.includes(tabListStart) && tabListEndIdx > -1) {
  const newTabList = `${tabListStart}
            {/* Aba 1: Vitrine / Início */}
            <button
              type="button"
              onClick={() => setActiveTab("vitrine")}
              className={cn(
                "px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
                activeTab === "vitrine"
                  ? "bg-background text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="size-4" />
              <span>Vitrine</span>
            </button>

            {/* Aba 2: Posts & Novidades */}
            <button
              type="button"
              onClick={() => setActiveTab("posts")}
              className={cn(
                "px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
                activeTab === "posts"
                  ? "bg-background text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageSquare className="size-4" />
              <span>Posts</span>
              {posts.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-bold font-mono">
                  {posts.length}
                </span>
              )}
            </button>

            {/* Aba 3: Catálogo / Cardápio */}
            <button
              type="button"
              onClick={() => setActiveTab("catalogo")}
              className={cn(
                "px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
                activeTab === "catalogo"
                  ? "bg-background text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CatalogIcon className="size-4" />
              <span>{catalogTabTitle}</span>
              {catalog.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-bold font-mono">
                  {catalog.length}
                </span>
              )}
            </button>

            {/* Aba 4: Vagas */}
            <button
              type="button"
              onClick={() => setActiveTab("vagas")}
              className={cn(
                "px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
                activeTab === "vagas"
                  ? "bg-background text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Briefcase className="size-4" />
              <span>Vagas</span>
              {jobs.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-bold font-mono">
                  {jobs.length}
                </span>
              )}
            </button>

            {/* Aba 5: Avaliações */}
            <button
              type="button"
              onClick={() => setActiveTab("avaliacoes")}
              className={cn(
                "px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
                activeTab === "avaliacoes"
                  ? "bg-background text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Star className="size-4" />
              <span>Avaliações</span>
              {reviews.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-bold font-mono">
                  {reviews.length}
                </span>
              )}
            </button>

            {/* Aba 6: Sobre & Atendimento */}
            <button
              type="button"
              onClick={() => setActiveTab("sobre")}
              className={cn(
                "px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
                activeTab === "sobre"
                  ? "bg-background text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Building2 className="size-4" />
              <span>Sobre & Atendimento</span>
            </button>

            {/* Aba 7: Sorteios & Prêmios (Condicional) */}
            {concursos.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("concursos")}
                className={cn(
                  "px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
                  activeTab === "concursos"
                    ? "bg-background text-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Ticket className="size-4" />
                <span>Sorteios & Prêmios</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-bold font-mono">
                  {concursos.length}
                </span>
              </button>
            )}`;

  content = content.slice(0, content.indexOf(tabListStart)) + newTabList + content.slice(tabListEndIdx);
  console.log('Tab bar successfully replaced with Apple HIG monochromatic style!');
}

fs.writeFileSync(filePath, content, 'utf-8');
