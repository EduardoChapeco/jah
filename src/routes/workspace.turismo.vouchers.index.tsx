import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Search,
  Plane,
  Building2,
  Car,
  Download,
  Trash2,
  Printer,
  QrCode,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/commerce/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getStoreSettings } from '@/services/store.functions';
import { listTravelVouchers, createTravelVoucher, deleteTravelVoucher } from '@/services/travel-vouchers.functions';
import { VOUCHER_TYPE_LABELS, type VoucherType } from '@/types/travel-vouchers';
import { TemplateVoucherA4 } from '@/components/tourism/vouchers/templates/template-voucher-a4';
import { exportElementAsPdf } from '@/lib/pdf-export';

export const Route = createFileRoute('/workspace/turismo/vouchers/')({
  head: () => ({ meta: [{ title: 'Central de Vouchers & Boarding Passes | Workspace' }] }),
  loader: async () => {
    const store = await getStoreSettings().catch(() => null);
    return { store };
  },
  component: WorkspaceVouchersPage,
});

function WorkspaceVouchersPage() {
  const { store } = Route.useLoaderData();
  const storeId = store?.id || '';

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [previewVoucher, setPreviewVoucher] = useState<any | null>(null);

  const { data: vouchers = [], refetch, isLoading } = useQuery({
    queryKey: ['travel-vouchers', storeId, selectedType],
    queryFn: () => listTravelVouchers({ data: { store_id: storeId, type: selectedType } }),
  });

  const filtered = vouchers.filter(
    (v) =>
      v.passenger_name.toLowerCase().includes(search.toLowerCase()) ||
      v.voucher_number.toLowerCase().includes(search.toLowerCase()) ||
      v.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleQuickCreate = async (type: VoucherType) => {
    try {
      await createTravelVoucher({
        data: {
          store_id: storeId,
          voucher_type: type,
          title: type === 'flight' ? 'Passagem Aérea & Cartão de Embarque' : 'Voucher de Hospedagem & Resort',
          passenger_name: 'Novo Passageiro',
          flight_data: { airline: 'GOL Linhas Aéreas', origin: 'GRU', destination: 'FLN', departureTime: '10:00', seat: '14B' },
          hotel_data: { hotelName: 'Resort Internacional', roomType: 'Luxo Casal', boardBasis: 'All Inclusive' },
        },
      });
      toast.success('Novo voucher emitido com sucesso!');
      refetch();
    } catch (err: any) {
      toast.error('Erro ao emitir: ' + err?.message);
    }
  };

  const handleDelete = async (id: string, num: string) => {
    if (!confirm(`Deseja realmente excluir o voucher ${num}?`)) return;
    try {
      await deleteTravelVoucher({ data: { id } });
      toast.success('Voucher removido!');
      refetch();
    } catch (err: any) {
      toast.error('Erro ao remover: ' + err?.message);
    }
  };

  const handleDownloadPdf = async (v: any) => {
    setPreviewVoucher(v);
    setTimeout(async () => {
      try {
        await exportElementAsPdf('voucher-a4-canvas', `${v.voucher_number}.pdf`);
        toast.success('Voucher baixado em PDF!');
      } catch (err: any) {
        toast.error('Erro ao gerar PDF: ' + err?.message);
      }
    }, 300);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Central de Vouchers & Boarding Passes"
        description="Emissão e gerenciamento de cartões de embarque aéreo, vouchers de resorts e transfers com QR Code de verificação."
      >
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => handleQuickCreate('flight')}
            className="rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs gap-1.5 shadow-md h-10 px-4 cursor-pointer"
          >
            <Plane className="size-4" /> Emitir Voo
          </Button>
          <Button
            type="button"
            onClick={() => handleQuickCreate('hotel')}
            className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md h-10 px-4 cursor-pointer"
          >
            <Building2 className="size-4" /> Emitir Hotel
          </Button>
        </div>
      </PageHeader>

      {/* Barra de Busca & Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por passageiro ou nº do voucher..."
            className="h-10 pl-9 rounded-xl text-xs bg-muted/20"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedType('all')}
            className={'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ' + (
              selectedType === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/40 text-muted-foreground hover:text-foreground'
            )}
          >
            Todos ({vouchers.length})
          </button>
          {Object.entries(VOUCHER_TYPE_LABELS).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSelectedType(k)}
              className={'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ' + (
                selectedType === k
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/40 text-muted-foreground hover:text-foreground'
              )}
            >
              {label.split('/')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Vouchers */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">Carregando vouchers emitidos...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-3">
          <FileText className="size-8 text-muted-foreground mx-auto" />
          <p className="text-xs font-bold text-foreground">Nenhum voucher emitido ainda</p>
          <p className="text-xs text-muted-foreground">Emita vouchers para hotéis, passagens aéreas e receptivos para seus clientes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <div
              key={v.id}
              className="p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-muted-foreground font-bold">{v.voucher_number}</span>
                    <h3 className="text-sm font-bold text-foreground leading-tight">{v.passenger_name}</h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    {VOUCHER_TYPE_LABELS[v.voucher_type]?.split('/')[0] || v.voucher_type}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground font-medium">
                  {v.title}
                </p>

                {v.voucher_type === 'flight' && v.flight_data && (
                  <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/20 text-xs space-y-1">
                    <p className="font-bold text-sky-700 dark:text-sky-400">
                      {v.flight_data.airline || 'Cia Aérea'} ({v.flight_data.origin || 'ORIG'} ➔ {v.flight_data.destination || 'DEST'})
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                      <span>Voo: {v.flight_data.flightNumber || '-'}</span>
                      <span>Assento: {v.flight_data.seat || '-'}</span>
                    </div>
                  </div>
                )}

                {v.voucher_type === 'hotel' && v.hotel_data && (
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                    <p className="font-bold text-emerald-700 dark:text-emerald-400">
                      {v.hotel_data.hotelName || 'Hotel / Pousada'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {v.hotel_data.roomType || 'Quarto Standard'} · {v.hotel_data.boardBasis || 'Café da Manhã'}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-border/60 pt-3 flex items-center justify-between text-xs">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadPdf(v)}
                  className="rounded-xl h-8 px-3 text-xs font-bold gap-1.5"
                >
                  <Download className="size-3.5" /> Baixar PDF
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(v.id, v.voucher_number)}
                  className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden container for rendering voucher A4 to PDF */}
      {previewVoucher && (
        <div className="fixed left-[-9999px] top-0 pointer-events-none">
          <TemplateVoucherA4 voucher={previewVoucher} agencyName={store?.name} />
        </div>
      )}
    </div>
  );
}
