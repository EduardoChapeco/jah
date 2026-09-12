import { NICHE_PRESETS, MODULE_REGISTRY, NICHE_LABELS } from "@/lib/nicheModules";
import { CheckCircle2 } from "lucide-react";

interface SemanticPreviewStepProps {
  segment: string;
  activeModules: string[];
}

export function SemanticPreviewStep({ segment, activeModules }: SemanticPreviewStepProps) {
  const preset = NICHE_PRESETS[segment] || NICHE_PRESETS.general;
  const labels = NICHE_LABELS[segment] || {};
  const renamedModules = Object.entries(labels).filter(
    ([moduleId]) => activeModules.includes(moduleId) && MODULE_REGISTRY[moduleId]
  );

  return (
    <div className="space-y-4">
      <h2 style={{ fontSize: 16, fontWeight: 800, color: "hsl(var(--text-primary))", marginBottom: 4 }}>
        Seu sistema personalizado
      </h2>
      <p style={{ fontSize: 12, color: "hsl(var(--text-tertiary))", marginBottom: 8 }}>
        Baseado no segmento <strong>{preset.name}</strong>, os módulos foram ajustados para seu negócio.
      </p>

      {/* Semantic renaming preview */}
      {renamedModules.length > 0 && (
        <div className="card" style={{ padding: "14px 16px" }}>
          <h3 style={{ fontSize: 12, fontWeight: 700, color: "hsl(var(--text-primary))", marginBottom: 10 }}>
            Renomeações semânticas
          </h3>
          <div className="space-y-2">
            {renamedModules.map(([moduleId, customLabel]) => {
              const original = MODULE_REGISTRY[moduleId];
              return (
                <div key={moduleId} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 12, color: "hsl(var(--text-secondary))",
                }}>
                  <span style={{ color: "hsl(var(--text-quaternary))", textDecoration: "line-through" }}>
                    {original.name}
                  </span>
                  <span style={{ color: "hsl(var(--text-quaternary))" }}>→</span>
                  <span style={{ fontWeight: 600, color: "hsl(var(--orange-l))" }}>
                    {customLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active modules */}
      <div className="card" style={{ padding: "14px 16px" }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: "hsl(var(--text-primary))", marginBottom: 10 }}>
          Módulos ativos ({activeModules.length})
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {activeModules.map((modId) => {
            const mod = MODULE_REGISTRY[modId];
            if (!mod) return null;
            const customLabel = labels[modId];
            return (
              <div key={modId} style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "4px 10px", borderRadius: 8,
                background: "hsl(var(--b2))",
                fontSize: 11, color: "hsl(var(--text-secondary))",
              }}>
                <CheckCircle2 size={10} style={{ color: "hsl(var(--green, 142 71% 45%))" }} />
                {customLabel || mod.name}
              </div>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div className="card" style={{ padding: "14px 16px" }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: "hsl(var(--text-primary))", marginBottom: 6 }}>
          Sobre esse perfil
        </h3>
        <p style={{ fontSize: 11, color: "hsl(var(--text-tertiary))", lineHeight: 1.5 }}>
          {preset.description}
        </p>
      </div>
    </div>
  );
}
