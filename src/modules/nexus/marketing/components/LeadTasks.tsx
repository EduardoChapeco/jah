import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
    Plus,
    CheckCircle2,
    Circle,
    Clock,
    User,
    AlertCircle,
    Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LeadTasksProps {
    leadId: string;
    empresaId: string;
}

export function LeadTasks({ leadId, empresaId }: LeadTasksProps) {
    const queryClient = useQueryClient();
    const [isAdding, setIsAdding] = useState(false);

    const { data: tasks, isLoading } = useQuery({
        queryKey: ["lead-tasks", leadId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("lead_tasks")
                .select("*")
                .eq("lead_id", leadId)
                .order("due_date", { ascending: true });

            if (error) throw error;
            return data;
        },
        enabled: !!leadId,
    });

    const toggleTaskMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const { error } = await supabase
                .from("lead_tasks")
                .update({ status: status === 'completed' ? 'pending' : 'completed' })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lead-tasks", leadId] });
            toast.success("Tarefa atualizada");
        }
    });

    if (isLoading) {
        return (
            <div className="space-y-4 mt-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Tarefas Pendentes</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)} className="h-8 px-2 text-orange-600 hover:bg-orange-50">
                    <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
            </div>

            <div className="space-y-3">
                {tasks?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-30 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <CheckCircle2 className="h-8 w-8 mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Tudo em dia!</p>
                    </div>
                ) : (
                    tasks?.map((task) => (
                        <Card 
                            key={task.id} 
                            className={cn(
                                "p-4 border-none shadow-sm flex items-start gap-4 transition-all group",
                                task.status === 'completed' ? "bg-slate-50 opacity-60" : "bg-white hover:shadow-md"
                            )}
                        >
                            <button 
                                onClick={() => toggleTaskMutation.mutate({ id: task.id, status: task.status })}
                                className="mt-0.5"
                            >
                                {task.status === 'completed' ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                ) : (
                                    <Circle className="h-5 w-5 text-slate-300 group-hover:text-orange-500 transition-colors" />
                                )}
                            </button>
                            <div className="flex-1">
                                <h4 className={cn(
                                    "text-sm font-bold text-slate-900 tracking-tight",
                                    task.status === 'completed' && "line-through text-slate-400"
                                )}>
                                    {task.title}
                                </h4>
                                {task.description && (
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-3">
                                    {task.due_date && (
                                        <div className={cn(
                                            "flex items-center gap-1.5 text-[10px] font-bold uppercase",
                                            new Date(task.due_date) < new Date() && task.status !== 'completed' ? "text-red-500" : "text-slate-400"
                                        )}>
                                            <CalendarIcon className="h-3 w-3" />
                                            {format(new Date(task.due_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                        </div>
                                    )}
                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter">
                                        {task.priority || 'media'}
                                    </Badge>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
