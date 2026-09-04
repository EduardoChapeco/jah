import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  Percent,
  Trash2,
  ExternalLink,
  MapPin,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/commerce/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getStoreSettings } from '@/services/store.functions';
import { listTravelSuppliers, deleteTravelSupplier } from '@/services/travel-suppliers.functions';
import { SUPPLIER_KIND_LABELS, type SupplierKind } from '@/types/travel-suppliers';
import { NewSupplierWizard } from '@/components/tourism/suppliers/new-supplier-wizard';

export const Route = createFileRoute('/workspace/turismo/fornecedores')({
  head: () => ({ meta: [{ title: 'Fornecedores & Tarifários de DMCs | Workspace' }] }),
  loader: async () => {
    const store = await getStoreSettings().catch(() => null);
    return { store };
  },
  component: WorkspaceSuppliersPage,
});

function WorkspaceSuppliersPage() {
  const { store } = Route.useLoaderData();
  const storeId = store?.id || '';

  const [search, setSearch] = useState('');
  const [selectedKind, setSelectedKind] = useState('all');
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data: suppliers = [], refetch, isLoading } = useQuery({
    queryKey: ['travel-suppliers', storeId, selectedKind],
    queryFn: () => listTravelSuppliers({ data: { store_id: storeId, kind: selectedKind } }),
  });

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.legal_name && s.legal_name.toLowerCase().includes(search.toLowerCase())) ||
      (s.city && s.city.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir o fornecedor ${name}?`)) return;
    try {
      await deleteTravelSupplier({ data: { id } });
      toast.success('Fornecedor removido com sucesso!');
      refetch();
    } catch (err: any) {
      toast.error('Erro ao remover: ' + err?.message);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Fornecedores & Tarifários de DMCs"
        description="Gestão de operadoras de turismo, companhias aéreas, resorts, receptivos e acordos comerciais."
      >
        <Button
          type="button"
          onClick={() => setWizardOpen(true)}
          className="rounded-2xl bg-primary text-primary-foreground font-bold text-xs gap-1.5 shadow-md h-10 px-4 cursor-pointer"
        >
          <Plus className="size-4" /> Novo Fornecedor
        </Button>
      </PageHeader>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar fornecedor por nome, razão ou cidade..."
            className="h-10 pl-9 rounded-xl text-xs bg-muted/20"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedKind('all')}
            className={'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ' + (
              selectedKind === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/40 text-muted-foreground hover:text-foreground'
            )}
          >
            Todos
          </button>
          {Object.entries(SUPPLIER_KIND_LABELS).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSelectedKind(k)}
              className={'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ' + (
                selectedKind === k
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/40 text-muted-foreground hover:text-foreground'
              )}
            >
              {label.split('/')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Fornecedores */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">Carregando catálogo de fornecedores...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-3">
          <Building2 className="size-8 text-muted-foreground mx-auto" />
          <p className="text-xs font-bold text-foreground">Nenhum fornecedor encontrado</p>
          <p className="text-xs text-muted-foreground">Cadastre operadoras e DMCs para vincular às propostas e cotações da agência.</p>
          <Button type="button" onClick={() => setWizardOpen(true)} size="sm" className="rounded-xl">
            Cadastrar Primeiro Fornecedor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-foreground leading-tight">{s.name}</h3>
                    {s.legal_name && (
                      <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">{s.legal_name}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono shrink-0">
                    {SUPPLIER_KIND_LABELS[s.kind]?.split('/')[0] || s.kind}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs pt-1">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                    <Percent className="size-3" /> {s.commission_rate}% Comissão
                  </span>
                  {s.city && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="size-3" /> {s.city}{s.state ? '/' + s.state : ''}
                    </span>
                  )}
                </div>

                {s.notes && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 bg-muted/20 p-2.5 rounded-xl">
                    {s.notes}
                  </p>
                )}
              </div>

              <div className="border-t border-border/60 pt-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {s.phone && (
                    <a
                      href={`tel:${s.phone}`}
                      className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                      title={s.phone}
                    >
                      <Phone className="size-3.5" />
                    </a>
                  )}
                  {s.email && (
                    <a
                      href={`mailto:${s.email}`}
                      className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                      title={s.email}
                    >
                      <Mail className="size-3.5" />
                    </a>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(s.id, s.name)}
                  className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {wizardOpen && (
        <NewSupplierWizard
          isOpen={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onCreated={refetch}
          storeId={storeId}
        />
      )}
    </div>
  );
}
