import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Sun,
  ListTodo,
  Kanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Star,
  Filter,
  Calendar,
  Layers,
} from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/state/states";

import { getStoreSettings } from "@/services/store.functions";
import {
  listWorkspaceTasks,
  updateTaskStatus,
  toggleTaskMyDay,
  getDailyTaskDigest,
} from "@/services/tasks.functions";

import type { WorkspaceTask, TaskStatus, TaskPriority } from "@/components/tasks/task-types";
import { TaskItemCard } from "@/components/tasks/task-item-card";
import { TaskKanbanBoard } from "@/components/tasks/task-kanban";
import { NewTaskModal } from "@/components/tasks/new-task-modal";
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet";
import { TaskCalendarView } from "@/components/tasks/task-calendar-view";

export const Route = createFileRoute("/workspace/tarefas")({
  head: () => ({ meta: [{ title: "Tarefas & Produtividade | Workspace Wider" }] }),
  loader: async () => {
    const store = await getStoreSettings().catch(() => null);
    const storeId = store?.id || "";
    const [tasks, digest] = await Promise.all([
      storeId ? listWorkspaceTasks({ data: { store_id: storeId } }).catch(() => []) : [],
      storeId ? getDailyTaskDigest({ data: { store_id: storeId } }).catch(() => null) : null,
    ]);
    return {
      store,
      initialTasks: (tasks || []) as WorkspaceTask[],
      initialDigest: digest,
    };
  },
  component: WorkspaceTasksPage,
});

