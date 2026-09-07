import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
    Plus,
    Search,
    Filter,
    Calendar,
    CheckCircle2,
    Clock,
    AlertTriangle,
    MoreHorizontal,
    Paperclip,
    MessageSquare,
    Users,
    ChevronRight,
    Layout
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TaskStatus = 'todo' | 'inprogress' | 'review' | 'done';

interface ProjectTask {
    id: string;
    title: string;
    description?: string | null;
    status: TaskStatus;
    priority: 'low' | 'medium' | 'high';
    due_date?: string | null;
    assignee?: {
        name: string;
        avatar?: string | null;
    };
    category?: string | null;
}

const COLUMNS: { id: TaskStatus; title: string }[] = [
    { id: 'todo', title: 'A Fazer' },
    { id: 'inprogress', title: 'Em Execução' },
    { id: 'review', title: 'Revisão' },
    { id: 'done', title: 'Concluído' },
];

export default function ProjectBoard() {
    const { id: empresaId } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");

    // Real Tasks Data
    const { data: tasks, isLoading } = useQuery({
        queryKey: ["project-tasks", empresaId],
        queryFn: async () => {
             const { data, error } = await supabase
                .from('production_tasks')
                .select(`
                    *,
                    assignee:pessoas(nome_completo, foto_url)
                `)
                .eq('empresa_id', empresaId);

             if (error) throw error;
             return data.map(task => {
                 const assigneeData = task.assignee as unknown as { nome_completo: string, foto_url?: string } | null;
                 return {
                     ...task,
                     status: (task.status as TaskStatus) || 'todo',
                     priority: (task.priority as 'low' | 'medium' | 'high') || 'medium',
                     assignee: assigneeData ? {
                         name: assigneeData.nome_completo,
                         avatar: assigneeData.foto_url
                     } : undefined
                 };
             }) as ProjectTask[];
        },
        enabled: !!empresaId
    });

    const tasksByStatus = useMemo(() => {
        const grouped: Record<TaskStatus, ProjectTask[]> = {
            todo: [],
            inprogress: [],
            review: [],
            done: []
        };
        tasks?.forEach(task => {
            if (grouped[task.status]) grouped[task.status].push(task);
        });
        return grouped;
    }, [tasks]);

    const updateTaskStatusMutation = useMutation({
        mutationFn: async ({ taskId, status }: { taskId: string, status: TaskStatus }) => {
            const { error } = await supabase
                .from('production_tasks')
                .update({ status })
                .eq('id', taskId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project-tasks", empresaId] });
        }
    });

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;
        
        updateTaskStatusMutation.mutate({ 
            taskId: draggableId, 
            status: destination.droppableId as TaskStatus 
        });
        toast.info(`Tarefa movida para ${destination.droppableId}`);
    };

    const getPriorityColor = (p: string) => {
        switch(p) {
            case 'high': return 'bg-red-50 text-red-600 border-red-100';
            case 'medium': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-blue-50 text-blue-600 border-blue-100';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">ProjectBoard</h1>
                    <p className="text-slate-500 font-bold">Coordenação de fluxo de trabalho para produção de eventos.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="h-12 rounded-xl font-bold border-2">
                        <Filter className="h-4 w-4 mr-2" /> Filtros
                    </Button>
                    <Button className="h-12 rounded-xl bg-slate-900 text-white font-bold px-6">
                        <Plus className="h-5 w-5 mr-2" /> Nova Tarefa
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4 max-w-md bg-white p-2 rounded-2xl shadow-sm border border-slate-100/50">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Buscar tarefa..." 
                        className="pl-11 h-12 rounded-xl border-none bg-transparent font-bold focus-visible:ring-0" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 px-3 border-l border-slate-100">
                    <Layout className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-black uppercase text-slate-400">Kanban</span>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-8 pb-10 overflow-x-auto min-h-[600px] scrollbar-hide">
                    {COLUMNS.map((column) => (
                        <div key={column.id} className="w-80 flex-shrink-0 flex flex-col gap-6">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                                        {column.title}
                                    </h3>
                                    <span className="h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-md bg-slate-100 text-[10px] font-black text-slate-500">
                                        {tasksByStatus[column.id].length}
                                    </span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={cn(
                                            "flex-1 flex flex-col gap-4 p-2 rounded-2xl transition-all duration-300",
                                            snapshot.isDraggingOver ? "bg-slate-50 ring-2 ring-slate-100 ring-inset" : "bg-transparent"
                                        )}
                                    >
                                        {tasksByStatus[column.id].map((task, index) => (
                                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                                {(provided, isDragging) => (
                                                    <Card
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={cn(
                                                            "border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white group select-none",
                                                            isDragging.isDragging ? "rotate-2 scale-105 z-50 shadow-2xl ring-2 ring-slate-900" : ""
                                                        )}
                                                    >
                                                        <CardContent className="p-5 space-y-4">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                                                    {task.title}
                                                                </h4>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                                            <MoreHorizontal className="h-3 w-3" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem>Editar</DropdownMenuItem>
                                                                        <DropdownMenuItem className="text-rose-500">Excluir</DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>

                                                            <div className="flex flex-wrap gap-1.5">
                                                                <Badge className={cn("px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase", getPriorityColor(task.priority))}>
                                                                    {task.priority}
                                                                </Badge>
                                                                {task.category && (
                                                                    <Badge variant="outline" className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase text-slate-400 border-slate-100">
                                                                        {task.category}
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            {task.description && (
                                                                <p className="text-xs text-slate-500 line-clamp-2 font-medium">
                                                                    {task.description}
                                                                </p>
                                                            )}

                                                            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    {task.due_date && (
                                                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
                                                                            <Clock className="h-3 w-3" />
                                                                            {format(new Date(task.due_date), "dd MMM", { locale: ptBR })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center -space-x-2">
                                                                    <Avatar className="h-6 w-6 border-2 border-white">
                                                                        <AvatarFallback className="text-[10px] font-black bg-slate-900 text-white">
                                                                            {task.assignee?.name.charAt(0)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                    <div className="w-80 shrink-0">
                        <Button variant="ghost" className="w-full h-14 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-slate-400 hover:bg-slate-50 font-black uppercase tracking-widest text-[10px]">
                            <Plus className="h-4 w-4 mr-2" /> Adicionar Coluna
                        </Button>
                    </div>
                </div>
            </DragDropContext>
        </div>
    );
}
