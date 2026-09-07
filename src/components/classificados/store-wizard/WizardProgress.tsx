interface Props {
  currentStep: number;
  totalSteps: number;
}

const STEP_LABELS = ["Tipo de loja", "Identidade", "Localização", "Operação", "Publicar"];

export function WizardProgress({ currentStep, totalSteps }: Props) {
  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          Etapa {currentStep} de {totalSteps}
        </span>
        <span className="text-sm font-semibold text-foreground">
          {STEP_LABELS[currentStep - 1]}
        </span>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
              i < currentStep ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
