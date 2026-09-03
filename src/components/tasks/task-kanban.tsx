import React from "react";
import { Plus, Check, MoreVertical, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WorkspaceTask, TaskStatus } from "./task-types";
import { TaskItemCard } from "./task-item-card";

interface TaskKanbanProps {
  tasks: WorkspaceTask[];
  onToggleStatus: (task: WorkspaceTask) => void;
  onToggleMyDay: (task: WorkspaceTask) => void;
  onSelectTask: (task: WorkspaceTask) => void;
  onMoveTaskStatus: (task: WorkspaceTask, newStatus: TaskStatus) => void;
  onNewTaskClick: () => void;
}

const COLUMNS: Array<{ id: TaskStatus; label: string; dotColor: string }> = [
  { id: "todo", label: "A Fazer", dotColor: "bg-slate-400" },
  { id: "in_progress", label: "Em Andamento", dotColor: "bg-sky-500" },
  { id: "review", label: "Em Revisão", dotColor: "bg-amber-500" },
  { id: "done", label: "Concluído", dotColor: "bg-emerald-500" },
];

export function TaskKanbanBoard({
  tasks,
  onToggleStatus,
  onToggleMyDay,
  onSelectTask,
  onMoveTaskStatus,
  onNewTaskClick,
}: TaskKanbanProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start pb-12 overflow-x-auto">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            className="flex flex-col rounded-2xl border border-border/70 bg-muted/20 p-3.5 space-y-3 min-w-[280px]"
          >
            {/* Header da Coluna */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", col.dotColor)} />
                <h3 className="text-xs font-bold text-foreground">{col.label}</h3>
                <span className="text-[11px] font-mono text-muted-foreground bg-background/80 px-1.5 py-0.2 rounded-md border border-border/50">
                  {colTasks.length}
                </span>
              </div>

              {col.id === "todo" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onNewTaskClick}
                  className="size-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Adicionar tarefa"
                >
                  <Plus className="size-3.5" />
                </Button>
              )}
            </div>

            {/* Lista de Cards da Coluna */}
            <div className="space-y-2.5 min-h-32">
              {colTasks.map((task) => (
                <div key={task.id} className="relative group/card">
                  <TaskItemCard
                    task={task}
                    onToggleStatus={onToggleStatus}
                    onToggleMyDay={onToggleMyDay}
                    onClick={onSelectTask}
                  />

                  {/* Ações Rápidas de Mover Coluna (Mobile & Hover) */}
                  <div className="absolute right-2 bottom-2 hidden group-hover/card:flex items-center gap-1 bg-background/95 backdrop-blur-md rounded-lg p-0.5 border border-border shadow-xs">
                    {col.id !== "todo" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const prevIndex = COLUMNS.findIndex((c) => c.id === col.id) - 1;
                          if (prevIndex >= 0) {
                            onMoveTaskStatus(task, COLUMNS[prevIndex].id);
                          }
                        }}
                        title="Voltar etapa"
                        className="size-6 flex items-center justify-center text-muted-foreground hover:text-foreground rounded cursor-pointer"
                      >
                        <ArrowLeft className="size-3" />
                      </button>
                    )}

                    {col.id !== "done" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextIndex = COLUMNS.findIndex((c) => c.id === col.id) + 1;
                          if (nextIndex < COLUMNS.length) {
                            onMoveTaskStatus(task, COLUMNS[nextIndex].id);
                          }
                        }}
                        title="Avançar etapa"
                        className="size-6 flex items-center justify-center text-muted-foreground hover:text-foreground rounded cursor-pointer"
                      >
                        <ArrowRight className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {colTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-border/60 text-muted-foreground/60 text-xs">
                  Sem tarefas nesta etapa
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
