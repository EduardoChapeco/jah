/**
 * OSKDSDashboard - Kitchen Display System Dashboard
 * Visualização de pedidos em tempo real para cozinha
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ChefHat, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Play,
  Volume2,
  VolumeX,
  LayoutGrid,
  RefreshCw,
  Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKDS, type KDSOrder } from '@/hooks/useKDS';

export default function OSKDSDashboard() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'pt-BR' ? ptBR : enUS;
  const { 
    orders, 
    stations, 
    startOrder, 
    bumpOrder, 
    isLoading,
    soundEnabled,
    setSoundEnabled,
    metrics
  } = useKDS();
  const [selectedStation, setSelectedStation] = useState<string>('all');

  // Filter orders by station
  const filteredOrders = selectedStation === 'all' 
    ? orders 
    : orders.filter(o => o.station_id === selectedStation);

  // Group orders by status
  const newOrders = filteredOrders.filter(o => o.status === 'new');
  const preparingOrders = filteredOrders.filter(o => o.status === 'preparing');
  const readyOrders = filteredOrders.filter(o => o.status === 'ready');

  const getOrderUrgency = (order: KDSOrder) => {
    const waitTime = Date.now() - new Date(order.created_at).getTime();
    const minutes = waitTime / (1000 * 60);
    
    if (minutes > 15) return 'critical';
    if (minutes > 10) return 'warning';
    return 'normal';
  };

  const handleStartOrder = async (orderId: string) => {
    try {
      await startOrder.mutateAsync(orderId);
      toast.success(t('kds.orderStarted'));
    } catch (error) {
      toast.error(t('kds.errorStarting'));
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      await bumpOrder.mutateAsync(orderId);
      toast.success(t('kds.orderComplete'));
    } catch (error) {
      toast.error(t('kds.errorCompleting'));
    }
  };

  const OrderCard = ({ order }: { order: KDSOrder }) => {
    const urgency = getOrderUrgency(order);
    const waitTime = formatDistanceToNow(new Date(order.created_at), { 
      locale: dateLocale, 
      addSuffix: false 
    });

    return (
      <Card className={cn(
        'transition-all hover:shadow-md',
        urgency === 'critical' && 'border-red-500 bg-red-500/5 animate-pulse',
        urgency === 'warning' && 'border-yellow-500 bg-yellow-500/5'
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              #{order.order_number}
            </CardTitle>
            <div className="flex items-center gap-2">
              {order.priority === 'rush' && (
                <Badge variant="destructive">{t('kds.priority.rush')}</Badge>
              )}
              {order.priority === 'vip' && (
                <Badge className="bg-purple-500">{t('kds.priority.vip')}</Badge>
              )}
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {waitTime}
              </Badge>
            </div>
          </div>
          {order.customer_name && (
            <p className="text-sm text-muted-foreground">{order.customer_name}</p>
          )}
          {order.table_number && (
            <p className="text-sm text-muted-foreground">{t('kds.table')} {order.table_number}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.quantity}x</span>
                  <span>{item.item_name}</span>
                </div>
                {item.status === 'ready' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            ))}
          </div>
          
          {order.notes && (
            <div className="mt-3 p-2 bg-yellow-500/10 rounded text-sm">
              <strong>{t('kds.notes')}:</strong> {order.notes}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            {order.status === 'new' && (
              <Button 
                className="w-full" 
                onClick={() => handleStartOrder(order.id)}
                disabled={startOrder.isPending}
              >
                <Play className="mr-2 h-4 w-4" />
                {t('kds.actions.start')}
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button 
                className="w-full bg-success hover:bg-success/90" 
                onClick={() => handleCompleteOrder(order.id)}
                disabled={bumpOrder.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {t('kds.actions.ready')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-primary" />
            {t('kds.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('kds.description')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedStation} onValueChange={setSelectedStation}>
            <SelectTrigger className="w-48">
              <LayoutGrid className="mr-2 h-4 w-4" />
              <SelectValue placeholder={t('kds.allStations')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('kds.allStations')}</SelectItem>
              {stations.map(station => (
                <SelectItem key={station.id} value={station.id}>
                  {station.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
          
          <Button variant="outline" asChild>
            <a href="/os/kds/stations">
              <Settings className="mr-2 h-4 w-4" />
              {t('kds.stations')}
            </a>
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('kds.metrics.inQueue')}</p>
                <p className="text-3xl font-bold">{metrics.ordersInQueue}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('kds.metrics.avgTime')}</p>
                <p className="text-3xl font-bold">{metrics.averagePrepTime}min</p>
              </div>
              <ChefHat className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('kds.metrics.completed')}</p>
                <p className="text-3xl font-bold">{metrics.ordersCompleted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className={cn(
          metrics.lateOrders > 0 && 'border-red-500'
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('kds.metrics.late')}</p>
                <p className="text-3xl font-bold text-red-500">{metrics.lateOrders}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* New Orders */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            {t('kds.columns.new')} ({newOrders.length})
          </h2>
          <div className="space-y-4">
            {newOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
            {newOrders.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {t('kds.empty.new')}
              </p>
            )}
          </div>
        </div>

        {/* Preparing */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            {t('kds.columns.preparing')} ({preparingOrders.length})
          </h2>
          <div className="space-y-4">
            {preparingOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
            {preparingOrders.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {t('kds.empty.preparing')}
              </p>
            )}
          </div>
        </div>

        {/* Ready */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            {t('kds.columns.ready')} ({readyOrders.length})
          </h2>
          <div className="space-y-4">
            {readyOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
            {readyOrders.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {t('kds.empty.ready')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
