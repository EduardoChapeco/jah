import React from "react";
import { ShieldCheck, HeartPulse } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export function LeadAccessibilityCard({ lead }: { lead: any }) {
  if (!lead) return null;

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2 flex items-center gap-1.5">
        <ShieldCheck className="h-4 w-4 text-primary" /> Acessibilidade & Saúde
      </h4>
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-medium text-foreground">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border/50">
            <Checkbox
              disabled
              checked={Boolean(lead?.pcd)}
              className="h-4 w-4"
            />
            <span className="text-xs">Passageiro PCD</span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border/50">
            <Checkbox
              disabled
              checked={Boolean(lead?.reduced_mobility)}
              className="h-4 w-4"
            />
            <span className="text-xs">Mobilidade Reduzida</span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border/50">
            <Checkbox
              disabled
              checked={Boolean(lead?.autism)}
              className="h-4 w-4"
            />
            <span className="text-xs">Espectro Autista (TEA)</span>
          </div>
        </div>

        <div className="pt-2 border-t border-border/40">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Notas de Saúde / Restrições Alimentares
          </span>
          <p className="text-xs text-foreground/80 leading-relaxed bg-muted/30 p-2.5 rounded-xl border border-border/40">
            {lead?.health_notes || "Nenhuma restrição ou cuidado especial informado."}
          </p>
        </div>
      </div>
    </div>
  );
}
