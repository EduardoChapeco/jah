import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plane,
  Building2,
  Users,
  FileText,
  Ticket,
  Calendar,
  Phone,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Printer,
  Download,
  Luggage,
  Shield,
  Clock,
  Car,
  FileCheck2,
  Loader2,
  Compass,
} from "lucide-react";
import { WhatsappLogo } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getTripAggregate,
  saveConfirmationItem,
  type TripAggregateDTO,
  type TripConfirmationItemDTO,
} from "@/services/travel-lifecycle.functions";
import { VoucherBoardingCard } from "@/components/tourism/voucher-boarding-card";
import { exportElementAsPdf } from "@/lib/pdf-export";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/turismo/viagens/$id")({
  head: ({ loaderData }: any) => ({
    meta: [
      {
        title: loaderData?.aggregate?.trip
          ? `${loaderData.aggregate.trip.destination_city || "Viagem"} (${loaderData.aggregate.trip.trip_number}) | Workspace JAH Master OS`
          : "Detalhes da Viagem | Workspace JAH Master OS",
      },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const aggregate = await getTripAggregate({ data: { tripId: params.id } });
      return { aggregate };
    } catch {
      return { aggregate: null };
    }
  },
  component: WorkspaceTripDetailPage,
});

type ActiveTab = "overview" | "passengers" | "locators" | "contract" | "vouchers";

