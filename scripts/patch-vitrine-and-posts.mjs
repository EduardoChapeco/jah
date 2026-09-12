import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/components/commerce/canonical-store-profile-view.tsx');
let content = fs.readFileSync(filePath, 'utf-8');
content = content.replace(/\r\n/g, '\n');

// 1. Find the start of the tab content:
const tabMarker = `          {/* ── CONTEÚDO DA ABA 1: VITRINE / CARDÁPIO ── */}
          {activeTab === "catalogo" && (`;

// We will replace up to the start of "── CONTEÚDO DA ABA 4: VAGAS & EMPREGOS ──"
const vagasMarker = `          {/* ── CONTEÚDO DA ABA 4: VAGAS & EMPREGOS ── */}`;

const startIndex = content.indexOf(tabMarker);
const endIndex = content.indexOf(vagasMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find start or end marker!", { startIndex, endIndex });
  process.exit(1);
}

const newVitrineAndPostsJSX = `          {/* ── CONTEÚDO DA ABA 1: VITRINE MODULAR (WIX / APP BUILDER STYLE COM SCROLL INFINITO FINAL) ── */}
          {activeTab === "vitrine" && (
            <div className="space-y-8 animate-in fade-in duration-150">
              {/* Barra de Gestão do Lojista */}
              {isOwner && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">
                      Modo Gestor Ativo: Você pode reorganizar e personalizar as seções desta vitrine.
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsSectionsEditorOpen(true)}
                    className="h-8 px-3 rounded-xl text-xs font-semibold gap-1.5 cursor-pointer border-border/70 shadow-2xs"
                  >
                    <Layers className="size-3.5 text-primary" />
                    <span>Personalizar Vitrine</span>
                  </Button>
                </div>
              )}

              {/* Renderização Dinâmica das Seções Configuradas */}
              {vitrineSections
                .filter((s) => s.enabled)
                .map((section) => {
                  if (section.type === "banners") {
                    if (!banners || banners.length === 0) return null;
                    return (
                      <div key={section.id} className="space-y-2">
                        <BannerHeroCarousel banners={banners} className="w-full rounded-2xl overflow-hidden shadow-xs" />
                      </div>
                    );
                  }

                  if (section.type === "custom_cards") {
                    const cards = section.cards || [];
                    if (cards.length === 0) return null;
                    return (
                      <div key={section.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h2 className="text-base font-bold text-foreground tracking-tight">
                            {section.title || "Destaques & Novidades"}
                          </h2>
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => setIsSectionsEditorOpen(true)}
                              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="size-3" />
                              <span>Editar Cards</span>
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {cards.map((card) => {
                            const isWhatsAppAction = card.linkUrl === "whatsapp";
                            const isCatalogAction = card.linkUrl === "#catalogo";

                            const handleCardClick = () => {
                              if (isWhatsAppAction && whatsappNumber) {
                                trackAndOpenWhatsApp({
                                  phone: whatsappNumber,
                                  storeId: store.id || null,
                                  entityType: "store",
                                  entityId: store.id,
                                  entityTitle: store.name || store.business_name,
                                  niche: segment,
                                  customMessage: \`Olá! Vi o destaque "\${card.title}" no Wider e gostaria de saber mais.\`,
                                });
                              } else if (isCatalogAction) {
                                setActiveTab("catalogo");
                              } else if (card.linkUrl && card.linkUrl.startsWith("http")) {
                                window.open(card.linkUrl, "_blank", "noopener,noreferrer");
                              }
                            };

                            return (
                              <div
                                key={card.id}
                                onClick={handleCardClick}
                                className="group rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-foreground/30 transition-all cursor-pointer shadow-2xs flex flex-col justify-between"
                              >
                                {card.imageUrl ? (
                                  <div className="aspect-[16/9] w-full overflow-hidden bg-muted/30 relative">
                                    <img
                                      src={card.imageUrl}
                                      alt={card.title}
                                      className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      loading="lazy"
                                    />
                                    {card.tag && (
                                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-background/90 backdrop-blur-md text-[10px] font-bold text-foreground">
                                        {card.tag}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  card.tag && (
                                    <div className="p-4 pb-0">
                                      <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
                                        {card.tag}
                                      </span>
                                    </div>
                                  )
                                )}
                                <div className="p-4 space-y-1">
                                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                    {card.title}
                                  </h3>
                                  {card.subtitle && (
                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                      {card.subtitle}
                                    </p>
                                  )}
                                </div>
                                <div className="p-4 pt-0 flex items-center justify-between text-xs font-semibold text-primary">
                                  <span>{isWhatsAppAction ? "Falar no WhatsApp" : isCatalogAction ? "Ver no Catálogo" : "Saiba Mais"}</span>
                                  <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  if (section.type === "product_rail") {
                    if (!catalog || catalog.length === 0) return null;
                    const topProducts = catalog.slice(0, 8);

                    return (
                      <div key={section.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h2 className="text-base font-bold text-foreground tracking-tight">
                            {section.title || "Mais Pedidos da Loja"}
                          </h2>
                          <button
                            type="button"
                            onClick={() => setActiveTab("catalogo")}
                            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Ver Catálogo Completo</span>
                            <ChevronRight className="size-3" />
                          </button>
                        </div>
                        <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2">
                          {topProducts.map((p: any) => {
                            const priceCents = p.price_cents || p.price || 0;
                            const imageUrl = p.images?.[0] || p.image_url || null;

                            return (
                              <div
                                key={p.id}
                                className="w-56 shrink-0 rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-foreground/30 transition-all shadow-2xs flex flex-col justify-between group"
                              >
                                {imageUrl && (
                                  <div className="aspect-square w-full overflow-hidden bg-muted/30">
                                    <img
                                      src={imageUrl}
                                      alt={p.title}
                                      className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      loading="lazy"
                                    />
                                  </div>
                                )}
                                <div className="p-3.5 space-y-1 min-w-0">
                                  <h4 className="text-xs font-bold text-foreground truncate">{p.title}</h4>
                                  <p className="text-sm font-black text-foreground font-mono">
                                    {formatMoney(priceCents)}
                                  </p>
                                </div>
                                <div className="p-3.5 pt-0">
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddToCart(p)}
                                    className="w-full h-8 rounded-xl font-bold text-xs bg-foreground text-background hover:bg-foreground/90 gap-1 cursor-pointer"
                                  >
                                    <Plus className="size-3" />
                                    <span>Adicionar</span>
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  if (section.type === "hotpages") {
                    if (!hotpages || hotpages.length === 0) return null;
                    return (
                      <div key={section.id} className="space-y-2">
                        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 pt-1">
                          {hotpages.map((h: any) => (
                            <div key={h.id} className="shrink-0">
                              <DynamicMediaChip
                                label={h.title}
                                badge={h.badge_label || undefined}
                                mediaUrl={h.bg_media_url || undefined}
                                texture={h.bg_texture || undefined}
                                href={h.target_route || undefined}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (section.type === "brand_story") {
                    const storyText = store.description || settings.bio || settings.about;
                    if (!storyText) return null;
                    return (
                      <div
                        key={section.id}
                        className="p-5 sm:p-6 rounded-2xl bg-card border border-border/60 shadow-2xs space-y-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <Store className="size-4 text-primary" />
                          <h3 className="text-sm font-bold text-foreground">
                            {section.title || "Sobre a Empresa"}
                          </h3>
                        </div>
                        <p className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed whitespace-pre-line">
                          {storyText}
                        </p>
                      </div>
                    );
                  }

                  if (section.type === "infinite_feed") {
                    return (
                      <div key={section.id} className="pt-6 border-t border-border/40 space-y-4">
                        <div className="space-y-0.5">
                          <h2 className="text-base font-bold text-foreground tracking-tight">
                            {section.title || "Explore Mais na Região"}
                          </h2>
                          <p className="text-xs text-muted-foreground">
                            Navegação contínua de produtos e oportunidades locais.
                          </p>
                        </div>
                        <ProceduralInfiniteFeed
                          initialExcludedStoreIds={[store.id]}
                          city={store.city}
                          className="pt-2"
                        />
                      </div>
                    );
                  }

                  return null;
                })}
            </div>
          )}

          {/* ── CONTEÚDO DA ABA 2: POSTS & NOVIDADES (MURAL SOCIAL COM FEED & GRID) ── */}
          {activeTab === "posts" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Barra de Visualização: Grade de Fotos vs Feed */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  {posts.length} {posts.length === 1 ? "Publicação" : "Publicações"}
                </span>

                <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/40 border border-border/40 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setPostViewMode("grid")}
                    className={cn(
                      "size-8 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                      postViewMode === "grid"
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label="Visualização em Grade"
                  >
                    <Grid className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostViewMode("feed")}
                    className={cn(
                      "size-8 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                      postViewMode === "feed"
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-label="Visualização em Feed"
                  >
                    <List className="size-4" />
                  </button>
                </div>
              </div>

              {posts.length > 0 ? (
                postViewMode === "grid" ? (
                  /* Modo 1: Grade de Fotos 1:1 Estilo Instagram */
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {posts.map((post: any) => {
                      const firstMedia = post.media_urls?.[0];
                      return (
                        <div
                          key={post.id}
                          onClick={() => setLightboxPost(post)}
                          className="group aspect-square rounded-2xl overflow-hidden bg-muted/30 relative cursor-pointer border border-border/40 hover:border-foreground/40 transition-all"
                        >
                          {firstMedia ? (
                            <img
                              src={firstMedia}
                              alt="Foto da publicação"
                              className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="size-full p-4 flex flex-col justify-between bg-card">
                              <p className="text-xs text-foreground line-clamp-4 leading-relaxed font-medium">
                                {post.content_text}
                              </p>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {formatDate(post.created_at)}
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3 text-center text-white text-xs font-semibold">
                            <span className="line-clamp-2">{post.content_text || "Ver publicação"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Modo 2: Feed Social com Cards de Threads */
                  <div className="space-y-4 max-w-2xl mx-auto">
                    {posts.map((post: any) => (
                      <ThreadsFeedCard
                        key={post.id}
                        post={{
                          id: post.id,
                          author: {
                            id: store.id,
                            full_name: store.name || store.business_name,
                            username: store.slug,
                            avatar_url: logoUrl || undefined,
                            is_verified: true,
                          },
                          content_text: post.content_text || "",
                          media_urls: post.media_urls || [],
                          created_at: post.created_at,
                          likes_count: post.likes_count || 0,
                          replies_count: post.replies_count || 0,
                        }}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="py-16 text-center space-y-2 bg-muted/20 rounded-2xl p-8 border border-border/60">
                  <MessageSquare className="size-10 text-muted-foreground/40 mx-auto" />
                  <h3 className="text-sm font-bold text-foreground">Nenhuma publicação recente</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    A empresa ainda não realizou postagens sociais neste canal.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── CONTEÚDO DA ABA 3: CATÁLOGO COMPLETO / CARDÁPIO ── */}
          {activeTab === "catalogo" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Barra de Busca e Categorias de Produtos */}
              {catalog.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder={\`Buscar no catálogo de \${store.name || store.business_name}...\`}
                        className="pl-10 h-11 rounded-xl text-xs bg-card border-border/80"
                      />
                    </div>
                  </div>

                  {/* Chips de Categorias */}
                  {categories.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory("todas")}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer",
                          selectedCategory === "todas"
                            ? "bg-foreground text-background font-bold"
                            : "bg-muted/40 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Todas as Opções
                      </button>
                      {categories.map((cat: any) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer",
                            selectedCategory === cat.id
                              ? "bg-foreground text-background font-bold"
                              : "bg-muted/40 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Grade de Produtos / Cardápio */}
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((p: any) => {
                    const priceCents = p.price_cents || p.price || 0;
                    const imageUrl = p.images?.[0] || p.image_url || null;

                    return (
                      <div
                        key={p.id}
                        className="flex flex-col justify-between rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-foreground/30 transition-all shadow-2xs group"
                      >
                        <div className="flex items-start gap-3 p-4">
                          <div className="min-w-0 flex-1 space-y-1">
                            <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug">
                              {p.title}
                            </h3>
                            {p.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {p.description}
                              </p>
                            )}
                            <div className="pt-2">
                              <span className="text-sm font-black text-foreground font-mono">
                                {formatMoney(priceCents)}
                              </span>
                            </div>
                          </div>

                          {/* Foto 1:1 do Produto */}
                          {imageUrl && (
                            <div className="size-20 sm:size-24 rounded-xl overflow-hidden bg-muted/30 shrink-0">
                              <img
                                src={imageUrl}
                                alt={p.title}
                                className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            </div>
                          )}
                        </div>

                        {/* Botão de Adição com Touch Target 44px */}
                        <div className="p-3 pt-0 flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(p)}
                            className="rounded-xl h-10 px-4 font-bold text-xs bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer w-full sm:w-auto"
                          >
                            <Plus className="size-3.5" />
                            <span>Adicionar</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : catalog.length > 0 ? (
                <div className="py-16 text-center space-y-2 bg-muted/20 rounded-2xl p-6">
                  <Search className="size-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-xs font-semibold text-foreground">
                    Nenhum item encontrado para "{productSearch}".
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setProductSearch("");
                      setSelectedCategory("todas");
                    }}
                    className="rounded-xl text-xs"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              ) : (
                <div className="py-16 text-center space-y-4 bg-muted/20 rounded-2xl p-8 border border-border/60">
                  <Briefcase className="size-10 text-muted-foreground/40 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">
                      Atendimento Sob Medida & Presencial
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Esta empresa presta serviços e atendimento personalizado. Entre em contato diretamente pelo WhatsApp para orçamentos e agendamentos.
                    </p>
                  </div>
                  {whatsappNumber && (
                    <Button
                      onClick={() =>
                        trackAndOpenWhatsApp({
                          phone: whatsappNumber,
                          storeId: store.id || null,
                          entityType: "store",
                          entityId: store.id,
                          entityTitle: store.name || store.business_name,
                          niche: segment,
                          customMessage: \`Olá! Gostaria de um orçamento ou informações sobre seus serviços.\`,
                        })
                      }
                      className="rounded-xl h-10 px-5 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-2 cursor-pointer mx-auto"
                    >
                      <WhatsappLogo size={16} weight="bold" />
                      <span>Falar no WhatsApp</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

`;

content = content.slice(0, startIndex) + newVitrineAndPostsJSX + content.slice(endIndex);

// Add StoreVitrineSectionsEditor modal at the end of the component (before the last closing tag)
const editorModalJSX = `
      {/* ── Editor Modular de Seções da Vitrine (Drawer para o Lojista) ── */}
      {isOwner && (
        <StoreVitrineSectionsEditor
          open={isSectionsEditorOpen}
          onOpenChange={setIsSectionsEditorOpen}
          storeId={store.id}
          initialSections={vitrineSections}
          onSave={(newSections) => setVitrineSections(newSections)}
        />
      )}
    </div>
  );
}`;

content = content.replace(/\n\s*<\/div>\s*\);\s*\}\s*$/, editorModalJSX);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Vitrine and Posts tabs successfully patched into canonical-store-profile-view.tsx!');
