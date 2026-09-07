import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useMyCompany } from "@/hooks/useCompanies";
import {
  usePickingBatches,
  usePickingItems,
  useCreatePickingBatch,
  useAddPickingItems,
  useUpdatePickingItem,
  useUpdatePickingBatch,
  type PickingBatch,
  type PickingItem,
} from "@/hooks/usePicking";
import {
  Package,
  ScanLine,
  MapPin,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Camera,
  Printer,
  Lock,
  Layers,
  ListChecks,
  Settings,
  Plus,
  Play,
  ChevronRight,
  AlertTriangle,
  Replace,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Aguardando", color: "bg-yellow-100 text-yellow-800" },
  in_progress: { label: "Separando", color: "bg-blue-100 text-blue-800" },
  completed: { label: "Concluído", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

const ITEM_STATUS: Record<string, { label: string; icon: any }> = {
  pending: { label: "Pendente", icon: Package },
  picked: { label: "Coletado", icon: CheckCircle2 },
  unavailable: { label: "Indisponível", icon: XCircle },
  substituted: { label: "Substituído", icon: Replace },
};

// ── Dashboard Tab ──
function DashboardTab({ companyId }: { companyId: string }) {
  const { data: batches = [] } = usePickingBatches(companyId);
  const createBatch = useCreatePickingBatch();
  const updateBatch = useUpdatePickingBatch();
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = batches.filter((b) => {
    if (channelFilter !== "all" && b.channel !== channelFilter) return false;
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    return true;
  });

  const pending = batches.filter((b) => b.status === "pending").length;
  const inProgress = batches.filter((b) => b.status === "in_progress").length;
  const completed = batches.filter((b) => b.status === "completed").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{pending}</p><p className="text-xs text-muted-foreground">Aguardando</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{inProgress}</p><p className="text-xs text-muted-foreground">Separando</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{completed}</p><p className="text-xs text-muted-foreground">Concluídos</p></CardContent></Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Canal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos canais</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="pickup">Retirada</SelectItem>
            <SelectItem value="store">Loja</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Aguardando</SelectItem>
            <SelectItem value="in_progress">Separando</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={() => {
            createBatch.mutate(
              { company_id: companyId, mode: "single", channel: "delivery" },
              { onSuccess: () => toast.success("Lote criado!") }
            );
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Novo lote
        </Button>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum lote de separação encontrado.</p>
        )}
        {filtered.map((b) => {
          const st = STATUS_MAP[b.status] || STATUS_MAP.pending;
          return (
            <Card key={b.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {b.mode === "cluster" ? <Layers className="h-5 w-5 text-muted-foreground" /> : <Package className="h-5 w-5 text-muted-foreground" />}
                  <div>
                    <p className="font-medium text-sm">{b.batch_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.mode === "cluster" ? "Cluster" : "Individual"}
                      {b.zone && ` · ${b.zone}`}
                      {b.channel && ` · ${b.channel}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {b.sealed && <Lock className="h-4 w-4 text-green-600" />}
                  <Badge className={st.color}>{st.label}</Badge>
                  {b.status === "pending" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateBatch.mutate({
                          id: b.id,
                          company_id: companyId,
                          status: "in_progress",
                          started_at: new Date().toISOString(),
                        });
                      }}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Guided Picking Tab ──
function GuidedPickingTab({ companyId }: { companyId: string }) {
  const { data: batches = [] } = usePickingBatches(companyId);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const { data: items = [] } = usePickingItems(selectedBatchId ?? undefined);
  const updateItem = useUpdatePickingItem();
  const updateBatch = useUpdatePickingBatch();
  const [substituteInput, setSubstituteInput] = useState<Record<string, string>>({});

  const activeBatches = batches.filter((b) => b.status === "in_progress");
  const currentItem = items.find((i) => i.status === "pending");
  const pickedCount = items.filter((i) => i.status !== "pending").length;

  const handlePick = (item: PickingItem) => {
    updateItem.mutate({
      id: item.id,
      batch_id: item.batch_id,
      status: "picked",
      quantity_picked: item.quantity_requested,
      picked_at: new Date().toISOString(),
    });
    toast.success(`${item.product_name} coletado!`);
  };

  const handleUnavailable = (item: PickingItem) => {
    updateItem.mutate({
      id: item.id,
      batch_id: item.batch_id,
      status: "unavailable",
      quantity_picked: 0,
      picked_at: new Date().toISOString(),
    });
    toast.info("Item marcado como indisponível");
  };

  const handleSubstitute = (item: PickingItem) => {
    const name = substituteInput[item.id];
    if (!name) return;
    updateItem.mutate({
      id: item.id,
      batch_id: item.batch_id,
      status: "substituted",
      substitute_name: name,
      quantity_picked: item.quantity_requested,
      picked_at: new Date().toISOString(),
    });
    toast.info(`Substituído por: ${name}`);
  };

  const handleComplete = (batch: PickingBatch) => {
    updateBatch.mutate({
      id: batch.id,
      company_id: companyId,
      status: "completed",
      completed_at: new Date().toISOString(),
    });
    toast.success("Separação concluída!");
    setSelectedBatchId(null);
  };

  if (!selectedBatchId) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold">Selecione um lote em separação:</h3>
        {activeBatches.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum lote ativo. Inicie um lote no Dashboard.</p>
        )}
        {activeBatches.map((b) => (
          <Card key={b.id} className="cursor-pointer hover:shadow-md" onClick={() => setSelectedBatchId(b.id)}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{b.batch_number}</p>
                <p className="text-xs text-muted-foreground">{b.zone || "Sem zona"} · {b.channel || "Geral"}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setSelectedBatchId(null)}>
          ← Voltar
        </Button>
        <Badge variant="outline">{pickedCount}/{items.length} itens</Badge>
      </div>

      {/* Progress */}
      <div className="w-full bg-muted rounded-full h-2">
        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${items.length ? (pickedCount / items.length) * 100 : 0}%` }} />
      </div>

      {currentItem ? (
        <Card className="border-2 border-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Vá para: <span className="text-primary font-bold">{currentItem.location_code || "Sem local"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">{currentItem.quantity_requested}x {currentItem.product_name}</p>
                <p className="text-xs text-muted-foreground">Item {pickedCount + 1} de {items.length}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => handlePick(currentItem)}>
                <ScanLine className="h-4 w-4 mr-1" /> Confirmar
              </Button>
              <Button variant="destructive" size="icon" onClick={() => handleUnavailable(currentItem)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Nome do substituto..."
                value={substituteInput[currentItem.id] || ""}
                onChange={(e) => setSubstituteInput((prev) => ({ ...prev, [currentItem.id]: e.target.value }))}
              />
              <Button variant="outline" size="sm" onClick={() => handleSubstitute(currentItem)} disabled={!substituteInput[currentItem.id]}>
                <Replace className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : items.length > 0 ? (
        <Card className="border-2 border-green-500">
          <CardContent className="p-6 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <p className="font-semibold text-lg">Todos os itens coletados!</p>
            <p className="text-sm text-muted-foreground">Proceda para conferência e lacre.</p>
          </CardContent>
        </Card>
      ) : (
        <p className="text-center text-muted-foreground py-8">Nenhum item neste lote.</p>
      )}

      {/* Picked items summary */}
      {items.filter((i) => i.status !== "pending").length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase">Itens coletados</p>
          {items.filter((i) => i.status !== "pending").map((item) => {
            const st = ITEM_STATUS[item.status] || ITEM_STATUS.pending;
            const Icon = st.icon;
            return (
              <div key={item.id} className="flex items-center gap-2 text-sm py-1">
                <Icon className={`h-4 w-4 ${item.status === "picked" ? "text-green-500" : item.status === "unavailable" ? "text-red-500" : "text-yellow-500"}`} />
                <span className={item.status === "unavailable" ? "line-through text-muted-foreground" : ""}>
                  {item.quantity_requested}x {item.product_name}
                </span>
                {item.substitute_name && <span className="text-xs text-yellow-600">→ {item.substitute_name}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Cluster Tab ──
function ClusterTab({ companyId }: { companyId: string }) {
  const createBatch = useCreatePickingBatch();
  const addItems = useAddPickingItems();
  const [zone, setZone] = useState("");
  const [itemsText, setItemsText] = useState("");

  const handleCreateCluster = () => {
    if (!zone) { toast.error("Informe a zona"); return; }
    createBatch.mutate(
      { company_id: companyId, mode: "cluster", zone, channel: "delivery" },
      {
        onSuccess: (batch) => {
          const lines = itemsText.split("\n").filter(Boolean);
          if (lines.length > 0) {
            const items = lines.map((line, i) => {
              const parts = line.split(",").map((s) => s.trim());
              return {
                batch_id: batch.id,
                product_name: parts[0] || "Item",
                quantity_requested: parseInt(parts[1]) || 1,
                location_code: parts[2] || null,
                sort_order: i,
              };
            });
            addItems.mutate(items as any);
          }
          toast.success(`Cluster "${zone}" criado com ${lines.length} itens!`);
          setZone("");
          setItemsText("");
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4" /> Criar Cluster de Separação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Agrupe pedidos de uma mesma zona para separação em lote. Um separador faz todos de uma vez.
          </p>
          <Input placeholder="Zona de entrega (ex: Efapi, Centro)" value={zone} onChange={(e) => setZone(e.target.value)} />
          <div>
            <label className="text-xs font-medium text-muted-foreground">Itens (nome, qtd, local — um por linha)</label>
            <textarea
              className="w-full border rounded-md p-2 text-sm min-h-[120px] bg-background"
              placeholder={"Coca-Cola 2L, 3, A-3-2\nLeite Integral, 2, B-1-4\nPão Francês, 10, C-2-1"}
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
            />
          </div>
          <Button onClick={handleCreateCluster} disabled={createBatch.isPending}>
            <Plus className="h-4 w-4 mr-1" /> Criar cluster
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Dica: Modo Cluster</p>
              <p className="text-muted-foreground">
                Ao criar um cluster, o sistema agrupa todos os pedidos da mesma zona.
                O separador pode coletar todos os itens em uma única passagem pelo depósito,
                otimizando o tempo em até 60%.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Inspection Tab ──
function InspectionTab({ companyId }: { companyId: string }) {
  const { data: batches = [] } = usePickingBatches(companyId);
  const updateBatch = useUpdatePickingBatch();

  const completedNotSealed = batches.filter((b) => b.status === "completed" && !b.sealed);
  const sealed = batches.filter((b) => b.sealed).slice(0, 20);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Aguardando conferência e lacre</h3>
      {completedNotSealed.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhum lote aguardando lacre.</p>
      )}
      {completedNotSealed.map((b) => (
        <Card key={b.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{b.batch_number}</p>
                <p className="text-xs text-muted-foreground">{b.zone || "Sem zona"}</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Separado</Badge>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  updateBatch.mutate({ id: b.id, company_id: companyId, photo_url: "pending_upload" });
                  toast.info("Foto do pedido registrada");
                }}
              >
                <Camera className="h-4 w-4 mr-1" /> Foto
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  updateBatch.mutate({ id: b.id, company_id: companyId, sealed: true, label_printed: true });
                  toast.success("Pedido lacrado e etiqueta gerada!");
                }}
              >
                <Lock className="h-4 w-4 mr-1" /> Lacrar + Etiqueta
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {sealed.length > 0 && (
        <>
          <h3 className="font-semibold mt-6">Lacrados e prontos para despacho</h3>
          {sealed.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">{b.batch_number}</p>
                    <p className="text-xs text-muted-foreground">{b.zone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {b.label_printed && <Printer className="h-4 w-4 text-muted-foreground" />}
                  <Badge className="bg-green-100 text-green-800">Pronto</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

// ── Main Page ──
export default function PickingPage() {
  const { data: company, isLoading } = useMyCompany();

  if (isLoading) return <div className="p-6 text-muted-foreground">Carregando...</div>;
  if (!company) return <div className="p-6 text-muted-foreground">Crie uma empresa primeiro.</div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ListChecks className="h-6 w-6" /> Sistema de Separação (Picking)
      </h1>
      <Tabs defaultValue="dashboard">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="dashboard" className="gap-1"><Package className="h-4 w-4" /><span className="hidden sm:inline">Dashboard</span></TabsTrigger>
          <TabsTrigger value="guided" className="gap-1"><ScanLine className="h-4 w-4" /><span className="hidden sm:inline">Guiado</span></TabsTrigger>
          <TabsTrigger value="cluster" className="gap-1"><Layers className="h-4 w-4" /><span className="hidden sm:inline">Cluster</span></TabsTrigger>
          <TabsTrigger value="inspection" className="gap-1"><Lock className="h-4 w-4" /><span className="hidden sm:inline">Conferência</span></TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard"><DashboardTab companyId={company.id} /></TabsContent>
        <TabsContent value="guided"><GuidedPickingTab companyId={company.id} /></TabsContent>
        <TabsContent value="cluster"><ClusterTab companyId={company.id} /></TabsContent>
        <TabsContent value="inspection"><InspectionTab companyId={company.id} /></TabsContent>
      </Tabs>
    </div>
  );
}
