import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  Sparkles,
  Check,
  AlertCircle,
  HelpCircle,
  Layers,
  Utensils,
  Coffee,
  PlusCircle,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CurrencyField } from "@/components/ui/currency-field";
import { Badge } from "@/components/ui/badge";
import { upsertOptionGroup } from "@/services/admin-catalog.functions";
import { cn } from "@/lib/utils";

const optionValueSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1, "Obrigatório"),
  price_modifier_cents: z.number().int().default(0),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

const formSchema = z.object({
  id: z.string().uuid().optional(),
  internal_name: z.string().min(1, "Nome interno é obrigatório"),
  display_name: z.string().min(1, "Nome de exibição é obrigatório"),
  selection_type: z.enum(["single", "multiple"]),
  min_selections: z.number().int().min(0),
  max_selections: z.number().int().min(1),
  is_required: z.boolean(),
  values: z.array(optionValueSchema).min(1, "Adicione pelo menos 1 opção"),
});

export type OptionGroupFormData = z.infer<typeof formSchema>;

export interface QuickOptionGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupToEdit?: any | null;
  onSaved: (savedGroup: any) => void;
}

const PRESETS = [
  {
    name: "Ponto da Carne",
    icon: Utensils,
    desc: "1 opção obrigatória",
    data: {
      display_name: "Ponto da Carne",
      internal_name: "ponto-carne",
      selection_type: "single" as const,
      is_required: true,
      min_selections: 1,
      max_selections: 1,
      values: [
        { label: "Mal Passado", price_modifier_cents: 0, is_default: false, is_active: true },
        { label: "Ao Ponto", price_modifier_cents: 0, is_default: true, is_active: true },
        { label: "Bem Passado", price_modifier_cents: 0, is_default: false, is_active: true },
      ],
    },
  },
  {
    name: "Adicionais Pagos",
    icon: PlusCircle,
    desc: "Vários extras opcionais",
    data: {
      display_name: "Turbine seu Pedido (Adicionais)",
      internal_name: "adicionais-extras",
      selection_type: "multiple" as const,
      is_required: false,
      min_selections: 0,
      max_selections: 5,
      values: [
        { label: "Bacon Crocante Extra", price_modifier_cents: 450, is_default: false, is_active: true },
        { label: "Queijo Cheddar Fatiado", price_modifier_cents: 350, is_default: false, is_active: true },
        { label: "Ovo Frito", price_modifier_cents: 250, is_default: false, is_active: true },
        { label: "Molho Especial da Casa (50ml)", price_modifier_cents: 300, is_default: false, is_active: true },
      ],
    },
  },
  {
    name: "Bebida Acompanhamento",
    icon: Coffee,
    desc: "1 bebida opcional",
    data: {
      display_name: "Deseja Bebida?",
      internal_name: "bebida-combo",
      selection_type: "single" as const,
      is_required: false,
      min_selections: 0,
      max_selections: 1,
      values: [
        { label: "Não, obrigado", price_modifier_cents: 0, is_default: true, is_active: true },
        { label: "Coca-Cola Original 350ml", price_modifier_cents: 600, is_default: false, is_active: true },
        { label: "Coca-Cola Zero 350ml", price_modifier_cents: 600, is_default: false, is_active: true },
        { label: "Suco Natural de Laranja 400ml", price_modifier_cents: 850, is_default: false, is_active: true },
        { label: "Água Mineral com Gás 500ml", price_modifier_cents: 400, is_default: false, is_active: true },
      ],
    },
  },
  {
    name: "Tamanho / Porção",
    icon: Layers,
    desc: "Escolha obrigatória de tamanho",
    data: {
      display_name: "Escolha o Tamanho",
      internal_name: "tamanho-porcao",
      selection_type: "single" as const,
      is_required: true,
      min_selections: 1,
      max_selections: 1,
      values: [
        { label: "Pequeno (300g)", price_modifier_cents: 0, is_default: false, is_active: true },
        { label: "Médio (500g)", price_modifier_cents: 600, is_default: true, is_active: true },
        { label: "Grande (750g)", price_modifier_cents: 1200, is_default: false, is_active: true },
      ],
    },
  },
];

