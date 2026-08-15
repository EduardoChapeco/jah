import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  DollarSign,
  Plus,
  Truck,
  Car,
  Bike,
  Boxes,
  Zap,
  Save,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import { toast } from "sonner";

export const Route = createFileRoute("/workspace/logistica/tabelas")({
  head: () => ({
    meta: [{ title: "Tabelas de Preço de Frete & KM | JAH Workspace" }],
  }),
  component: WorkspaceLogisticsPriceTablesPage,
});

interface PriceTableItem {
  id: string;
  service_type: string;
  name: string;
  base_fee_cents: number;
  km_rate_cents: number;
  min_fare_cents: number;
  helper_fee_cents: number;
  is_active: boolean;
}

const DEFAULT_TABLES: PriceTableItem[] = [
  {
    id: "1",
    service_type: "delivery_express",
    name: "Entrega Expressa (Moto / Flash)",
    base_fee_cents: 500,
    km_rate_cents: 220,
    min_fare_cents: 900,
    helper_fee_cents: 0,
    is_active: true,
  },
  {
    id: "2",
    service_type: "ride_car",
    name: "Transporte de Passageiros (Carro)",
    base_fee_cents: 600,
    km_rate_cents: 280,
    min_fare_cents: 1200,
    helper_fee_cents: 0,
    is_active: true,
  },
  {
    id: "3",
    service_type: "freight_van",
    name: "Fretes & Utilitários (Fiorino / Van)",
    base_fee_cents: 2500,
    km_rate_cents: 450,
    min_fare_cents: 4500,
    helper_fee_cents: 3000,
    is_active: true,
  },
  {
    id: "4",
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
  const [tables, setTables] = useState<PriceTableItem[]>(DEFAULT_TABLES);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = (id: string, field: keyof PriceTableItem, value: any) => {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  };

  const handleSaveAll = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Tabelas de frete e tarifas por KM salvas com sucesso!");
    }, 600);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Tabelas de Preço & Tarifas de Logística
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure tarifas base, valor cobrado por quilômetro rodado e adicionais por tipo de veículo.
          </p>
        </div>

        <Button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="rounded-2xl h-11 px-6 font-bold text-xs bg-primary text-primary-foreground gap-2"
        >
          <Save className="size-4" />
          <span>{isSaving ? "Salvando..." : "Salvar Alterações"}</span>
        </Button>
      </div>

      {/* Grid de Modais e Tarifas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tables.map((table) => (
          <div
            key={table.id}
            className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
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
                  onChange={(e) => handleUpdate(table.id, "is_active", e.target.checked)}
                  className="size-4 rounded border-border text-primary"
                />
                <span>Ativo</span>
              </label>
            </div>

            {/* Campos de Configuração */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Tarifa Base (Partida)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.50"
                    value={(table.base_fee_cents / 100).toFixed(2)}
                    onChange={(e) =>
                      handleUpdate(
                        table.id,
                        "base_fee_cents",
                        Math.round(parseFloat(e.target.value || "0") * 100),
                      )
                    }
                    className="h-10 pl-9 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Valor por KM Rodado
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.10"
                    value={(table.km_rate_cents / 100).toFixed(2)}
                    onChange={(e) =>
                      handleUpdate(
                        table.id,
                        "km_rate_cents",
                        Math.round(parseFloat(e.target.value || "0") * 100),
                      )
                    }
                    className="h-10 pl-9 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Tarifa Mínima do Chamado
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="1.00"
                    value={(table.min_fare_cents / 100).toFixed(2)}
                    onChange={(e) =>
                      handleUpdate(
                        table.id,
                        "min_fare_cents",
                        Math.round(parseFloat(e.target.value || "0") * 100),
                      )
                    }
                    className="h-10 pl-9 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase">
                  Adicional Ajudante
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="5.00"
                    value={(table.helper_fee_cents / 100).toFixed(2)}
                    onChange={(e) =>
                      handleUpdate(
                        table.id,
                        "helper_fee_cents",
                        Math.round(parseFloat(e.target.value || "0") * 100),
                      )
                    }
                    className="h-10 pl-9 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
