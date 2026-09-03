import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Undo,
  Redo,
  Sparkles,
  Layers,
  Users,
  Settings2,
  Trash2,
  HelpCircle,
  Bus,
} from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { getStoreSettings } from "@/services/store.functions";
import {
  getVehicleLayout,
  updateVehicleLayout,
  type SeatCell,
  type SeatElementType,
  type SeatCategory,
} from "@/services/vehicle-layouts.functions";

export const Route = createFileRoute("/workspace/turismo/frota/$id")({
  head: () => ({ meta: [{ title: "Editor de Assentos 2D | Workspace Wider" }] }),
  loader: async ({ params }: { params: { id: string } }) => {
    const store = await getStoreSettings().catch(() => null);
    const storeId = store?.id || "";
    const layout = storeId
      ? await getVehicleLayout({ data: { store_id: storeId, layout_id: params.id } }).catch(
          () => null
        )
      : null;
    return {
      store,
      layout,
    };
  },
  component: VehicleLayoutEditorPage,
});

const TOOL_OPTIONS: Array<{
  type: SeatElementType;
  label: string;
  badgeColor: string;
}> = [
  { type: "seat", label: "Poltrona", badgeColor: "bg-primary text-primary-foreground" },
  { type: "aisle", label: "Corredor", badgeColor: "bg-muted text-muted-foreground" },
  { type: "wc", label: "Banheiro (WC)", badgeColor: "bg-amber-500 text-white" },
  { type: "door", label: "Porta", badgeColor: "bg-emerald-500 text-white" },
  { type: "driver", label: "Motorista", badgeColor: "bg-indigo-500 text-white" },
  { type: "guide", label: "Guia", badgeColor: "bg-purple-500 text-white" },
  { type: "stairs", label: "Escada", badgeColor: "bg-slate-500 text-white" },
  { type: "empty", label: "Vazio", badgeColor: "bg-background text-muted-foreground border" },
];

