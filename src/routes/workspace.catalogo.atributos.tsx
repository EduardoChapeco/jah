import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Plus, MoreHorizontal, Edit, Trash2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Surface } from "@/components/ui/surface";
import { Input } from "@/components/ui/input";
import { CurrencyField } from "@/components/ui/currency-field";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/state/states";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listOptionGroups,
  upsertOptionGroup,
  deleteOptionGroup,
} from "@/services/admin-catalog.functions";

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
  values: z.array(optionValueSchema),
});

type FormValues = z.infer<typeof formSchema>;

export const Route = createFileRoute("/workspace/catalogo/atributos")({
  head: () => ({ meta: [{ title: "Adicionais e Opções" }] }),
  loader: async () => {
    const res = await listOptionGroups();
    return res || [];
  },
  component: OptionGroupsPage,
});

function OptionGroupsPage() {
  const groups = Route.useLoaderData();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = useMemo(() => {
    return groups.filter(
      (g: any) =>
        g.internal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.display_name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [groups, searchQuery]);

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      internal_name: "",
      display_name: "",
      selection_type: "multiple",
      min_selections: 0,
      max_selections: 1,
      is_required: false,
      values: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "values",
  });

  const handleEdit = (group: any) => {
    form.reset({
      id: group.id,
      internal_name: group.internal_name,
      display_name: group.display_name,
      selection_type: group.selection_type,
      min_selections: group.min_selections,
      max_selections: group.max_selections,
      is_required: group.is_required,
      values: group.values || [],
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este grupo?")) return;
    try {
      await deleteOptionGroup({ data: { id } });
      toast.success("Grupo excluído");
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await upsertOptionGroup({ data });
      toast.success("Grupo salvo com sucesso!");
      setOpen(false);
      form.reset();
      router.invalidate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar grupo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Adicionais e Opções"

        actions={
          <Button
            onClick={() => {
              form.reset({
                internal_name: "",
                display_name: "",
                selection_type: "multiple",
                min_selections: 0,
                max_selections: 1,
                is_required: false,
                values: [],
              });
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar Grupo
          </Button>
        }
      />

      <Surface variant="default" padding="sm" className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </Surface>

      <Surface variant="default" padding="none">
        {filteredGroups.length === 0 ? (
          <EmptyState
            title="Nenhum grupo encontrado"
            description="Você ainda não criou nenhum grupo de opções."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Interno</TableHead>
                <TableHead>Nome Exibido</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Regras</TableHead>
                <TableHead>Opções</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map((group: any) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium text-xs uppercase">
                    {group.internal_name}
                  </TableCell>
                  <TableCell className="font-semibold">{group.display_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {group.selection_type === "single"
                        ? "Escolha Única (Radio)"
                        : "Múltipla (Checkbox)"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {group.is_required && (
                      <Badge className="mr-2 bg-primary/20 text-primary">Obrigatório</Badge>
                    )}
                    Min: {group.min_selections} | Max: {group.max_selections}
                  </TableCell>
                  <TableCell className="text-xs">{group.values?.length || 0} valor(es)</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(group)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(group.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Surface>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-[450px] sm:w-[600px] overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{form.watch("id") ? "Editar Grupo" : "Novo Grupo de Opções"}</SheetTitle>
            <SheetDescription>
              Configure regras de exibição e os valores que o cliente poderá escolher.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6 mt-6">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Interno</Label>
                  <Input {...form.register("internal_name")} placeholder="Ex: BORDAS_PIZZA" />
                  {form.formState.errors.internal_name && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.internal_name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Nome de Exibição (Vitrine)</Label>
                  <Input {...form.register("display_name")} placeholder="Ex: Escolha a Borda" />
                  {form.formState.errors.display_name && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.display_name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Seleção</Label>
                <Select
                  value={form.watch("selection_type")}
                  onValueChange={(val: any) => form.setValue("selection_type", val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Escolha Única (Um apenas)</SelectItem>
                    <SelectItem value="multiple">Escolha Múltipla (Vários)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mínimo de Seleções</Label>
                  <Input
                    type="number"
                    min={0}
                    {...form.register("min_selections", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Máximo de Seleções</Label>
                  <Input
                    type="number"
                    min={1}
                    {...form.register("max_selections", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2 pb-4 border-b border-border">
                <Checkbox
                  id="isRequired"
                  checked={form.watch("is_required")}
                  onCheckedChange={(c) => form.setValue("is_required", !!c)}
                />
                <Label htmlFor="isRequired" className="font-semibold text-foreground">
                  Obrigatório
                </Label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Valores (Opções)</Label>
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
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4 text-center border rounded border-dashed">
                    Nenhuma opção adicionada.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex gap-3 items-start border p-3 rounded-xl bg-muted/20"
                      >
                        <div className="grid flex-1 gap-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Nome / Label</Label>
                              <Input
                                {...form.register(`values.${index}.label`)}
                                placeholder="Ex: Catupiry"
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Preço Adicional (R$)</Label>
                              <CurrencyField
                                className="h-8 text-sm"
                                placeholder="0,00"
                                value={form.watch(`values.${index}.price_modifier_cents`)}
                                onChange={(val) =>
                                  form.setValue(
                                    `values.${index}.price_modifier_cents`,
                                    val || 0,
                                  )
                                }
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                              <Checkbox
                                checked={form.watch(`values.${index}.is_default`)}
                                onCheckedChange={(c) =>
                                  form.setValue(`values.${index}.is_default`, !!c)
                                }
                              />
                              Padrão
                            </label>
                            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-muted-foreground">
                              <Checkbox
                                checked={form.watch(`values.${index}.is_active`)}
                                onCheckedChange={(c) =>
                                  form.setValue(`values.${index}.is_active`, !!c)
                                }
                              />
                              Ativo
                            </label>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive shrink-0"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <SheetFooter className="pt-4 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar Grupo"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
