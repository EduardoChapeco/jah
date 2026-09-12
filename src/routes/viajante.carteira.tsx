import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
 Plane,
 Ticket,
 ShieldAlert,
 Hotel,
 QrCode,
 WalletCards,
 X,
 CheckCircle2,
 Calendar,
 Clock,
 ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { listClientWalletPasses } from '@/services/client-wallet.functions';
import type { ClientWalletPass, PassType } from '@/types/client-wallet';

export const Route = createFileRoute('/viajante/carteira')({
 component: ViajanteCarteiraPage,
});

function getPassConfig(type: PassType) {
 switch (type) {
 case 'boarding_pass':
 return { icon: Plane, label: 'Cartão de Embarque', bg: 'bg-gradient-to-br from-indigo-900 to-slate-950' };
 case 'insurance':
 return { icon: ShieldAlert, label: 'Seguro Viagem Internacional', bg: 'bg-gradient-to-br from-emerald-900 to-slate-950' };
 case 'ticket':
 return { icon: Ticket, label: 'Ingresso / Atrativo', bg: 'bg-gradient-to-br from-amber-900 to-slate-950' };
 default:
 return { icon: Hotel, label: 'Voucher de Hospedagem', bg: 'bg-gradient-to-br from-purple-900 to-slate-950' };
 }
}

export default function ViajanteCarteiraPage() {
  const [selectedPass, setSelectedPass] = useState<ClientWalletPass | null>(null);

  const { data: passes = [], isLoading } = useQuery({
    queryKey: ['client-wallet-passes'],
    queryFn: async () => {
      const res = await listClientWalletPasses({ data: {} });
      return res || [];
    },
  });

 return (
 <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 flex flex-col items-center justify-start p-4 sm:p-6">
 <div className="max-w-md w-full flex flex-col gap-4">
 {/* Header */}
 <div className="flex items-center justify-between pt-4 pb-2">
 <div>
 <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
 <WalletCards className="size-3.5" />
 Apple Wallet Experience
 </span>
 <h1 className="text-2xl font-black tracking-tight text-foreground mt-1">
 Carteira do Viajante
 </h1>
 <p className="text-xs text-muted-foreground">
 Bilhetes, vouchers e cartões prontos para embarque.
 </p>
 </div>

 <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
 {passes.length}
 </div>
 </div>

      {/* Stack of Cards (Apple Wallet Style) ou Empty State */}
      {passes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card">
          <Ticket className="size-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-bold text-foreground">Nenhum passe ou voucher na carteira</p>
          <p className="text-xs text-muted-foreground mt-1">Seus bilhetes, reservas e vouchers aparecerão aqui após a emissão.</p>
        </div>
      ) : (
        <div className="relative pt-6 pb-28" style={{ perspective: '1200px' }}>
          {passes.map((pass, index) => {
 const config = getPassConfig(pass.pass_type);
 const Icon = config.icon;
 const isSelected = selectedPass?.id === pass.id;
 const isHidden = selectedPass && !isSelected;

 if (isHidden) return null;

 return (
 <div
 key={pass.id}
 onClick={() => setSelectedPass(isSelected ? null : pass)}
 className={`
 w-full rounded-2xl p-6 text-white cursor-pointer shadow-2xl transition-all duration-500 ease-out border border-white/10
 ${config.bg}
 ${isSelected ? 'relative z-50 min-h-[520px]' : 'h-52 mb-[-115px] hover:-translate-y-4 hover:shadow-cyan-500/10'}
 `}
 style={{
 transform: !isSelected
 ? `translateY(${index * 8}px) scale(${1 - index * 0.03})`
 : 'none',
 zIndex: isSelected ? 50 : 40 - index,
 }}
 >
 <div className="flex justify-between items-start">
 <div className="flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
 <Icon className="size-3.5" />
 {config.label}
 </div>
 {isSelected && (
 <Button
 size="icon"
 variant="ghost"
 onClick={(e) => {
 e.stopPropagation();
 setSelectedPass(null);
 }}
 className="size-8 rounded-full bg-white/20 hover:bg-white/30 text-white"
 >
 <X className="size-4" />
 </Button>
 )}
 </div>

 <div className="mt-5">
 <h2 className="text-2xl font-black leading-tight tracking-tight">{pass.title}</h2>
 <p className="text-white/80 text-sm mt-1 font-medium">{pass.subtitle}</p>
 </div>

 {isSelected ? (
 <div className="mt-8 bg-white text-zinc-900 rounded-2xl p-6 flex flex-col items-center shadow-inner animate-in fade-in zoom-in-95 duration-300">
 <QrCode className="size-40 text-zinc-900" strokeWidth={1.5} />
 <div className="mt-4 text-center">
 <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
 Código de Embarque / Voucher
 </p>
 <p className="font-mono text-lg tracking-wider font-extrabold text-foreground mt-0.5">
 {pass.barcode_value}
 </p>
 </div>
 <div className="mt-5 w-full flex justify-between text-xs font-semibold border-t border-border/80 pt-3">
 <span className="text-muted-foreground">Status do Bilhete</span>
 <span className="text-emerald-600 flex items-center gap-1 font-bold uppercase">
 <CheckCircle2 className="size-3.5" />
 Pronto para Uso
 </span>
 </div>
 </div>
 ) : (
 <div className="absolute bottom-4 left-6 right-6 flex justify-between items-center text-[11px] text-white/60">
 <span>Toque para expandir bilhete</span>
 <span className="font-mono">{pass.barcode_value.slice(0, 10)}...</span>
 </div>
 )}
 </div>
 );
 })}
        </div>
      )}
    </div>
  </div>
 );
}
