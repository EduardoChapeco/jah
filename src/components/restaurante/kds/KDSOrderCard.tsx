/**
 * KDSOrderCard - Card de pedido para KDS
 * Componente separado para melhor manutenção
 */

import { memo, useState, useEffect } from 'react';
import { Clock, CheckCircle, Play, AlertTriangle, User, Utensils } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { KDSOrder, KDSOrderItem } from '@/hooks/useKDS';

interface KDSOrderCardProps {
  order: KDSOrder;
  onStart?: (orderId: string) => void;
  onComplete?: (orderId: string) => void;
  onItemComplete?: (orderId: string, itemId: string) => void;
  isStarting?: boolean;
  isCompleting?: boolean;
  compact?: boolean;
}

const LATE_THRESHOLD_MS = 15 * 60 * 1000;
const WARNING_THRESHOLD_MS = 10 * 60 * 1000;

const priorityConfig = {
  vip: { label: 'VIP', class: 'bg-purple-500 text-white' },
  rush: { label: 'URGENTE', class: 'bg-destructive text-destructive-foreground' },
  normal: { label: '', class: '' },
};

const sourceConfig = {
  pdv: { label: 'PDV', class: 'bg-primary/10 text-primary' },
  ifood: { label: 'iFood', class: 'bg-red-500/10 text-red-500' },
  rappi: { label: 'Rappi', class: 'bg-orange-500/10 text-orange-500' },
  marketplace: { label: 'Marketplace', class: 'bg-blue-500/10 text-blue-500' },
  manual: { label: 'Manual', class: 'bg-muted text-muted-foreground' },
};

function LiveTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    
    const updateElapsed = () => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    };
    
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    
    return () => clearInterval(interval);
  }, [startTime]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const isLate = elapsed > LATE_THRESHOLD_MS / 1000;
  const isWarning = elapsed > WARNING_THRESHOLD_MS / 1000;

  return (
    <span className={cn(
      'font-mono font-semibold',
      isLate && 'text-destructive',
      isWarning && !isLate && 'text-warning'
    )}>
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  );
}

function ItemRow({ item, onComplete }: { item: KDSOrderItem; onComplete?: () => void }) {
  return (
    <div className={cn(
      'flex items-center justify-between py-1.5 border-b border-border/50 last:border-0',
      item.status === 'ready' && 'opacity-60'
    )}>
      <div className="flex items-center gap-2 flex-1">
        <span className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
          item.status === 'ready' ? 'bg-success/20 text-success' : 'bg-primary/10 text-primary'
        )}>
          {item.quantity}
        </span>
        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-medium truncate',
            item.status === 'ready' && 'line-through'
          )}>
            {item.item_name}
          </p>
          {item.notes && (
            <p className="text-xs text-warning truncate">⚠️ {item.notes}</p>
          )}
          {item.modifiers && item.modifiers.length > 0 && (
            <p className="text-xs text-muted-foreground truncate">
              {item.modifiers.join(', ')}
            </p>
          )}
        </div>
      </div>
      {item.status === 'ready' ? (
        <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
      ) : onComplete ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
        >
          <CheckCircle className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}

export const KDSOrderCard = memo(function KDSOrderCard({
  order,
  onStart,
  onComplete,
  onItemComplete,
  isStarting,
  isCompleting,
  compact = false,
}: KDSOrderCardProps) {
  const waitTime = Date.now() - new Date(order.created_at).getTime();
  const isLate = waitTime > LATE_THRESHOLD_MS;
  const isWarning = waitTime > WARNING_THRESHOLD_MS;
  
  const completedItems = order.items.filter(i => i.status === 'ready').length;
  const totalItems = order.items.length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  
  const source = sourceConfig[order.source] || sourceConfig.manual;
  const priority = priorityConfig[order.priority];

  return (
    <Card className={cn(
      'transition-all duration-300 hover:shadow-lg overflow-hidden',
      isLate && 'border-destructive bg-destructive/5 shadow-destructive/20',
      isWarning && !isLate && 'border-warning bg-warning/5',
      order.status === 'ready' && 'border-success bg-success/5',
      order.priority === 'vip' && 'ring-2 ring-purple-500/50',
      order.priority === 'rush' && 'ring-2 ring-destructive/50'
    )}>
      {/* Progress bar on top */}
      {order.status === 'preparing' && (
        <Progress value={progress} className="h-1 rounded-none" />
      )}
      
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl font-bold">#{order.order_number}</span>
            <Badge variant="outline" className={source.class}>
              {source.label}
            </Badge>
            {priority.label && (
              <Badge className={priority.class}>
                {priority.label}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge 
              variant="outline" 
              className={cn(
                'gap-1',
                isLate && 'border-destructive text-destructive',
                isWarning && !isLate && 'border-warning text-warning'
              )}
            >
              <Clock className="h-3 w-3" />
              <LiveTimer startTime={order.created_at} />
            </Badge>
            {isLate && (
              <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
            )}
          </div>
        </div>
        
        {/* Customer/Table Info */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
          {order.customer_name && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {order.customer_name}
            </span>
          )}
          {order.table_number && (
            <span className="flex items-center gap-1">
              <Utensils className="h-3 w-3" />
              Mesa {order.table_number}
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-2 px-4 pb-4">
        {/* Items list */}
        <div className={cn(
          'space-y-0',
          compact && order.items.length > 4 && 'max-h-32 overflow-y-auto'
        )}>
          {order.items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              onComplete={
                order.status === 'preparing' && onItemComplete
                  ? () => onItemComplete(order.id, item.id)
                  : undefined
              }
            />
          ))}
        </div>
        
        {/* Notes */}
        {order.notes && (
          <div className="mt-3 p-2 bg-warning/10 rounded-lg text-sm border border-warning/20">
            <strong className="text-warning">Obs:</strong> {order.notes}
          </div>
        )}
        
        {/* Progress indicator */}
        {order.status === 'preparing' && totalItems > 1 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{completedItems}/{totalItems} itens prontos</span>
          </div>
        )}
        
        {/* Actions */}
        <div className="mt-4 flex gap-2">
          {order.status === 'new' && onStart && (
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => onStart(order.id)}
              disabled={isStarting}
            >
              <Play className="mr-2 h-5 w-5" />
              Iniciar Preparo
            </Button>
          )}
          {order.status === 'preparing' && onComplete && (
            <Button 
              className="w-full bg-success hover:bg-success/90" 
              size="lg"
              onClick={() => onComplete(order.id)}
              disabled={isCompleting}
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Pedido Pronto
            </Button>
          )}
          {order.status === 'ready' && (
            <div className="w-full text-center py-2 text-success font-semibold">
              ✓ Aguardando Entrega
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default KDSOrderCard;
