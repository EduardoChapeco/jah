import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Scale, RotateCcw, Printer, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/lib/utils';

interface BuffetPOSProps {
    produto: {
        id: string;
        nome: string;
        preco: number; // For kg
        regras_peso?: {
            limite_kg_livre: number;
            preco_fixo_livre: number;
        };
    };
    onConfirm: (data: { peso: number; valor: number }) => void;
}

export function BuffetPOS({ produto, onConfirm }: BuffetPOSProps) {
    const [peso, setPeso] = useState<string>('');
    const [calculado, setCalculado] = useState<{ valor: number; isLivre: boolean } | null>(null);

    // Configuration (Could come from produto.regras_peso)
    const LIMITE_LIVRE = produto.regras_peso?.limite_kg_livre || 1.0;
    const PRECO_LIVRE = produto.regras_peso?.preco_fixo_livre || 79.90;
    const PRECO_KG = produto.preco;

    useEffect(() => {
        const p = parseFloat(peso);
        if (!isNaN(p) && p > 0) {
            if (p >= LIMITE_LIVRE) {
                setCalculado({ valor: PRECO_LIVRE, isLivre: true });
            } else {
                setCalculado({ valor: p * PRECO_KG, isLivre: false });
            }
        } else {
            setCalculado(null);
        }
    }, [peso, PRECO_KG, PRECO_LIVRE, LIMITE_LIVRE]);

    const handleConfirm = () => {
        if (calculado) {
            onConfirm({ peso: parseFloat(peso), valor: calculado.valor });
            setPeso('');
            toast.success('Pesagem consolidada!');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">{produto.nome}</h3>
                    <p className="text-slate-500 font-medium">Capture o peso ou digite manualmente</p>
                </div>
                <Badge variant="outline" className="h-10 px-4 rounded-lg border-2 font-black text-primary border-primary/20 bg-primary/5">
                    {formatCurrency(PRECO_KG)} / KG
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="relative">
                        <Label className="text-xs font-black uppercase text-slate-400 mb-3 block tracking-widest">Peso Atual (KG)</Label>
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Scale className="absolute left-6 top-1/2 -translate-y-1/2 h-8 w-8 text-primary opacity-50" />
                                <Input
                                    type="number"
                                    placeholder="0.000"
                                    value={peso}
                                    onChange={(e) => setPeso(e.target.value)}
                                    className="h-28 text-5xl font-black text-center pl-16 rounded-lg border-4 border-slate-100 focus-visible:border-primary transition-all"
                                    autoFocus
                                />
                            </div>
                            <Button
                                variant="outline"
                                className="h-28 w-28 rounded-lg border-4 border-slate-100 hover:bg-slate-50"
                                onClick={() => setPeso('')}
                            >
                                <RotateCcw className="h-8 w-8 text-slate-400" />
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {[0.3, 0.5, 0.7, 1.0, 1.2, 1.5].map(p => (
                            <Button
                                key={p}
                                variant="ghost"
                                className="h-16 rounded-lg border-2 border-slate-100 font-bold hover:bg-slate-900 hover:text-white transition-all"
                                onClick={() => setPeso(p.toFixed(3))}
                            >
                                {p.toFixed(3)}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col">
                    <Card className={cn(
                        "flex-1 rounded-lg border border-slate-100 transition-all duration-700 overflow-hidden flex flex-col",
                        calculado ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                    )}>
                        <CardContent className="p-10 flex flex-col h-full">
                            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4">
                                {calculado ? (
                                    <>
                                        <h4 className="text-sm font-black uppercase tracking-[0.2em] opacity-50">Total Consumo</h4>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-8xl font-black tracking-tighter">
                                                {formatCurrency(calculado.valor)}
                                            </span>
                                        </div>
                                        {calculado.isLivre && (
                                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-black uppercase italic tracking-widest animate-bounce">
                                                Prato Livre (Mão Cheia)
                                            </Badge>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="h-20 w-20 opacity-20" />
                                        <p className="font-bold text-xl max-w-[200px]">Aguardando pesagem na balança...</p>
                                    </>
                                )}
                            </div>

                            <div className="pt-8 space-y-4">
                                <Button
                                    disabled={!calculado}
                                    className="w-full h-20 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xl uppercase italic tracking-wider transition-all disabled:opacity-20"
                                    onClick={handleConfirm}
                                >
                                    Imprimir & Lançar
                                    <Printer className="ml-3 h-6 w-6" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

