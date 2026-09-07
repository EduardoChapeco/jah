/**
 * OSKDSStations - Gerenciamento de estações KDS
 * CRUD de estações de trabalho na cozinha
 * 
 * REFATORADO v0.95: Dialog → CrudSheet + mutations completas
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChefHat, 
  Plus, 
  Pencil, 
  Trash2, 
  ArrowLeft,
  LayoutGrid,
  Monitor,
  Settings,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BloesyTabsRoot, BloesyTabItem } from '@/components/ui/bloesy-tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
import { CrudSheet, useCrudSheet } from '@/components/layout/CrudSheet';
import { BloesyTabs, type BloesyTab } from '@/components/ui/bloesy-tabs';
import { useKDS, type KDSStation } from '@/hooks/useKDS';

const STATION_TYPES = [
  { value: 'kitchen', label: 'Cozinha', icon: ChefHat },
  { value: 'bar', label: 'Bar', icon: Monitor },
  { value: 'grill', label: 'Grill', icon: ChefHat },
  { value: 'expeditor', label: 'Expedição', icon: LayoutGrid },
  { value: 'custom', label: 'Personalizado', icon: Monitor },
];

const CRUD_TABS = [
  { key: 'dados', label: 'Dados', icon: <Settings className="h-4 w-4" /> },
  { key: 'preview', label: 'Preview', icon: <Eye className="h-4 w-4" /> },
];

export default function OSKDSStations() {
  const navigate = useNavigate();
  const { stations, createStation, updateStation, deleteStation, isLoading } = useKDS();
  
  const crudSheet = useCrudSheet<KDSStation>();
  const [deletingStation, setDeletingStation] = useState<KDSStation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'kitchen' as KDSStation['type'],
    is_active: true,
  });
  const [processing, setProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const resetForm = () => {
    setFormData({ name: '', type: 'kitchen', is_active: true });
  };

  const handleOpenCreate = () => {
    resetForm();
    crudSheet.openCreate();
  };

  const handleOpenEdit = (station: KDSStation) => {
    setFormData({
      name: station.name,
      type: station.type,
      is_active: station.is_active,
    });
    crudSheet.openEdit(station);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome da estação é obrigatório');
      return;
    }

    setProcessing(true);
    try {
      if (crudSheet.mode === 'edit' && crudSheet.editingItem) {
        await updateStation.mutateAsync({
          id: crudSheet.editingItem.id,
          name: formData.name,
          type: formData.type,
          is_active: formData.is_active,
        });
        toast.success('Estação atualizada!');
      } else {
        await createStation.mutateAsync({
          name: formData.name,
          type: formData.type,
          is_active: formData.is_active,
          display_order: stations.length,
        });
        toast.success('Estação criada!');
      }
      crudSheet.close();
      resetForm();
    } catch (error) {
      toast.error('Erro ao salvar estação');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingStation) return;

    setProcessing(true);
    try {
      await deleteStation.mutateAsync(deletingStation.id);
      toast.success('Estação removida!');
      setDeletingStation(null);
    } catch (error) {
      toast.error('Erro ao remover estação');
    } finally {
      setProcessing(false);
    }
  };

  const getStationType = (type: string) => {
    return STATION_TYPES.find(t => t.value === type) || STATION_TYPES[4];
  };

  // Filtrar estações
  const filteredStations = stations.filter(s => {
    if (activeFilter === 'active') return s.is_active;
    if (activeFilter === 'inactive') return !s.is_active;
    return true;
  });

  // Preview Component
  const StationPreview = () => {
    const stationType = getStationType(formData.type);
    const StationIcon = stationType.icon;
    
    return (
      <div className="p-4 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Preview da Estação</h3>
        <Card className="max-w-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <StationIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{formData.name || 'Nome da Estação'}</CardTitle>
                  <CardDescription>{stationType.label}</CardDescription>
                </div>
              </div>
              <Badge variant={formData.is_active ? 'default' : 'secondary'}>
                {formData.is_active ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Ordem: {crudSheet.editingItem?.display_order ? crudSheet.editingItem.display_order + 1 : stations.length + 1}</span>
              <span>{crudSheet.editingItem?.order_count || 0} pedidos</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/os/kds')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <LayoutGrid className="h-8 w-8 text-primary" />
                Estações KDS
              </h1>
              <p className="text-muted-foreground mt-1">
                Configure as estações de trabalho da cozinha
              </p>
            </div>
          </div>
          
        </div>

        {/* BloesyTabs Filter Navigation */}
        <BloesyTabsRoot className="mb-4">
          <BloesyTabItem
            isActive={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
            icon={<LayoutGrid className="h-4 w-4" />}
            badge={stations.length}
          >
            Todas
          </BloesyTabItem>
          <BloesyTabItem
            isActive={activeFilter === 'active'}
            onClick={() => setActiveFilter('active')}
            icon={<Monitor className="h-4 w-4" />}
            badge={stations.filter(s => s.is_active).length}
          >
            Ativas
          </BloesyTabItem>
          <BloesyTabItem
            isActive={activeFilter === 'inactive'}
            onClick={() => setActiveFilter('inactive')}
            icon={<Monitor className="h-4 w-4" />}
            badge={stations.filter(s => !s.is_active).length}
          >
            Inativas
          </BloesyTabItem>
          <div className="flex-1" />
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Estação
          </Button>
        </BloesyTabsRoot>

        {/* Stations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStations.map(station => {
            const stationType = getStationType(station.type);
            const StationIcon = stationType.icon;
            
            return (
              <Card key={station.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <StationIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{station.name}</CardTitle>
                        <CardDescription>{stationType.label}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={station.is_active ? 'default' : 'secondary'}>
                      {station.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>Ordem: {station.display_order + 1}</span>
                    <span>{station.order_count || 0} pedidos</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleOpenEdit(station)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeletingStation(station)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {filteredStations.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">
                  {activeFilter === 'all' 
                    ? 'Nenhuma estação configurada'
                    : `Nenhuma estação ${activeFilter === 'active' ? 'ativa' : 'inativa'}`
                  }
                </p>
                <p className="text-muted-foreground mb-4">
                  Crie estações para organizar os pedidos por área de trabalho
                </p>
                <Button onClick={handleOpenCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Estação
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* CrudSheet */}
        <CrudSheet
          open={crudSheet.isOpen}
          onOpenChange={(open) => !open && crudSheet.close()}
          title={crudSheet.mode === 'edit' ? 'Editar Estação' : 'Nova Estação'}
          tabs={CRUD_TABS}
          activeTab={crudSheet.activeTab}
          onTabChange={crudSheet.setActiveTab}
          preview={<StationPreview />}
          footer={
            <div className="flex justify-end gap-3 p-4 border-t">
              <Button variant="outline" onClick={crudSheet.close}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={processing}>
                {processing ? 'Salvando...' : crudSheet.mode === 'edit' ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          }
        >
          {crudSheet.activeTab === 'dados' && (
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Estação</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Cozinha Principal"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: KDSStation['type']) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Estação Ativa</Label>
                  <p className="text-sm text-muted-foreground">
                    Estações inativas não recebem novos pedidos
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
          )}
          
          {crudSheet.activeTab === 'preview' && <StationPreview />}
        </CrudSheet>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingStation} onOpenChange={() => setDeletingStation(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Estação</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover a estação "{deletingStation?.name}"?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {processing ? 'Removendo...' : 'Remover'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
