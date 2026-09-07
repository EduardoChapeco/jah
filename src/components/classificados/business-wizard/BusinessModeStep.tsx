import { BUSINESS_TEMPLATES } from "@/lib/nicheModules";

export type BusinessMode = "commerce";

interface BusinessModeStepProps {
  selectedTemplate: string;
  onSelectTemplate: (template: string) => void;
}

export function BusinessModeStep({ selectedTemplate, onSelectTemplate }: BusinessModeStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "hsl(var(--text-primary))", marginBottom: 4 }}>
          Qual é o seu negócio?
        </h2>
        <p style={{ fontSize: 12, color: "hsl(var(--text-tertiary))", marginBottom: 16 }}>
          Escolha o template que mais se encaixa. Isso define seus módulos e vocabulário.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BUSINESS_TEMPLATES.map((template) => {
            const isSelected = selectedTemplate === template.id;
            return (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template.id)}
                style={{
                  textAlign: "center",
                  padding: "16px 12px",
                  borderRadius: 12,
                  border: isSelected
                    ? "2px solid hsl(var(--orange-l))"
                    : "1px solid hsl(var(--b2))",
                  background: isSelected
                    ? "hsl(var(--orange-d) / 0.15)"
                    : "hsl(var(--b1))",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 6 }}>{template.emoji}</div>
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  color: isSelected ? "hsl(var(--orange-l))" : "hsl(var(--text-primary))",
                }}>
                  {template.name}
                </div>
                <p style={{ fontSize: 10, color: "hsl(var(--text-quaternary))", marginTop: 2 }}>
                  {template.tagline}
                </p>
                {isSelected && template.inspirations.length > 0 && (
                  <p style={{ fontSize: 9, color: "hsl(var(--text-quaternary))", marginTop: 4, fontStyle: "italic" }}>
                    Inspirado em: {template.inspirations.join(", ")}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sidebar preview */}
      {selectedTemplate && (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 12,
            background: "hsl(var(--b2) / 0.5)",
            border: "1px solid hsl(var(--b2))",
          }}
        >
          <h3 style={{ fontSize: 11, fontWeight: 700, color: "hsl(var(--text-tertiary))", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Seu painel será organizado assim:
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {BUSINESS_TEMPLATES.find(t => t.id === selectedTemplate)?.sidebarPreview.map((item, i) => (
              <div key={i} style={{
                fontSize: 12, color: "hsl(var(--text-secondary))",
                display: "flex", alignItems: "center", gap: 6,
                padding: "4px 8px",
                borderRadius: 6,
                background: i === 0 ? "hsl(var(--orange-d) / 0.1)" : "transparent",
              }}>
                <span style={{
                  width: 4, height: 4, borderRadius: "50%",
                  background: i === 0 ? "hsl(var(--orange-l))" : "hsl(var(--text-quaternary))",
                }} />
                {item}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: "hsl(var(--text-quaternary))", marginTop: 8, fontStyle: "italic" }}>
            Você poderá adicionar ou remover módulos depois.
          </p>
        </div>
      )}
    </div>
  );
}
