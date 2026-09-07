
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    BookOpen,
    CheckCircle2,
    Plus,
    Search,
    ChevronRight,
    Flame,
    ShieldCheck,
    ClipboardList,
    Clock,
    Trash2,
    Edit2,
    ArrowLeft,
    Target,
    Zap,
    Scale,
    Activity,
    Lock,
    Eye,
    Settings,
    Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type Playbook = Database['public']['Tables']['playbooks']['Row'];
type ChecklistItem = {
    task: string;
    status: string;
    created_at: string;
};

export default function OperationalPlaybooks() {
    const { id: empresaId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlaybookId, setSelectedPlaybookId] = useState<string | null>(null);
    const [newItemText, setNewItemText] = useState('');
    const [isAddingItem, setIsAddingItem] = useState(false);

    // Fetch Playbooks
    const { data: playbooks, isLoading } = useQuery({
        queryKey: ['playbooks', empresaId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('playbooks')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as Playbook[];
        }
    });

    const selectedPlaybook = playbooks?.find(p => p.id === selectedPlaybookId) || null;

    const createPlaybook = useMutation({
        mutationFn: async (payload: Omit<Playbook, 'id' | 'created_at' | 'updated_at' | 'empresa_id'>) => {
            const { error } = await supabase
                .from('playbooks')
                .insert({ 
                    ...payload, 
                    empresa_id: empresaId as string,
                    checklist: payload.checklist as Playbook['checklist'], 
                    instrucoes_preparo: payload.instrucoes_preparo as Playbook['instrucoes_preparo']
                });
            if (error) {
                console.error("Error creating playbook:", error);
                throw error;
            }
            console.log("Playbook created successfully:", payload.titulo);
        },
        onSuccess: () => {
            toast.success("Novo Padrão Operacional registrado!");
            queryClient.invalidateQueries({ queryKey: ['playbooks'] });
        }
    });

    const updatePlaybook = useMutation({
        mutationFn: async (payload: Partial<Playbook>) => {
            const { error } = await supabase
                .from('playbooks')
                .update(payload as Database['public']['Tables']['playbooks']['Update'])
                .eq('id', selectedPlaybookId as string);
            if (error) {
                console.error("Error updating playbook:", error);
                throw error;
            }
            console.log("Playbook updated successfully:", payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playbooks'] });
            toast.success("Manifesto sincronizado.");
        }
    });

    const addChecklistItem = () => {
        if (!newItemText.trim() || !selectedPlaybook) return;

        const currentChecklist = (selectedPlaybook.checklist as ChecklistItem[]) || [];
        const newItem = { task: newItemText, status: 'mandatory', created_at: new Date().toISOString() };
        const newChecklist = [...currentChecklist, newItem];

        updatePlaybook.mutate({ checklist: newChecklist });
        setNewItemText('');
    };

    const removeChecklistItem = (index: number) => {
        if (!selectedPlaybook) return;
        const currentChecklist = (selectedPlaybook.checklist as ChecklistItem[]) || [];
        const newChecklist = [...currentChecklist];
        newChecklist.splice(index, 1);
        updatePlaybook.mutate({ checklist: newChecklist });
    };

    const filteredPlaybooks = playbooks?.filter(p =>
        p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tipo_setor?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-slate-100">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate(-1)}
                        className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all group"
                    >
                        <ArrowLeft className="h-6 w-6 text-slate-400 group-hover:text-slate-900 transition-colors" />
                    </button>
                    <div>
                        <p className="luma-subtitle-premium">SOP & Operational Standards</p>
                        <h1 className="luma-title-premium !text-4xl">Playbooks</h1>
                    </div>
                </div>

                <Sheet>
                    <SheetTrigger asChild>
                        <button className="h-14 px-10 rounded-[28px] bg-slate-900 text-white font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-slate-900/10 hover:bg-black transition-all active:scale-95 duration-500 flex items-center gap-3">
                            <Plus className="h-5 w-5" /> Iniciar Protocolo
                        </button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-md border-none p-0 overflow-hidden bg-white shadow-[-32px_0_120px_rgba(0,0,0,0.1)] rounded-l-[48px]">
                        <div className="p-12 border-b border-slate-50 bg-slate-50/30">
                            <SheetHeader>
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 mb-2">Structure Design</p>
                                <SheetTitle className="text-3xl font-black italic uppercase tracking-tighter">Novo Playbook</SheetTitle>
                                <SheetDescription className="font-medium text-slate-400 pt-2 leading-relaxed">Defina padrões de qualidade para novos setores operacionais.</SheetDescription>
                            </SheetHeader>
                        </div>
                        <div className="p-12 space-y-10">
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-300 ml-2">Nomenclatura do Padrão</Label>
                                    <Input placeholder="Ex: Abertura de Bar VIP..." className="h-16 rounded-[24px] border-slate-100 bg-slate-50 focus-visible:bg-white focus-visible:ring-0 focus-visible:border-slate-900 text-lg font-black italic uppercase tracking-tighter transition-all duration-500 shadow-inner px-8" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-300 ml-2">Node Operacional / Setor</Label>
                                    <Input placeholder="Ex: Supply / Beverage..." className="h-16 rounded-[24px] border-slate-100 bg-slate-50 focus-visible:bg-white focus-visible:ring-0 focus-visible:border-slate-900 font-bold transition-all duration-500 shadow-inner px-8" />
                                </div>
                            </div>
                            <button className="w-full h-20 rounded-[28px] bg-slate-900 text-white font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-slate-900/10 hover:bg-black transition-all active:scale-95 duration-500">
                                Gravar Manifesto
                            </button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Playbook Explorer */}
                <div className="lg:col-span-4 space-y-10">
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                        <Input
                            placeholder="Universal Search Standard..."
                            className="h-16 pl-16 rounded-[28px] border-slate-100 bg-white font-bold text-sm shadow-sm focus:ring-0 focus:border-slate-900 transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="space-y-6">
                        {filteredPlaybooks?.map((p, idx) => (
                            <div
                                key={p.id}
                                onClick={() => setSelectedPlaybookId(p.id)}
                                className={cn(
                                    "group p-1 rounded-[32px] transition-all duration-700 cursor-pointer overflow-hidden",
                                    selectedPlaybook?.id === p.id
                                        ? "bg-slate-900 shadow-2xl shadow-slate-900/20 scale-[1.02]"
                                        : "bg-transparent hover:bg-slate-50"
                                )}
                            >
                                <div className={cn(
                                    "p-6 flex items-center justify-between rounded-[31px]",
                                    selectedPlaybook?.id === p.id ? "bg-slate-900" : "bg-white border border-slate-100"
                                )}>
                                    <div className="flex items-center gap-6">
                                        <div className={cn(
                                            "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                                            selectedPlaybook?.id === p.id ? "bg-white/10 text-white" : "bg-slate-50 text-slate-300 group-hover:bg-slate-900 group-hover:text-white"
                                        )}>
                                            <BookOpen className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <h3 className={cn("text-xs font-black uppercase tracking-tight", selectedPlaybook?.id === p.id ? "text-white" : "text-slate-900")}>
                                                {p.titulo}
                                            </h3>
                                            <p className={cn("text-[8px] font-black uppercase tracking-widest mt-1", selectedPlaybook?.id === p.id ? "text-white/40" : "text-slate-300")}>
                                                Node: {p.tipo_setor || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className={cn("h-5 w-5 transition-transform duration-500", selectedPlaybook?.id === p.id ? "text-white translate-x-2" : "text-slate-100")} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detail Hub */}
                <div className="lg:col-span-8">
                    {selectedPlaybook ? (
                        <div className="luma-card p-0 overflow-hidden bg-white border-slate-100 animate-in slide-in-from-right-8 duration-1000">
                            <header className="p-12 lg:p-16 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-12 bg-slate-50/20 relative overflow-hidden">
                                <Activity className="absolute right-0 top-0 h-48 w-48 text-slate-900/[0.02] -translate-y-12 translate-x-12" />
                                <div className="space-y-6 relative z-10 w-full">
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-[0.3em] px-4 py-2 rounded-lg">{selectedPlaybook.tipo_setor}</Badge>
                                        <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest flex items-center gap-2">
                                            <Clock className="h-3 w-3" /> Sync: {new Date(selectedPlaybook.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h2 className="text-5xl font-black italic uppercase italic tracking-tighter text-slate-900 leading-none">{selectedPlaybook.titulo}</h2>
                                </div>
                                <div className="flex items-center gap-4 shrink-0 relative z-10">
                                    <button className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm active:scale-90"><Edit2 className="h-5 w-5" /></button>
                                    <button className="h-14 w-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm active:scale-90"><Trash2 className="h-5 w-5" /></button>
                                </div>
                            </header>

                            <Tabs defaultValue="checklist" className="p-12 lg:p-16">
                                <TabsList className="bg-slate-50 p-2 rounded-[24px] mb-12 flex items-center h-auto gap-2 border border-slate-100 shadow-inner">
                                    <TabsTrigger value="checklist" className="flex-1 py-4 rounded-xl font-black italic uppercase italic tracking-widest text-[10px] text-slate-400 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all duration-500">Checklist Protocol</TabsTrigger>
                                    <TabsTrigger value="manual" className="flex-1 py-4 rounded-xl font-black italic uppercase italic tracking-widest text-[10px] text-slate-400 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all duration-500">Methodologies / SOP</TabsTrigger>
                                    <TabsTrigger value="security" className="flex-1 py-4 rounded-xl font-black italic uppercase italic tracking-widest text-[10px] text-slate-400 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all duration-500">Compliance</TabsTrigger>
                                </TabsList>

                                <TabsContent value="checklist" className="space-y-10 focus-visible:outline-none">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-10 bg-slate-950 rounded-[40px] text-white shadow-3xl shadow-slate-900/20 relative overflow-hidden group">
                                         <div className="absolute right-0 top-0 h-full w-48 bg-emerald-500/5 blur-3xl group-hover:w-full transition-all duration-1000" />
                                         <div className="flex items-center gap-8 relative z-10">
                                            <div className="h-20 w-20 rounded-[32px] bg-white/10 flex items-center justify-center text-emerald-400 shadow-inner">
                                                <ShieldCheck className="h-10 w-10" />
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Security Registry</h4>
                                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Mandatory verification nodes</p>
                                            </div>
                                         </div>
                                         <button
                                            onClick={() => setIsAddingItem(!isAddingItem)}
                                            className="h-14 px-8 rounded-2xl bg-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-slate-950 transition-all active:scale-95 duration-500 relative z-10"
                                         >
                                            <Plus className="h-4 w-4 inline mr-2" /> {isAddingItem ? 'Cancel' : 'Deploy Node'}
                                         </button>
                                    </div>

                                    {isAddingItem && (
                                        <div className="p-8 rounded-[32px] border-2 border-slate-900 bg-white flex items-center gap-6 animate-in slide-in-from-top-4 duration-500">
                                            <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900">
                                                <Zap className="h-6 w-6" />
                                            </div>
                                            <Input
                                                autoFocus
                                                placeholder="Define a new verification point..."
                                                value={newItemText}
                                                onChange={e => setNewItemText(e.target.value)}
                                                className="border-none shadow-none text-xl font-black italic uppercase italic tracking-tighter placeholder:text-slate-200"
                                                onKeyDown={e => e.key === 'Enter' && addChecklistItem()}
                                            />
                                            <button onClick={addChecklistItem} className="h-12 px-8 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all">Commit</button>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {((selectedPlaybook.checklist as unknown as ChecklistItem[]) || []).length === 0 ? (
                                             Array.from({ length: 3 }).map((_, i) => (
                                                <div key={i} className="group p-8 rounded-[32px] border border-slate-100 bg-white flex items-center gap-8 opacity-20 grayscale">
                                                    <div className="h-10 w-10 rounded-xl border-4 border-slate-100" />
                                                    <div className="h-4 w-64 bg-slate-100 rounded-sm" />
                                                </div>
                                             ))
                                        ) : ((selectedPlaybook.checklist as unknown as ChecklistItem[]) || []).map((item, i) => (
                                            <div key={i} className="group p-8 rounded-[40px] border border-slate-50 bg-white hover:border-slate-900 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-700 flex items-center justify-between">
                                                <div className="flex items-center gap-8">
                                                    <div className="h-12 w-12 rounded-2xl border-4 border-slate-100 flex items-center justify-center text-slate-100 group-hover:bg-slate-900 group-hover:border-slate-900 group-hover:text-white transition-all duration-500 cursor-pointer shadow-sm">
                                                        <CheckCircle2 className="h-5 w-5" />
                                                    </div>
                                                    <span className="text-xl font-black italic uppercase tracking-tighter text-slate-900 group-hover:translate-x-2 transition-transform duration-700">{item.task}</span>
                                                </div>
                                                <button
                                                    className="h-12 w-12 rounded-2xl bg-white border border-slate-50 opacity-0 group-hover:opacity-100 transition-all duration-500 text-slate-300 hover:text-rose-500 hover:border-rose-100 shadow-sm"
                                                    onClick={() => removeChecklistItem(i)}
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="manual" className="space-y-10 mt-0 focus-visible:outline-none">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="p-12 bg-amber-50 rounded-[48px] border border-amber-100/50 space-y-8 relative overflow-hidden group">
                                            <Flame className="absolute right-0 top-0 h-32 w-32 text-amber-500/10 group-hover:scale-125 transition-transform duration-1000" />
                                            <div className="space-y-3">
                                                <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center text-amber-500 shadow-sm">
                                                    <Scale className="h-7 w-7" />
                                                </div>
                                                <h4 className="text-2xl font-black italic uppercase italic tracking-tighter text-amber-900">Protocolologies</h4>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 opacity-60">SOP / Method of Operation</p>
                                            </div>
                                            <p className="text-amber-900 font-medium text-sm leading-relaxed antialiased">Instruções de alta fidelidade para replicação perfeita do modelo de negócio em qualquer terminal.</p>
                                            <button className="w-full h-14 rounded-2xl bg-white border border-amber-200 text-amber-700 font-black uppercase text-[10px] tracking-[0.3em] hover:bg-amber-100 transition-all active:scale-95">Edit Matrix</button>
                                        </div>
                                        <div className="p-12 bg-blue-50 rounded-[48px] border border-blue-100/50 space-y-8 relative overflow-hidden group">
                                            <Layout className="absolute right-0 top-0 h-32 w-32 text-blue-500/10 group-hover:scale-125 transition-transform duration-1000" />
                                            <div className="space-y-3">
                                                <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center text-blue-500 shadow-sm">
                                                    <Settings className="h-7 w-7" />
                                                </div>
                                                <h4 className="text-2xl font-black italic uppercase italic tracking-tighter text-blue-900">Infrastructure</h4>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 opacity-60">Assets & Requirements</p>
                                            </div>
                                            <p className="text-blue-900 font-medium text-sm leading-relaxed antialiased">Especificação técnica de hardware e suprimentos críticos para o funcionamento deste node.</p>
                                            <button className="w-full h-14 rounded-2xl bg-white border border-blue-200 text-blue-700 font-black uppercase text-[10px] tracking-[0.3em] hover:bg-blue-100 transition-all active:scale-95">Link Assets</button>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    ) : (
                        <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center space-y-12 bg-slate-50/30 rounded-[64px] border-4 border-dashed border-slate-100 animate-in fade-in duration-1000">
                             <div className="h-40 w-40 bg-white rounded-[40px] flex items-center justify-center shadow-3xl shadow-slate-200/50 relative">
                                <BookOpen className="h-16 w-16 text-slate-100" />
                                <div className="absolute inset-0 border-2 border-slate-50 rounded-[40px] animate-ping opacity-20" />
                             </div>
                             <div className="space-y-4 max-w-md">
                                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Operations Hub Idle</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 leading-loose">Selecione um manifesto operacional para visualizar os protocolos de execução e garantir a conformidade sistemática.</p>
                             </div>
                             <div className="flex items-center gap-10 grayscale opacity-20">
                                <Target className="h-8 w-8" />
                                <Lock className="h-8 w-8" />
                                <ShieldCheck className="h-8 w-8" />
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
