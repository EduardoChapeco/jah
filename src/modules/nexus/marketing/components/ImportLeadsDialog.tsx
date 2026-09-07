import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileDown, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEmpresa } from '@/hooks/useEmpresa';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ImportedLead {
    nome: string;
    email: string | null;
    telefone: string | null;
    origem: string;
    status: 'novo';
}

export function ImportLeadsDialog() {
    const { empresa } = useEmpresa();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<ImportedLead[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            parseCSV(file);
        }
    };

    const parseCSV = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

            const parsedData: ImportedLead[] = [];

            // Simple CSV parser
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = lines[i].split(',').map((v) => v.trim());

                // Basic column mapping
                const nomeIndex = headers.findIndex(h => h.includes('nome') || h.includes('name'));
                const emailIndex = headers.findIndex(h => h.includes('email') || h.includes('mail'));
                const foneIndex = headers.findIndex(h => h.includes('telefone') || h.includes('phone') || h.includes('celular'));

                if (nomeIndex !== -1) {
                    parsedData.push({
                        nome: values[nomeIndex] || 'Desconhecido',
                        email: emailIndex !== -1 ? values[emailIndex] : null,
                        telefone: foneIndex !== -1 ? values[foneIndex] : null,
                        origem: 'importacao_csv',
                        status: 'novo'
                    });
                }
            }

            setData(parsedData);
            if (parsedData.length === 0) {
                toast.error("Nenhum dado válido encontrado. Verifique se o CSV tem cabeçalhos (Nome, Email, Telefone).");
            } else {
                toast.success(`${parsedData.length} linhas lidas com sucesso.`);
            }
        };
        reader.readAsText(file);
    };

    const importMutation = useMutation({
        mutationFn: async (leadsToImport: ImportedLead[]) => {
            if (!empresa?.id) throw new Error("Empresa não selecionada");

            const payload = leadsToImport.map(lead => ({
                empresa_id: empresa.id,
                nome: lead.nome,
                email: lead.email,
                telefone: lead.telefone,
                origem: lead.origem,
                status: lead.status
                // Add explicit casting or ensure table schema matches
            }));

            const { error } = await supabase
                .from('clientes_leads')
                .insert(payload);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success(`${data.length} leads importados com sucesso!`);
            queryClient.invalidateQueries({ queryKey: ['leads', empresa?.id] });
            setIsOpen(false);
            setData([]);
            setFileName(null);
        },
        onError: (error) => {
            console.error(error);
            toast.error("Erro ao importar leads. Verifique o console.");
        }
    });

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,Nome,Email,Telefone\nFulano Silva,fulano@exemplo.com,11999999999\nBeltrana Souza,beltrana@exemplo.com,21988888888";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "modelo_importacao_leads.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-11 px-6 rounded-xl border-slate-200 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95">
                    <Upload className="mr-2 h-4 w-4" /> Importar CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">Importação em Massa</DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium">
                        Carregue uma lista de contatos para adicionar ao seu funil de maneira instantânea.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 p-8 pt-2">
                    <div className="grid w-full items-center gap-3">
                        <Label htmlFor="csv-upload" className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Arquivo CSV / Planilha</Label>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="secondary"
                                className="w-full h-32 border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-900/20 hover:shadow-md transition-all text-slate-400 flex flex-col gap-3 rounded-2xl group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    <Upload className="h-5 w-5 text-slate-400 group-hover:text-slate-900" />
                                </div>
                                <span className="text-[10px] uppercase font-bold tracking-widest group-hover:text-slate-900 transition-colors">
                                    {fileName || "Arraste ou clique para selecionar"}
                                </span>
                            </Button>
                            <Input
                                ref={fileInputRef}
                                id="csv-upload"
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button variant="link" size="sm" onClick={downloadTemplate} className="text-[10px] uppercase font-bold tracking-widest text-slate-400 hover:text-slate-900 h-auto p-0">
                                <FileDown className="h-3.5 w-3.5 mr-2" /> Baixar Modelo Exemplo
                            </Button>
                        </div>
                    </div>

                    {data.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 underline underline-offset-4">Prévia dos Dados</Label>
                                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                    <CheckCircle className="h-3 w-3" /> {data.length} contatos detectados
                                </span>
                            </div>
                            <ScrollArea className="h-[220px] w-full rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-slate-200/50">
                                            <TableHead className="py-2 h-10 text-[10px] font-bold uppercase tracking-widest text-slate-400">Nome</TableHead>
                                            <TableHead className="py-2 h-10 text-[10px] font-bold uppercase tracking-widest text-slate-400">Email</TableHead>
                                            <TableHead className="py-2 h-10 text-[10px] font-bold uppercase tracking-widest text-slate-400">Telefone</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((lead, i) => (
                                            <TableRow key={i} className="border-b border-slate-100 last:border-0 hover:bg-white/50 transition-colors">
                                                <TableCell className="py-3 font-bold text-xs text-slate-900 truncate max-w-[150px]">{lead.nome}</TableCell>
                                                <TableCell className="py-3 text-[11px] font-medium text-slate-500 truncate max-w-[150px]">{lead.email || '-'}</TableCell>
                                                <TableCell className="py-3 text-[11px] font-medium text-slate-500">{lead.telefone || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <Button 
                        variant="ghost" 
                        onClick={() => setIsOpen(false)} 
                        disabled={importMutation.isPending}
                        className="h-11 px-6 rounded-xl font-bold uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-900"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={() => importMutation.mutate(data)}
                        disabled={data.length === 0 || importMutation.isPending}
                        className="h-11 px-8 rounded-xl bg-slate-900 hover:bg-black text-white font-bold uppercase text-[10px] tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-slate-900/10"
                    >
                        {importMutation.isPending ? (
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <CheckCircle className="mr-2 h-3.5 w-3.5" />
                        )}
                        Confirmar e Processar
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
