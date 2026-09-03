import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  KeyRound,
  QrCode,
  MapPin,
  Phone,
  User,
  Plus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  listStorePudoPackages,
  checkInPudoPackage,
  deliverPudoPackageToCustomer,
  reportPackageDamageAndReturn,
  type PudoPackageDTO,
} from "@/services/pudo.functions";

export const Route = createFileRoute("/workspace/logistica/pudo")({
  head: () => ({ meta: [{ title: "Ponto de Retirada (PUDO) & Logística Reversa | Workspace" }] }),
  loader: async () => {
    const packages = await listStorePudoPackages().catch(() => []);
    const safePackages = packages || [];
    return { packages: safePackages, defaultLocationId: safePackages[0]?.pudo_location_id ?? null };
  },
  component: WorkspacePudoLogisticsPage,
});

function WorkspacePudoLogisticsPage() {
  const { packages: initialData, defaultLocationId } = Route.useLoaderData();
  const router = useRouter();
  const [packages, setPackages] = useState<PudoPackageDTO[]>(initialData);
  const [statusTab, setStatusTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Balcão de Retirada Rápida
  const [quickPickupCode, setQuickPickupCode] = useState("");

  // Modal: Entrada de Pacote
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [senderName, setSenderName] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  // Modal: Registrar Avaria / Logística Reversa
  const [damageModalPkg, setDamageModalPkg] = useState<PudoPackageDTO | null>(null);
  const [damageNotes, setDamageNotes] = useState("");

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        pkg.tracking_code.toLowerCase().includes(q) ||
        pkg.recipient_name.toLowerCase().includes(q) ||
        pkg.recipient_phone.toLowerCase().includes(q);

      let matchesTab = true;
      if (statusTab === "ready") matchesTab = pkg.status === "ready_for_pickup";
      else if (statusTab === "delivered") matchesTab = pkg.status === "delivered_to_customer";
      else if (statusTab === "returns")
        matchesTab = pkg.status === "return_requested" || pkg.status === "returned_to_hub";

      return matchesSearch && matchesTab;
    });
  }, [packages, searchQuery, statusTab]);

  const handleQuickPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPickupCode.trim()) {
      toast.error("Digite o código de 4 dígitos fornecido pelo cliente.");
      return;
    }

    const matchedPkg = packages.find(
      (p) =>
        p.security_pickup_code === quickPickupCode.trim() && p.status === "ready_for_pickup",
    );

    if (!matchedPkg) {
      toast.error("Nenhum pacote aguardando retirada com este código de segurança.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await deliverPudoPackageToCustomer({
        data: {
          packageId: matchedPkg.id,
          pickupCodeEntered: quickPickupCode.trim(),
        },
      });

      setPackages((prev) =>
        prev.map((p) =>
          p.id === matchedPkg.id ? { ...p, status: "delivered_to_customer" } : p,
        ),
      );

      toast.success(res.message);
      setQuickPickupCode("");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao confirmar entrega do pacote.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckInPackage = async () => {
    if (!trackingCode.trim() || !senderName.trim() || !recipientName.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setIsProcessing(true);
    try {
      const locationId =
        packages[0]?.pudo_location_id || defaultLocationId;

      if (!locationId) {
        toast.error("Nenhum ponto PUDO configurado para esta loja. Configure em Configurações de Logística.");
        setIsProcessing(false);
        return;
      }

      const res = await checkInPudoPackage({
        data: {
          trackingCode: trackingCode.trim(),
          locationId,
          senderName: senderName.trim(),
          recipientName: recipientName.trim(),
          recipientPhone: recipientPhone.trim() || "49999000000",
        },
      });

      toast.success(`Pacote recebido! Código de retirada gerado: ${res.securityPickupCode}`);
      setIsCheckInModalOpen(false);
      setTrackingCode("");
      setSenderName("");
      setRecipientName("");
      setRecipientPhone("");
      router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao registrar entrada do pacote.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReportDamage = async () => {
    if (!damageModalPkg || !damageNotes.trim()) {
      toast.error("Descreva o motivo da avaria ou devolução.");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await reportPackageDamageAndReturn({
        data: {
          packageId: damageModalPkg.id,
          damageNotes: damageNotes.trim(),
        },
      });

      setPackages((prev) =>
        prev.map((p) =>
          p.id === damageModalPkg.id
            ? { ...p, status: "return_requested", has_damage: true, damage_notes: damageNotes }
            : p,
        ),
      );

      toast.success(res.message);
      setDamageModalPkg(null);
      setDamageNotes("");
    } catch {
      toast.error("Erro ao solicitar logística reversa.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          eyebrow="Logística"
          title="Ponto de Retirada (PUDO)"
        />

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsCheckInModalOpen(true)}
            className="rounded-xl font-bold bg-primary text-primary-foreground text-xs gap-1.5"
          >
            <Plus className="size-4" />
            <span>Receber Novo Pacote</span>
          </Button>
          <Button asChild variant="outline" className="rounded-xl font-bold text-xs">
            <Link to="/workspace">Voltar</Link>
          </Button>
        </div>
      </div>

      {/* Balcão de Retirada Rápida com Validação de Token */}
      <div className="p-6 rounded-2xl border border-border/60 bg-card space-y-4">
        <div className="flex items-center gap-2 text-primary font-black text-sm uppercase tracking-wider">
          <KeyRound className="size-4" />
          <span>Balcão de Entrega ao Cliente</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Solicite ao cliente o código de segurança de 4 dígitos enviado no WhatsApp ou comprovante do app.
        </p>

        <form onSubmit={handleQuickPickup} className="flex flex-col sm:flex-row gap-2 max-w-lg">
          <Input
            placeholder="Digite o código de 4 dígitos (Ex: 8492)..."
            value={quickPickupCode}
            onChange={(e) => setQuickPickupCode(e.target.value)}
            className="h-10 text-sm font-mono font-bold tracking-widest text-center bg-card rounded-xl"
            maxLength={6}
          />
          <Button
            type="submit"
            disabled={isProcessing}
            className="h-10 px-6 rounded-xl font-black bg-primary text-primary-foreground text-xs shrink-0"
          >
            Validar & Entregar Pacote
          </Button>
        </form>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all", label: "Todos", count: packages.length },
            {
              id: "ready",
              label: "Aguardando Retirada",
              count: packages.filter((p) => p.status === "ready_for_pickup").length,
            },
            {
              id: "delivered",
              label: "Entregues",
              count: packages.filter((p) => p.status === "delivered_to_customer").length,
            },
            {
              id: "returns",
              label: "Devoluções / Avarias",
              count: packages.filter((p) => p.has_damage || p.status === "return_requested").length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                statusTab === tab.id
                  ? "bg-foreground text-background "
                  : "bg-card  text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{tab.label}</span>
              <span className="opacity-70 text-[10px]">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por rastreio, cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 rounded-xl text-xs bg-card"
          />
        </div>
      </div>

      {/* Lista de Pacotes */}
      {filteredPackages.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border-0 bg-card/60 space-y-2">
          <Package className="size-10 text-muted-foreground/40 mx-auto" />
          <h3 className="text-base font-bold text-foreground">Nenhum pacote no momento</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Pacotes enviados para retirada no seu estabelecimento aparecerão organizados aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="p-5 rounded-3xl  bg-card  space-y-4 flex flex-col justify-between hover:border-primary/40 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                      Rastreio: {pkg.tracking_code}
                    </span>
                    <h4 className="text-base font-black text-foreground mt-0.5">
                      {pkg.recipient_name}
                    </h4>
                  </div>

                  <Badge
                    variant={
                      pkg.status === "delivered_to_customer"
                        ? "success"
                        : pkg.status === "ready_for_pickup"
                          ? "info"
                          : pkg.has_damage
                            ? "destructive"
                            : "secondary"
                    }
                    className="text-[10px] font-bold shrink-0"
                  >
                    {pkg.status === "delivered_to_customer"
                      ? "Entregue ✓"
                      : pkg.status === "ready_for_pickup"
                        ? "Pronto p/ Retirada"
                        : pkg.status === "return_requested"
                          ? "Devolução Solicitada"
                          : "Em Trânsito"}
                  </Badge>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="size-3.5" />
                    <span>Remetente: {pkg.sender_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    <span>Contato: {pkg.recipient_phone}</span>
                  </div>
                </div>

                {/* Código de Retirada Seguro */}
                <div className="p-3 rounded-2xl bg-muted/40  flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Código de Segurança
                    </span>
                    <p className="text-sm font-mono font-black text-foreground tracking-wider">
                      {pkg.security_pickup_code}
                    </p>
                  </div>
                  <ShieldCheck className="size-5 text-primary" />
                </div>

                {pkg.damage_notes && (
                  <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-xl border border-destructive/20 font-medium">
                    Avaria relatada: {pkg.damage_notes}
                  </p>
                )}
              </div>

              {/* Ações */}
              <div className="pt-3  flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground">
                  Recebido: {new Date(pkg.created_at).toLocaleDateString("pt-BR")}
                </span>

                {pkg.status === "ready_for_pickup" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDamageModalPkg(pkg);
                      setDamageNotes("");
                    }}
                    className="rounded-xl text-xs font-bold gap-1 text-destructive hover:bg-destructive/10 h-8"
                  >
                    <RotateCcw className="size-3" />
                    <span>Avaria / Reversa</span>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Receber Novo Pacote */}
      <Dialog open={isCheckInModalOpen} onOpenChange={setIsCheckInModalOpen}>
        <DialogContent className="sm:max-w-md sm:p-6 sm:rounded-3xl bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">Registrar Entrada de Pacote</DialogTitle>
            <DialogDescription className="text-xs">
              Dê entrada em um volume recebido para retirada no seu estabelecimento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Código de Rastreio / Etiqueta</Label>
              <Input
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Ex: WDR-PUDO-99123"
                className="rounded-xl text-xs font-mono uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Empresa Remetente</Label>
              <Input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Ex: Magazine Oeste, Loja Alpha..."
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Nome do Destinatário</Label>
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nome completo"
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Telefone (WhatsApp)</Label>
                <Input
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="(49) 99999-0000"
                  className="rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsCheckInModalOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCheckInPackage}
              disabled={isProcessing}
              className="rounded-xl font-bold bg-primary text-primary-foreground"
            >
              Salvar Entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Relatar Avaria & Devolução Reversa */}
      <Dialog open={!!damageModalPkg} onOpenChange={(open) => !open && setDamageModalPkg(null)}>
        <DialogContent className="sm:max-w-md sm:p-6 sm:rounded-3xl bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-destructive">
              Solicitar Logística Reversa & Avaria
            </DialogTitle>
            <DialogDescription className="text-xs">
              Relate o problema detectado na embalagem ou solicitação de devolução para devolução ao remetente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Descrição da Avaria / Motivo</Label>
              <Textarea
                value={damageNotes}
                onChange={(e) => setDamageNotes(e.target.value)}
                placeholder="Ex: Embalagem violada na lateral, pacote molhado ou cliente não retirou em 7 dias."
                className="rounded-xl text-xs"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDamageModalPkg(null)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReportDamage}
              disabled={isProcessing}
              className="rounded-xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Logística Reversa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
