import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    CreditCard,
    Search,
    QrCode,
    Printer,
    Download,
    Smartphone,
    UserPlus,
    Coins,
    ShieldCheck,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CredentialIssuer() {
    const { id: empresaId } = useParams<{ id: string }>();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPerson, setSelectedPerson] = useState<any>(null);

    // Fetch People (Guests/Leads)
    const { data: people, isLoading } = useQuery({
        queryKey: ['experience-people', empresaId, searchTerm],
        queryFn: async () => {
            if (searchTerm.length < 3) return [];
            const { data, error } = await supabase
                .from('clientes_leads')
                .select('*')
                .ilike('nome', `%${searchTerm}%`)
                .limit(5);
            if (error) throw error;
            return data;
        },
        enabled: searchTerm.length >= 3
    });

    const issueCredential = (person: any) => {
        setSelectedPerson(person);
        toast.success(`Credencial gerada para ${person.nome}`);
    };

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-4">
                        <CreditCard className="h-12 w-12 text-primary" />
                        Credential Engine
                    </h1>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.3em] mt-2">Emissão de Credenciais & Digital Wallets</p>
                </div>

                <div className="flex items-center gap-4">
                    <Button variant="outline" className="h-16 rounded-lg border-2 border-slate-100 font-black uppercase text-xs tracking-widest px-8">
                        <Printer className="mr-2 h-4 w-4" /> Impressão em Massa
                    </Button>
                    <Button className="h-16 rounded-lg bg-slate-900 text-white font-black uppercase text-xs tracking-widest px-8 shadow-2xl">
                        <UserPlus className="mr-2 h-5 w-5" /> Cadastrar Visitante
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Issuance Controls */}
                <div className="lg:col-span-7 space-y-8">
                    <Card className="rounded-lg border-none shadow-2xl shadow-slate-200/50 bg-white overflow-hidden p-1">
                        <div className="p-10 space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Localizar Pessoa</h3>
                                <div className="relative">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
                                    <Input
                                        placeholder="Digite nome, CPF ou e-mail..."
                                        className="h-20 pl-16 rounded-lg border-none bg-slate-50 font-bold text-xl placeholder:text-slate-300 focus-visible:ring-primary shadow-inner"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                {people?.map((person: any) => (
                                    <div
                                        key={person.id}
                                        onClick={() => issueCredential(person)}
                                        className={cn(
                                            "group p-6 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-between",
                                            selectedPerson?.id === person.id
                                                ? "bg-slate-900 text-white border-slate-900 shadow-xl"
                                                : "bg-white border-slate-50 hover:border-slate-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-14 h-14 rounded-lg flex items-center justify-center text-xl font-black",
                                                selectedPerson?.id === person.id ? "bg-white/10" : "bg-slate-100 text-slate-400"
                                            )}>
                                                {person.nome.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-black uppercase tracking-tight text-sm">{person.nome}</h4>
                                                <p className={cn("text-[10px] font-bold uppercase tracking-widest", selectedPerson?.id === person.id ? "text-white/40" : "text-slate-400")}>{person.email || 'SEM EMAIL'}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" className={cn("rounded-lg h-10 w-10 p-0", selectedPerson?.id === person.id ? "text-white" : "text-slate-400")}>
                                            <Zap className="h-5 w-5" />
                                        </Button>
                                    </div>
                                ))}
                                {searchTerm.length >= 3 && people?.length === 0 && (
                                    <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-lg">
                                        <p className="font-black uppercase text-xs tracking-widest">Nenhum resultado encontrado</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 p-1 gap-1">
                            <div className="bg-slate-50 p-10 rounded-lg flex flex-col items-center text-center space-y-4">
                                <Smartphone className="h-8 w-8 text-slate-400" />
                                <h5 className="font-black uppercase tracking-widest text-xs">Wallet Digital</h5>
                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed">Enviar link de credencial via WhatsApp ou E-mail</p>
                                <Button disabled={!selectedPerson} variant="outline" className="rounded-lg h-10 px-6 border-slate-200 text-[10px] font-black uppercase">Enviar Link</Button>
                            </div>
                            <div className="bg-slate-50 p-10 rounded-lg flex flex-col items-center text-center space-y-4">
                                <Coins className="h-8 w-8 text-slate-400" />
                                <h5 className="font-black uppercase tracking-widest text-xs">Adicionar Saldo</h5>
                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed">Carregar créditos Cashless para consumo no evento</p>
                                <Button disabled={!selectedPerson} variant="outline" className="rounded-lg h-10 px-6 border-slate-200 text-[10px] font-black uppercase">Recarregar</Button>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Credential Preview */}
                <div className="lg:col-span-5">
                    <div className="sticky top-8">
                        {selectedPerson ? (
                            <div className="space-y-6 animate-in zoom-in duration-500">
                                {/* The "Physical" Credential Preview */}
                                <div className="relative aspect-[3/4] w-full max-w-sm mx-auto bg-slate-900 rounded-lg overflow-hidden shadow-2xl p-1 shadow-slate-400/50">
                                    <div className="h-full border-[8px] border-white/5 rounded-lg flex flex-col p-10 text-white relative">
                                        {/* Top Brand */}
                                        <div className="flex justify-between items-start">
                                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-slate-900">
                                                <QrCode className="h-6 w-6" />
                                            </div>
                                            <Badge className="bg-primary text-white font-black uppercase text-[8px] tracking-[0.2em] px-3 py-1">PREMIUM ACCESS</Badge>
                                        </div>

                                        {/* Center QR */}
                                        <div className="mt-auto mb-auto flex flex-col items-center">
                                            <div className="bg-white p-6 rounded-lg shadow-2xl scale-110">
                                                <QRCodeSVG value={`https://eventio.live/c/${selectedPerson.id}`} size={160} level="H" />
                                            </div>
                                            <div className="mt-10 text-center">
                                                <h4 className="text-3xl font-black italic uppercase italic tracking-tighter leading-tight">{selectedPerson.nome}</h4>
                                                <p className="text-white/40 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">ID: {selectedPerson.id.slice(0, 8).toUpperCase()}</p>
                                            </div>
                                        </div>

                                        {/* Bottom Stats */}
                                        <div className="pt-8 border-t border-white/10 flex justify-between items-center">
                                            <div>
                                                <span className="block text-white/40 font-black text-[8px] uppercase tracking-widest">Saldo Cashback</span>
                                                <span className="text-xl font-black tracking-tighter">R$ 140,00</span>
                                            </div>
                                            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center text-primary">
                                                <ShieldCheck className="h-7 w-7" />
                                            </div>
                                        </div>

                                        {/* Dynamic Hologram Effect (CSS) */}
                                        <div className="absolute inset-0 bg-muted/10    pointer-events-none" />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 max-w-sm mx-auto">
                                    <Button className="h-20 rounded-lg bg-primary text-primary-foreground font-black uppercase italic tracking-widest text-xl shadow-2xl shadow-primary/30">
                                        <Printer className="mr-3 h-6 w-6" /> Imprimir Etiqueta
                                    </Button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button variant="outline" className="h-16 rounded-lg border-2 border-slate-100 font-black uppercase text-xs tracking-widest text-slate-400">
                                            <Download className="mr-2 h-4 w-4" /> PDF
                                        </Button>
                                        <Button variant="outline" className="h-16 rounded-lg border-2 border-slate-100 font-black uppercase text-xs tracking-widest text-slate-400">
                                            <Zap className="mr-2 h-4 w-4" /> Validar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-[3/4] w-full max-w-sm mx-auto bg-white rounded-lg border-4 border-dashed border-slate-100 flex flex-col items-center justify-center p-12 text-center space-y-6">
                                <div className="w-24 h-24 bg-slate-50 rounded-lg flex items-center justify-center text-slate-200">
                                    <CreditCard className="h-12 w-12" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-400">Aguardando Seleção</h3>
                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2 leading-relaxed">Selecione uma pessoa para visualizar e emitir a credencial digital.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