export function QuickOptionGroupDialog({
  open,
  onOpenChange,
  groupToEdit,
  onSaved,
}: QuickOptionGroupDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OptionGroupFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      internal_name: "",
      display_name: "",
      selection_type: "multiple",
      min_selections: 0,
      max_selections: 3,
      is_required: false,
      values: [
        { label: "", price_modifier_cents: 0, is_default: false, is_active: true },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "values",
  });

  const selectionType = form.watch("selection_type");
  const isRequired = form.watch("is_required");

  // Popula o formulário ao abrir ou trocar de grupo a editar
  useEffect(() => {
    if (open) {
      if (groupToEdit) {
        form.reset({
          id: groupToEdit.id,
          internal_name: groupToEdit.internal_name || "",
          display_name: groupToEdit.display_name || "",
          selection_type: groupToEdit.selection_type || "multiple",
          min_selections: groupToEdit.min_selections ?? 0,
          max_selections: groupToEdit.max_selections ?? 1,
          is_required: groupToEdit.is_required ?? false,
          values:
            groupToEdit.values && groupToEdit.values.length > 0
              ? groupToEdit.values.map((v: any) => ({
                  id: v.id,
                  label: v.label || "",
                  price_modifier_cents: v.price_modifier_cents ?? 0,
                  is_default: v.is_default ?? false,
                  is_active: v.is_active ?? true,
                }))
              : [{ label: "", price_modifier_cents: 0, is_default: false, is_active: true }],
        });
      } else {
        form.reset({
          internal_name: "",
          display_name: "",
          selection_type: "multiple",
          min_selections: 0,
          max_selections: 3,
          is_required: false,
          values: [
            { label: "", price_modifier_cents: 0, is_default: false, is_active: true },
          ],
        });
      }
    }
  }, [open, groupToEdit, form]);

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    form.reset({
      id: groupToEdit?.id,
      internal_name: preset.data.internal_name,
      display_name: preset.data.display_name,
      selection_type: preset.data.selection_type,
      min_selections: preset.data.min_selections,
      max_selections: preset.data.max_selections,
      is_required: preset.data.is_required,
      values: preset.data.values.map((v) => ({ ...v })),
    });
    toast.info(`Preset "${preset.name}" aplicado.`);
  };

  const onSubmit = async (data: OptionGroupFormData) => {
    setIsSubmitting(true);
    try {
      // Ajusta regras de min/max caso seja seleção única
      const cleanedData = {
        ...data,
        internal_name: data.internal_name.trim() || data.display_name.trim().toLowerCase().replace(/\s+/g, "-"),
        min_selections: data.selection_type === "single" ? (data.is_required ? 1 : 0) : data.min_selections,
        max_selections: data.selection_type === "single" ? 1 : Math.max(data.min_selections, data.max_selections),
      };

      const result = await upsertOptionGroup({ data: cleanedData });
      toast.success(groupToEdit ? "Grupo de adicionais atualizado!" : "Grupo de adicionais criado com sucesso!");
      
      const savedGroup = result?.group || {
        ...cleanedData,
        id: groupToEdit?.id || "temp-" + Date.now(),
        values: cleanedData.values,
      };

      onSaved(savedGroup);
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar grupo de adicionais.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border">
        <DialogHeader className="p-6 pb-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <SlidersHorizontal className="size-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {groupToEdit ? "Editar Grupo de Modificadores" : "Criar Grupo de Adicionais & Modificadores"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Defina as opções, regras de escolha e valores extras que os clientes poderão selecionar.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* PRESETS RÁPIDOS (Se for criação) */}
          {!groupToEdit && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                <span>Modelos Prontos (Presets de 1 Clique)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="flex flex-col items-start p-2.5 rounded-xl border border-border/80 bg-background hover:bg-muted/40 hover:border-primary/40 transition-all text-left group"
                    >
                      <div className="flex items-center gap-1.5 w-full mb-1">
                        <Icon className="size-3.5 text-primary" />
                        <span className="text-xs font-semibold text-foreground truncate">{preset.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground line-clamp-1">{preset.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* DADOS BÁSICOS DO GRUPO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Nome para o Cliente <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Ex: Escolha o Ponto da Carne"
                className="h-10 text-xs"
                {...form.register("display_name", {
                  onChange: (e) => {
                    if (!form.getValues("internal_name") || form.getValues("internal_name") === "") {
                      form.setValue(
                        "internal_name",
                        e.target.value
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/(^-|-$)+/g, ""),
                      );
                    }
                  },
                })}
              />
              {form.formState.errors.display_name && (
                <p className="text-[10px] text-destructive font-medium">
                  {form.formState.errors.display_name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Identificador Interno
              </Label>
              <Input
                placeholder="Ex: ponto-carne"
                className="h-10 text-xs font-mono"
                {...form.register("internal_name")}
              />
              {form.formState.errors.internal_name && (
                <p className="text-[10px] text-destructive font-medium">
                  {form.formState.errors.internal_name.message}
                </p>
              )}
            </div>
          </div>

          {/* TIPO DE ESCOLHA & REGRAS */}
          <div className="rounded-2xl p-4 bg-muted/30 border border-border/70 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* TIPO DE SELEÇÃO */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tipo de Seleção</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      form.setValue("selection_type", "single");
                      form.setValue("max_selections", 1);
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all",
                      selectionType === "single"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border/80 bg-background text-muted-foreground hover:bg-muted/40",
                    )}
                  >
                    <span>Única (1 opção)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => form.setValue("selection_type", "multiple")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-all",
                      selectionType === "multiple"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border/80 bg-background text-muted-foreground hover:bg-muted/40",
                    )}
                  >
                    <span>Múltipla (Várias)</span>
                  </button>
                </div>
              </div>

              {/* OBRIGATÓRIO SWITCH */}
              <div className="flex flex-col justify-between p-2.5 rounded-xl border border-border/80 bg-background">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold">Escolha Obrigatória</Label>
                    <p className="text-[10px] text-muted-foreground">O cliente não pode avançar sem escolher</p>
                  </div>
                  <Switch
                    checked={isRequired}
                    onCheckedChange={(checked) => {
                      form.setValue("is_required", checked);
                      if (checked && form.getValues("min_selections") === 0) {
                        form.setValue("min_selections", 1);
                      } else if (!checked) {
                        form.setValue("min_selections", 0);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* LIMITES DE QUANTIDADE (SE FOR MÚLTIPLA) */}
            {selectionType === "multiple" && (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/50">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">Mínimo de Escolhas</Label>
                  <Input
                    type="number"
                    min={0}
                    className="h-8.5 text-xs"
                    {...form.register("min_selections", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-muted-foreground">Máximo de Escolhas</Label>
                  <Input
                    type="number"
                    min={1}
                    className="h-8.5 text-xs"
                    {...form.register("max_selections", { valueAsNumber: true })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* LISTA DE OPÇÕES / ITENS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Opções / Itens do Grupo ({fields.length})
                </Label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    label: "",
                    price_modifier_cents: 0,
                    is_default: false,
                    is_active: true,
                  })
                }
                className="h-7 text-xs gap-1 border-dashed"
              >
                <Plus className="size-3.5 text-primary" />
                Adicionar Opção
              </Button>
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-border/80 bg-background hover:border-foreground/20 transition-all"
                >
                  <span className="text-xs font-mono font-bold text-muted-foreground w-4 text-center">
                    {index + 1}
                  </span>

                  {/* Nome da Opção */}
                  <div className="flex-1 min-w-[140px]">
                    <Input
                      placeholder="Nome da opção (ex: Bacon Extra)"
                      className="h-9 text-xs"
                      {...form.register(`values.${index}.label` as const)}
                    />
                  </div>

                  {/* Preço Adicional */}
                  <div className="w-32">
                    <CurrencyField
                      placeholder="R$ 0,00"
                      className="h-9 text-xs"
                      value={form.watch(`values.${index}.price_modifier_cents` as const) || 0}
                      onChange={(cents) =>
                        form.setValue(`values.${index}.price_modifier_cents` as const, cents ?? 0)
                      }
                    />
                  </div>

                  {/* Botão Remover */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                    className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {form.formState.errors.values && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="size-3.5" />
                {form.formState.errors.values.message}
              </p>
            )}
          </div>
        </form>

        <DialogFooter className="p-4 border-t border-border/80 bg-muted/10 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-9 text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="h-9 text-xs gap-1.5 font-bold"
          >
            {isSubmitting ? "Salvando..." : groupToEdit ? "Salvar Alterações" : "Salvar e Vincular Grupo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
