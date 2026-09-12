import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useMyCompany } from "@/hooks/useCompanies";
import {
  usePresentationsList, useSlides, usePresentationEditor,
  SLIDE_LAYOUTS, SLIDE_TRANSITIONS, ASPECT_RATIOS,
  type Slide, type SlideElement, type Presentation,
} from "@/hooks/usePresentations";
import {
  Plus, Trash2, Copy, ChevronLeft, Eye, EyeOff, Grid3X3, Type, Image, Square,
  Play, ArrowLeft, ArrowRight, Maximize, Minimize, StickyNote, Zap,
  Download, RotateCcw, Settings, Loader2, Monitor, Move, Palette, Layers,
  Layout, FileText, MousePointer, Circle, Triangle, Star, Minus,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

/* ── Scaled Slide Renderer ── */
function ScaledSlide({
  slide, canvasW, canvasH, scale, selectedElementId, onSelectElement, onUpdateElement, isEditing,
}: {
  slide: Slide; canvasW: number; canvasH: number; scale: number;
  selectedElementId?: string | null; onSelectElement?: (id: string | null) => void;
  onUpdateElement?: (id: string, updates: Partial<SlideElement>) => void; isEditing?: boolean;
}) {
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; startX: number; startY: number; elX: number; elY: number } | null>(null);

  const bg = slide.background;
  const bgStyle: React.CSSProperties = bg.type === "gradient"
    ? { background: `linear-gradient(${bg.direction || "135deg"}, ${bg.value}, ${bg.secondaryValue || "#ffffff"})` }
    : bg.type === "image"
    ? { backgroundImage: `url(${bg.value})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { backgroundColor: bg.value };

  const handleMouseDown = (e: React.MouseEvent, el: SlideElement) => {
    if (!isEditing || editingTextId) return;
    e.stopPropagation();
    onSelectElement?.(el.id);
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    setDragging({ id: el.id, startX: e.clientX, startY: e.clientY, elX: el.x, elY: el.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging || !onUpdateElement) return;
    const dx = (e.clientX - dragging.startX) / scale;
    const dy = (e.clientY - dragging.startY) / scale;
    onUpdateElement(dragging.id, { x: Math.round(dragging.elX + dx), y: Math.round(dragging.elY + dy) });
  }, [dragging, scale, onUpdateElement]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className="absolute slide-content"
      style={{ width: canvasW, height: canvasH, left: "50%", top: "50%", marginLeft: -canvasW / 2, marginTop: -canvasH / 2, transform: `scale(${scale})`, transformOrigin: "center center", ...bgStyle }}
      onClick={() => { onSelectElement?.(null); setEditingTextId(null); }}
    >
      {slide.elements.map((el) => {
        const isSelected = selectedElementId === el.id;
        const isEditingText = editingTextId === el.id;

        return (
          <div
            key={el.id}
            className={`absolute cursor-move ${isSelected ? "ring-2 ring-primary ring-offset-1" : ""}`}
            style={{
              left: el.x, top: el.y, width: el.width, height: el.height,
              transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
              opacity: el.opacity,
            }}
            onClick={(e) => { e.stopPropagation(); onSelectElement?.(el.id); }}
            onMouseDown={(e) => handleMouseDown(e, el)}
            onDoubleClick={(e) => {
              if (el.type === "text" && isEditing) { e.stopPropagation(); setEditingTextId(el.id); }
            }}
          >
            {el.type === "text" && (
              isEditingText ? (
                <textarea
                  className="w-full h-full bg-transparent border-none outline-none resize-none p-0"
                  style={{ ...el.style, lineHeight: 1.3 }}
                  value={el.content}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => onUpdateElement?.(el.id, { content: e.target.value })}
                  onBlur={() => setEditingTextId(null)}
                />
              ) : (
                <div style={{ ...el.style, lineHeight: 1.3, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{el.content}</div>
              )
            )}
            {el.type === "shape" && (
              <svg width="100%" height="100%" viewBox={`0 0 ${el.width} ${el.height}`}>
                {el.content === "circle" ? (
                  <ellipse cx={el.width / 2} cy={el.height / 2} rx={el.width / 2 - 2} ry={el.height / 2 - 2} fill={el.style.fill || "#e2e8f0"} stroke={el.style.stroke || "none"} strokeWidth={el.style.strokeWidth || 0} />
                ) : el.content === "triangle" ? (
                  <polygon points={`${el.width / 2},4 ${el.width - 4},${el.height - 4} 4,${el.height - 4}`} fill={el.style.fill || "#e2e8f0"} />
                ) : (
                  <rect x={2} y={2} width={el.width - 4} height={el.height - 4} rx={el.style.rx || 0} fill={el.style.fill || "#e2e8f0"} stroke={el.style.stroke || "none"} strokeWidth={el.style.strokeWidth || 0} />
                )}
              </svg>
            )}
            {el.type === "image" && (
              <img src={el.content} alt="" className="w-full h-full object-cover rounded" draggable={false} />
            )}

            {/* Resize handle */}
            {isSelected && isEditing && (
              <div className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize border-2 border-background" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Fullscreen Presenter ── */
function PresenterMode({ slides, canvasW, canvasH, onExit }: { slides: Slide[]; canvasW: number; canvasH: number; onExit: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
      if (e.key === "ArrowRight" || e.key === " ") setCurrentIndex((p) => Math.min(p + 1, slides.length - 1));
      if (e.key === "ArrowLeft") setCurrentIndex((p) => Math.max(p - 1, 0));
    };
    window.addEventListener("keydown", handle);
    try { document.documentElement.requestFullscreen?.(); } catch {}
    return () => {
      window.removeEventListener("keydown", handle);
      try { document.exitFullscreen?.(); } catch {}
    };
  }, [slides.length, onExit]);

  const slide = slides[currentIndex];
  if (!slide) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[9999] bg-black flex items-center justify-center cursor-none" onClick={() => setCurrentIndex((p) => Math.min(p + 1, slides.length - 1))}>
      <div className="relative w-full h-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={slide.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: slide.transition_duration || 0.5 }} className="w-full h-full relative">
            <ScaledSlide slide={slide} canvasW={canvasW} canvasH={canvasH} scale={Math.min(window.innerWidth / canvasW, window.innerHeight / canvasH)} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-xs bg-black/50 px-3 py-1 rounded-full">
        {currentIndex + 1} / {slides.length} • ESC para sair
      </div>
    </div>
  );
}

/* ── Main Editor ── */
export default function SlideEditor() {
  const { user } = useAuth();
  const { data: company } = useMyCompany();
  const editor = usePresentationEditor(user?.id, company?.id);
  const { data: presentations, isLoading: loadingPres } = usePresentationsList(user?.id);
  const { data: slides } = useSlides(editor.activePresentationId || undefined);
  const activePresentation = presentations?.find((p) => p.id === editor.activePresentationId);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [leftTab, setLeftTab] = useState("slides");

  // Auto-select first slide
  useEffect(() => {
    if (slides?.length && !editor.activeSlideId) {
      editor.setActiveSlideId(slides[0].id);
    }
  }, [slides, editor.activeSlideId]);

  const activeSlide = slides?.find((s) => s.id === editor.activeSlideId);
  const selectedElement = activeSlide?.elements.find((e) => e.id === editor.selectedElementId);

  const canvasW = activePresentation?.canvas_width || 1920;
  const canvasH = activePresentation?.canvas_height || 1080;

  // Calculate scale
  const [containerSize, setContainerSize] = useState({ w: 800, h: 500 });
  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    if (canvasRef.current) obs.observe(canvasRef.current);
    return () => obs.disconnect();
  }, [editor.activePresentationId]);

  const canvasScale = Math.min((containerSize.w - 40) / canvasW, (containerSize.h - 40) / canvasH, 1) * editor.zoom;

  const handleUpdateElement = useCallback((elementId: string, updates: Partial<SlideElement>) => {
    if (!activeSlide) return;
    const newElements = activeSlide.elements.map((el) => el.id === elementId ? { ...el, ...updates } : el);
    editor.updateSlide.mutate({ id: activeSlide.id, elements: newElements as any });
  }, [activeSlide, editor.updateSlide]);

  const handleAddElement = useCallback((type: SlideElement["type"], content: string, style: Record<string, any> = {}) => {
    if (!activeSlide) return;
    const newEl: SlideElement = {
      id: crypto.randomUUID(), type, x: 100, y: 100,
      width: type === "text" ? 600 : 300, height: type === "text" ? 80 : 300,
      rotation: 0, opacity: 1, content, style,
    };
    const newElements = [...activeSlide.elements, newEl];
    editor.updateSlide.mutate({ id: activeSlide.id, elements: newElements as any });
    editor.setSelectedElementId(newEl.id);
  }, [activeSlide, editor]);

  const handleDeleteElement = useCallback(() => {
    if (!activeSlide || !editor.selectedElementId) return;
    const newElements = activeSlide.elements.filter((el) => el.id !== editor.selectedElementId);
    editor.updateSlide.mutate({ id: activeSlide.id, elements: newElements as any });
    editor.setSelectedElementId(null);
  }, [activeSlide, editor]);

  // ── Presentation list ──
  if (!editor.activePresentationId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Apresentações</h2>
            <p className="text-sm text-muted-foreground">Crie slides interativos em HTML/CSS</p>
          </div>
          <Button size="sm" onClick={() => editor.createPresentation.mutate({})}>
            <Plus className="h-4 w-4 mr-1" /> Nova Apresentação
          </Button>
        </div>

        {loadingPres ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />)}
          </div>
        ) : !presentations?.length ? (
          <Card className="py-16 text-center">
            <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma apresentação criada ainda.</p>
            <Button size="sm" className="mt-4" onClick={() => editor.createPresentation.mutate({})}>
              <Plus className="h-4 w-4 mr-1" /> Criar Primeira
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {presentations.map((p) => (
              <Card
                key={p.id}
                className="group cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                onClick={() => editor.setActivePresentationId(p.id)}
              >
                <div className="aspect-video bg-muted flex items-center justify-center relative">
                  <Monitor className="h-8 w-8 text-muted-foreground" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-foreground truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.aspect_ratio} • {p.status}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Presenter mode ──
  if (editor.isPresenting && slides) {
    return <PresenterMode slides={slides} canvasW={canvasW} canvasH={canvasH} onExit={() => editor.setIsPresenting(false)} />;
  }

  // ── Editor ──
  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-background rounded-lg border overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
        <Button size="sm" variant="ghost" onClick={() => editor.setActivePresentationId(null)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Input
          className="h-7 text-sm font-semibold w-48 bg-transparent border-none"
          value={activePresentation?.title || ""}
          onChange={(e) => activePresentation && editor.updatePresentation.mutate({ id: activePresentation.id, title: e.target.value })}
        />
        <Badge variant="outline" className="text-[10px]">{activePresentation?.aspect_ratio}</Badge>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => editor.setShowGrid(!editor.showGrid)} className={editor.showGrid ? "text-primary" : ""}>
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => editor.setShowNotes(!editor.showNotes)} className={editor.showNotes ? "text-primary" : ""}>
            <StickyNote className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-5 mx-1" />
          <Button size="sm" variant="ghost" onClick={() => editor.setZoom(Math.max(0.25, editor.zoom - 0.1))}>
            <Minimize className="h-3 w-3" />
          </Button>
          <span className="text-[10px] text-muted-foreground w-10 text-center">{Math.round(editor.zoom * 100)}%</span>
          <Button size="sm" variant="ghost" onClick={() => editor.setZoom(Math.min(2, editor.zoom + 0.1))}>
            <Maximize className="h-3 w-3" />
          </Button>
          <Separator orientation="vertical" className="h-5 mx-1" />
          <Button size="sm" onClick={() => editor.setIsPresenting(true)} disabled={!slides?.length}>
            <Play className="h-4 w-4 mr-1" /> Apresentar
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel ── */}
        <div className="w-64 border-r flex flex-col bg-muted/10 shrink-0">
          <Tabs value={leftTab} onValueChange={setLeftTab} className="flex flex-col h-full">
            <TabsList className="w-full rounded-none border-b grid grid-cols-4">
              <TabsTrigger value="slides" className="text-[10px] px-1"><Layers className="h-3 w-3" /></TabsTrigger>
              <TabsTrigger value="elements" className="text-[10px] px-1"><Layout className="h-3 w-3" /></TabsTrigger>
              <TabsTrigger value="layouts" className="text-[10px] px-1"><Grid3X3 className="h-3 w-3" /></TabsTrigger>
              <TabsTrigger value="ai" className="text-[10px] px-1"><Zap className="h-3 w-3" /></TabsTrigger>
            </TabsList>

            {/* Slides thumbnails */}
            <TabsContent value="slides" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full p-2">
                <div className="space-y-2">
                  {slides?.map((slide, i) => (
                    <div
                      key={slide.id}
                      className={`relative rounded-md border overflow-hidden cursor-pointer transition-all group ${
                        slide.id === editor.activeSlideId ? "ring-2 ring-primary" : "hover:border-primary/50"
                      }`}
                      onClick={() => { editor.setActiveSlideId(slide.id); editor.setSelectedElementId(null); }}
                    >
                      <div className="aspect-video relative overflow-hidden bg-white">
                        <ScaledSlide slide={slide} canvasW={canvasW} canvasH={canvasH} scale={0.12} />
                      </div>
                      <div className="absolute top-1 left-1 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-mono">
                        {i + 1}
                      </div>
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-0.5">
                        <button className="p-0.5 bg-black/50 rounded text-white hover:bg-black/70" onClick={(e) => { e.stopPropagation(); editor.duplicateSlide(slide); }}>
                          <Copy className="h-3 w-3" />
                        </button>
                        <button className="p-0.5 bg-black/50 rounded text-white hover:bg-red-500/70" onClick={(e) => { e.stopPropagation(); editor.deleteSlide.mutate(slide.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => editor.addSlide.mutate({ presentation_id: editor.activePresentationId!, layout: "blank", sort_order: slides?.length || 0 })}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Novo Slide
                  </Button>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Elements panel */}
            <TabsContent value="elements" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Texto</p>
                <div className="space-y-1 mb-4">
                  {[
                    { label: "Título", size: 48, weight: "700" },
                    { label: "Subtítulo", size: 32, weight: "600" },
                    { label: "Corpo", size: 20, weight: "400" },
                    { label: "Legenda", size: 14, weight: "400" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      className="w-full text-left p-2 rounded hover:bg-muted text-sm transition-colors"
                      onClick={() => handleAddElement("text", preset.label, { fontSize: preset.size, fontWeight: preset.weight, color: "#1a1a2e", fontFamily: "Inter" })}
                    >
                      <span style={{ fontSize: Math.min(preset.size * 0.4, 18), fontWeight: preset.weight as any }}>{preset.label}</span>
                    </button>
                  ))}
                </div>

                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Formas</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: "Retângulo", icon: Square, content: "rect", style: { fill: "#e2e8f0", rx: 8 } },
                    { label: "Círculo", icon: Circle, content: "circle", style: { fill: "#e2e8f0" } },
                    { label: "Triângulo", icon: Triangle, content: "triangle", style: { fill: "#e2e8f0" } },
                  ].map((shape) => (
                    <button
                      key={shape.label}
                      className="flex flex-col items-center gap-1 p-2 rounded hover:bg-muted transition-colors"
                      onClick={() => handleAddElement("shape", shape.content, shape.style)}
                    >
                      <shape.icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground">{shape.label}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Layouts panel */}
            <TabsContent value="layouts" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full p-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Adicionar slide com layout</p>
                <div className="space-y-1">
                  {SLIDE_LAYOUTS.map((layout) => (
                    <button
                      key={layout.value}
                      className="w-full text-left p-2 rounded hover:bg-muted transition-colors"
                      onClick={() => editor.addSlide.mutate({ presentation_id: editor.activePresentationId!, layout: layout.value, sort_order: slides?.length || 0 })}
                    >
                      <p className="text-xs font-medium text-foreground">{layout.label}</p>
                      <p className="text-[10px] text-muted-foreground">{layout.desc}</p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* AI panel */}
            <TabsContent value="ai" className="flex-1 overflow-hidden m-0">
              <div className="p-3 space-y-3">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Gerar com IA</p>
                <Textarea
                  placeholder="Ex: Crie uma apresentação de 8 slides sobre os resultados do trimestre..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="min-h-[100px] text-xs"
                />
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!aiPrompt.trim() || editor.generating}
                  onClick={() => {
                    if (editor.activePresentationId) {
                      editor.generateSlides(aiPrompt, editor.activePresentationId);
                      setAiPrompt("");
                    }
                  }}
                >
                  {editor.generating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
                  Gerar Slides
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Canvas ── */}
        <div ref={canvasRef} className="flex-1 relative overflow-hidden bg-muted/50" onClick={() => editor.setSelectedElementId(null)}>
          {activeSlide ? (
            <>
              {editor.showGrid && (
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: "radial-gradient(circle, hsl(var(--muted-foreground) / 0.15) 1px, transparent 1px)",
                  backgroundSize: `${20 * canvasScale}px ${20 * canvasScale}px`,
                }} />
              )}
              <ScaledSlide
                slide={activeSlide}
                canvasW={canvasW}
                canvasH={canvasH}
                scale={canvasScale}
                selectedElementId={editor.selectedElementId}
                onSelectElement={editor.setSelectedElementId}
                onUpdateElement={handleUpdateElement}
                isEditing
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Selecione ou crie um slide
            </div>
          )}
        </div>

        {/* ── Right Panel ── */}
        <div className="w-64 border-l bg-muted/10 flex flex-col shrink-0">
          <ScrollArea className="flex-1 p-3">
            {selectedElement ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-foreground capitalize">{selectedElement.type}</p>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={handleDeleteElement}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Position */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Posição e Tamanho</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "X", key: "x" },
                      { label: "Y", key: "y" },
                      { label: "W", key: "width" },
                      { label: "H", key: "height" },
                    ].map((field) => (
                      <div key={field.key}>
                        <Label className="text-[10px] text-muted-foreground">{field.label}</Label>
                        <Input
                          type="number"
                          className="h-7 text-xs"
                          value={(selectedElement as any)[field.key]}
                          onChange={(e) => handleUpdateElement(selectedElement.id, { [field.key]: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rotation & Opacity */}
                <div className="space-y-2">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Rotação ({selectedElement.rotation}°)</Label>
                    <Slider min={0} max={360} step={1} value={[selectedElement.rotation]} onValueChange={([v]) => handleUpdateElement(selectedElement.id, { rotation: v })} />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Opacidade ({Math.round(selectedElement.opacity * 100)}%)</Label>
                    <Slider min={0} max={1} step={0.01} value={[selectedElement.opacity]} onValueChange={([v]) => handleUpdateElement(selectedElement.id, { opacity: v })} />
                  </div>
                </div>

                {/* Text-specific */}
                {selectedElement.type === "text" && (
                  <div className="space-y-2">
                    <Separator />
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Texto</p>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Tamanho</Label>
                      <Input type="number" className="h-7 text-xs" value={selectedElement.style.fontSize || 24}
                        onChange={(e) => handleUpdateElement(selectedElement.id, { style: { ...selectedElement.style, fontSize: parseInt(e.target.value) || 24 } })} />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Cor</Label>
                      <div className="flex gap-1">
                        <input type="color" className="h-7 w-10 rounded cursor-pointer" value={selectedElement.style.color || "#000000"}
                          onChange={(e) => handleUpdateElement(selectedElement.id, { style: { ...selectedElement.style, color: e.target.value } })} />
                        <Input className="h-7 text-xs flex-1" value={selectedElement.style.color || "#000000"}
                          onChange={(e) => handleUpdateElement(selectedElement.id, { style: { ...selectedElement.style, color: e.target.value } })} />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[
                        { icon: Bold, key: "fontWeight", on: "700", off: "400" },
                        { icon: Italic, key: "fontStyle", on: "italic", off: "normal" },
                      ].map(({ icon: Icon, key, on, off }) => (
                        <Button
                          key={key} size="sm" variant={selectedElement.style[key] === on ? "default" : "outline"} className="h-7 w-7 p-0"
                          onClick={() => handleUpdateElement(selectedElement.id, { style: { ...selectedElement.style, [key]: selectedElement.style[key] === on ? off : on } })}
                        >
                          <Icon className="h-3 w-3" />
                        </Button>
                      ))}
                      <Separator orientation="vertical" className="h-7 mx-0.5" />
                      {[
                        { value: "left", icon: AlignLeft },
                        { value: "center", icon: AlignCenter },
                        { value: "right", icon: AlignRight },
                      ].map(({ value, icon: Icon }) => (
                        <Button
                          key={value} size="sm" variant={selectedElement.style.textAlign === value ? "default" : "outline"} className="h-7 w-7 p-0"
                          onClick={() => handleUpdateElement(selectedElement.id, { style: { ...selectedElement.style, textAlign: value } })}
                        >
                          <Icon className="h-3 w-3" />
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shape-specific */}
                {selectedElement.type === "shape" && (
                  <div className="space-y-2">
                    <Separator />
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Forma</p>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Preenchimento</Label>
                      <div className="flex gap-1">
                        <input type="color" className="h-7 w-10 rounded cursor-pointer" value={selectedElement.style.fill || "#e2e8f0"}
                          onChange={(e) => handleUpdateElement(selectedElement.id, { style: { ...selectedElement.style, fill: e.target.value } })} />
                        <Input className="h-7 text-xs flex-1" value={selectedElement.style.fill || "#e2e8f0"}
                          onChange={(e) => handleUpdateElement(selectedElement.id, { style: { ...selectedElement.style, fill: e.target.value } })} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeSlide ? (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-foreground">Design do Slide</p>

                {/* Background */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">Fundo</p>
                  <Select
                    value={activeSlide.background.type}
                    onValueChange={(v) => editor.updateSlide.mutate({ id: activeSlide.id, background: { ...activeSlide.background, type: v } as any })}
                  >
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">Cor sólida</SelectItem>
                      <SelectItem value="gradient">Gradiente</SelectItem>
                      <SelectItem value="image">Imagem</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1">
                    <input type="color" className="h-7 w-10 rounded cursor-pointer" value={activeSlide.background.value}
                      onChange={(e) => editor.updateSlide.mutate({ id: activeSlide.id, background: { ...activeSlide.background, value: e.target.value } as any })} />
                    <Input className="h-7 text-xs flex-1" value={activeSlide.background.value}
                      onChange={(e) => editor.updateSlide.mutate({ id: activeSlide.id, background: { ...activeSlide.background, value: e.target.value } as any })} />
                  </div>
                  {activeSlide.background.type === "gradient" && (
                    <div className="flex gap-1">
                      <input type="color" className="h-7 w-10 rounded cursor-pointer" value={activeSlide.background.secondaryValue || "#ffffff"}
                        onChange={(e) => editor.updateSlide.mutate({ id: activeSlide.id, background: { ...activeSlide.background, secondaryValue: e.target.value } as any })} />
                      <Input className="h-7 text-xs flex-1" placeholder="Cor 2" value={activeSlide.background.secondaryValue || ""}
                        onChange={(e) => editor.updateSlide.mutate({ id: activeSlide.id, background: { ...activeSlide.background, secondaryValue: e.target.value } as any })} />
                    </div>
                  )}
                </div>

                {/* Transition */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">Transição</p>
                  <Select
                    value={activeSlide.transition}
                    onValueChange={(v) => editor.updateSlide.mutate({ id: activeSlide.id, transition: v })}
                  >
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SLIDE_TRANSITIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Layout */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase">Layout</p>
                  <Badge variant="outline" className="text-[10px]">{SLIDE_LAYOUTS.find((l) => l.value === activeSlide.layout)?.label || activeSlide.layout}</Badge>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center pt-8">Selecione um slide para editar</p>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* ── Notes panel ── */}
      {editor.showNotes && activeSlide && (
        <div className="border-t p-3">
          <Label className="text-[10px] text-muted-foreground uppercase">Notas do apresentador</Label>
          <Textarea
            className="mt-1 min-h-[60px] text-xs resize-none"
            placeholder="Notas visíveis apenas para você..."
            value={activeSlide.notes || ""}
            onChange={(e) => editor.updateSlide.mutate({ id: activeSlide.id, notes: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
