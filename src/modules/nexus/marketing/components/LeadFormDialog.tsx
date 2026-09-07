import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { leadSchema, LeadFormValues } from "@/lib/validations/marketing";
import { LeadStatus } from "@/types/crm";
import { Loader2, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface LeadFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    empresaId: string;
    initialData?: LeadFormValues & { id: string };
    onSuccess: () => void;
}

export function LeadFormDialog({ open, onOpenChange, empresaId, initialData, onSuccess }: LeadFormDialogProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<LeadFormValues>({
        resolver: zodResolver(leadSchema),
        defaultValues: {
            nome: "",
            email: "",
            telefone: "",
            cpf: "",
            status: "novo",
            origem: "manual",
            observacoes: "",
            is_cliente: false,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset(initialData ? {
                nome: initialData.nome,
                email: initialData.email || "",
                telefone: initialData.telefone || "",
                cpf: initialData.cpf || "",
                status: (initialData.status as LeadStatus) || "novo",
                origem: initialData.origem || "manual",
                observacoes: initialData.observacoes || "",
                is_cliente: initialData.is_cliente || false,
                valor_estimado: initialData.valor_estimado || 0,
                probabilidade: initialData.probabilidade || 0,
            } : {
                nome: "",
                email: "",
                telefone: "",
                cpf: "",
                status: "novo",
                origem: "manual",
                observacoes: "",
                is_cliente: false,
                valor_estimado: 0,
                probabilidade: 0,
            });
        }
    }, [open, initialData, form]);

    const onSubmit = async (values: LeadFormValues) => {
        setLoading(true);
        try {
            if (initialData?.id) {
                const { error } = await supabase
                    .from("clientes_leads")
                    .update({
                        nome: values.nome!,
                        email: values.email || null,
                        telefone: values.telefone || null,
                        cpf: values.cpf || null,
                        status: values.status,
                        origem: values.origem,
                        observacoes: values.observacoes,
                        is_cliente: values.is_cliente,
                        valor_estimado: values.valor_estimado,
                        probabilidade: values.probabilidade,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", initialData.id);

                if (error) throw error;
                toast.success("Lead atualizado com sucesso!");
            } else {
                const { error } = await supabase
                    .from("clientes_leads")
                    .insert({
                        nome: values.nome!,
                        empresa_id: empresaId,
                        email: values.email || null,
                        telefone: values.telefone || null,
                        cpf: values.cpf || null,
                        status: values.status,
                        origem: values.origem,
                        observacoes: values.observacoes,
                        is_cliente: values.is_cliente,
                        valor_estimado: values.valor_estimado,
                        probabilidade: values.probabilidade,
                    });

                if (error) throw error;
                toast.success("Lead criado com sucesso!");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error: unknown) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
            toast.error("Erro ao salvar lead", { description: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">
                        {initialData ? "Editar Lead" : "Novo Lead"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium">
                        Preencha os detalhes do lead abaixo para acompanhar no funil de vendas.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-8 pt-2">
                        <FormField
                            control={form.control}
                            name="nome"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Nome Completo</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="Ex: João Silva" 
                                            {...field} 
                                            className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-slate-900/5 shadow-none"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Email</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="joao@email.com" 
                                                {...field} 
                                                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-slate-900/5 shadow-none"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="telefone"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Telefone</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="(11) 99999-9999" 
                                                {...field} 
                                                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-slate-900/5 shadow-none"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="cpf"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-slate-400">CPF (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="000.000.000-00" 
                                                {...field} 
                                                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-slate-900/5 shadow-none"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="origem"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Origem</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="Ex: Instagram, Indicação..." 
                                                {...field} 
                                                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-slate-900/5 shadow-none"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Status no Funil</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-slate-900/5 shadow-none">
                                                <SelectValue placeholder="Selecione o status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                            <SelectItem value="novo" className="rounded-lg">Novo</SelectItem>
                                            <SelectItem value="contatado" className="rounded-lg">Em Contato</SelectItem>
                                            <SelectItem value="qualificado" className="rounded-lg">Qualificado</SelectItem>
                                            <SelectItem value="convertido" className="rounded-lg">Convertido (Cliente)</SelectItem>
                                            <SelectItem value="perdido" className="rounded-lg">Perdido</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="valor_estimado"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Valor Estimado (R$)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                placeholder="0.00" 
                                                {...field} 
                                                onChange={e => field.onChange(Number(e.target.value))}
                                                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-slate-900/5 shadow-none"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="probabilidade"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Probabilidade (%)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                placeholder="0" 
                                                {...field} 
                                                onChange={e => field.onChange(Number(e.target.value))}
                                                className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-slate-900/5 shadow-none"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Smart Scorer Indicator */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between group overflow-hidden relative transition-all hover:bg-white hover:shadow-md hover:border-slate-200">
                            <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 transition-transform group-hover:rotate-0">
                                <Sparkles className="h-10 w-10 text-slate-900" />
                            </div>
                            <div className="z-10">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">AI Lead Scoring</p>
                                <p className="text-xs font-bold text-slate-900">
                                    {(form.watch("valor_estimado") || 0) > 1000 ? "⭐ Perfil High-End" : "Sugerido: Nutrição Automática"}
                                </p>
                            </div>
                            <div className="z-10 h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-900 leading-none">
                                    {(form.watch("probabilidade") || 0) > 50 ? "HOT" : "COLD"}
                                </span>
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="observacoes"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <FormLabel className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Observações Internas</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Notas estratégicas sobre o lead..."
                                            className="resize-none min-h-[80px] rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all focus:ring-slate-900/5 shadow-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end items-center gap-3 pt-4">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={() => onOpenChange(false)}
                                className="h-11 px-6 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-900"
                            >
                                Cancelar
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={loading} 
                                className="h-11 px-8 rounded-xl bg-slate-900 hover:bg-black text-white font-bold uppercase text-[10px] tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-slate-900/10"
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 animate-spin" style={{ width: '12px', height: '12px' }} />
                                ) : (
                                    initialData ? "Atualizar Lead" : "Criar Novo Lead"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
