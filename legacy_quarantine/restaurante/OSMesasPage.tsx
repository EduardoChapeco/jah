/**
 * WAESY OS - Mesas Page
 * v0.107.2
 * 
 * Gestão completa de mesas do restaurante.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutGrid, 
  Plus, 
  Users, 
  Circle,
  Square,
  RectangleHorizontal,
  Edit,
  Trash2,
  X,
  Check,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';
import {
  listRestaurantTables,
  saveRestaurantTable,
  deleteRestaurantTable,
  updateRestaurantTableStatus,
} from '@/services/pdv.functions';
import { cn } from '@/lib/utils';

interface RestaurantTable {
  id: string;
  tenant_id: string;
  number: number;
  name: string | null;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  section: string | null;
  shape: 'square' | 'round' | 'rectangle';
  is_active: boolean;
}

const STATUS_CONFIG = {
  available: { label: 'Disponível', color: 'bg-success', textColor: 'text-success' },
  occupied: { label: 'Ocupada', color: 'bg-destructive', textColor: 'text-destructive' },
  reserved: { label: 'Reservada', color: 'bg-warning', textColor: 'text-warning' },
  cleaning: { label: 'Limpeza', color: 'bg-info', textColor: 'text-info' },
};

const SHAPE_ICONS = {
  square: Square,
  round: Circle,
  rectangle: RectangleHorizontal,
};

export default function OSMesasPage() {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [deleteTable, setDeleteTable] = useState<RestaurantTable | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    number: 1,
    name: '',
    capacity: 4,
    section: '',
    shape: 'square' as 'square' | 'round' | 'rectangle',
  });
  
  // Fetch tables
  const { data: tables = [], isLoading, refetch } = useQuery({
    queryKey: ['restaurant-tables', tenant?.id],
    queryFn: async () => {
      const res = await listRestaurantTables();
      return (res || []).map((t: any) => ({
        id: t.id,
        tenant_id: tenant?.id || '',
        number: t.table_number || t.number || 0,
        name: t.table_name || t.name || null,
        capacity: t.capacity || 4,
        section: t.zone || t.section || null,
        shape: (t.shape as any) || 'square',
        status: (t.status as any) || 'available',
        is_active: t.is_active ?? true,
      })) as RestaurantTable[];
    },
    enabled: true,
  });
  
  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      return await saveRestaurantTable({
        data: {
          id: data.id,
          tableNumber: data.number,
          tableName: data.name || `Mesa ${data.number}`,
          zone: data.section || 'Salão Principal',
          capacity: data.capacity,
          shape: (data.shape as any) || 'square',
          status: 'available',
        }
      });
    },
    onSuccess: () => {
      toast({ title: selectedTable ? 'Mesa atualizada!' : 'Mesa criada!' });
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      handleCloseSheet();
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro ao salvar mesa', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteRestaurantTable({ data: { tableId: id } });
    },
    onSuccess: () => {
      toast({ title: 'Mesa removida!' });
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      setDeleteTable(null);
    },
  });
  
  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await updateRestaurantTableStatus({
        data: {
          tableId: id,
          status: status as any,
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
    },
  });
  
  const handleOpenSheet = (table?: RestaurantTable) => {
    if (table) {
      setSelectedTable(table);
      setFormData({
        number: table.number,
        name: table.name || '',
        capacity: table.capacity,
        section: table.section || '',
        shape: table.shape,
      });
    } else {
      setSelectedTable(null);
      setFormData({
        number: (tables.length > 0 ? Math.max(...tables.map(t => t.number)) : 0) + 1,
        name: '',
        capacity: 4,
        section: '',
        shape: 'square',
      });
    }
    setIsSheetOpen(true);
  };
  
  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setSelectedTable(null);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...formData,
      id: selectedTable?.id,
    });
  };
  
  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  };
  
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <LayoutGrid className="h-8 w-8 text-primary" />
            Mesas
          </h1>
          <p className="text-muted-foreground">
            Gerencie o mapa de mesas do seu estabelecimento
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => handleOpenSheet()} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Mesa
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <div className="text-sm text-muted-foreground">Disponíveis</div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.occupied}</div>
            <div className="text-sm text-muted-foreground">Ocupadas</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.reserved}</div>
            <div className="text-sm text-muted-foreground">Reservadas</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tables Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-32" />
            </Card>
          ))}
        </div>
      ) : tables.length === 0 ? (
        <Card className="p-12 text-center">
          <LayoutGrid className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg mb-2">Nenhuma mesa cadastrada</h3>
          <p className="text-muted-foreground mb-4">
            Comece adicionando as mesas do seu estabelecimento
          </p>
          <Button onClick={() => handleOpenSheet()}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Mesa
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <AnimatePresence>
            {tables.map((table) => {
              const statusConfig = STATUS_CONFIG[table.status];
              const ShapeIcon = SHAPE_ICONS[table.shape];
              
              return (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card 
                    className={cn(
                      "cursor-pointer hover:shadow-lg transition-all relative group",
                      table.status === 'occupied' && "border-red-300",
                      table.status === 'available' && "border-green-300",
                      table.status === 'reserved' && "border-yellow-300",
                    )}
                  >
                    {/* Status indicator */}
                    <div className={cn(
                      "absolute top-2 right-2 w-3 h-3 rounded-full",
                      statusConfig.color
                    )} />
                    
                    <CardContent className="p-4 text-center">
                      <ShapeIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <div className="font-bold text-xl">
                        {table.name || `Mesa ${table.number}`}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {table.capacity} lugares
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn("mt-2", statusConfig.textColor)}
                      >
                        {statusConfig.label}
                      </Badge>
                      
                      {/* Quick actions */}
                      <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="flex-1 h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSheet(table);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Select
                          value={table.status}
                          onValueChange={(value) => {
                            updateStatusMutation.mutate({ id: table.id, status: value });
                          }}
                        >
                          <SelectTrigger className="flex-1 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Disponível</SelectItem>
                            <SelectItem value="occupied">Ocupada</SelectItem>
                            <SelectItem value="reserved">Reservada</SelectItem>
                            <SelectItem value="cleaning">Limpeza</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      
      {/* Create/Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {selectedTable ? 'Editar Mesa' : 'Nova Mesa'}
            </SheetTitle>
            <SheetDescription>
              {selectedTable 
                ? 'Altere as informações da mesa'
                : 'Adicione uma nova mesa ao estabelecimento'
              }
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  type="number"
                  min={1}
                  value={formData.number}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    number: parseInt(e.target.value) || 1 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidade</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    capacity: parseInt(e.target.value) || 1 
                  }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome (opcional)</Label>
              <Input
                id="name"
                placeholder="Ex: Mesa VIP, Varanda..."
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="section">Seção</Label>
              <Input
                id="section"
                placeholder="Ex: Salão, Varanda, Mezanino..."
                value={formData.section}
                onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Formato</Label>
              <div className="flex gap-2">
                {(['square', 'round', 'rectangle'] as const).map((shape) => {
                  const Icon = SHAPE_ICONS[shape];
                  return (
                    <Button
                      key={shape}
                      type="button"
                      variant={formData.shape === shape ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setFormData(prev => ({ ...prev, shape }))}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={handleCloseSheet}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
            
            {selectedTable && (
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={() => setDeleteTable(selectedTable)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover Mesa
              </Button>
            )}
          </form>
        </SheetContent>
      </Sheet>
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTable} onOpenChange={() => setDeleteTable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover mesa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a mesa {deleteTable?.name || `Mesa ${deleteTable?.number}`}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTable && deleteMutation.mutate(deleteTable.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
