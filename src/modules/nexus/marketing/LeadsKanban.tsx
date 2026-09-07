
import { useState, useMemo, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, MoreVertical, Loader2, Flame, CloudSun, Snowflake, Plus, Settings2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lead } from '@/types/crm';
import { usePipelines, usePipelineStages } from '@/hooks/usePipelines';

interface LeadsKanbanProps {
    onSelectLead?: (lead: Lead) => void;
}

const getTemperatureConfig = (temp?: string) => {
    switch (temp) {
        case 'quente': return { icon: Flame, color: 'text-orange-600', bg: 'bg-orange-100' };
        case 'morno': return { icon: CloudSun, color: 'text-yellow-600', bg: 'bg-yellow-100' };
        default: return { icon: Snowflake, color: 'text-blue-400', bg: 'bg-blue-50' };
    }
};

export default function LeadsKanban({ onSelectLead }: LeadsKanbanProps) {
    const { id: empresaId } = useParams<{ id: string }>();
    const queryClient = useQueryClient();

    const { pipelines, pipelinesLoading, createDefaultPipeline, isCreatingDefault } = usePipelines(empresaId || '');
    
    const activePipeline = useMemo(() => 
        pipelines?.find(p => p.is_default) || pipelines?.[0], 
    [pipelines]);

    const { data: stages, isLoading: stagesLoading } = usePipelineStages(activePipeline?.id);

    const { data: leads, isLoading: leadsLoading } = useQuery({
        queryKey: ['leads', empresaId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('clientes_leads')
                .select(`
                    *,
                    tasks:lead_tasks(id)
                `)
                .eq('empresa_id', empresaId || '')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            return data.map(l => ({
                ...l,
                task_count: (l.tasks as { id: string }[])?.length || 0
            })) as unknown as Lead[];
        },
        enabled: !!empresaId,
    });

    const updateStageMutation = useMutation({
        mutationFn: async ({ id, stageId }: { id: string; stageId: string }) => {
            const { error } = await supabase
                .from('clientes_leads')
                .update({ stage_id: stageId })
                .eq('id', id);
            if (error) throw error;
        },
        onMutate: async ({ id, stageId }) => {
            await queryClient.cancelQueries({ queryKey: ['leads', empresaId] });
            const previousLeads = queryClient.getQueryData<Lead[]>(['leads', empresaId]);

            queryClient.setQueryData(['leads', empresaId], (old: Lead[] | undefined) => {
                if (!old) return [];
                return old.map((lead) =>
                    lead.id === id ? { ...lead, stage_id: stageId } : lead
                );
            });

            return { previousLeads };
        },
        onError: (_err, _newLead, context) => {
            if (context?.previousLeads) {
                queryClient.setQueryData(['leads', empresaId], context.previousLeads);
            }
            toast.error('Erro ao mover lead');
        },
    });

    const leadsByStage = useMemo(() => {
        const grouped: Record<string, Lead[]> = {};
        stages?.forEach(stage => { grouped[stage.id] = []; });

        leads?.forEach((lead) => {
            if (lead.stage_id && grouped[lead.stage_id]) {
                grouped[lead.stage_id].push(lead);
            } else if (!lead.stage_id && stages?.length) {
                const statusMatch = stages.find(s => s.nome.toLowerCase() === lead.status?.toLowerCase());
                if (statusMatch) grouped[statusMatch.id].push(lead);
                else grouped[stages[0].id].push(lead);
            }
        });
        return grouped;
    }, [leads, stages]);

    const revenueByStage = useMemo(() => {
        const rev: Record<string, number> = {};
        stages?.forEach(stage => { rev[stage.id] = 0; });

        Object.entries(leadsByStage).forEach(([stageId, stageLeads]) => {
            rev[stageId] = stageLeads.reduce((sum, lead) => sum + (Number(lead.valor_estimado) || 0), 0);
        });
        return rev;
    }, [leadsByStage, stages]);

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;
        updateStageMutation.mutate({ id: draggableId, stageId: destination.droppableId });
    };

    if (pipelinesLoading || (activePipeline && stagesLoading) || leadsLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-10 w-10 animate-spin text-slate-900" />
            </div>
        );
    }

    if (!pipelines || pipelines.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100">
                    <Settings2 className="w-10 h-10 text-slate-400" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="luma-title-premium text-xl">Arquitetura de Vendas</h3>
                    <p className="text-slate-500 max-w-sm font-medium text-sm leading-relaxed px-4">
                        Ainda não identificamos nenhum pipeline de prospecção para esta unidade de negócio.
                    </p>
                </div>
                <Button 
                    onClick={() => createDefaultPipeline()} 
                    disabled={isCreatingDefault}
                    className="rounded-2xl h-14 px-8 font-black uppercase text-[10px] tracking-widest bg-slate-900 hover:bg-black transition-all active:scale-95 shadow-none"
                >
                    {isCreatingDefault ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Plus className="w-4 h-4 mr-2" />}
                    Configurar Fluxo Padrão
                </Button>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-250px)] overflow-x-auto pb-6 no-scrollbar">
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-10 h-full min-w-max p-4">
                    {stages.map((stage) => (
                        <div key={stage.id} className="w-80 flex-shrink-0 flex flex-col gap-6">
                            {/* Column Header */}
                            <div className="flex flex-col px-4 group">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-2 h-2 rounded-sm",
                                            stage.color?.replace('border-', 'bg-') || 'bg-slate-300'
                                        )} />
                                        <h3 className="luma-subtitle-premium !text-slate-900 !tracking-wider">
                                            {stage.nome}
                                        </h3>
                                    </div>
                                    <span className="font-black text-[10px] text-slate-300">
                                        {leadsByStage[stage.id]?.length || 0}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1.5 pt-2 border-t border-slate-50">
                                     <span className="text-[10px] font-black text-slate-300 uppercase non-italic tracking-widest">Est: R$</span>
                                     <span className="text-lg font-black italic uppercase tracking-tighter text-slate-900">
                                        {new Intl.NumberFormat('pt-BR', { notation: "compact", maximumFractionDigits: 1 }).format(revenueByStage[stage.id] || 0)}
                                    </span>
                                </div>
                            </div>

                            <Droppable droppableId={stage.id}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className={cn(
                                            "flex-1 rounded-[32px] p-2 transition-all duration-500 overflow-y-auto space-y-4 no-scrollbar",
                                            snapshot.isDraggingOver ? "bg-slate-50/50 border && border-slate-100" : "bg-transparent"
                                        )}
                                    >
                                        {leadsByStage[stage.id]?.map((lead, index) => {
                                            const tempConfig = getTemperatureConfig(lead.temperatura || 'frio');
                                            const TempIcon = tempConfig.icon;
                                            return (
                                                <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            onClick={() => onSelectLead?.(lead)}
                                                            className={cn(
                                                                "luma-card p-5 group relative cursor-grab active:cursor-grabbing",
                                                                snapshot.isDragging ? "rotate-2 scale-[1.05] z-50 shadow-2xl border-slate-900/10" : "hover:border-slate-200"
                                                            )}
                                                        >
                                                            <div className="space-y-5">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex items-center gap-4">
                                                                        <Avatar className="h-10 w-10 rounded-xl border border-slate-100">
                                                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${lead.nome}`} />
                                                                            <AvatarFallback className="text-[10px] bg-slate-50 font-black">{lead.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                                        </Avatar>
                                                                        <div>
                                                                            <h4 className="font-bold text-sm text-slate-900 line-clamp-1 leading-none mb-1.5">{lead.nome}</h4>
                                                                            <p className="luma-subtitle-premium !text-[9px]">{lead.origem || "Organic"}</p>
                                                                        </div>
                                                                    </div>
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-slate-100">
                                                                                <MoreVertical className="h-4 w-4 text-slate-400" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-none p-2 min-w-[180px]">
                                                                            <DropdownMenuItem onClick={() => onSelectLead?.(lead)} className="rounded-xl h-10 font-black text-[9px] uppercase tracking-widest p-4">
                                                                                Ver Pipeline <ChevronRight className="ml-auto h-3 w-3" />
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem className="rounded-xl h-10 font-black text-[9px] uppercase tracking-widest p-4 text-red-500">
                                                                                Arquivar Lead
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>

                                                                {lead.telefone && (
                                                                    <div 
                                                                        className="w-fit flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 hover:border-emerald-100 transition-all cursor-pointer bg-slate-50/50"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            window.open(`https://wa.me/${lead.telefone?.replace(/\D/g, '')}`, '_blank');
                                                                        }}
                                                                    >
                                                                        <MessageSquare className="h-3 w-3" /> Connect
                                                                    </div>
                                                                )}

                                                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                                     <div className="flex flex-col gap-1">
                                                                        {(lead.valor_estimado || 0) > 0 && (
                                                                            <div className="text-sm font-black italic uppercase tracking-tighter text-slate-900">
                                                                                R$ {new Intl.NumberFormat('pt-BR').format(lead.valor_estimado || 0)}
                                                                            </div>
                                                                        )}
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-12 h-1 bg-slate-100 rounded-sm overflow-hidden">
                                                                                <div 
                                                                                    className="h-full bg-slate-900 transition-all duration-700" 
                                                                                    style={{ width: `${lead.probabilidade || 0}%` }}
                                                                                />
                                                                            </div>
                                                                            <span className="text-[9px] font-black text-slate-300">{lead.probabilidade || 0}%</span>
                                                                        </div>
                                                                     </div>

                                                                    <div className={cn(
                                                                        "flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-50 bg-white shadow-none group-hover:bg-slate-50 transition-colors",
                                                                        tempConfig.color,
                                                                    )}>
                                                                        <TempIcon className="h-3 w-3" />
                                                                        <span className="text-[9px] font-black uppercase tracking-widest">{lead.temperatura}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            );
                                        })}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