function WorkspaceTasksPage() {
  const { store, initialTasks, initialDigest } = (Route.useLoaderData as any)();
  const router = useRouter();

  const storeId = store?.id || "";

  const [tasks, setTasks] = useState<WorkspaceTask[]>(initialTasks);
  const [digest, setDigest] = useState(initialDigest);
  const [activeTab, setActiveTab] = useState<"my-day" | "kanban" | "list" | "calendar">("my-day");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [contextFilter, setContextFilter] = useState<string>("all");

  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<WorkspaceTask | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Recarregar dados
  const reloadTasks = async () => {
    if (!storeId) return;
    try {
      const [updatedTasks, updatedDigest] = await Promise.all([
        listWorkspaceTasks({ data: { store_id: storeId } }),
        getDailyTaskDigest({ data: { store_id: storeId } }),
      ]);
      setTasks(updatedTasks as WorkspaceTask[]);
      setDigest(updatedDigest);
      router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar tarefas");
    }
  };

  // Alternar status da tarefa
  const handleToggleStatus = async (task: WorkspaceTask) => {
    const nextStatus: TaskStatus = task.status === "done" ? "todo" : "done";
    try {
      await updateTaskStatus({
        data: {
          store_id: storeId,
          task_id: task.id,
          status: nextStatus,
        },
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
      reloadTasks();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar status");
    }
  };

  // Alternar Meu Dia
  const handleToggleMyDay = async (task: WorkspaceTask) => {
    const nextValue = !task.is_my_day;
    try {
      await toggleTaskMyDay({
        data: {
          store_id: storeId,
          task_id: task.id,
          is_my_day: nextValue,
        },
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, is_my_day: nextValue } : t))
      );
      reloadTasks();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao alternar Meu Dia");
    }
  };

  // Mover status no Kanban
  const handleMoveTaskStatus = async (task: WorkspaceTask, newStatus: TaskStatus) => {
    try {
      await updateTaskStatus({
        data: {
          store_id: storeId,
          task_id: task.id,
          status: newStatus,
        },
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
      reloadTasks();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao mover tarefa");
    }
  };

  // Filtro de tarefas
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Filtro da aba
      if (activeTab === "my-day" && !t.is_my_day) return false;

      // Filtro de contexto / nicho
      if (contextFilter !== "all" && t.context_type !== contextFilter) return false;

      // Filtro de busca
      if (searchQuery.trim()) {
        const matchesTitle = t.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDesc = t.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCode = t.task_code?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = t.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        if (!matchesTitle && !matchesDesc && !matchesCode && !matchesTag) return false;
      }

      // Filtro de prioridade
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;

      return true;
    });
  }, [tasks, activeTab, searchQuery, priorityFilter, contextFilter]);

  const pendingTasks = filteredTasks.filter((t) => t.status !== "done");
  const completedTasks = filteredTasks.filter((t) => t.status === "done");

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
      {/* ── 1. Page Header Canônico ── */}
      <PageHeader
        eyebrow="Operação & Rotina"
        title="Tarefas & Produtividade"
        actions={
          <Button
            type="button"
            onClick={() => setNewTaskOpen(true)}
            className="h-11 px-5 rounded-xl text-xs font-bold gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="size-4" /> Nova Tarefa
          </Button>
        }
      />

      {/* ── 2. Cards de Métricas Operacionais (Digest) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Meu Dia</span>
            <Sun className="size-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-foreground font-mono">
            {digest?.myDayCount ?? 0}
          </p>
          <p className="text-[11px] text-muted-foreground">Prioridades para hoje</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Pendentes</span>
            <Clock className="size-4 text-sky-500" />
          </div>
          <p className="text-2xl font-extrabold text-foreground font-mono">
            {digest?.pendingCount ?? 0}
          </p>
          <p className="text-[11px] text-muted-foreground">Em todo o workspace</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Concluídas Hoje</span>
            <CheckCircle2 className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-foreground font-mono">
            {digest?.completedTodayCount ?? 0}
          </p>
          <p className="text-[11px] text-muted-foreground">Finalizadas com sucesso</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Urgentes / Atrasadas</span>
            <AlertTriangle className="size-4 text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold text-foreground font-mono text-rose-600">
            {digest?.urgentCount ?? 0}
          </p>
          <p className="text-[11px] text-muted-foreground">Requerem atenção imediata</p>
        </div>
      </div>

      {/* ── 3. Barra de Controle & Abas Canônicas ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as any)}
          className="w-auto overflow-x-auto"
        >
          <TabsList className="h-11 p-1 rounded-xl bg-muted/30 border border-border/70 flex-nowrap overflow-x-auto no-scrollbar scrollbar-none">
            <TabsTrigger
              value="my-day"
              className="rounded-lg px-3 sm:px-4 text-xs font-semibold gap-1.5 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs"
            >
              <Sun className="size-3.5 text-amber-500" /> Meu Dia
            </TabsTrigger>
            <TabsTrigger
              value="list"
              className="rounded-lg px-3 sm:px-4 text-xs font-semibold gap-1.5 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs"
            >
              <ListTodo className="size-3.5 text-sky-500" /> Lista
            </TabsTrigger>
            <TabsTrigger
              value="kanban"
              className="rounded-lg px-3 sm:px-4 text-xs font-semibold gap-1.5 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs"
            >
              <Kanban className="size-3.5 text-emerald-500" /> Quadro
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="rounded-lg px-3 sm:px-4 text-xs font-semibold gap-1.5 cursor-pointer data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs"
            >
              <Calendar className="size-3.5 text-purple-500" /> Calendário
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filtros de Nicho, Busca e Prioridade */}
        <div className="flex flex-wrap items-center gap-2 flex-1 lg:max-w-2xl justify-end">
          <div className="relative flex-1 min-w-0 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, tag, código..."
              className="h-10 pl-9 rounded-xl text-xs"
            />
          </div>

          <select
            value={contextFilter}
            onChange={(e) => setContextFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-input bg-card text-xs font-semibold text-foreground focus:outline-none"
          >
            <option value="all">Todas as Áreas</option>
            <option value="group_tour">Viagens / Pacotes</option>
            <option value="order">Pedidos / Vendas</option>
            <option value="inventory">Estoque / Fornecedor</option>
            <option value="lead">Leads / Comercial</option>
            <option value="general">Geral</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-input bg-card text-xs font-semibold text-foreground focus:outline-none"
          >
            <option value="all">Prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
        </div>
      </div>

      {/* ── 4. Conteúdo das Abas ── */}
      {activeTab === "calendar" ? (
        <TaskCalendarView
          tasks={filteredTasks}
          onSelectTask={(task) => {
            setSelectedTask(task);
            setDetailOpen(true);
          }}
          onAddTaskOnDate={() => setNewTaskOpen(true)}
        />
      ) : activeTab === "kanban" ? (
        <TaskKanbanBoard
          tasks={filteredTasks}
          onToggleStatus={handleToggleStatus}
          onToggleMyDay={handleToggleMyDay}
          onSelectTask={(task) => {
            setSelectedTask(task);
            setDetailOpen(true);
          }}
          onMoveTaskStatus={handleMoveTaskStatus}
          onNewTaskClick={() => setNewTaskOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          {/* Tarefas Pendentes */}
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <TaskItemCard
                key={task.id}
                task={task}
                onToggleStatus={handleToggleStatus}
                onToggleMyDay={handleToggleMyDay}
                onClick={(t) => {
                  setSelectedTask(t);
                  setDetailOpen(true);
                }}
              />
            ))}

            {pendingTasks.length === 0 && (
              <EmptyState
                title={
                  activeTab === "my-day"
                    ? "Nenhuma tarefa focada para hoje"
                    : "Nenhuma tarefa pendente encontrada"
                }
                description={
                  activeTab === "my-day"
                    ? "Marque com a estrela as tarefas que deseja executar hoje ou crie uma nova."
                    : "Todas as atividades deste filtro foram concluídas ou ainda não foram criadas."
                }
              />
            )}
          </div>

          {/* Tarefas Concluídas */}
          {completedTasks.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-border/60">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <span>Concluídas ({completedTasks.length})</span>
              </div>

              {completedTasks.map((task) => (
                <TaskItemCard
                  key={task.id}
                  task={task}
                  onToggleStatus={handleToggleStatus}
                  onToggleMyDay={handleToggleMyDay}
                  onClick={(t) => {
                    setSelectedTask(t);
                    setDetailOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 5. Modal de Criação de Tarefa ── */}
      <NewTaskModal
        open={newTaskOpen}
        onOpenChange={setNewTaskOpen}
        storeId={storeId}
        defaultMyDay={activeTab === "my-day"}
        onTaskCreated={reloadTasks}
      />

      {/* ── 6. Drawer Lateral de Detalhes ── */}
      <TaskDetailSheet
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        storeId={storeId}
        onTaskUpdated={reloadTasks}
      />
    </div>
  );
}
