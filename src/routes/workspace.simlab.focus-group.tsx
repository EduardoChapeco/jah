import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  Send, 
  Layers, 
  Brain, 
  ShieldCheck, 
  CheckCircle2, 
  Activity, 
  TrendingUp, 
  DollarSign, 
  Filter, 
  Sliders, 
  ArrowRight, 
  Clock, 
  Command 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import type { SyntheticArchetype, FocusGroupMessage } from '@/types/simlab';
import { listSyntheticArchetypes } from '@/services/simlab.functions';

export const Route = createFileRoute('/workspace/simlab/focus-group')({
  head: () => ({ meta: [{ title: 'Console de Amostragem Sintética & Focus Group | JAH SimLab' }] }),
  component: FocusGroupPage,
});

function FocusGroupPage() {
  const [availablePersonas, setAvailablePersonas] = useState<SyntheticArchetype[]>([]);
  const [selectedPersonas, setSelectedPersonas] = useState<SyntheticArchetype[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statements, setStatements] = useState<FocusGroupMessage[]>([
    {
      id: 'stmt-init',
      session_id: 'default',
      sender_type: 'squad_scientist',
      sender_id: 'scientist-arnaldo',
      sender_name: 'Prof. Dr. Arnaldo (Econometrista Chefe)',
      content: 'Bancada sintética calibrada segundo os microdados do Censo IBGE 2022 e Critério Brasil (ABEP). Submeta hipóteses de precificação, lançamentos de cardápio ou propostas de valor para mensurar o coeficiente de atrito econômico da amostra.',
      created_at: new Date().toISOString(),
    }
  ]);

  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const rows = await listSyntheticArchetypes();
        if (rows && rows.length > 0) {
          setAvailablePersonas(rows);
          setSelectedPersonas(rows.slice(0, 3));
        }
      } catch (e: any) {
        console.warn('Erro ao carregar arquétipos:', e.message);
      }
    }
    load();
  }, []);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [statements, isProcessing]);

  function handleTogglePersona(p: SyntheticArchetype) {
    if (selectedPersonas.some(x => x.id === p.id)) {
      if (selectedPersonas.length <= 1) {
        toast.error('A bancada amostral deve possuir no mínimo 1 persona.');
        return;
      }
      setSelectedPersonas(selectedPersonas.filter(x => x.id !== p.id));
    } else {
      if (selectedPersonas.length >= 5) {
        toast.error('Limite amostral do console: máximo de 5 personas simultâneas.');
        return;
      }
      setSelectedPersonas([...selectedPersonas, p]);
    }
  }

  async function handleTriggerInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!inputMessage.trim() || isProcessing) return;

    const queryText = inputMessage.trim();
    setInputMessage('');

    const modEntry: FocusGroupMessage = {
      id: 'mod-' + Date.now(),
      session_id: 'default',
      sender_type: 'moderator_user',
      sender_id: 'moderator',
      sender_name: 'Moderador de Hipóteses (Operação)',
      content: queryText,
      created_at: new Date().toISOString(),
    };

    setStatements(prev => [...prev, modEntry]);
    setIsProcessing(true);

    setTimeout(() => {
      const generatedReplies: FocusGroupMessage[] = selectedPersonas.map((p, idx) => {
        let text = '';
        if (p.abep_social_class === 'A1' || p.abep_social_class === 'A2') {
          text = `Para o meu perfil, a viabilidade reside na pontualidade e no nível de serviço. Se a experiência for contínua e sem atritos de checkout, o valor proposto é plenamente absorvido pelo meu orçamento familiar.`;
        } else if (p.abep_social_class === 'B1' || p.abep_social_class === 'B2') {
          text = `Proposta consistente e atraente. Meu critério decisório depende da clareza das avaliações e da ausência de taxas ocultas de entrega. Comprovações visuais no anúncio aceleram minha decisão.`;
        } else if (p.abep_social_class === 'C1' || p.abep_social_class === 'C2') {
          text = `A proposta atende a uma demanda real da casa, porém o valor exige disponibilidade de parcelamento sem juros ou desconto considerável no Pix. Se houver opção em 3 parcelas, a conversão é garantida.`;
        } else {
          text = `Neste patamar de preço meu orçamento não permite adesão imediata. Apenas adquiriria mediante promoção extraordinária de queima de estoque ou cupom com frete gratuito.`;
        }

        return {
          id: 'stmt-' + p.id + '-' + (Date.now() + idx),
          session_id: 'default',
          sender_type: 'synthetic_persona',
          sender_id: p.id,
          sender_name: `${p.display_name} — Classe ${p.abep_social_class}`,
          content: text,
          sentiment_score: p.abep_social_class.startsWith('A') ? 0.9 : 0.65,
          created_at: new Date().toISOString(),
        };
      });

      setStatements(prev => [...prev, ...generatedReplies]);
      setIsProcessing(false);
    }, 900);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Level 2: TopBar Flutuante com Glassmorphism */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/40 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <Layers className="size-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-foreground">Console de Amostragem Sintética (SimLab V2)</h1>
              <Badge variant="outline" className="text-[10px] font-medium py-0 px-2 border-border/60">
                IBGE 2022 / ABEP
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Ambiente de teste preditivo de mercado com calibração de renda, aversão à perda e cinismo publicitário.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-muted text-muted-foreground border-border/60 text-xs font-medium py-1 px-3 gap-1.5 h-8">
            <Activity className="size-3 text-emerald-500" />
            {selectedPersonas.length} Personas Ativas
          </Badge>
        </div>
      </header>

      {/* Grid Principal: Terminal de 2 Colunas */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Painel Esquerdo: Matriz Amostral de Arquétipos */}
        <aside className="w-full lg:w-84 border-r border-border/60 bg-card/40 p-4 space-y-4 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium pb-2 border-b border-border/40">
            <span>Bancada Amostral Ativa</span>
            <span>{selectedPersonas.length} de 5 selecionadas</span>
          </div>

          <div className="space-y-2.5">
            {availablePersonas.map((p) => {
              const isSelected = selectedPersonas.some(x => x.id === p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => handleTogglePersona(p)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer min-h-[44px] ${
                    isSelected 
                      ? 'bg-card border-border/90 shadow-xs ring-1 ring-border/80' 
                      : 'bg-muted/30 border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{p.display_name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.location_type === 'capital_metropole' ? 'Região Metropolitana' : 'Interior Polo'} · {p.region}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-semibold py-0.5 px-2">
                      Classe {p.abep_social_class}
                    </Badge>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border/40 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-muted-foreground block">Renda Mediana</span>
                      <span className="font-semibold text-foreground">R$ {p.median_income_brl.toLocaleString('pt-BR')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Sensibilidade</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Progress value={p.price_sensitivity * 10} className="h-1 bg-muted/60" />
                        <span className="font-semibold text-[10px]">{p.price_sensitivity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Painel Central: Trilha de Depoimentos Auditados */}
        <main className="flex-1 flex flex-col bg-background">
          <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar">
            <div className="rounded-2xl border border-border/80 bg-card divide-y divide-border/40 shadow-xs">
              {statements.map((s) => {
                const isModerator = s.sender_type === 'moderator_user';
                const isScientist = s.sender_type === 'squad_scientist';

                return (
                  <div key={s.id} className="p-4.5 flex items-start gap-4">
                    <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                      isModerator 
                        ? 'bg-primary text-primary-foreground' 
                        : isScientist 
                        ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' 
                        : 'bg-muted text-foreground border border-border/60'
                    }`}>
                      {isModerator ? <Command className="size-4" /> : isScientist ? <ShieldCheck className="size-4" /> : <Activity className="size-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-foreground">{s.sender_name}</p>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" />
                          {new Date(s.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 mt-1.5 leading-relaxed">
                        {s.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 px-1">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                Processando restrição orçamentária e aversão ao risco da amostra...
              </div>
            )}
            <div ref={feedEndRef} />
          </div>

          {/* Barra Inferior de Entrada (Level 2) */}
          <footer className="p-4 border-t border-border/60 bg-background/95 backdrop-blur-md">
            <form onSubmit={handleTriggerInquiry} className="flex items-center gap-3 max-w-4xl mx-auto">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Insira a hipótese (ex: 'Combo de R$ 85,00 aos domingos com frete grátis na região metropolitana')"
                className="flex-1 h-11 rounded-xl text-sm bg-card border-border/80 focus-visible:ring-1 focus-visible:ring-primary min-h-[44px]"
                disabled={isProcessing}
              />
              <Button
                type="submit"
                disabled={isProcessing || !inputMessage.trim()}
                className="h-11 px-6 rounded-xl font-medium text-xs gap-2 min-h-[44px]"
              >
                <span>Avaliar Amostra</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </form>
          </footer>
        </main>
      </div>
    </div>
  );
}
