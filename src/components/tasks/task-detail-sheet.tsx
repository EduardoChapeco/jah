import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Star,
  CheckSquare,
  MessageSquare,
  Trash2,
  Send,
  Clock,
  Check,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Tag,
  Repeat,
  Link as LinkIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  WorkspaceTask,
  TaskPriority,
  TaskStatus,
  TaskChecklistItem,
  TaskCommentItem,
} from "./task-types";
import {
  getTaskDetails,
  updateWorkspaceTask,
  updateTaskStatus,
  toggleTaskMyDay,
  deleteWorkspaceTask,
  toggleChecklistItem,
  addChecklistItem,
  addTaskComment,
  startTaskTimer,
  stopTaskTimer,
  resetTaskTimer,
} from "@/services/tasks.functions";

interface TaskDetailSheetProps {
  task: WorkspaceTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  onTaskUpdated: () => void;
}

const formatTimer = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  storeId,
  onTaskUpdated,
}: TaskDetailSheetProps) {
  const [currentTask, setCurrentTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Carregar detalhes completos com checklists e comentários
  const loadDetails = async (taskId: string) => {
    try {
      setLoading(true);
      const data = await getTaskDetails({
        data: { store_id: storeId, task_id: taskId },
      });
      setCurrentTask(data);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao carregar detalhes da tarefa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (task && open) {
      loadDetails(task.id);
    } else {
      setCurrentTask(null);
    }
  }, [task?.id, open]);

  useEffect(() => {
    if (currentTask) {
      let initialSecs = currentTask.timer_seconds || 0;
      if (currentTask.is_timer_running && currentTask.timer_started_at) {
        const diff = Math.floor((Date.now() - new Date(currentTask.timer_started_at).getTime()) / 1000);
        initialSecs += Math.max(0, diff);
      }
      setTimerSeconds(initialSecs);
      setIsTimerRunning(Boolean(currentTask.is_timer_running));
    }
  }, [currentTask]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  if (!task) return null;

  const isDone = currentTask?.status === "done";
  const checklists: TaskChecklistItem[] = currentTask?.workspace_task_checklists || [];
  const comments: TaskCommentItem[] = currentTask?.workspace_task_comments || [];

  const completedCount = checklists.filter((c) => c.is_completed).length;
  const progressPercent = checklists.length > 0 ? Math.round((completedCount / checklists.length) * 100) : 0;

  const handleCopyCode = () => {
    const code = currentTask?.task_code || `TSK-${task.id.substring(0, 6).toUpperCase()}`;
    navigator.clipboard.writeText(code);
    toast.success(`Código ${code} copiado!`);
  };

  const handleToggleTimer = async () => {
    try {
      if (isTimerRunning) {
        const res = await stopTaskTimer({ data: { store_id: storeId, task_id: task.id } });
        setIsTimerRunning(false);
        setTimerSeconds(res.timer_seconds || 0);
        toast.info("Cronômetro pausado");
      } else {
        await startTaskTimer({ data: { store_id: storeId, task_id: task.id } });
        setIsTimerRunning(true);
        toast.success("Cronômetro iniciado");
      }
      onTaskUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Erro no cronômetro");
    }
  };

  const handleResetTimer = async () => {
    if (!window.confirm("Deseja zerar o cronômetro desta tarefa?")) return;
    try {
      await resetTaskTimer({ data: { store_id: storeId, task_id: task.id } });
      setIsTimerRunning(false);
      setTimerSeconds(0);
      toast.info("Cronômetro zerado");
      onTaskUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao zerar");
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      await updateTaskStatus({
        data: {
          store_id: storeId,
          task_id: task.id,
          status: newStatus,
        },
      });
      setCurrentTask((prev: any) => ({ ...prev, status: newStatus }));
      onTaskUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar status");
    }
  };

  const handleMyDayToggle = async () => {
    try {
      const nextValue = !currentTask?.is_my_day;
      await toggleTaskMyDay({
        data: {
          store_id: storeId,
          task_id: task.id,
          is_my_day: nextValue,
        },
      });
      setCurrentTask((prev: any) => ({ ...prev, is_my_day: nextValue }));
      onTaskUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar Meu Dia");
    }
  };

  const handleToggleChecklist = async (item: TaskChecklistItem) => {
    try {
      const nextCompleted = !item.is_completed;
      await toggleChecklistItem({
        data: {
          store_id: storeId,
          task_id: task.id,
          checklist_id: item.id,
          is_completed: nextCompleted,
        },
      });
      setCurrentTask((prev: any) => ({
        ...prev,
        workspace_task_checklists: prev.workspace_task_checklists.map((c: any) =>
          c.id === item.id ? { ...c, is_completed: nextCompleted } : c
        ),
      }));
      onTaskUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar item");
    }
  };

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;

    try {
      const created = await addChecklistItem({
        data: {
          store_id: storeId,
          task_id: task.id,
          title: newChecklistTitle.trim(),
        },
      });
      setCurrentTask((prev: any) => ({
        ...prev,
        workspace_task_checklists: [...(prev.workspace_task_checklists || []), created],
      }));
      setNewChecklistTitle("");
      onTaskUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao adicionar item");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      setSubmittingComment(true);
      const created = await addTaskComment({
        data: {
          store_id: storeId,
          task_id: task.id,
          comment_text: newCommentText.trim(),
        },
      });
      setCurrentTask((prev: any) => ({
        ...prev,
        workspace_task_comments: [created, ...(prev.workspace_task_comments || [])],
      }));
      setNewCommentText("");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao adicionar comentário");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm("Deseja realmente excluir esta tarefa?")) return;

    try {
      await deleteWorkspaceTask({
        data: { store_id: storeId, task_id: task.id },
      });
      toast.success("Tarefa excluída");
      onOpenChange(false);
      onTaskUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao excluir tarefa");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full max-sm:!h-[100dvh] max-sm:!inset-0 max-sm:!rounded-none bg-card border-l border-border/70"
      >
        {/* Header do Drawer */}
        <SheetHeader className="px-6 py-4 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleStatusChange(isDone ? "todo" : "done")}
              className={cn(
                "size-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer",
                isDone
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-border/80 bg-background hover:border-primary text-transparent hover:text-primary/40"
              )}
            >
              <Check className="size-4 stroke-[2.5]" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <SheetTitle className="text-sm font-bold text-foreground">
                  {isDone ? "Tarefa Concluída" : "Detalhes da Tarefa"}
                </SheetTitle>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[11px] font-mono font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Clique para copiar código único"
                >
                  <Copy className="size-3" />
                  {currentTask?.task_code || `TSK-${task.id.substring(0, 6).toUpperCase()}`}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Botão Meu Dia */}
            <button
              type="button"
              onClick={handleMyDayToggle}
              title={currentTask?.is_my_day ? "Remover de Meu Dia" : "Adicionar a Meu Dia"}
              className={cn(
                "size-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer",
                currentTask?.is_my_day
                  ? "text-amber-500 hover:bg-amber-500/10"
                  : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted"
              )}
            >
              <Star className={cn("size-4", currentTask?.is_my_day && "fill-amber-500")} />
            </button>

            {/* Excluir */}
            <button
              type="button"
              onClick={handleDeleteTask}
              title="Excluir tarefa"
              className="size-9 flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </SheetHeader>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Título Principal */}
          <div className="space-y-1">
            <h2
              className={cn(
                "text-base sm:text-lg font-bold text-foreground tracking-tight leading-snug",
                isDone && "line-through text-muted-foreground"
              )}
            >
              {currentTask?.title || task.title}
            </h2>
            {currentTask?.description && (
              <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed pt-1">
                {currentTask.description}
              </p>
            )}
          </div>

          {/* CRONÔMETRO AO VIVO / TEMPORIZADOR AVANÇADO */}
          <div className="p-4 rounded-xl border border-border/70 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className={cn(
                "size-10 rounded-xl flex items-center justify-center transition-colors",
                isTimerRunning ? "bg-emerald-500/20 text-emerald-600 animate-pulse" : "bg-muted text-muted-foreground"
              )}>
                <Clock className="size-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  {isTimerRunning ? "Cronômetro em Execução" : "Tempo Total Rastreado"}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-foreground">
                    {formatTimer(timerSeconds)}
                  </span>
                  {(currentTask?.estimated_minutes ?? 0) > 0 && (
                    <span className="text-xs text-muted-foreground font-mono">
                      / {currentTask.estimated_minutes}m est.
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant={isTimerRunning ? "destructive" : "default"}
                size="sm"
                onClick={handleToggleTimer}
                className="h-9 px-4 rounded-xl text-xs font-semibold cursor-pointer gap-1.5 shadow-sm"
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="size-3.5 fill-current" /> Pausar
                  </>
                ) : (
                  <>
                    <Play className="size-3.5 fill-current" /> Iniciar
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetTimer}
                disabled={timerSeconds === 0 && !isTimerRunning}
                className="h-9 w-9 p-0 rounded-xl cursor-pointer text-muted-foreground hover:text-foreground"
                title="Zerar cronômetro"
              >
                <RotateCcw className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Vínculos e Metadados Multi-Nicho */}
          {(currentTask?.context_label || currentTask?.context_type !== "general" || (currentTask?.recurrence && currentTask?.recurrence !== "none")) && (
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/10 flex flex-wrap gap-2 text-xs">
              {currentTask?.context_type && currentTask.context_type !== "general" && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium">
                  <LinkIcon className="size-3" />
                  <span className="capitalize">
                    {currentTask.context_type === "group_tour" ? "Pacote de Viagem" :
                     currentTask.context_type === "order" ? "Pedido / Venda" :
                     currentTask.context_type === "inventory" ? "Estoque / Fornecedor" :
                     currentTask.context_type === "lead" ? "Lead CRM" : currentTask.context_type}
                  </span>
                </div>
              )}

              {currentTask?.context_label && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-foreground font-semibold">
                  <span>Ref: {currentTask.context_label}</span>
                </div>
              )}

              {currentTask?.recurrence && currentTask.recurrence !== "none" && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 font-medium">
                  <Repeat className="size-3" />
                  <span>
                    {currentTask.recurrence === "daily" ? "Diária (Todos os dias)" :
                     currentTask.recurrence === "weekdays" ? "Dias úteis (Seg-Sex)" :
                     currentTask.recurrence === "weekly" ? "Semanal" : "Mensal"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Status & Prioridade */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/20 border border-border/60">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase font-mono">
                Status
              </span>
              <select
                value={currentTask?.status || "todo"}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="w-full h-9 px-2.5 rounded-lg border border-input bg-background text-xs font-semibold text-foreground focus:outline-none"
              >
                <option value="todo">A Fazer</option>
                <option value="in_progress">Em Andamento</option>
                <option value="review">Em Revisão</option>
                <option value="done">Concluída</option>
              </select>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase font-mono">
                Prioridade
              </span>
              <div className="h-9 flex items-center">
                <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5">
                  {currentTask?.priority === "urgent" && "Urgente"}
                  {currentTask?.priority === "high" && "Alta"}
                  {currentTask?.priority === "medium" && "Média"}
                  {currentTask?.priority === "low" && "Baixa"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Tags */}
          {currentTask?.tags && currentTask.tags.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase font-mono">
                Etiquetas / Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentTask.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs py-0.5 px-2.5 rounded-md">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Subitens / Checklists com Barra de Progresso */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckSquare className="size-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Etapas do Checklist</span>
              </div>
              {checklists.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-foreground">
                    {progressPercent}%
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    ({completedCount}/{checklists.length})
                  </span>
                </div>
              )}
            </div>

            {/* Barra de Progresso */}
            {checklists.length > 0 && (
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            {/* Itens */}
            <div className="space-y-1.5">
              {checklists.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleChecklist(item)}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border/60 bg-card hover:bg-muted/10 transition-colors cursor-pointer"
                >
                  <div
                    className={cn(
                      "size-5 rounded border flex items-center justify-center transition-all shrink-0",
                      item.is_completed
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border/80 bg-background"
                    )}
                  >
                    {item.is_completed && <Check className="size-3 stroke-[2.5]" />}
                  </div>
                  <span
                    className={cn(
                      "text-xs text-foreground flex-1 select-none",
                      item.is_completed && "line-through text-muted-foreground"
                    )}
                  >
                    {item.title}
                  </span>
                </div>
              ))}

              {/* Adicionar Novo Item */}
              <form onSubmit={handleAddChecklist} className="flex gap-2 pt-1">
                <Input
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  placeholder="Adicionar nova etapa..."
                  className="h-9 rounded-lg text-xs"
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={!newChecklistTitle.trim()}
                  className="h-9 px-3 rounded-lg text-xs cursor-pointer shrink-0"
                >
                  <Plus className="size-3.5 mr-1" /> Adicionar
                </Button>
              </form>
            </div>
          </div>

          {/* Comentários e Histórico */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="size-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Discussão & Histórico</span>
            </div>

            {/* Input de Novo Comentário */}
            <form onSubmit={handleAddComment} className="space-y-2">
              <Textarea
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Escreva um comentário ou atualização..."
                className="min-h-18 rounded-xl text-xs resize-none"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={submittingComment || !newCommentText.trim()}
                  className="h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  <Send className="size-3 mr-1.5" /> Enviar
                </Button>
              </div>
            </form>

            {/* Timeline de Comentários */}
            <div className="space-y-2 pt-1">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-3 rounded-xl bg-muted/20 border border-border/50 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span>Operador</span>
                    <span>
                      {new Date(comment.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                    {comment.comment_text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
