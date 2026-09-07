
import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ChevronRight, Sparkles, AlertCircle, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createCaptureSchema } from "./publicCaptureValidation";

interface FormField {
    id: string;
    label: string;
    type: string;
    placeholder?: string;
    required?: boolean;
}

interface LeadCaptureForm {
    id: string;
    empresa_id: string;
    title: string;
    description: string;
    slug: string;
    status: string;
    config: {
        fields: FormField[];
        submitButtonText?: string;
    };
    empresa?: {
        nome: string;
        logo_url?: string;
    };
}

export default function PublicCaptureForm() {
    const { slug } = useParams<{ slug: string }>();
    const [searchParams] = useSearchParams();
    const campaignId = searchParams.get('c'); 

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [values, setValues] = useState<Record<string, string>>({});

    useState(() => {
        if (slug) {
            supabase.rpc('increment_form_views', { form_slug: slug }).then(() => { });
        }
    });

    const { data: formConfig, isLoading, error } = useQuery({
        queryKey: ["public-form", slug],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("lead_capture_forms")
                .select("*, empresa:empresas(nome, logo_url)")
                .eq("slug", slug)
                .single();

            if (error) throw error;
            if (data.status !== 'active') throw new Error("Este motor de captação não está mais disponível.");
            return data as unknown as LeadCaptureForm;
        },
        enabled: !!slug
    });

    const mutation = useMutation({
        mutationFn: async (submittedData: Record<string, unknown>) => {
            const fields = formConfig.config?.fields || [];
            const schema = createCaptureSchema(fields);
            const parsedData = schema.parse(submittedData);

            const email = (parsedData.email || parsedData.Email || '') as string;
            const nome = (parsedData.nome || parsedData.Nome || parsedData.name || parsedData.Name || '') as string;

            // 1. Check or create pessoa by email
            const { data: existingPessoa } = await supabase
                .from('pessoas')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            let pessoaId: string;
            if (existingPessoa?.id) {
                pessoaId = existingPessoa.id;
            } else {
                const { data: newPessoa, error: pessoaError } = await (supabase as any)
                    .from('pessoas')
                    .insert({ email, nome_completo: nome, cpf: '', user_id: null })
                    .select('id')
                    .single();
                if (pessoaError) throw new Error(pessoaError.message);
                pessoaId = newPessoa.id;
            }

            // 2. Upsert lead
            const { data: lead, error: leadError } = await (supabase as any)
                .from('clientes_leads')
                .upsert({ pessoa_id: pessoaId, empresa_id: formConfig.empresa_id, nome }, { onConflict: 'pessoa_id,empresa_id' })
                .select('id')
                .single();
            if (leadError) throw new Error(leadError.message);

            // 3. Insert capture entry
            const { error: entryError } = await supabase
                .from('lead_capture_entries')
                .insert({
                    form_id: formConfig.id,
                    lead_id: lead.id,
                    empresa_id: formConfig.empresa_id,
                    data: parsedData,
                    campaign_id: campaignId ?? null,
                });
            if (entryError) throw new Error(entryError.message);

            // 4. Insert conversion record
            await supabase.from('lead_conversions').insert({
                lead_id: lead.id,
                empresa_id: formConfig.empresa_id,
                source: 'capture_form',
                form_id: formConfig.id,
            });

            return true;
        },
        onSuccess: () => {
            setIsSubmitted(true);
            toast.success("Dados enviados com sucesso!");
        },
        onError: (err: unknown) => {
            let message = "Erro ao processar requisição.";
            if (err instanceof Error) {
                message = err.message;
            } else if (typeof err === 'object' && err !== null && 'issues' in err) {
                const issues = (err as { issues: { message: string }[] }).issues;
                if (issues?.[0]) message = issues[0].message;
            }
            toast.error(message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(values);
    };

    if (isLoading) return (
        <div className="min-h-[100dvh] bg-white flex items-center justify-center p-8">
            <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex flex-col items-center gap-6"
            >
                <div className="h-16 w-16 rounded-[24px] bg-slate-900 flex items-center justify-center text-white shadow-2xl shadow-slate-900/20">
                    <Zap className="h-6 w-6" />
                </div>
                <p className="luma-subtitle-premium animate-pulse">Initializing Capture Engine...</p>
            </motion.div>
        </div>
    );

    if (error || !formConfig) return (
        <div className="min-h-[100dvh] bg-white flex items-center justify-center p-8">
            <div className="max-w-md w-full luma-card p-16 text-center space-y-8 border-slate-100 shadow-none">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
                <div className="space-y-2">
                    <h1 className="luma-title-premium !text-3xl">Portal Indisponível</h1>
                    <p className="luma-subtitle-premium !text-slate-400">Este gateway de captura está offline ou o acesso foi revogado pelo administrador.</p>
                </div>
                <Button 
                    onClick={() => window.location.reload()}
                    className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-all shadow-none"
                >
                    Tentar Reconectar
                </Button>
            </div>
        </div>
    );

    const fields = formConfig.config?.fields || [];

    return (
        <div className="min-h-[100dvh] bg-white flex items-center justify-center p-6 sm:p-12 font-sans relative overflow-hidden">
            {/* Ambient Background Element */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,0,0,0.01),transparent)] pointer-events-none" />
            
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="w-full max-w-2xl relative z-10"
            >
                <header className="flex flex-col items-center mb-16 text-center space-y-8">
                    <motion.div
                        className="w-24 h-24 rounded-[32px] bg-white p-3 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] border border-slate-50 overflow-hidden group"
                        whileHover={{ scale: 1.05, rotate: 2 }}
                    >
                        {formConfig.empresa?.logo_url ? (
                            <img src={formConfig.empresa.logo_url} alt="" className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white font-black text-2xl uppercase italic">
                                {formConfig.empresa?.nome?.[0]}
                            </div>
                        )}
                    </motion.div>
                    
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                            <ShieldCheck className="h-3 w-3 text-emerald-500" /> Authorized Portal: {formConfig.empresa?.nome}
                        </div>
                        <h1 className="luma-title-premium !text-5xl sm:text-6xl text-slate-900">
                            {formConfig.title}
                        </h1>
                        {formConfig.description && (
                            <p className="text-slate-400 font-medium text-lg tracking-tight max-w-lg mx-auto leading-relaxed">
                                {formConfig.description}
                            </p>
                        )}
                    </div>
                </header>

                <div className="luma-card p-0 border-slate-100 shadow-[0_48px_80px_-24px_rgba(0,0,0,0.06)] overflow-hidden">
                    <div className="p-10 sm:p-16">
                        <AnimatePresence mode="wait">
                            {!isSubmitted ? (
                                <motion.form
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.4 }}
                                    onSubmit={handleSubmit}
                                    className="space-y-10"
                                >
                                    <div className="space-y-8">
                                        {fields.length === 0 ? (
                                            <div className="p-10 text-center bg-slate-50 rounded-[24px] border border-dashed border-slate-200">
                                                <p className="luma-subtitle-premium opacity-30">Nenhum parâmetro de entrada configurado.</p>
                                            </div>
                                        ) : (
                                            fields.map((field, index: number) => (
                                                <motion.div
                                                    key={field.id}
                                                    className="space-y-3"
                                                    initial={{ opacity: 0, y: 15 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                                >
                                                    <Label className="luma-subtitle-premium !text-slate-900 ml-2">
                                                        {field.label} {field.required && <span className="text-red-400">*</span>}
                                                    </Label>
                                                    <div className="relative group">
                                                        <Input
                                                            required={field.required}
                                                            type={field.type}
                                                            placeholder={field.placeholder}
                                                            className="h-16 rounded-[20px] border-slate-100 bg-slate-50 focus-visible:bg-white focus-visible:ring-0 focus-visible:border-slate-900 px-8 text-lg font-bold transition-all duration-300 placeholder:text-slate-200"
                                                            value={values[field.id] || ''}
                                                            onChange={(e) => setValues({ ...values, [field.id]: e.target.value })}
                                                        />
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>

                                    {fields.length > 0 && (
                                        <Button
                                            className="w-full h-16 rounded-[24px] bg-slate-900 hover:bg-black text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-none transition-all duration-500 active:scale-95 disabled:opacity-50 group mt-4 overflow-hidden"
                                            disabled={mutation.isPending}
                                        >
                                            <span className="relative z-10">{mutation.isPending ? 'PROCESSANDO...' : (formConfig.config?.submitButtonText || 'Confirmar Identidade')}</span>
                                            {!mutation.isPending && (
                                                <ChevronRight className="ml-3 h-4 w-4 transition-transform duration-300 group-hover:translate-x-2 relative z-10" />
                                            )}
                                        </Button>
                                    )}
                                </motion.form>
                            ) : (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                                    className="py-12 text-center space-y-10"
                                >
                                    <motion.div
                                        className="w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center text-white mx-auto shadow-2xl shadow-slate-900/20"
                                        initial={{ rotate: -45, scale: 0 }}
                                        animate={{ rotate: 0, scale: 1 }}
                                        transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 12 }}
                                    >
                                        <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                                    </motion.div>
                                    <div className="space-y-4">
                                        <h2 className="luma-title-premium !text-4xl text-slate-900">Registro Concluído.</h2>
                                        <p className="text-slate-400 font-medium text-lg tracking-tight max-w-sm mx-auto leading-relaxed">
                                            Sua solicitação foi indexada com sucesso. Nossa inteligência entrará em contato através dos dados fornecidos.
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        className="h-14 px-10 rounded-2xl bg-slate-50 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-100 hover:text-slate-900 transition-all duration-300"
                                        onClick={() => setIsSubmitted(false)}
                                    >
                                        Novo Cadastro
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <footer className="bg-slate-50/50 p-6 flex items-center justify-center gap-3 border-t border-slate-100">
                        <Sparkles className="h-3.5 w-3.5 text-slate-300" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">EVENT I/OS GLOBAL NETWORK INFRASTRUCTURE</span>
                    </footer>
                </div>

                <div className="mt-12 text-center">
                    <p className="luma-subtitle-premium !text-[9px] opacity-20 uppercase tracking-[0.3em]">Identity Protocol v4.2 - Secure Node</p>
                </div>
            </motion.div>
        </div >
    );
}
