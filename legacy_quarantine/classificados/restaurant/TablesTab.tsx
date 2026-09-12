import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  useRestaurantTables, useUpsertTable, useDeleteTable, useCreateComanda,
  useRestaurantSectors, useUpsertSector, useDeleteSector,
  useFloorElements, useUpsertElement, useDeleteElement
} from "@/hooks/useRestaurant";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, Users, UtensilsCrossed, CircleDot, Move, DoorOpen, Bath, ChefHat, TreePine, Crown, GripVertical, Edit, Save, Eye } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  available: "bg-green-500",
  occupied: "bg-red-500",
  reserved: "bg-yellow-500",
  bill_requested: "bg-orange-500",
  blocked: "bg-muted-foreground",
};
const statusLabels: Record<string, string> = {
  available: "🟢 Livre",
  occupied: "🔴 Ocupada",
  reserved: "🟡 Reservada",
  bill_requested: "🟠 Conta",
  blocked: "⭕ Bloqueada",
};

const elementTypes = [
  { type: "door", icon: "🚪", label: "Porta" },
  { type: "outdoor", icon: "🌿", label: "Área Externa" },
  { type: "vip", icon: "🏠", label: "Sala VIP" },
  { type: "bathroom", icon: "🚻", label: "Banheiro" },
  { type: "kitchen_area", icon: "👨‍🍳", label: "Cozinha" },
];

const tableShapes = [
  { value: "round", label: "🪑 Redonda" },
  { value: "square", label: "🪑 Quadrada" },
  { value: "rectangle", label: "🪑 Retangular" },
];

interface Props { companyId: string; }

