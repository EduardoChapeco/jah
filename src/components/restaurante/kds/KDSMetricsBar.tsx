/**
 * KDSMetricsBar - Barra de métricas do KDS
 */

import { Clock, ChefHat, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KDSMetrics } from '@/hooks/useKDS';

interface KDSMetricsBarProps {
  metrics: KDSMetrics;
  className?: string;
}

export function KDSMetricsBar({ metrics, className }: KDSMetricsBarProps) {
  return (
    <div className={cn(
      'flex flex-wrap items-center gap-4 p-4 bg-background rounded-xl border',
      className
    )}>
      <MetricItem
        icon={Clock}
        label="Na Fila"
        value={metrics.ordersInQueue}
        color="primary"
      />
      <div className="w-px h-8 bg-border hidden sm:block" />
      <MetricItem
        icon={ChefHat}
        label="Tempo Médio"
        value={`${metrics.averagePrepTime}min`}
        color="success"
      />
      <div className="w-px h-8 bg-border hidden sm:block" />
      <MetricItem
        icon={CheckCircle}
        label="Concluídos"
        value={metrics.ordersCompleted}
        color="info"
      />
      <div className="w-px h-8 bg-border hidden sm:block" />
      <MetricItem
        icon={AlertTriangle}
        label="Atrasados"
        value={metrics.lateOrders}
        color={metrics.lateOrders > 0 ? 'destructive' : 'muted'}
        pulse={metrics.lateOrders > 0}
      />
    </div>
  );
}

interface MetricItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: 'primary' | 'success' | 'info' | 'warning' | 'destructive' | 'muted';
  pulse?: boolean;
}

function MetricItem({ icon: Icon, label, value, color, pulse }: MetricItemProps) {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    info: 'text-info bg-info/10',
    warning: 'text-warning bg-warning/10',
    destructive: 'text-destructive bg-destructive/10',
    muted: 'text-muted-foreground bg-muted',
  };

  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        'h-10 w-10 rounded-lg flex items-center justify-center',
        colorClasses[color],
        pulse && 'animate-pulse'
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn(
          'text-xl font-bold',
          color === 'destructive' && 'text-destructive'
        )}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default KDSMetricsBar;
