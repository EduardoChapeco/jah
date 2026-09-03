import React, { useState } from "react";
import { Plus, X, Calendar, Star, AlertCircle, CheckSquare, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
          is_my_day: isMyDay,
          checklists: checklists.length > 0 ? checklists : undefined,
        },
      });

      toast.success("Tarefa criada com sucesso!");
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-full max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border-border/70 bg-card">
        {/* Header Limpo */}
        <DialogHeader className="px-5 py-4 border-b border-border/60">
          <DialogTitle className="text-base font-bold text-foreground">
            Nova Tarefa Operacional
          </DialogTitle>
        </DialogHeader>

        {/* Formulário com Scroll Suave */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Título */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Título *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Confirmar lista de passageiros com o hotel..."
              className="h-11 rounded-xl text-xs sm:text-sm"
              autoFocus
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Descrição (opcional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instruções ou detalhes adicionais..."
              className="min-h-20 rounded-xl text-xs resize-none"
            />
          </div>

          {/* Prioridade e Data em Linha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>

          {/* Adicionar ao "Meu Dia" */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/60">
            <div className="flex items-center gap-2">
              <Star className="size-4 text-amber-500 fill-amber-500" />
              <span className="text-xs font-semibold text-foreground">Focar no Meu Dia</span>
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
              Etapas / Subitens do Checklist
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
                placeholder="Adicionar etapa..."
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
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/50 text-xs text-foreground"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklist(idx)}
                      className="size-6 flex items-center justify-center text-muted-foreground hover:text-rose-600 rounded cursor-pointer"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Rodapé de Ações */}
        <DialogFooter className="px-5 py-3 border-t border-border/60 bg-muted/10 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="h-10 px-4 rounded-xl text-xs cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !title.trim()}
            className="h-10 px-5 rounded-xl text-xs font-semibold cursor-pointer"
          >
            {submitting ? "Criando..." : "Criar Tarefa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