export default function TablesTab({ companyId }: Props) {
  const { user } = useAuth();
  const { data: tables = [], isLoading } = useRestaurantTables(companyId);
  const { data: sectors = [] } = useRestaurantSectors(companyId);
  const { data: elements = [] } = useFloorElements(companyId);
  const upsertTable = useUpsertTable();
  const deleteTable = useDeleteTable();
  const createComanda = useCreateComanda();
  const upsertSector = useUpsertSector();
  const deleteSector = useDeleteSector();
  const upsertElement = useUpsertElement();
  const deleteElement = useDeleteElement();

  const [mode, setMode] = useState<"view" | "edit">("view");
  const [showTableForm, setShowTableForm] = useState(false);
  const [showSectorForm, setShowSectorForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [editingSector, setEditingSector] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [selectedSector, setSelectedSector] = useState("all");
  const [dragging, setDragging] = useState<any>(null);

  const [form, setForm] = useState({ table_number: "", nickname: "", capacity: 4, shape: "round", min_consumption: 0, sector_id: "" });
  const [sectorForm, setSectorForm] = useState({ name: "", responsible_id: "" });

  const canvasRef = useRef<HTMLDivElement>(null);

  const openNewTable = () => {
    setEditing(null);
    setForm({ table_number: "", nickname: "", capacity: 4, shape: "round", min_consumption: 0, sector_id: sectors[0]?.id || "" });
    setShowTableForm(true);
  };

  const openEditTable = (t: any) => {
    setEditing(t);
    setForm({ table_number: t.table_number, nickname: t.nickname || "", capacity: t.capacity || 4, shape: t.shape || "round", min_consumption: t.min_consumption || 0, sector_id: t.sector_id || "" });
    setShowTableForm(true);
  };

  const handleSaveTable = async () => {
    if (!form.table_number) { toast.error("Número é obrigatório"); return; }
    await upsertTable.mutateAsync({ 
      ...(editing ? { id: editing.id } : {}), 
      company_id: companyId, 
      table_number: form.table_number, 
      nickname: form.nickname || null, 
      capacity: form.capacity, 
      shape: form.shape, 
      min_consumption: form.min_consumption,
      sector_id: form.sector_id || null,
    });
    toast.success(editing ? "Mesa atualizada" : "Mesa criada");
    setShowTableForm(false);
  };

  const handleOpenComanda = async (table: any) => {
    if (!user) return;
    const comanda = await createComanda.mutateAsync({ company_id: companyId, table_name: `Mesa ${table.table_number}`, opened_by: user.id });
    await upsertTable.mutateAsync({ id: table.id, status: "occupied", current_comanda_id: comanda.id });
    toast.success(`Comanda aberta na Mesa ${table.table_number}`);
  };

  const handleFreeTable = async (table: any) => {
    await upsertTable.mutateAsync({ id: table.id, status: "available", current_comanda_id: null });
    toast.success(`Mesa ${table.table_number} liberada`);
  };

  const handleRequestBill = async (table: any) => {
    await upsertTable.mutateAsync({ id: table.id, status: "bill_requested" });
    toast.success(`Conta solicitada na Mesa ${table.table_number}`);
  };

  const handleBlockTable = async (table: any) => {
    await upsertTable.mutateAsync({ id: table.id, status: "blocked" });
    toast.success(`Mesa ${table.table_number} bloqueada`);
  };

  const handleAddElement = async (type: string) => {
    await upsertElement.mutateAsync({ company_id: companyId, element_type: type, label: elementTypes.find(e => e.type === type)?.label || type, pos_x: 50 + Math.random() * 200, pos_y: 50 + Math.random() * 200 });
    toast.success("Elemento adicionado");
  };

  const handleDragStart = (e: React.MouseEvent, item: any, isTable: boolean) => {
    if (mode !== "edit") return;
    setDragging({ item, isTable, startX: e.clientX, startY: e.clientY, origX: isTable ? (item.pos_x || 0) : (item.pos_x || 0), origY: isTable ? (item.pos_y || 0) : (item.pos_y || 0) });
  };

  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.startX;
    const dy = e.clientY - dragging.startY;
    const el = document.getElementById(`floor-item-${dragging.item.id}`);
    if (el) {
      el.style.left = `${dragging.origX + dx}px`;
      el.style.top = `${dragging.origY + dy}px`;
    }
  }, [dragging]);

  const handleDragEnd = useCallback(async (e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.startX;
    const dy = e.clientY - dragging.startY;
    const newX = Math.max(0, dragging.origX + dx);
    const newY = Math.max(0, dragging.origY + dy);
    if (dragging.isTable) {
      await upsertTable.mutateAsync({ id: dragging.item.id, pos_x: newX, pos_y: newY });
    } else {
      await upsertElement.mutateAsync({ id: dragging.item.id, pos_x: newX, pos_y: newY });
    }
    setDragging(null);
  }, [dragging, upsertTable, upsertElement]);

  // Sectors
  const openNewSector = () => { setEditingSector(null); setSectorForm({ name: "", responsible_id: "" }); setShowSectorForm(true); };
  const openEditSector = (s: any) => { setEditingSector(s); setSectorForm({ name: s.name, responsible_id: s.responsible_id || "" }); setShowSectorForm(true); };
  const handleSaveSector = async () => {
    if (!sectorForm.name) { toast.error("Nome obrigatório"); return; }
    await upsertSector.mutateAsync({ ...(editingSector ? { id: editingSector.id } : {}), company_id: companyId, name: sectorForm.name, responsible_id: sectorForm.responsible_id || null });
    toast.success(editingSector ? "Setor atualizado" : "Setor criado");
    setShowSectorForm(false);
  };

  const filteredTables = tables.filter((t: any) => {
    if (filter !== "all" && t.status !== filter) return false;
    if (selectedSector !== "all" && t.sector_id !== selectedSector) return false;
    return true;
  });

  const getTableSize = (shape: string, capacity: number) => {
    const base = 60;
    if (shape === "rectangle") return { w: base + capacity * 6, h: base };
    return { w: base + capacity * 4, h: base + capacity * 4 };
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold">Mapa de Mesas</h2>
        <div className="flex gap-2">
          <Button size="sm" variant={mode === "view" ? "default" : "outline"} onClick={() => setMode("view")}>
            <Eye className="h-4 w-4 mr-1" />Operação
          </Button>
          <Button size="sm" variant={mode === "edit" ? "default" : "outline"} onClick={() => setMode("edit")}>
            <Edit className="h-4 w-4 mr-1" />Editar Layout
          </Button>
        </div>
      </div>

      {/* Sectors bar */}
      <div className="flex gap-2 flex-wrap items-center">
        <Button size="sm" variant={selectedSector === "all" ? "default" : "outline"} onClick={() => setSelectedSector("all")}>Todos</Button>
        {sectors.map((s: any) => (
          <Button key={s.id} size="sm" variant={selectedSector === s.id ? "default" : "outline"} onClick={() => setSelectedSector(s.id)}>
            {s.name}
            {mode === "edit" && <Edit className="h-3 w-3 ml-1" onClick={e => { e.stopPropagation(); openEditSector(s); }} />}
          </Button>
        ))}
        {mode === "edit" && <Button size="sm" variant="ghost" onClick={openNewSector}><Plus className="h-4 w-4" />Setor</Button>}
      </div>

      {/* Status filters (view mode) */}
      {mode === "view" && (
        <div className="flex gap-2 flex-wrap">
          {["all", "available", "occupied", "reserved", "bill_requested", "blocked"].map(s => (
            <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>
              {s === "all" ? "Todas" : statusLabels[s]}
              <Badge variant="secondary" className="ml-1 text-xs">{s === "all" ? tables.length : tables.filter((t: any) => t.status === s).length}</Badge>
            </Button>
          ))}
        </div>
      )}

      {/* Edit mode: element palette */}
      {mode === "edit" && (
        <Card>
          <CardContent className="p-3">
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-sm font-medium text-muted-foreground">Adicionar:</span>
              <Button size="sm" variant="outline" onClick={openNewTable}><Plus className="h-4 w-4 mr-1" />Mesa</Button>
              {elementTypes.map(et => (
                <Button key={et.type} size="sm" variant="outline" onClick={() => handleAddElement(et.type)}>
                  {et.icon} {et.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floor plan canvas */}
      <div 
        ref={canvasRef}
        className="relative border-2 border-dashed rounded-xl bg-muted/20 overflow-hidden"
        style={{ minHeight: 500 }}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* Floor elements */}
        {elements.map((el: any) => (
          <div
            key={el.id}
            id={`floor-item-${el.id}`}
            className={`absolute flex items-center justify-center rounded-lg border-2 border-dashed text-2xl select-none ${mode === "edit" ? "cursor-move border-muted-foreground/30 hover:border-primary" : "border-transparent"}`}
            style={{ left: el.pos_x || 0, top: el.pos_y || 0, width: el.width || 60, height: el.height || 60 }}
            onMouseDown={e => handleDragStart(e, el, false)}
          >
            <div className="flex flex-col items-center">
              <span>{elementTypes.find(et => et.type === el.element_type)?.icon || "📦"}</span>
              <span className="text-[10px] text-muted-foreground">{el.label}</span>
            </div>
            {mode === "edit" && (
              <button className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center" onClick={() => deleteElement.mutateAsync(el.id)}>×</button>
            )}
          </div>
        ))}

        {/* Tables */}
        {filteredTables.map((table: any) => {
          const size = getTableSize(table.shape || "round", table.capacity || 4);
          const isRound = table.shape === "round";
          return (
            <div
              key={table.id}
              id={`floor-item-${table.id}`}
              className={`absolute flex flex-col items-center justify-center border-2 select-none transition-all
                ${isRound ? "rounded-full" : table.shape === "rectangle" ? "rounded-lg" : "rounded-md"}
                ${mode === "edit" ? "cursor-move hover:shadow-lg" : "cursor-pointer hover:scale-105"}
                ${table.status === "available" ? "bg-green-500/20 border-green-500" : ""}
                ${table.status === "occupied" ? "bg-red-500/20 border-red-500" : ""}
                ${table.status === "reserved" ? "bg-yellow-500/20 border-yellow-500" : ""}
                ${table.status === "bill_requested" ? "bg-orange-500/20 border-orange-500" : ""}
                ${table.status === "blocked" ? "bg-muted border-muted-foreground/30" : ""}
              `}
              style={{ left: table.pos_x || 0, top: table.pos_y || 0, width: size.w, height: size.h }}
              onMouseDown={e => mode === "edit" && handleDragStart(e, table, true)}
              onClick={() => mode === "view" && openEditTable(table)}
            >
              <span className="text-sm font-bold">{table.table_number}</span>
              <span className="text-[10px] text-muted-foreground">{table.nickname || ""}</span>
              <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Users className="h-3 w-3" />{table.capacity}
              </div>
              {mode === "edit" && (
                <button className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center" onClick={e => { e.stopPropagation(); openEditTable(table); }}>✎</button>
              )}
            </div>
          );
        })}

        {tables.length === 0 && elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">Nenhuma mesa cadastrada</p>
              <p className="text-sm">Clique em "Editar Layout" e adicione mesas ao seu salão</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions for view mode */}
      {mode === "view" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {filteredTables.map((table: any) => (
            <Card key={table.id} className="overflow-hidden">
              <CardContent className="p-2 text-center space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${statusColors[table.status] || "bg-muted"}`} />
                  <span className="font-bold text-sm">Mesa {table.table_number}</span>
                </div>
                {table.nickname && <p className="text-[10px] text-muted-foreground">{table.nickname}</p>}
                <p className="text-[10px] text-muted-foreground">{statusLabels[table.status]}</p>
                {table.min_consumption > 0 && <p className="text-[10px] text-muted-foreground">Mín: R$ {table.min_consumption}</p>}
                <div className="flex gap-1 justify-center flex-wrap">
                  {table.status === "available" && (
                    <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => handleOpenComanda(table)}>
                      <UtensilsCrossed className="h-3 w-3" />Abrir
                    </Button>
                  )}
                  {table.status === "occupied" && (
                    <>
                      <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => handleRequestBill(table)}>
                        🟠 Conta
                      </Button>
                      <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => handleFreeTable(table)}>
                        <CircleDot className="h-3 w-3" />Liberar
                      </Button>
                    </>
                  )}
                  {table.status === "bill_requested" && (
                    <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => handleFreeTable(table)}>
                      ✅ Finalizar
                    </Button>
                  )}
                  {table.status === "blocked" && (
                    <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => handleFreeTable(table)}>
                      Desbloquear
                    </Button>
                  )}
                  {table.status === "available" && (
                    <Button size="sm" variant="ghost" className="text-[10px] h-6 px-1" onClick={() => handleBlockTable(table)}>
                      🔒
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table form dialog */}
      <Dialog open={showTableForm} onOpenChange={setShowTableForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? `Mesa ${editing.table_number}` : "Nova Mesa"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Número *</Label><Input value={form.table_number} onChange={e => setForm(f => ({ ...f, table_number: e.target.value }))} /></div>
              <div><Label>Apelido</Label><Input value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} placeholder="Varanda 1" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Formato</Label>
                <Select value={form.shape} onValueChange={v => setForm(f => ({ ...f, shape: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tableShapes.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Capacidade</Label><Input type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: +e.target.value }))} /></div>
              <div><Label>Cons. Mín (R$)</Label><Input type="number" value={form.min_consumption} onChange={e => setForm(f => ({ ...f, min_consumption: +e.target.value }))} /></div>
            </div>
            {sectors.length > 0 && (
              <div>
                <Label>Setor</Label>
                <Select value={form.sector_id} onValueChange={v => setForm(f => ({ ...f, sector_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar setor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem setor</SelectItem>
                    {sectors.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            {editing && <Button variant="destructive" size="sm" onClick={async () => { await deleteTable.mutateAsync(editing.id); setShowTableForm(false); toast.success("Mesa removida"); }}><Trash2 className="h-4 w-4" /></Button>}
            <Button onClick={handleSaveTable}><Save className="h-4 w-4 mr-1" />{editing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sector form dialog */}
      <Dialog open={showSectorForm} onOpenChange={setShowSectorForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSector ? "Editar Setor" : "Novo Setor"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome do Setor *</Label><Input value={sectorForm.name} onChange={e => setSectorForm(f => ({ ...f, name: e.target.value }))} placeholder="Salão Principal, Varanda..." /></div>
          </div>
          <DialogFooter className="gap-2">
            {editingSector && <Button variant="destructive" size="sm" onClick={async () => { await deleteSector.mutateAsync(editingSector.id); setShowSectorForm(false); toast.success("Setor removido"); }}><Trash2 className="h-4 w-4" /></Button>}
            <Button onClick={handleSaveSector}>{editingSector ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
