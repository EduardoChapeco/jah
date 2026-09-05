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
  Command,
  MessageSquare,
  Sparkles as _ForbiddenSparkles, // Proibido pelo Conselho Apple HIG
  ChevronRight,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import type { SyntheticArchetype, FocusGroupMessage, FocusGroupSession } from '@/types/simlab';
import { 
  listSyntheticArchetypes, 
  getOrCreateActiveFocusSession, 
  listFocusGroupMessages, 
  sendFocusGroupMessage 
} from '@/services/simlab.functions';

export const Route = createFileRoute('/workspace/simlab/focus-group')({
  head: () => ({ meta: [{ title: 'Console de Amostragem Sintética & Focus Group | JAH SimLab' }] }),
  component: FocusGroupPage,
});

const DEFAULT_STORE_ID = 'c6ccd3b2-aa54-42a2-b0fe-251daa5b97f7'; // Excelência Tour SMO

function FocusGroupPage() {
  const [session, setSession] = useState<FocusGroupSession | null>(null);
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
    async function loadData() {
      try {
        // 1. Carregar arquétipos reais
        const rows = await listSyntheticArchetypes();
        if (rows && rows.length > 0) {
          setAvailablePersonas(rows);
          const initialSelection = rows.slice(0, 3);
          setSelectedPersonas(initialSelection);

          // 2. Inicializar ou recuperar sessão de Focus Group
          const sessRes = await getOrCreateActiveFocusSession({
            data: {
              storeId: DEFAULT_STORE_ID,
              personaIds: initialSelection.map(p => p.id)
            }
          });

          if (sessRes?.session) {
            setSession(sessRes.session);

            // 3. Carregar histórico de mensagens
            const messages = await listFocusGroupMessages({
              data: { sessionId: sessRes.session.id }
            });

            if (messages && messages.length > 0) {
              setStatements(messages);
            }
          }
        }
      } catch (e: any) {
        console.warn('Erro ao carregar dados do SimLab Focus Group:', e.message);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    setIsProcessing(true);

    // Adiciona feedback otimista da mensagem do moderador
    const tempModMsg: FocusGroupMessage = {
      id: 'mod-' + Date.now(),
      session_id: session?.id || 'default',
      sender_type: 'moderator_user',
      sender_id: 'moderator',
      sender_name: 'Moderador de Hipóteses (Operação)',
      content: queryText,
      created_at: new Date().toISOString(),
    };
    setStatements(prev => [...prev, tempModMsg]);

    try {
      const result = await sendFocusGroupMessage({
        data: {
          sessionId: session?.id || 'default',
          userMessage: queryText,
          selectedPersonas: selectedPersonas,
        }
      });

      if (result?.success && result.newMessages.length > 0) {
        // Substitui a mensagem temporária pelas salvas e adiciona as respostas
        setStatements(prev => {
          const filtered = prev.filter(m => m.id !== tempModMsg.id);
          return [...filtered, ...result.newMessages];
        });
        toast.success(`Respostas computadas de ${selectedPersonas.length} personas sintéticas.`);
      }
    } catch (err: any) {
      toast.error('Falha ao processar simulação: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      {/* Level 2: TopBar Flutuante com Glassmorphism Apple HIG */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/40 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <Layers className="size-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-foreground">Console de Amostragem Sintética</h1>
              <Badge variant="outline" className="text-[10px] font-medium py-0 px-2 border-border/60">
                IBGE 2022
              </Badge>
              <Badge variant="secondary" className="text-[10px] font-medium py-0 px-2 text-emerald-600 bg-emerald-500/10 border border-emerald-500/20">
                SimLab
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Simulação preditiva calibrada por restrição de renda e elasticidade de preço.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-muted text-muted-foreground border-border/60 text-xs font-medium py-1 px-3 gap-1.5 h-8">
            <Activity className="size-3 text-emerald-500" />
            {selectedPersonas.length} de {availablePersonas.length} Personas Ativas
          </Badge>
        </div>
      </header>

      {/* Grid Principal: Terminal de 2 Colunas */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Painel Esquerdo: Matriz Amostral de Arquétipos */}
        {/* Barra Horizontal Compacta Mobile (Apple HIG Ultra-Mobile-First) */}
        <div className="lg:hidden border-b border-border/40 bg-card/40 p-2.5 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium px-1">
            <span className="flex items-center gap-1.5">
              <Users className="size-3" />
              Bancada Amostral ({selectedPersonas.length}/{availablePersonas.length})
            </span>
            <span className="text-[10px]">Toque para alternar</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {availablePersonas.map((p) => {
              const isSelected = selectedPersonas.some(x => x.id === p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleTogglePersona(p)}
                  className={`h-11 px-3 rounded-xl border text-xs font-medium shrink-0 flex items-center gap-2 transition-all min-h-[44px] ${
                    isSelected
                      ? 'bg-card border-border shadow-xs text-foreground ring-1 ring-primary/30'
                      : 'bg-muted/30 border-transparent text-muted-foreground opacity-60'
                  }`}
                >
                  <span className="truncate max-w-[120px]">{p.display_name}</span>
                  <Badge variant="secondary" className="text-[9px] py-0 px-1.5 rounded-sm">
                    {p.abep_social_class}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* Painel Lateral Desktop */}
        <aside className="hidden lg:block w-88 border-r border-border/60 bg-card/30 p-4 space-y-4 overflow-y-auto no-scrollbar shrink-0">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium pb-2 border-b border-border/40">
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" />
              Bancada Amostral Ativa
            </span>
            <span className="font-semibold text-foreground">{selectedPersonas.length} selecionadas</span>
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
                      : 'bg-muted/20 border-transparent opacity-60 hover:opacity-100 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{p.display_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.location_type === 'capital_metropole' ? 'Região Metropolitana' : 'Interior Polo'} · {p.region}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-semibold py-0.5 px-2">
                      Classe {p.abep_social_class}
                    </Badge>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border/40 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Renda Mediana</span>
                      <span className="font-semibold text-foreground">R$ {p.median_income_brl.toLocaleString('pt-BR')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Sensibilidade Preço</span>
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
            <div className="rounded-2xl border border-border/80 bg-card divide-y divide-border/40 shadow-xs overflow-hidden">
              {statements.map((s) => {
                const isModerator = s.sender_type === 'moderator_user';
                const isScientist = s.sender_type === 'squad_scientist';

                return (
                  <div key={s.id} className={`p-4.5 flex items-start gap-4 transition-colors ${
                    isModerator ? 'bg-primary/5' : isScientist ? 'bg-blue-500/5' : 'bg-transparent'
                  }`}>
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
                      {s.sentiment_score !== null && s.sentiment_score !== undefined && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-medium">Receptividade Estimada:</span>
                          <div className="w-20 bg-muted/60 h-1.5 rounded-sm overflow-hidden">
                            <div 
                              className={`h-full rounded-sm ${s.sentiment_score >= 0.75 ? 'bg-emerald-500' : s.sentiment_score >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${Math.round((s.sentiment_score || 0) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold">{Math.round((s.sentiment_score || 0) * 100)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 px-1">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                Processando restrição orçamentária, aversão ao risco e cinismo da amostra...
              </div>
            )}
            <div ref={feedEndRef} />
          </div>

          {/* Barra Inferior de Entrada (Level 2) */}
          <footer className="p-4 border-t border-border/60 bg-background/90 backdrop-blur-md">
            <form onSubmit={handleTriggerInquiry} className="flex items-center gap-3 max-w-4xl mx-auto">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Insira a hipótese (ex: 'Combo executivo por R$ 85,00 aos domingos com frete grátis na região metropolitana')"
                className="flex-1 h-11 rounded-xl text-sm bg-card border-border/80 focus-visible:ring-1 focus-visible:ring-primary min-h-[44px]"
                disabled={isProcessing}
              />
              <Button
                type="submit"
                disabled={isProcessing || !inputMessage.trim()}
                className="h-11 px-6 rounded-xl font-medium text-xs gap-2 min-h-[44px] shrink-0"
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
