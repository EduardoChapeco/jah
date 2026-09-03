import React, { useState } from "react";
import { Plus, X, Calendar, Star, AlertCircle, CheckSquare, Trash2, Tag, Repeat, Clock, Layers, Link as LinkIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { TaskPriority, TaskContextType } from "./task-types";
import { createWorkspaceTask } from "@/services/tasks.functions";

interface NewTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  onTaskCreated: () => void;
  defaultMyDay?: boolean;
}

const COMMON_TAGS = ["Compras", "Fornecedor", "Checklist", "Operação", "Financeiro", "Cliente", "Pós-Venda", "Urgente"];

export function NewTaskModal({
  open,
  onOpenChange,
  storeId,
  onTaskCreated,
  defaultMyDay = false,
}: NewTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [contextType, setContextType] = useState<TaskContextType>("general");
  const [contextLabel, setContextLabel] = useState("");
  const [recurrence, setRecurrence] = useState<"none" | "daily" | "weekly" | "monthly" | "weekdays">("none");
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isMyDay, setIsMyDay] = useState(defaultMyDay);
  const [checklists, setChecklists] = useState<string[]>([]);
  const [newChecklistInput, setNewChecklistInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAddChecklist = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newChecklistInput.trim()) return;
    setChecklists((prev) => [...prev, newChecklistInput.trim()]);
    setNewChecklistInput("");
  };

  const handleRemoveChecklist = (index: number) => {
    setChecklists((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    setTags((prev) => [...prev, trimmed]);
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Informe o título da tarefa");
      return;
    }

    try {
      setSubmitting(true);
      await createWorkspaceTask({
        data: {
          store_id: storeId,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          status: "todo",
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          context_type: contextType,
          context_label: contextLabel.trim() || undefined,
          tags,
          is_my_day: isMyDay,
          recurrence,
          estimated_minutes: estimatedMinutes,
          checklists: checklists.length > 0 ? checklists : undefined,
        },
      });

      toast.success("Tarefa criada com sucesso!");
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
      setContextType("general");
      setContextLabel("");
      setRecurrence("none");
      setEstimatedMinutes(0);
      setTags([]);
      setChecklists([]);
      onOpenChange(false);
      onTaskCreated();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar tarefa");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-xl md:max-w-2xl w-full max-sm:!h-[100dvh] max-sm:!inset-0 max-sm:!rounded-none border-l p-0 flex flex-col bg-card"
      >
        {/* Header Limpo */}
        <SheetHeader className="px-6 py-5 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-base font-bold text-foreground">
                Nova Tarefa Operacional
              </SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Controle avançado de produtividade com tags, timers e recorrência
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Formulário com Scroll Suave */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Título */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Título da Tarefa *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Fazer compras de insumos para o café da manhã..."
              className="h-11 rounded-xl text-xs sm:text-sm font-medium"
              autoFocus
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Instruções & Detalhes</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione observações, links de fornecedores ou procedimentos padrão..."
              className="min-h-24 rounded-xl text-xs resize-none"
            />
          </div>

          {/* Vínculo de Nicho / Contexto */}
          <div className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
            <div className="flex items-center gap-2">
              <LinkIcon className="size-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Vínculo de Negócio / Nicho</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Tipo de Contexto</label>
                <select
                  value={contextType}
                  onChange={(e) => setContextType(e.target.value as TaskContextType)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="general">Geral / Operação Interna</option>
                  <option value="group_tour">Pacote de Viagem / Excursão</option>
                  <option value="order">Pedido / Comanda / Venda</option>
                  <option value="lead">Lead / Oportunidade Comercial</option>
                  <option value="customer">Cliente / Passageiro</option>
                  <option value="inventory">Estoque / Fornecedor / Peças</option>
                  <option value="contract">Contrato / Jurídico</option>
                  <option value="service">Prestação de Serviço</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground">Identificador / Referência</label>
                <Input
                  value={contextLabel}
                  onChange={(e) => setContextLabel(e.target.value)}
                  placeholder="Ex: Viagem Serra Gaúcha Outubro"
                  className="h-10 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Prioridade, Vencimento, Estimativa e Recorrência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full h-11 px-3 rounded-xl border border-input bg-background text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Data de Vencimento</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-11 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Repeat className="size-3.5 text-muted-foreground" />
                Recorrência
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="none">Sem recorrência (Única)</option>
                <option value="daily">Diária (Todos os dias)</option>
                <option value="weekdays">Dias úteis (Segunda a Sexta)</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="size-3.5 text-muted-foreground" />
                Tempo Estimado (minutos)
              </label>
              <Input
                type="number"
                min="0"
                step="5"
                value={estimatedMinutes || ""}
                onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 0)}
                placeholder="Ex: 30"
                className="h-11 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          {/* Tags do Sistema */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Tag className="size-3.5 text-muted-foreground" />
              Etiquetas / Tags
            </label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag(tagInput);
                  }
                }}
                placeholder="Digite uma tag e aperte Enter..."
                className="h-9 rounded-lg text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddTag(tagInput)}
                className="h-9 px-3 rounded-lg text-xs shrink-0 cursor-pointer"
              >
                Adicionar
              </Button>
            </div>

            {/* Sugestões rápidas de tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COMMON_TAGS.map((ct) => (
                <button
                  key={ct}
                  type="button"
                  onClick={() => handleAddTag(ct)}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                    tags.includes(ct)
                      ? "bg-primary text-primary-foreground border-primary font-medium"
                      : "bg-muted/30 text-muted-foreground border-border/60 hover:bg-muted"
                  }`}
                >
                  +{ct}
                </button>
              ))}
            </div>

            {/* Tags selecionadas */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs py-0.5 pl-2.5 pr-1.5 flex items-center gap-1 rounded-md"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="size-3.5 flex items-center justify-center hover:text-destructive cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Adicionar ao "Meu Dia" */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <Star className="size-4 text-amber-500 fill-amber-500" />
              <div>
                <span className="text-xs font-semibold text-foreground block">Prioridade "Meu Dia"</span>
                <span className="text-[11px] text-muted-foreground">Destaca a tarefa na visão do dia atual</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isMyDay}
              onChange={(e) => setIsMyDay(e.target.checked)}
              className="size-5 rounded border-border text-primary cursor-pointer"
            />
          </div>

          {/* Subitens de Checklist */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CheckSquare className="size-3.5 text-muted-foreground" />
              Etapas / Subitens do Checklist (Trello Level)
            </label>

            <div className="flex gap-2">
              <Input
                value={newChecklistInput}
                onChange={(e) => setNewChecklistInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddChecklist();
                  }
                }}
                placeholder="Ex: Verificar validade dos alvarás de viagem..."
                className="h-9 rounded-lg text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddChecklist}
                className="h-9 px-3 rounded-lg text-xs cursor-pointer shrink-0"
              >
                Adicionar
              </Button>
            </div>

            {checklists.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {checklists.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/60 text-xs text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <span className="size-5 rounded bg-muted flex items-center justify-center font-mono text-[10px] text-muted-foreground">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklist(idx)}
                      className="size-6 flex items-center justify-center text-muted-foreground hover:text-rose-600 rounded cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Rodapé de Ações */}
        <SheetFooter className="px-6 py-4 border-t border-border/60 bg-muted/20 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="h-11 px-4 rounded-xl text-xs cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !title.trim()}
            className="h-11 px-6 rounded-xl text-xs font-semibold cursor-pointer shadow-sm"
          >
            {submitting ? "Criando..." : "Criar Tarefa"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