function WorkspaceTripDetailPage() {
  const { aggregate: initialAggregate } = Route.useLoaderData();
  const [aggregate, setAggregate] = useState<TripAggregateDTO | null>(initialAggregate);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [isCopied, setIsCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Modal de Adicionar Localizador
  const [isAddLocatorOpen, setIsAddLocatorOpen] = useState(false);
  const [locatorForm, setLocatorForm] = useState({
    itemType: "flight" as const,
    providerName: "",
    locatorCode: "",
    status: "confirmed" as const,
    serviceDate: "",
    notes: "",
  });

  if (!aggregate || !aggregate.trip) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="size-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
          <Compass className="size-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-foreground">Viagem não encontrada</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            A reserva solicitada não existe ou ainda não foi confirmada.
          </p>
        </div>
        <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-bold">
          <Link to="/workspace/turismo/viagens">Voltar para Viagens & Reservas</Link>
        </Button>
      </div>
    );
  }

  const trip = aggregate.trip;
  const store = aggregate.store;
  const mainVoucher = aggregate.vouchers[0];

  const origin = typeof window !== "undefined" ? window.location.origin : "https://jah.com.br";
  const voucherPublicUrl = mainVoucher ? `${origin}/voucher/${mainVoucher.public_token}` : "";
  const contractPublicUrl = aggregate.contract?.public_token
    ? `${origin}/contrato/${aggregate.contract.public_token}`
    : "";

  const handleCopyVoucherUrl = () => {
    if (!voucherPublicUrl) return;
    navigator.clipboard.writeText(voucherPublicUrl);
    setIsCopied(true);
    toast.success("Link do voucher copiado!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      await exportElementAsPdf(
        "voucher-printable-area",
        `Voucher_${trip.trip_number}_${trip.destination_city}.pdf`
      );
      toast.success("PDF gerado com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao gerar PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const saveLocatorMutation = useMutation({
    mutationFn: (data: typeof locatorForm) =>
      saveConfirmationItem({
        data: {
          tripId: trip.id,
          itemType: data.itemType,
          providerName: data.providerName,
          locatorCode: data.locatorCode,
          status: data.status,
          serviceDate: data.serviceDate || undefined,
          notes: data.notes || undefined,
        },
      }),
    onSuccess: (res) => {
      toast.success("Localizador cadastrado com sucesso!");
      setIsAddLocatorOpen(false);
      setLocatorForm({
        itemType: "flight",
        providerName: "",
        locatorCode: "",
        status: "confirmed",
        serviceDate: "",
        notes: "",
      });
      // Atualizar lista local
      const newItem: TripConfirmationItemDTO = {
        id: res.id,
        trip_id: trip.id,
        item_type: locatorForm.itemType,
        provider_name: locatorForm.providerName,
        locator_code: locatorForm.locatorCode,
        status: locatorForm.status,
        service_date: locatorForm.serviceDate || null,
        notes: locatorForm.notes || null,
      };
      setAggregate((prev) => ({
        ...prev,
        confirmationItems: [newItem, ...prev.confirmationItems],
      }));
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao salvar localizador");
    },
  });

  const cleanWhatsapp = (trip.client_whatsapp || "").replace(/\D/g, "");

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. CABEÇALHO DA VIAGEM ── */}
      <div className="flex flex-col gap-4 p-5 rounded-2xl bg-card border border-border/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button asChild size="sm" variant="ghost" className="size-8 p-0 rounded-xl">
              <Link to="/workspace/turismo/viagens">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-muted-foreground uppercase">
                  {trip.trip_number}
                </span>
                <Badge variant="outline" className="text-[10px] font-bold uppercase">
                  {trip.status}
                </Badge>
              </div>
              <h1 className="text-base font-bold text-foreground">
                {trip.destination_city || trip.title}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {voucherPublicUrl && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopyVoucherUrl}
                className="rounded-xl text-xs font-bold gap-1.5 h-9"
              >
                {isCopied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                <span>Copiar Voucher</span>
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isExportingPdf}
              onClick={handleExportPdf}
              className="rounded-xl text-xs font-bold gap-1.5 h-9"
            >
              {isExportingPdf ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              <span>Baixar PDF</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-foreground text-background hover:bg-foreground/90"
            >
              <Printer className="size-3.5" />
              <span>Imprimir A4</span>
            </Button>

            {cleanWhatsapp && (
              <Button
                asChild
                size="sm"
                className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <a
                  href={`https://wa.me/55${cleanWhatsapp}?text=Ol%C3%A1%20${encodeURIComponent(trip.client_name)}!%20Sua%20viagem%20para%20${encodeURIComponent(trip.destination_city)}%20est%C3%A1%20confirmada.%20Acesse%20seu%20voucher%20oficial%20no%20link:%20${encodeURIComponent(voucherPublicUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsappLogo className="size-4" weight="fill" />
                  <span>WhatsApp Cliente</span>
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Linha de Metadados Rápidos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/60 text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Cliente Titular</span>
            <span className="font-bold text-foreground">{trip.client_name}</span>
            {trip.client_whatsapp && (
              <span className="text-[11px] text-muted-foreground block font-mono">{trip.client_whatsapp}</span>
            )}
          </div>

          <div>
            <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Período da Viagem</span>
            <span className="font-bold text-foreground">
              {trip.travel_start_date || "—"} até {trip.travel_end_date || "—"}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Viajantes</span>
            <span className="font-bold text-foreground">
              {trip.adults_count || 1} Adulto(s) {trip.children_count > 0 && `• ${trip.children_count} Criança(s)`}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Valor Fechado</span>
            <span className="font-bold text-foreground font-mono text-sm">
              {formatMoney(trip.total_cents)}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. SELETOR DE ABAS DA VIAGEM ── */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-card border border-border/60 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "overview"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Compass className="size-3.5" />
          <span>Visão Geral & Roteiro</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("passengers")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "passengers"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="size-3.5" />
          <span>Passageiros ({aggregate.passengers.length || (trip.adults_count + trip.children_count)})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("locators")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "locators"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Plane className="size-3.5" />
          <span>Localizadores PNR ({aggregate.confirmationItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("contract")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "contract"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="size-3.5" />
          <span>Contrato Digital</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("vouchers")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "vouchers"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Ticket className="size-3.5" />
          <span>Central de Vouchers A4</span>
        </button>
      </div>

      {/* ── 3. CONTEÚDO DAS ABAS ── */}

      {/* ABA 1: VISÃO GERAL */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Voos */}
          {trip.flights && trip.flights.length > 0 && (
            <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <Plane className="size-4 text-primary" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Voos & Malha Aérea
                </h3>
              </div>

              <div className="space-y-2">
                {trip.flights.map((f: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-foreground">
                        {f.origin} ➔ {f.destination}
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        {f.airline || "Cia Aérea"} • Voo {f.flight_number || "—"} {f.date && `• ${f.date}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      {f.locator && (
                        <div className="bg-card px-2.5 py-1 rounded-lg border border-border/80">
                          <span className="text-[9px] text-muted-foreground block uppercase">PNR</span>
                          <span className="font-bold text-foreground">{f.locator}</span>
                        </div>
                      )}
                      {(f.departure_time || f.arrival_time) && (
                        <span>
                          {f.departure_time || "--:--"} - {f.arrival_time || "--:--"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hospedagens */}
          {trip.hotels && trip.hotels.length > 0 && (
            <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <Building2 className="size-4 text-primary" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Hospedagens & Resorts
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {trip.hotels.map((h: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-foreground">{h.name}</span>
                      {h.confirmation && (
                        <span className="font-mono text-[10px] bg-card px-2 py-0.5 rounded border border-border">
                          Loc: {h.confirmation}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
                      <span>Regime: <strong className="text-foreground">{h.meal_plan || "Café"}</strong></span>
                      <span>Quarto: <strong className="text-foreground">{h.room_type || "Standard"}</strong></span>
                      <span>Check-in: <strong className="text-foreground">{h.checkin || "—"}</strong></span>
                      <span>Check-out: <strong className="text-foreground">{h.checkout || "—"}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inclusões & Observações */}
          {(trip.includes?.length > 0 || trip.notes) && (
            <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3 text-xs">
              <h3 className="font-bold text-foreground uppercase tracking-wider text-xs">
                Inclusões & Orientações ao Viajante
              </h3>
              {trip.includes?.length > 0 && (
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  {trip.includes.map((inc: string, i: number) => (
                    <li key={i}>{inc}</li>
                  ))}
                </ul>
              )}
              {trip.notes && (
                <p className="p-3 rounded-xl bg-muted/30 border border-border/60 text-muted-foreground leading-relaxed">
                  {trip.notes}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: PASSAGEIROS & ROOMING LIST */}
      {activeTab === "passengers" && (
        <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Lista Oficial de Hóspedes & Passageiros
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Documentação necessária para emissão de passagens e check-in hoteleiro.
              </p>
            </div>
          </div>

          {aggregate.passengers.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Passageiro principal cadastrado: <strong className="text-foreground">{trip.client_name}</strong>
              {trip.client_document && ` (CPF: ${trip.client_document})`}
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {aggregate.passengers.map((pax) => (
                <div key={pax.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{pax.full_name}</span>
                      {pax.is_lead_passenger && (
                        <Badge variant="outline" className="text-[9px] font-bold text-primary border-primary/30">
                          Titular
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                      {pax.document && <span>Documento: {pax.document}</span>}
                      {pax.birth_date && <span>Nascimento: {pax.birth_date}</span>}
                      {pax.seat_number && <span>Assento: {pax.seat_number}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 3: LOCALIZADORES PNR */}
      {activeTab === "locators" && (
        <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Localizadores & Confirmações de Fornecedores
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Códigos PNR de companhias aéreas, reservas de hotéis, apólices de seguros e transfers.
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => setIsAddLocatorOpen(true)}
              className="rounded-xl text-xs font-bold gap-1.5 h-8.5"
            >
              <Plus className="size-3.5" />
              <span>Novo Localizador</span>
            </Button>
          </div>

          {aggregate.confirmationItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
              <Plane className="size-8 mx-auto text-muted-foreground/50" />
              <p>Nenhum localizador específico cadastrado ainda.</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsAddLocatorOpen(true)}
                className="rounded-xl text-xs font-bold"
              >
                Cadastrar Primeiro Localizador
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {aggregate.confirmationItems.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{item.provider_name}</span>
                      <Badge variant="outline" className="text-[9px] uppercase font-mono">
                        {item.item_type}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-500/30 font-bold uppercase">
                        {item.status}
                      </Badge>
                    </div>
                    {item.notes && <p className="text-[11px] text-muted-foreground">{item.notes}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="bg-muted/40 px-3 py-1.5 rounded-xl border border-border/60 font-mono font-bold text-sm text-foreground">
                      {item.locator_code}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(item.locator_code);
                        toast.success(`Localizador ${item.locator_code} copiado!`);
                      }}
                      className="size-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 4: CONTRATO DIGITAL */}
      {activeTab === "contract" && (
        <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/60">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Contrato Digital de Viagem
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Documento jurídico vinculado com assinatura eletrônica e fé pública.
              </p>
            </div>

            {contractPublicUrl && (
              <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1.5 h-8.5">
                <a href={contractPublicUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" />
                  <span>Página de Assinatura</span>
                </a>
              </Button>
            )}
          </div>

          {aggregate.contract ? (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-foreground">{aggregate.contract.contract_title}</h4>
                  <span className="text-[11px] text-muted-foreground">
                    Contratante: {aggregate.contract.client_name} • CPF: {aggregate.contract.client_document}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-bold uppercase ${
                    aggregate.contract.status === "signed"
                      ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
                      : "text-amber-600 border-amber-500/30 bg-amber-500/10"
                  }`}
                >
                  {aggregate.contract.status === "signed" ? "Assinado" : "Pendente de Assinatura"}
                </Badge>
              </div>

              <div className="p-3.5 rounded-xl border border-border/60 bg-card space-y-2">
                <span className="font-bold text-foreground block">Cláusulas e Condições Gerais:</span>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  {aggregate.contract.package_summary}
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-bold">
                    <Link to="/workspace/turismo/contratos">Abrir Central de Contratos</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
              <FileCheck2 className="size-8 mx-auto text-muted-foreground/50" />
              <p>Nenhum contrato digital foi gerado automaticamente.</p>
              <Button asChild size="sm" className="rounded-xl text-xs font-bold">
                <Link to="/workspace/turismo/contratos">Emitir Novo Contrato</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ABA 5: CENTRAL DE VOUCHERS */}
      {activeTab === "vouchers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 p-4 rounded-2xl bg-card border border-border/80">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Voucher Oficial de Embarque (Padrão A4)
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Documento de apresentação com código de autenticidade e QR Code para embarque.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isExportingPdf}
                onClick={handleExportPdf}
                className="rounded-xl text-xs font-bold gap-1.5 h-8.5"
              >
                {isExportingPdf ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                <span>Baixar PDF</span>
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handlePrint}
                className="rounded-xl text-xs font-bold gap-1.5 h-8.5 bg-foreground text-background hover:bg-foreground/90"
              >
                <Printer className="size-3.5" />
                <span>Imprimir Voucher</span>
              </Button>
            </div>
          </div>

          {mainVoucher ? (
            <VoucherBoardingCard
              voucher={mainVoucher}
              tripNumber={trip.trip_number}
              agency={{
                name: store.name,
                logo_url: store.logo_url,
                whatsapp_phone: store.whatsapp_phone,
              }}
            />
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Nenhum voucher registrado para esta viagem.
            </div>
          )}
        </div>
      )}

      {/* ── MODAL DE ADICIONAR LOCALIZADOR ── */}
      <Dialog open={isAddLocatorOpen} onOpenChange={setIsAddLocatorOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Adicionar Localizador / PNR</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre o código de confirmação da companhia aérea, hotel ou operadora.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tipo de Serviço</Label>
              <Select
                value={locatorForm.itemType}
                onValueChange={(val: any) => setLocatorForm((prev) => ({ ...prev, itemType: val }))}
              >
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="flight">Voo / Companhia Aérea</SelectItem>
                  <SelectItem value="hotel">Hospedagem / Hotel</SelectItem>
                  <SelectItem value="transfer">Transfer / Receptivo</SelectItem>
                  <SelectItem value="tour">Passeio / Ingresso</SelectItem>
                  <SelectItem value="insurance">Seguro Viagem</SelectItem>
                  <SelectItem value="cruise">Cruzeiro Marítimo</SelectItem>
                  <SelectItem value="other">Outro Fornecedor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nome do Fornecedor / Cia *</Label>
              <Input
                value={locatorForm.providerName}
                onChange={(e) => setLocatorForm((prev) => ({ ...prev, providerName: e.target.value }))}
                placeholder="Ex: LATAM, Gol, CVC, Hotel Fasano"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Código Localizador / Reserva *</Label>
              <Input
                value={locatorForm.locatorCode}
                onChange={(e) => setLocatorForm((prev) => ({ ...prev, locatorCode: e.target.value.toUpperCase() }))}
                placeholder="Ex: AB34XY ou 982341"
                className="h-9 text-xs font-mono rounded-xl uppercase tracking-wider"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Observações / Detalhes</Label>
              <Input
                value={locatorForm.notes}
                onChange={(e) => setLocatorForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Ex: Voo JJ3451 ou Quarto Vista Mar"
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddLocatorOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saveLocatorMutation.isPending || !locatorForm.providerName || !locatorForm.locatorCode}
              onClick={() => saveLocatorMutation.mutate(locatorForm)}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              {saveLocatorMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              <span>Salvar Localizador</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