function VehicleLayoutEditorPage() {
  const { store, layout } = (Route.useLoaderData as any)();
  const router = useRouter();
  const storeId = store?.id || "";

  if (!layout) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Modelo de veículo não encontrado.</p>
        <Button asChild variant="outline">
          <Link to={"/workspace/turismo/frota" as any}>Voltar para a Frota</Link>
        </Button>
      </div>
    );
  }

  const [name, setName] = useState(layout.name);
  const [rows, setRows] = useState(layout.rows || 12);
  const [cols, setCols] = useState(layout.cols || 5);
  const [activeDeck, setActiveDeck] = useState<number>(1);
  const [activeTool, setActiveTool] = useState<SeatElementType>("seat");
  const [activeCategory, setActiveCategory] = useState<SeatCategory>("executivo");
  const [saving, setSaving] = useState(false);

  // Mapa de assentos
  const [seatMap, setSeatMap] = useState<SeatCell[]>(layout.seat_map || []);

  // Pilha de Histórico para Undo/Redo
  const [history, setHistory] = useState<SeatCell[][]>([layout.seat_map || []]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = (newMap: SeatCell[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newMap);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setSeatMap(prev);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setSeatMap(next);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Contagem de poltronas
  const totalSeats = useMemo(() => {
    return seatMap.filter((c) => c.type === "seat").length;
  }, [seatMap]);

  // Clicar em uma célula do grid
  const handleCellClick = (r: number, c: number) => {
    const existingIndex = seatMap.findIndex(
      (cell) => cell.r === r && cell.c === c && cell.deck === activeDeck
    );

    let nextMap = [...seatMap];

    if (existingIndex >= 0) {
      const current = nextMap[existingIndex];

      // Se clicar com a mesma ferramenta e for poltrona, cicla categoria
      if (current.type === activeTool && activeTool === "seat") {
        nextMap[existingIndex] = {
          ...current,
          category: activeCategory,
        };
      } else {
        // Altera ferramenta
        let newLabel = current.label;
        if (activeTool === "seat" && !newLabel) {
          newLabel = String(totalSeats + 1).padStart(2, "0");
        } else if (activeTool === "wc") newLabel = "WC";
        else if (activeTool === "door") newLabel = "Porta";
        else if (activeTool === "driver") newLabel = "Motorista";
        else if (activeTool === "guide") newLabel = "Guia";
        else if (activeTool === "stairs") newLabel = "Escada";
        else if (activeTool === "aisle" || activeTool === "empty") newLabel = "";

        nextMap[existingIndex] = {
          r,
          c,
          type: activeTool,
          label: newLabel,
          deck: activeDeck,
          category: activeTool === "seat" ? activeCategory : undefined,
          status: activeTool === "seat" ? "available" : undefined,
        };
      }
    } else {
      // Cria nova célula
      let newLabel = "";
      if (activeTool === "seat") newLabel = String(totalSeats + 1).padStart(2, "0");
      else if (activeTool === "wc") newLabel = "WC";
      else if (activeTool === "door") newLabel = "Porta";
      else if (activeTool === "driver") newLabel = "Motorista";
      else if (activeTool === "guide") newLabel = "Guia";
      else if (activeTool === "stairs") newLabel = "Escada";

      nextMap.push({
        r,
        c,
        type: activeTool,
        label: newLabel,
        deck: activeDeck,
        category: activeTool === "seat" ? activeCategory : undefined,
        status: activeTool === "seat" ? "available" : undefined,
      });
    }

    setSeatMap(nextMap);
    pushHistory(nextMap);
  };

  // Renumeração Sequencial Automática
  const handleAutoRenumber = () => {
    let seatNumber = 1;
    const nextMap = seatMap.map((cell) => {
      if (cell.type === "seat") {
        const label = String(seatNumber).padStart(2, "0");
        seatNumber++;
        return { ...cell, label };
      }
      return cell;
    });

    setSeatMap(nextMap);
    pushHistory(nextMap);
    toast.success(`${seatNumber - 1} poltronas renumeradas sequencialmente!`);
  };

  // Salvar no Banco
  const handleSave = async () => {
    try {
      setSaving(true);
      await updateVehicleLayout({
        data: {
          store_id: storeId,
          layout_id: layout.id,
          name: name.trim(),
          rows,
          cols,
          seat_map: seatMap,
        },
      });
      toast.success("Layout de assentos salvo com sucesso!");
      router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar layout");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
      {/* ── 1. Top Bar & Ações ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="size-10 rounded-xl cursor-pointer">
            <Link to={"/workspace/turismo/frota" as any}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                {name}
              </h1>
              <Badge variant="outline" className="text-[11px] font-mono">
                {totalSeats} assentos
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Clique nas células da planta para posicionar poltronas, corredor e banheiros.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Desfazer / Refazer */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="size-9 rounded-xl cursor-pointer"
            title="Desfazer"
          >
            <Undo className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="size-9 rounded-xl cursor-pointer"
            title="Refazer"
          >
            <Redo className="size-3.5" />
          </Button>

          {/* Renumerar */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoRenumber}
            className="h-9 px-3 rounded-xl text-xs gap-1.5 cursor-pointer"
          >
            <Sparkles className="size-3.5 text-primary" /> Renumerar
          </Button>

          {/* Salvar */}
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-5 rounded-xl text-xs font-bold gap-2 cursor-pointer shadow-xs"
          >
            <Save className="size-4" /> {saving ? "Salvando..." : "Salvar Mapa"}
          </Button>
        </div>
      </div>

      {/* ── 2. Paleta de Ferramentas de Pintura ── */}
      <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
            Ferramenta Ativa
          </span>

          {/* Alternador de Piso (Se for Double-Decker) */}
          {layout.is_double_decker && (
            <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/60">
              <Button
                type="button"
                variant={activeDeck === 1 ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveDeck(1)}
                className="h-7 px-3 rounded-lg text-xs cursor-pointer"
              >
                Piso 1 (Inferior)
              </Button>
              <Button
                type="button"
                variant={activeDeck === 2 ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveDeck(2)}
                className="h-7 px-3 rounded-lg text-xs cursor-pointer"
              >
                Piso 2 (Superior)
              </Button>
            </div>
          )}
        </div>

        {/* Botões de Seleção de Ferramenta */}
        <div className="flex flex-wrap items-center gap-2">
          {TOOL_OPTIONS.map((tool) => {
            const isSelected = activeTool === tool.type;
            return (
              <button
                key={tool.type}
                type="button"
                onClick={() => setActiveTool(tool.type)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-2xs"
                    : "border-border/70 bg-background text-foreground hover:bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "size-2.5 rounded-full inline-block",
                    tool.type === "seat" && "bg-primary",
                    tool.type === "aisle" && "bg-muted-foreground/40",
                    tool.type === "wc" && "bg-amber-500",
                    tool.type === "door" && "bg-emerald-500",
                    tool.type === "driver" && "bg-indigo-500",
                    tool.type === "guide" && "bg-purple-500",
                    tool.type === "stairs" && "bg-slate-500",
                    tool.type === "empty" && "border border-border"
                  )}
                />
                {tool.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Chassi Virtual do Veículo 2D ── */}
      <div className="flex justify-center p-6 sm:p-10 rounded-3xl bg-muted/20 border border-border/70 overflow-x-auto">
        {/* Carroceria do Ônibus */}
        <div className="relative w-fit rounded-[40px] border-4 border-foreground/30 bg-card p-6 shadow-xs flex flex-col items-center space-y-4 min-w-[280px]">
          {/* Para-brisa Dianteiro */}
          <div className="w-full h-8 rounded-t-3xl bg-sky-500/10 border-2 border-sky-500/30 flex items-center justify-center text-[10px] font-mono font-bold text-sky-600 uppercase tracking-widest">
            Frente / Para-brisa
          </div>

          {/* Matriz de Assentos */}
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(44px, 52px))`,
            }}
          >
            {Array.from({ length: rows }).map((_, r) =>
              Array.from({ length: cols }).map((_, c) => {
                const cell = seatMap.find(
                  (item) => item.r === r && item.c === c && item.deck === activeDeck
                );
                const cellType: SeatElementType = cell?.type || "empty";

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => handleCellClick(r, c)}
                    title={`Linha ${r + 1}, Coluna ${c + 1}: ${cell?.label || cellType}`}
                    className={cn(
                      "size-11 sm:size-12 rounded-xl flex flex-col items-center justify-center font-bold text-xs transition-all cursor-pointer select-none",
                      // Tipos Visuais
                      cellType === "seat" &&
                        "bg-primary text-primary-foreground border border-primary hover:scale-105 shadow-2xs",
                      cellType === "aisle" &&
                        "bg-muted/30 border border-dashed border-border/50 text-muted-foreground/30 hover:bg-muted/60",
                      cellType === "wc" &&
                        "bg-amber-500/20 text-amber-700 border border-amber-500/40 font-mono text-[11px]",
                      cellType === "door" &&
                        "bg-emerald-500/20 text-emerald-700 border border-emerald-500/40 text-[10px]",
                      cellType === "driver" &&
                        "bg-indigo-500/20 text-indigo-700 border border-indigo-500/40 text-[10px]",
                      cellType === "guide" &&
                        "bg-purple-500/20 text-purple-700 border border-purple-500/40 text-[10px]",
                      cellType === "stairs" &&
                        "bg-slate-500/20 text-slate-700 border border-slate-500/40 text-[10px]",
                      cellType === "empty" &&
                        "border border-border/40 bg-background/50 hover:border-primary/40 text-transparent hover:text-muted-foreground text-[10px]"
                    )}
                  >
                    {cellType === "seat" ? (
                      <>
                        <span className="font-mono text-xs">{cell?.label || `${r + 1}`}</span>
                      </>
                    ) : cellType === "aisle" ? (
                      <span className="text-[9px]">·</span>
                    ) : (
                      cell?.label || cellType
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Traseira do Ônibus */}
          <div className="w-full h-4 rounded-b-2xl bg-muted/60 border-t border-border flex items-center justify-center text-[9px] font-mono text-muted-foreground uppercase">
            Traseira
          </div>
        </div>
      </div>
    </div>
  );
}
