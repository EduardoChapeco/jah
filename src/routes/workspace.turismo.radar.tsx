import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import {
  Globe, TrendingUp, TrendingDown, Minus, Star, Shield, ShieldAlert, ShieldOff,
  AlertTriangle, Info, Zap, Thermometer, DollarSign, MapPin, Eye, Search,
  ChevronRight, Plane, BadgeCheck, BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/commerce/page-header';
import type { DestinationIntelligence, TravelAlert, SafetyLevel, DestinationTrend } from '@/types/destination-intelligence';
import { listDestinationIntelligence, listTravelAlerts } from '@/services/destination-intelligence.functions';
import { useEffect } from 'react';

export const Route = createFileRoute('/workspace/turismo/radar')({
  head: () => ({ meta: [{ title: 'Radar Global de Destinos & IA | JAH Turismo' }] }),
  component: TurismoRadarPage,
});

const DEMO_DESTINATIONS: DestinationIntelligence[] = [
  { id: 'd-1', store_id: '00000000-0000-0000-0000-000000000000', destination: 'Miami & Orlando, EUA', country_code: 'US', continent: 'América do Norte', demand_score: 95, trend: 'rising', is_featured: true, is_visa_required: false, safety_level: 'safe', currency_code: 'USD', exchange_rate_brl: 5.72, avg_package_brl: 9800, avg_daily_rate_brl: 850, min_budget_brl: 7500, avg_temp_celsius: 27, peak_season: 'Outubro a Março', best_months: ['out','nov','dez','jan','fev','mar'], tags: ['família','parques','praia','compras'], highlights: ['Universal Studios','Disney World','South Beach','Wynwood'], image_url: null },
  { id: 'd-2', store_id: '00000000-0000-0000-0000-000000000000', destination: 'Cancún & Riviera Maya, México', country_code: 'MX', continent: 'América Central', demand_score: 88, trend: 'rising', is_featured: true, is_visa_required: false, safety_level: 'moderate', currency_code: 'USD', exchange_rate_brl: 5.72, avg_package_brl: 6200, avg_daily_rate_brl: 520, min_budget_brl: 4800, avg_temp_celsius: 29, peak_season: 'Novembro a Abril', best_months: ['nov','dez','jan','fev','mar','abr'], tags: ['praia','all-inclusive','mergulho','casais'], highlights: ['Chichen Itza','Tulum','Xcaret','Playa del Carmen'], image_url: null },
  { id: 'd-3', store_id: '00000000-0000-0000-0000-000000000000', destination: 'Lisboa & Porto, Portugal', country_code: 'PT', continent: 'Europa', demand_score: 82, trend: 'stable', is_featured: true, is_visa_required: false, safety_level: 'safe', currency_code: 'EUR', exchange_rate_brl: 6.18, avg_package_brl: 8900, avg_daily_rate_brl: 680, min_budget_brl: 6500, avg_temp_celsius: 20, peak_season: 'Março a Outubro', best_months: ['mar','abr','mai','jun','set','out'], tags: ['cultura','gastronomia','história','vinho'], highlights: ['Torre de Belém','Mosteiro dos Jerônimos','Douro Valley','Fátima'], image_url: null },
  { id: 'd-4', store_id: '00000000-0000-0000-0000-000000000000', destination: 'Buenos Aires, Argentina', country_code: 'AR', continent: 'América do Sul', demand_score: 74, trend: 'rising', is_featured: false, is_visa_required: false, safety_level: 'moderate', currency_code: 'ARS', exchange_rate_brl: 0.0057, avg_package_brl: 3800, avg_daily_rate_brl: 280, min_budget_brl: 2500, avg_temp_celsius: 22, peak_season: 'Outubro a Março', best_months: ['out','nov','dez','jan','fev','mar'], tags: ['tango','gastronomia','cultura','teatro'], highlights: ['Puerto Madero','La Boca','Recoleta','Teatro Colón'], image_url: null },
  { id: 'd-5', store_id: '00000000-0000-0000-0000-000000000000', destination: 'Fernando de Noronha, Brasil', country_code: 'BR', continent: 'América do Sul', demand_score: 91, trend: 'rising', is_featured: true, is_visa_required: false, safety_level: 'safe', currency_code: 'BRL', exchange_rate_brl: 1, avg_package_brl: 5500, avg_daily_rate_brl: 800, min_budget_brl: 4000, avg_temp_celsius: 28, peak_season: 'Agosto a Novembro', best_months: ['ago','set','out','nov'], tags: ['ecoturismo','mergulho','praia','natureza'], highlights: ['Baía do Sancho','Praia do Leão','Atalaia','Mirante do Boldró'], image_url: null },
  { id: 'd-6', store_id: '00000000-0000-0000-0000-000000000000', destination: 'Dubai, Emirados Árabes', country_code: 'AE', continent: 'Ásia', demand_score: 78, trend: 'stable', is_featured: false, is_visa_required: true, safety_level: 'safe', currency_code: 'AED', exchange_rate_brl: 1.56, avg_package_brl: 14500, avg_daily_rate_brl: 1200, min_budget_brl: 10000, avg_temp_celsius: 25, peak_season: 'Novembro a Março', best_months: ['nov','dez','jan','fev','mar'], tags: ['luxo','arranha-céu','shopping','aventura'], highlights: ['Burj Khalifa','Palm Jumeirah','Desert Safari','Dubai Mall'], image_url: null },
];

const DEMO_ALERTS: TravelAlert[] = [
  { id: 'a-1', store_id: '00000000-0000-0000-0000-000000000000', destination: 'Miami & Orlando, EUA', severity: 'info', category: 'currency', title: 'Dólar em Alta — Câmbio Favorável para Compra Antecipada', description: 'USD/BRL em R$ 5,72. Recomenda-se adquirir dólar agora para viagens até março.', is_active: true, source_url: null, expires_at: null },
  { id: 'a-2', store_id: '00000000-0000-0000-0000-000000000000', destination: 'Buenos Aires, Argentina', severity: 'warning', category: 'currency', title: 'Economia Argentina Instável — Atenção ao Câmbio', description: 'Volatilidade do peso impacta contratos em ARS. Recomenda-se usar USD ou BRL para pacotes.', is_active: true, source_url: null, expires_at: null },
  { id: 'a-3', store_id: '00000000-0000-0000-0000-000000000000', destination: 'Fernando de Noronha, Brasil', severity: 'info', category: 'operational', title: 'TPA Reajustada para 2026/2027', description: 'Taxa de Preservação Ambiental ajustada para R$ 2.400 por pessoa em alta temporada.', is_active: true, source_url: null, expires_at: null },
];

function getTrendConfig(trend: DestinationTrend) {
  const map: Record<DestinationTrend, { icon: any; color: string; label: string; bg: string }> = {
    rising: { icon: TrendingUp, color: 'text-emerald-500', label: 'Alta Demanda', bg: 'bg-emerald-500/10 border-emerald-500/30' },
    stable: { icon: Minus, color: 'text-blue-400', label: 'Estável', bg: 'bg-blue-400/10 border-blue-400/30' },
    falling: { icon: TrendingDown, color: 'text-rose-400', label: 'Queda', bg: 'bg-rose-400/10 border-rose-400/30' },
  };
  return map[trend];
}

function getSafetyConfig(level: SafetyLevel) {
  const map: Record<SafetyLevel, { icon: any; label: string; bg: string }> = {
    safe: { icon: BadgeCheck, label: 'Seguro', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
    moderate: { icon: Shield, label: 'Atenção Moderada', bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400' },
    caution: { icon: ShieldAlert, label: 'Cautela', bg: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
    warning: { icon: ShieldOff, label: 'Alerta', bg: 'bg-rose-500/10 border-rose-500/30 text-rose-500' },
  };
  return map[level];
}

function getAlertConfig(severity: 'info' | 'warning' | 'critical') {
  const map = {
    info: { icon: Info, bg: 'bg-blue-500/10 border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-400' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400' },
    critical: { icon: ShieldOff, bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-400', dot: 'bg-rose-400' },
  };
  return map[severity];
}

function DemandBar({ score }: { score: number }) {
  const color = score >= 85 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold tabular-nums text-foreground">{score}</span>
    </div>
  );
}

function TurismoRadarPage() {
  const [search, setSearch] = useState('');
  const [filterContinent, setFilterContinent] = useState<string>('all');
  const [selectedDest, setSelectedDest] = useState<DestinationIntelligence | null>(null);

  const [destinations, setDestinations] = useState<DestinationIntelligence[]>([]);
  const [alerts, setAlerts] = useState<TravelAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const storeId = '00000000-0000-0000-0000-000000000000';
        const [destRows, alertRows] = await Promise.all([
          listDestinationIntelligence({ data: { store_id: storeId } }).catch(() => DEMO_DESTINATIONS),
          listTravelAlerts({ data: { store_id: storeId } }).catch(() => DEMO_ALERTS),
        ]);
        setDestinations(destRows.length > 0 ? destRows : DEMO_DESTINATIONS);
        setAlerts(alertRows.length > 0 ? alertRows : DEMO_ALERTS);
      } catch (e) {
        setDestinations(DEMO_DESTINATIONS);
        setAlerts(DEMO_ALERTS);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const continents = useMemo(() => {
    const all = Array.from(new Set(destinations.map(d => d.continent)));
    return ['all', ...all];
  }, [destinations]);

  const filtered = useMemo(() => {
    return destinations.filter(d => {
      const matchSearch = d.destination.toLowerCase().includes(search.toLowerCase()) ||
        d.tags.some(t => t.includes(search.toLowerCase()));
      const matchContinent = filterContinent === 'all' || d.continent === filterContinent;
      return matchSearch && matchContinent;
    });
  }, [destinations, search, filterContinent]);

  const topAlerts = alerts.filter(a => a.is_active).slice(0, 5);

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <PageHeader title="Radar Global de Destinos & IA" description="Inteligência de mercado em tempo real — demanda, câmbio, clima e alertas de operação." />
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl min-h-[44px] text-xs font-semibold"><BarChart3 className="size-4 mr-1.5" />Relatório PDF</Button>
          <Button className="rounded-2xl min-h-[44px] text-xs font-bold"><Globe className="size-4 mr-1.5" />Adicionar Destino</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Destinos Monitorados', value: destinations.length, icon: MapPin, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Destinos em Alta', value: destinations.filter(d => d.trend === 'rising').length, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Alertas Ativos', value: topAlerts.length, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Requerem Visto', value: destinations.filter(d => d.is_visa_required).length, icon: Shield, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="p-5 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
              <div className={`size-11 rounded-xl ${kpi.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`size-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground">{kpi.value}</p>
                <p className="text-[11px] text-muted-foreground font-medium">{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {topAlerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Alertas Operacionais Ativos</h2>
          <div className="space-y-2">
            {topAlerts.map(alert => {
              const cfg = getAlertConfig(alert.severity);
              return (
                <div key={alert.id} className={`flex items-start gap-3 p-4 rounded-2xl border ${cfg.bg}`}>
                  <div className={`size-2 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot} animate-pulse`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-black uppercase tracking-wide ${cfg.text}`}>{alert.destination}</span>
                      <Badge variant="outline" className="text-[10px] uppercase px-1.5 py-0.5 font-bold">{alert.category}</Badge>
                    </div>
                    <p className="text-sm font-bold text-foreground mt-0.5">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{alert.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar destino, praia, família..." className="w-full pl-9 pr-4 h-11 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {continents.map(c => (
            <button key={c} onClick={() => setFilterContinent(c)} className={`h-11 px-4 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${filterContinent === c ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'}`}>
              {c === 'all' ? 'Todos' : c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(dest => {
          const trend = getTrendConfig(dest.trend);
          const safety = getSafetyConfig(dest.safety_level);
          const TrendIcon = trend.icon;
          const SafetyIcon = safety.icon;
          const isSelected = selectedDest?.id === dest.id;
          return (
            <div key={dest.id} onClick={() => setSelectedDest(isSelected ? null : dest)} className={`relative p-5 rounded-2xl border cursor-pointer transition-all duration-300 shadow-sm ${isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-lg' : 'border-border bg-card hover:border-primary/40 hover:shadow-md'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">{dest.continent}</span>
                    {dest.is_featured && <Star className="size-3 text-amber-400 fill-amber-400" />}
                    {dest.is_visa_required && <Badge variant="destructive" className="text-[9px] px-1.5 py-0 font-bold">VISTO</Badge>}
                  </div>
                  <h3 className="font-black text-foreground text-base leading-tight">{dest.destination}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Melhor época: {dest.peak_season || '—'}</p>
                </div>
                <div className={`flex-shrink-0 p-2 rounded-xl border text-xs font-bold flex items-center gap-1 ${trend.bg} ${trend.color}`}>
                  <TrendIcon className="size-3.5" />
                  <span className="hidden sm:inline">{trend.label}</span>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Demanda</span>
                </div>
                <DemandBar score={dest.demand_score} />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="text-center p-2 rounded-xl bg-muted/30">
                  <p className="text-[10px] text-muted-foreground">Pacote Médio</p>
                  <p className="text-xs font-black text-foreground mt-0.5">{dest.avg_package_brl ? `R$ ${(dest.avg_package_brl / 1000).toFixed(1)}k` : '—'}</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-muted/30">
                  <p className="text-[10px] text-muted-foreground">Diária Média</p>
                  <p className="text-xs font-black text-foreground mt-0.5">{dest.avg_daily_rate_brl ? `R$ ${dest.avg_daily_rate_brl}` : '—'}</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-muted/30">
                  <p className="text-[10px] text-muted-foreground">Câmbio</p>
                  <p className="text-xs font-black text-foreground mt-0.5">{dest.exchange_rate_brl && dest.currency_code !== 'BRL' ? `R$ ${dest.exchange_rate_brl}` : 'BRL'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {dest.tags.slice(0, 4).map(tag => (<span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground capitalize">{tag}</span>))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                <span className={`flex items-center gap-1 text-[11px] font-bold rounded-full px-2 py-0.5 border ${safety.bg}`}>
                  <SafetyIcon className="size-3" />
                  {safety.label}
                </span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Thermometer className="size-3.5" />
                  <span className="text-xs font-medium">{dest.avg_temp_celsius ? `${dest.avg_temp_celsius}°C` : '—'}</span>
                </div>
              </div>
              {isSelected && (
                <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                  <h4 className="text-xs font-black uppercase tracking-wider text-foreground mb-2 flex items-center gap-1.5">
                    <Zap className="size-3.5 text-amber-400" /> Destaques do Destino
                  </h4>
                  <ul className="space-y-1">
                    {dest.highlights.map(h => (<li key={h} className="flex items-center gap-2 text-xs text-muted-foreground"><ChevronRight className="size-3 flex-shrink-0 text-primary" />{h}</li>))}
                  </ul>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs font-semibold min-h-[36px]"><Eye className="size-3.5 mr-1" />Ver Pacotes</Button>
                    <Button size="sm" className="flex-1 rounded-xl text-xs font-bold min-h-[36px]"><Plane className="size-3.5 mr-1" />Criar Cotação</Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Globe className="size-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Nenhum destino encontrado</p>
          <p className="text-sm mt-1">Tente outro termo ou adicione um novo destino ao radar.</p>
        </div>
      )}
    </div>
  );
}