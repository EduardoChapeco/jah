import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Shield,
    Plus,
    Trash2,
    Check,
    Lock,
    Eye,
    Settings,
    Users,
    Key,
    Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const AVAILABLE_PERMISSIONS = [
    { id: "events_view", label: "Visualizar Eventos", category: "Eventos" },
    { id: "events_manage", label: "Gerenciar Eventos", category: "Eventos" },
    { id: "tickets_view", label: "Visualizar Ingressos", category: "Financeiro" },
    { id: "tickets_manage", label: "Gerenciar Preços/Lotes", category: "Financeiro" },
    { id: "checkin_perform", label: "Realizar Check-in", category: "Operacional" },
    { id: "team_manage", label: "Gerenciar Equipe", category: "Geral" },
    { id: "reports_view", label: "Ver Relatórios/Aalytics", category: "Geral" },
    { id: "finance_view", label: "Ver Financeiro", category: "Financeiro" },
];

export default function PermissionTemplates() {
    const { id: empresaId } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [templateName, setTemplateName] = useState("");
    const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

    // Fetch Real Templates
    const { data: templates, isLoading } = useQuery({
        queryKey: ["permission-templates", empresaId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('equipe_permission_templates')
                .select('*')
                .eq('empresa_id', empresaId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data;
        }
    });

    const createMutation = useMutation({
        mutationFn: async () => {
             if (!templateName) throw new Error("Nome é obrigatório");
             const { error } = await supabase
                .from('equipe_permission_templates')
                .insert({
                    empresa_id: empresaId,
                    name: templateName,
                    permissions: selectedPerms,
                    description: "Template personalizado"
                });
             if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["permission-templates"] });
            toast.success("Template criado com sucesso!");
            setIsSheetOpen(false);
            setTemplateName("");
            setSelectedPerms([]);
        },
        onError: (err: any) => {
            toast.error("Erro ao criar template: " + err.message);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('equipe_permission_templates')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["permission-templates"] });
            toast.success("Template excluído");
        }
    });

    const togglePermission = (permId: string) => {
        setSelectedPerms(prev =>
            prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
        );
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Shield className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-eventio-dark">Templates de Permissão</h1>
                        <p className="text-muted-foreground">
                            Defina perfis de acesso padronizados para sua equipe de campo e escritório.
                        </p>
                    </div>
                </div>
                <Button
                    className="bg-eventio-dark hover:bg-eventio-dark/90 text-white rounded-lg h-12"
                    onClick={() => {
                        setTemplateName("");
                        setSelectedPerms([]);
                        setIsSheetOpen(true);
                    }}
                >
                    <Plus className="mr-2 h-4 w-4" /> Novo Template
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="rounded-lg border-border/60">
                            <CardHeader><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-full" /></CardHeader>
                            <CardContent><Skeleton className="h-20 w-full rounded-lg" /></CardContent>
                        </Card>
                    ))
                ) : templates?.map(template => (
                    <Card key={template.id} className="rounded-lg border-border/60 hover:shadow-md transition-shadow group">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg font-bold">{template.name}</CardTitle>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><Settings className="h-4 w-4" /></Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-500/5"
                                        onClick={() => deleteMutation.mutate(template.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardDescription className="text-xs">{template.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {(template.permissions as any[]).map((pId: string) => {
                                    const p = AVAILABLE_PERMISSIONS.find(ap => ap.id === pId);
                                    return (
                                        <Badge key={pId} variant="secondary" className="text-[10px] bg-muted/50 border-none font-normal">
                                            {p?.label || pId}
                                        </Badge>
                                    );
                                })}
                            </div>
                            <div className="mt-4 pt-4 border-t flex items-center justify-between text-[10px] text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span>Usado por 4 membros</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Key className="h-3 w-3" />
                                    <span>{(template.permissions as any[]).length} chaves</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Info Card */}
            <Card className="rounded-lg border-primary/20 bg-primary/5 border-dashed">
                <CardContent className="p-4 flex gap-4">
                    <Info className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-sm text-primary/80">
                        Os templates permitem que você atribua múltiplas permissões a um novo membro da equipe com apenas um clique, mantendo a consistência e segurança da sua operação.
                    </p>
                </CardContent>
            </Card>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-[540px]">
                    <SheetHeader>
                        <SheetTitle>Criar Template de Permissão</SheetTitle>
                        <SheetDescription>
                            Configure as chaves de acesso para este perfil.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-6 mt-8">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome do Template</Label>
                            <Input
                                id="name"
                                placeholder="Ex: Operador de Caixa"
                                className="rounded-lg h-11"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-4">
                            <Label>Permissões Selecionadas ({selectedPerms.length})</Label>

                            <div className="space-y-6">
                                {["Eventos", "Financeiro", "Operacional", "Geral"].map(category => (
                                    <div key={category} className="space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">{category}</h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            {AVAILABLE_PERMISSIONS.filter(p => p.category === category).map(perm => (
                                                <div key={perm.id} className="flex items-start space-x-3 p-2 hover:bg-muted/30 rounded-lg transition-colors cursor-pointer" onClick={() => togglePermission(perm.id)}>
                                                    <Checkbox
                                                        checked={selectedPerms.includes(perm.id)}
                                                        onCheckedChange={() => togglePermission(perm.id)}
                                                        className="mt-0.5"
                                                    />
                                                    <div className="grid gap-1.5 leading-none">
                                                        <label className="text-sm font-medium leading-none cursor-pointer">
                                                            {perm.label}
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <SheetFooter className="pt-8 flex-col sm:flex-row gap-3">
                            <Button variant="outline" className="rounded-lg h-12 flex-1" onClick={() => setIsSheetOpen(false)}>Cancelar</Button>
                            <Button 
                                className="bg-eventio-dark hover:bg-eventio-dark/90 text-white rounded-lg h-12 flex-1" 
                                onClick={() => createMutation.mutate()}
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending ? "Salvando..." : "Salvar Template"}
                            </Button>
                        </SheetFooter>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
