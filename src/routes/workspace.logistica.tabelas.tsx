import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Truck,
  Car,
  Bike,
  Boxes,
  Zap,
  Save,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyField } from "@/components/ui/currency-field";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import { toast } from "sonner";
import {
  listLogisticsPriceTables,
  saveLogisticsPriceTable,
} from "@/services/mobility.functions";

export const Route = createFileRoute("/workspace/logistica/tabelas")({
  head: () => ({
    meta: [{ title: "Tabelas de Preço de Frete & KM | Wider Workspace" }],
  }),
  loader: async () => {
    try {
      const res = await listLogisticsPriceTables();
      return res || [];
    } catch {
      return [];
    }
  },
  component: WorkspaceLogisticsPriceTablesPage,
});

interface PriceTableItem {
  id?: string;
  service_type: any;
  name: string;
  base_fee_cents: number;
  km_rate_cents: number;
  min_fare_cents: number;
  helper_fee_cents: number;
  is_active: boolean;
}

const DEFAULT_TABLES: PriceTableItem[] = [
  {
    service_type: "delivery_express",
    name: "Entrega Expressa (Moto / Flash)",
    base_fee_cents: 500,
    km_rate_cents: 220,
    min_fare_cents: 900,
    helper_fee_cents: 0,
    is_active: true,
  },
  {
    service_type: "ride_car",
    name: "Transporte de Passageiros (Carro)",
    base_fee_cents: 600,
    km_rate_cents: 280,
    min_fare_cents: 1200,
    helper_fee_cents: 0,
    is_active: true,
  },
  {
    service_type: "freight_van",
    name: "Fretes & Utilitários (Fiorino / Van)",
    base_fee_cents: 2500,
    km_rate_cents: 450,
    min_fare_cents: 4500,
    helper_fee_cents: 3000,
    is_active: true,
  },
  {
    service_type: "moving_truck",
    name: "Mudanças Completas (Caminhão Baú)",
    base_fee_cents: 8000,
    km_rate_cents: 750,
    min_fare_cents: 15000,
    helper_fee_cents: 5000,
    is_active: true,
  },
];

function WorkspaceLogisticsPriceTablesPage() {
  const loadedTables = Route.useLoaderData() as any[];
  const router = useRouter();

  const [tables, setTables] = useState<PriceTableItem[]>(() => {
    if (loadedTables && loadedTables.length > 0) {
      return loadedTables;
    }
    return DEFAULT_TABLES;
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (loadedTables && loadedTables.length > 0) {
      setTables(loadedTables);
    }
  }, [loadedTables]);

  const handleUpdate = (serviceType: string, field: keyof PriceTableItem, value: any) => {
    setTables((prev) =>
      prev.map((t) => (t.service_type === serviceType ? { ...t, [field]: value } : t)),
    );
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      for (const table of tables) {
        await saveLogisticsPriceTable({
          data: {
            id: table.id,
            name: table.name,
            service_type: table.service_type,
            base_fee_cents: table.base_fee_cents || 0,
            km_rate_cents: table.km_rate_cents || 0,
            min_fare_cents: table.min_fare_cents || 0,
            helper_fee_cents: table.helper_fee_cents || 0,
            is_active: table.is_active ?? true,
          },
        });
      }
      toast.success("Tabelas de frete e tarifas por KM salvas com sucesso no banco!");
      await router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar tabelas de preço.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        eyebrow="Logística"
        title="Tabelas de Preço & Tarifas por KM"
        actions={
          <Button
            onClick={handleSaveAll}
            disabled={isSaving}
            size="sm"
            className="font-bold text-xs bg-primary text-primary-foreground gap-2 rounded-xl h-9"
          >
            {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            <span>{isSaving ? "Salvando no Banco..." : "Salvar Alterações"}</span>
          </Button>
        }
      />

      {/* Grid de Modais e Tarifas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tables.map((table: PriceTableItem) => (
          <div
            key={table.id}
            className="rounded-2xl bg-card p-6 border border-border/60 space-y-5 shadow-none"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {table.service_type === "moving_truck" ? (
                    <Boxes className="size-4" />
                  ) : table.service_type === "freight_van" ? (
                    <Truck className="size-4" />
                  ) : table.service_type === "ride_car" ? (
                    <Car className="size-4" />
                  ) : (
                    <Zap className="size-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground leading-tight">{table.name}</h3>
                  <Badge variant="outline" className="text-[9px] uppercase font-mono mt-0.5">
                    {table.service_type}
                  </Badge>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold select-none">
                <input
                  type="checkbox"
                  checked={table.is_active}
                  onChange={(e) => handleUpdate(table.id as string, "is_active", e.target.checked)}
                  className="rounded border-border text-primary size-4"
                />
                <span className={table.is_active ? "text-foreground" : "text-muted-foreground"}>
                  {table.is_active ? "Ativo" : "Inativo"}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Tarifa de Saída (Base)</Label>
                <CurrencyField
                  value={table.base_fee_cents}
                  onChange={(cents) => handleUpdate(table.id as string, "base_fee_cents", cents || 0)}
                  placeholder="0,00"
                  className="h-10 text-sm font-mono"
                />
                <p className="text-[10px] text-muted-foreground">Valor fixo de partida</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Valor por KM Rodado</Label>
                <CurrencyField
                  value={table.km_rate_cents}
                  onChange={(cents) => handleUpdate(table.id as string, "km_rate_cents", cents || 0)}
                  placeholder="0,00"
                  className="h-10 text-sm font-mono"
                />
                <p className="text-[10px] text-muted-foreground">Adicional por KM linear</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Corrida Mínima</Label>
                <CurrencyField
                  value={table.min_fare_cents}
                  onChange={(cents) => handleUpdate(table.id as string, "min_fare_cents", cents || 0)}
                  placeholder="0,00"
                  className="h-10 text-sm font-mono"
                />
                <p className="text-[10px] text-muted-foreground">Piso mínimo cobrado</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Taxa de Ajudante / Carga</Label>
                <CurrencyField
                  value={table.helper_fee_cents}
                  onChange={(cents) => handleUpdate(table.id as string, "helper_fee_cents", cents || 0)}
                  placeholder="0,00"
                  className="h-10 text-sm font-mono"
                />
                <p className="text-[10px] text-muted-foreground">Mão de obra extra</p>
              </div>
            </div>

            {/* Simulador Rápido */}
            <div className="p-3.5 rounded-2xl bg-muted/20 border border-border/50 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[11px] text-muted-foreground font-medium">Estimativa para 5 km:</span>
                <p className="font-bold text-foreground">
                  {formatMoney(
                    Math.max(
                      table.min_fare_cents,
                      table.base_fee_cents + (table.km_rate_cents * 5),
                    )
                  )}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                Cálculo em tempo real
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
