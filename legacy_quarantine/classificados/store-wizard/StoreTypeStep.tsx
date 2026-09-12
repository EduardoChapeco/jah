import { STORE_TYPES, type StepProps } from "./types";

export function StoreTypeStep({ data, onChange }: StepProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">
        O que você vai vender ou oferecer?
      </h1>
      <p className="text-muted-foreground mb-8 text-center">
        Escolha o tipo da sua loja para configurarmos os módulos ideais.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-3xl w-full">
        {STORE_TYPES.map((type) => {
          const isActive = data.storeType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => onChange({ storeType: type.id })}
              className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200 min-h-[160px] ${
                isActive
                  ? "border-primary bg-primary/10 shadow-lg scale-[1.03]"
                  : "border-border bg-card hover:border-primary/40 hover:-translate-y-0.5"
              }`}
            >
              <span className="text-4xl">{type.icon}</span>
              <span className="font-bold text-sm text-foreground text-center leading-tight">
                {type.label}
              </span>
              <span className="text-[11px] text-muted-foreground text-center leading-tight">
                {type.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
