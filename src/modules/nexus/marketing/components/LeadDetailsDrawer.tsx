import { useState } from "react";
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetDescription 
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    History, 
    CheckSquare, 
    MessageSquare, 
    Mail, 
    Phone, 
    User,
    MoreVertical,
    Share2,
    Calendar,
    ChevronRight,
    Flame,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LeadTimeline } from "./LeadTimeline";
import { LeadTasks } from "./LeadTasks";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import { Lead } from "@/types/crm";

interface LeadDetailsDrawerProps {
    lead: Lead | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    empresaId: string;
}

export function LeadDetailsDrawer({ lead, open, onOpenChange, empresaId }: LeadDetailsDrawerProps) {
    if (!lead) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl p-0 border-none bg-white flex flex-col h-full shadow-2xl">
                {/* Header Profile Section */}
                <div className="p-8 pb-6 border-b border-slate-100 relative">
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-6">
                            <Avatar className="h-20 w-20 border-4 border-white shadow-md ring-1 ring-slate-100 rounded-2xl">
                                <AvatarImage 
                                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${lead.nome}`} 
                                    className="rounded-2xl"
                                />
                                <AvatarFallback className="rounded-2xl">{lead.nome[0]}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1.5">
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900 leading-none">
                                    {lead.nome}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <Badge variant="secondary" className="bg-amber-50 text-amber-600 border border-amber-100/50 px-3 py-0.5 font-bold text-[10px] uppercase rounded-lg">
                                        <Flame className="h-3 w-3 mr-1.5 fill-amber-600" /> {lead.score || 0} pts
                                    </Badge>
                                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">
                                        {lead.origem || 'Direto'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200 text-slate-400 hover:text-slate-900 transition-all">
                                <Share2 className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200 text-slate-400 hover:text-slate-900 transition-all">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <a href={`tel:${lead.telefone}`} className="bg-slate-50 hover:bg-white hover:shadow-md hover:border-slate-200 group transition-all p-3 rounded-xl flex flex-col items-center gap-2 border border-slate-100">
                            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm text-slate-400 group-hover:text-blue-600 transition-colors">
                                <Phone className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Ligar</span>
                        </a>
                        <a href={`mailto:${lead.email}`} className="bg-slate-50 hover:bg-white hover:shadow-md hover:border-slate-200 group transition-all p-3 rounded-xl flex flex-col items-center gap-2 border border-slate-100">
                            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm text-slate-400 group-hover:text-amber-600 transition-colors">
                                <Mail className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Email</span>
                        </a>
                        <a href={`https://wa.me/${lead.telefone?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="bg-slate-50 hover:bg-white hover:shadow-md hover:border-slate-200 group transition-all p-3 rounded-xl flex flex-col items-center gap-2 border border-slate-100">
                            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm text-slate-400 group-hover:text-emerald-600 transition-colors">
                                <MessageSquare className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">WhatsApp</span>
                        </a>
                    </div>
                </div>

                {/* AI Suggestion Section */}
                <div className="px-8 mt-6">
                    <div className="p-5 rounded-2xl bg-slate-900 text-white relative overflow-hidden group shadow-lg shadow-slate-900/10">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <Sparkles className="h-12 w-12 text-amber-400" />
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">AI Insight</span>
                        </div>
                        <p className="text-xs font-medium leading-relaxed text-slate-100/90">
                            {lead.temperatura === 'quente' 
                                ? "Este lead está altamente engajado. Recomendamos enviar uma proposta personalizada nas próximas 2 horas." 
                                : lead.task_count > 0 
                                ? "Há tarefas pendentes. Priorize a conclusão do follow-up para não perder o timing."
                                : "Lead em estágio inicial. Considere enviar o material de apresentação sobre os novos serviços."}
                        </p>
                    </div>
                </div>

                {/* Tabs Section */}
                <Tabs defaultValue="timeline" className="flex-1 flex flex-col min-h-0 mt-8">
                    <div className="px-8">
                        <TabsList className="w-full bg-slate-50 h-12 p-1.5 rounded-xl border border-slate-100">
                            <TabsTrigger value="timeline" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-400 font-bold uppercase text-[10px] tracking-widest gap-2 transition-all">
                                <History className="h-3.5 w-3.5" /> Timeline
                            </TabsTrigger>
                            <TabsTrigger value="tasks" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-400 font-bold uppercase text-[10px] tracking-widest gap-2 transition-all">
                                <CheckSquare className="h-3.5 w-3.5" /> Tarefas
                            </TabsTrigger>
                            <TabsTrigger value="info" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-400 font-bold uppercase text-[10px] tracking-widest gap-2 transition-all">
                                <User className="h-3.5 w-3.5" /> Info
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 px-8">
                        <TabsContent value="timeline" className="pb-10 pt-4">
                            <LeadTimeline leadId={lead.id} pessoaId={lead.pessoa_id} />
                        </TabsContent>
                        
                        <TabsContent value="tasks" className="pb-10 pt-4">
                            <LeadTasks leadId={lead.id} empresaId={empresaId} />
                        </TabsContent>

                        <TabsContent value="info" className="pb-10 pt-6 space-y-8">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-sm bg-slate-200"></span>
                                    Sobre o Lead
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">E-mail</p>
                                        <p className="text-sm font-bold text-slate-900">{lead.email || 'Não informado'}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Telefone</p>
                                        <p className="text-sm font-bold text-slate-900">{lead.telefone || 'Não informado'}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Notas</p>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed italic">{lead.observacoes || 'Nenhuma nota adicionada.'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-sm bg-slate-200"></span>
                                    Negociação
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Valor Estimado</p>
                                        <p className="text-sm font-bold text-slate-900">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.valor_estimado || 0)}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Probabilidade</p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="flex-1 h-1.5 bg-slate-200 rounded-lg overflow-hidden">
                                                <div 
                                                    className="h-full bg-slate-900 transition-all duration-700" 
                                                    style={{ width: `${lead.probabilidade || 0}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-900">{lead.probabilidade || 0}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-sm bg-slate-200"></span>
                                    Sistema
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Cadastro</p>
                                        <p className="text-xs font-bold text-slate-900">{format(new Date(lead.created_at), "dd/MM/yyyy HH:mm")}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Status</p>
                                        <Badge className={cn(
                                            "mt-1 font-bold uppercase text-[9px] px-3 py-0.5 border shadow-none rounded-lg",
                                            lead.temperatura === 'quente' ? "bg-amber-50 text-amber-600 border-amber-100" : 
                                            lead.temperatura === 'morno' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-100 text-slate-500 border-slate-200"
                                        )}>
                                            {lead.temperatura || 'frio'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>

                {/* Footer Action */}
                <div className="p-8 bg-white border-t border-slate-100">
                    <Button className="w-full h-12 bg-slate-900 hover:bg-black text-white font-bold uppercase text-xs tracking-widest rounded-xl transition-all active:scale-95 shadow-md">
                        Nova Atividade
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
