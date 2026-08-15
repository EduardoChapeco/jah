import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Car,
  Bike,
  Zap,
  Truck,
  Boxes,
  MapPin,
  Clock,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  Users,
  Package,
  Loader2,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import {
  calculateMobilityQuote,
  createMobilityRequest,
  type MobilityServiceType,
  type MobilityQuoteEstimate,
  type MobilityRequestDTO,
} from "@/services/mobility.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/mobilidade")({
  head: () => ({
    meta: [
      { title: "Mobilidade, Entregas & Mudanças — JAH" },
      {
        name: "description",
        content:
          "Chame motoristas de carro ou moto, entregas expressas ou fretes e mudanças completas na sua cidade com tarifas transparentes.",
      },
    ],
  }),
  component: MobilityOrderWizardPage,
});

const SERVICE_MODALS: Array<{
  type: MobilityServiceType;
  title: string;
  subtitle: string;
  icon: typeof Car;
  badge: string;
}> = [
  {
    type: "delivery_express",
    title: "Entrega Flash",
    subtitle: "Documentos, pacotes e compras urgentes em minutos",
    icon: Zap,
    badge: "Mais Rápido",
  },
  {
    type: "ride_moto",
    title: "Moto Passageiro",
    subtitle: "Deslocamento econômico e ágil para 1 pessoa",
    icon: Bike,
    badge: "Econômico",
  },
  {
    type: "ride_car",
    title: "Carro Privado",
    subtitle: "Transporte confortável para até 4 passageiros",
    icon: Car,
    badge: "Conforto",
  },
  {
    type: "freight_van",
    title: "Fiorino / Van",
    subtitle: "Eletrodomésticos, caixas médias e cargas comerciais",
    icon: Truck,
    badge: "Cargas Médias",
  },
  {
    type: "moving_truck",
    title: "Caminhão de Mudança",
    subtitle: "Mudanças completas residenciais ou comerciais",
    icon: Boxes,
    badge: "Grande Porte",
  },
];

function MobilityOrderWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [serviceType, setServiceType] = useState<MobilityServiceType>("delivery_express");
  const [originAddress, setOriginAddress] = useState("");
  const [originInstructions, setOriginInstructions] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [destinationInstructions, setDestinationInstructions] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [packageDescription, setPackageDescription] = useState("");
  const [helpersCount, setHelpersCount] = useState(0);
  const [needsPacking, setNeedsPacking] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cash" | "card">("pix");

  // Estimates & Created Request
  const [estimates, setEstimates] = useState<MobilityQuoteEstimate[]>([]);
  const [createdRequest, setCreatedRequest] = useState<MobilityRequestDTO | null>(null);

  // Quote Calculation Mutation
  const quoteMutation = useMutation({
    mutationFn: () =>
      calculateMobilityQuote({
        data: {
          origin_address: originAddress,
          destination_address: destinationAddress,
          distance_km: 4.8,
          helpers_count: helpersCount,
        },
      }),
    onSuccess: (data) => {
      setEstimates(data);
      setStep(2);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao calcular cotação.");
    },
  });

  // Request Creation Mutation
  const createMutation = useMutation({
    mutationFn: () => {
      const selectedEstimate = estimates.find((e) => e.service_type === serviceType);
      const priceCents = selectedEstimate ? selectedEstimate.estimated_price_cents : 1500;

      return createMobilityRequest({
        data: {
          customer_name: customerName,
          customer_phone: customerPhone,
          service_type: serviceType,
          origin_address: originAddress,
          origin_instructions: originInstructions || undefined,
          destination_address: destinationAddress,
          destination_instructions: destinationInstructions || undefined,
          distance_km: 4.8,
          package_description: packageDescription || undefined,
          helpers_count: helpersCount,
          needs_packing: needsPacking,
          scheduled_for: scheduledFor || undefined,
          estimated_price_cents: priceCents,
          payment_method: paymentMethod,
        },
      });
    },
    onSuccess: (data) => {
      setCreatedRequest(data);
      setStep(4);
      toast.success("Chamado enviado aos motoristas da comunidade!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao solicitar chamado.");
    },
  });

  const handleProceedToQuotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!originAddress.trim() || !destinationAddress.trim()) {
      toast.error("Informe o endereço de origem e destino.");
      return;
    }
    quoteMutation.mutate();
  };

  const handleProceedToConfirmation = () => {
    setStep(3);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Informe seu nome e WhatsApp de contato.");
      return;
    }
    createMutation.mutate();
  };

  const selectedModalInfo = SERVICE_MODALS.find((m) => m.type === serviceType);
  const selectedEstimate = estimates.find((e) => e.service_type === serviceType);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-24">
      {/* ── Header ── */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
          <Sparkles className="size-3.5" />
          <span>Mobilidade & Logística Comunitária</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          Chamar Corrida, Entrega ou Mudança
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
          Conecte-se com motoristas e empresas de logística locais com tarifas justas, rastreamento
          e sem taxas abusivas.
        </p>
      </div>

      {/* ── Stepper Navigation ── */}
      <div className="flex items-center justify-center gap-3 text-xs font-bold">
        <span
          className={`px-3 py-1 rounded-full transition-all ${
            step === 1
              ? "bg-primary text-primary-foreground font-black shadow-xs"
              : "bg-muted text-muted-foreground"
          }`}
        >
          1. Rota & Carga
        </span>
        <span className="text-muted-foreground/40">➔</span>
        <span
          className={`px-3 py-1 rounded-full transition-all ${
            step === 2
              ? "bg-primary text-primary-foreground font-black shadow-xs"
              : "bg-muted text-muted-foreground"
          }`}
        >
          2. Modal & Preço
        </span>
        <span className="text-muted-foreground/40">➔</span>
        <span
          className={`px-3 py-1 rounded-full transition-all ${
            step === 3
              ? "bg-primary text-primary-foreground font-black shadow-xs"
              : "bg-muted text-muted-foreground"
          }`}
        >
          3. Pagamento
        </span>
        <span className="text-muted-foreground/40">➔</span>
        <span
          className={`px-3 py-1 rounded-full transition-all ${
            step === 4
              ? "bg-primary text-primary-foreground font-black shadow-xs"
              : "bg-muted text-muted-foreground"
          }`}
        >
          4. Rastreamento
        </span>
      </div>

      {/* ── STEP 1: Rota e Dados da Viagem ── */}
      {step === 1 && (
        <form
          onSubmit={handleProceedToQuotes}
          className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6"
        >
          <div className="space-y-4">
            <h2 className="text-base font-black text-foreground flex items-center gap-2">
              <MapPin className="size-4 text-primary" />
              <span>Onde vamos buscar e entregar?</span>
            </h2>

            {/* Origem */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Endereço de Origem (Partida / Coleta)
              </Label>
              <Input
                placeholder="Ex: Av. Getúlio Vargas, 500 — Centro"
                value={originAddress}
                onChange={(e) => setOriginAddress(e.target.value)}
                className="h-11 rounded-2xl text-xs bg-card"
                required
              />
            </div>

            {/* Destino */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Endereço de Destino (Chegada / Entrega)
              </Label>
              <Input
                placeholder="Ex: Rua Marechal Deodoro, 1200 — São Cristóvão"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                className="h-11 rounded-2xl text-xs bg-card"
                required
              />
            </div>
          </div>

          {/* Agendamento Opcional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/60">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                <span>Horário do Chamado</span>
              </Label>
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="h-11 rounded-2xl text-xs bg-card"
              />
              <p className="text-[10px] text-muted-foreground">
                Deixe em branco para chamar imediatamente (Agora).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="size-3.5" />
                <span>Ajudantes para Mudança / Carga</span>
              </Label>
              <select
                value={helpersCount}
                onChange={(e) => setHelpersCount(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-2xl border border-border bg-card text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={0}>Sem ajudante (apenas o motorista)</option>
                <option value={1}>1 Ajudante (+ R$ 50,00)</option>
                <option value={2}>2 Ajudantes (+ R$ 100,00)</option>
                <option value={3}>3 Ajudantes (+ R$ 150,00)</option>
              </select>
            </div>
          </div>

          {/* Botão de Cotação */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={quoteMutation.isPending}
              className="h-12 px-8 rounded-2xl font-bold text-xs bg-primary text-primary-foreground shadow-sm hover:scale-105 active:scale-95 transition-all gap-2"
            >
              {quoteMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1" />
                  <span>Calculando Melhores Rotas...</span>
                </>
              ) : (
                <>
                  <span>Ver Opções e Preços</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* ── STEP 2: Seleção de Modal e Cotação Instantânea ── */}
      {step === 2 && (
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-black text-foreground">Escolha a Opção Ideal</h2>
            <p className="text-xs text-muted-foreground">
              Estimativa baseada no trajeto de ~4.8 km entre origem e destino.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SERVICE_MODALS.map((m) => {
              const Icon = m.icon;
              const isSelected = serviceType === m.type;
              const estimate = estimates.find((e) => e.service_type === m.type);
              const priceCents = estimate ? estimate.estimated_price_cents : 1500;

              return (
                <div
                  key={m.type}
                  onClick={() => setServiceType(m.type)}
                  className={`flex flex-col justify-between p-5 rounded-3xl border transition-all cursor-pointer select-none space-y-3 ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs scale-[1.02]"
                      : "border-border/80 bg-card hover:bg-muted/30 hover:border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-11 rounded-2xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-foreground leading-tight">
                          {m.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {m.subtitle}
                        </p>
                      </div>
                    </div>

                    <Badge variant="outline" className="text-[10px] uppercase font-mono shrink-0">
                      {m.badge}
                    </Badge>
                  </div>

                  <div className="flex items-baseline justify-between pt-2 border-t border-border/40">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      ~15 min estimado
                    </span>
                    <span className="text-base font-black text-foreground font-mono">
                      {formatMoney(priceCents)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="h-11 rounded-2xl text-xs"
            >
              Voltar ao Endereço
            </Button>

            <Button
              type="button"
              onClick={handleProceedToConfirmation}
              className="h-11 px-6 rounded-2xl font-bold text-xs bg-primary text-primary-foreground gap-2"
            >
              <span>Continuar para Identificação</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Dados de Contato e Pagamento ── */}
      {step === 3 && (
        <form
          onSubmit={handleFinalSubmit}
          className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6"
        >
          <div className="space-y-1">
            <h2 className="text-base font-black text-foreground">Identificação e Pagamento</h2>
            <p className="text-xs text-muted-foreground">
              O motorista entrará em contato com você diretamente pelo WhatsApp no momento da coleta.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Seu Nome Completo
              </Label>
              <Input
                placeholder="Ex: João da Silva"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-11 rounded-2xl text-xs bg-card"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                WhatsApp de Contato
              </Label>
              <Input
                placeholder="Ex: (49) 99881-2233"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-11 rounded-2xl text-xs bg-card"
                required
              />
            </div>
          </div>

          {/* Descrição do pacote se for entrega */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Observações da Carga / Instruções para o Motorista
            </Label>
            <Input
              placeholder="Ex: Tocar interfone 402; Cuidado com caixa de vidro; Entregar na portaria"
              value={packageDescription}
              onChange={(e) => setPackageDescription(e.target.value)}
              className="h-11 rounded-2xl text-xs bg-card"
            />
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-2 pt-2 border-t border-border/60">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Forma de Pagamento
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("pix")}
                className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all ${
                  paymentMethod === "pix"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                Pix Direto
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all ${
                  paymentMethod === "card"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                Cartão (Máquina)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all ${
                  paymentMethod === "cash"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                Dinheiro
              </button>
            </div>
          </div>

          {/* Resumo da Cotação */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-foreground">Total Estimado</span>
              <p className="text-[11px] text-muted-foreground">
                {selectedModalInfo?.title} • {helpersCount > 0 ? `${helpersCount} ajudante(s)` : "Sem ajudante"}
              </p>
            </div>
            <span className="text-lg font-black text-foreground font-mono">
              {formatMoney(selectedEstimate ? selectedEstimate.estimated_price_cents : 1500)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              className="h-11 rounded-2xl text-xs"
            >
              Voltar aos Modais
            </Button>

            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="h-11 px-8 rounded-2xl font-bold text-xs bg-primary text-primary-foreground shadow-sm"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  <span>Enviando Chamado...</span>
                </>
              ) : (
                "Confirmar e Chamar Motorista"
              )}
            </Button>
          </div>
        </form>
      )}

      {/* ── STEP 4: Confirmação & Rastreamento em Tempo Real ── */}
      {step === 4 && createdRequest && (
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs text-center space-y-6">
          <div className="size-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xs">
            <CheckCircle2 className="size-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              Chamado Enviado com Sucesso!
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              Os motoristas e frotas da comunidade já receberam a sua solicitação e o mais próximo
              aceitará seu chamado em instantes.
            </p>
          </div>

          {/* Card com Detalhes da Solicitação */}
          <div className="max-w-md mx-auto p-5 rounded-2xl bg-muted/40 border border-border/60 text-left space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="font-mono text-[10px] text-muted-foreground">ID DO CHAMADO</span>
              <span className="font-mono font-bold text-primary">
                {createdRequest.magic_token || createdRequest.id.substring(0, 8)}
              </span>
            </div>

            <div>
              <span className="font-bold text-muted-foreground">Origem:</span>
              <p className="text-foreground">{createdRequest.origin_address}</p>
            </div>

            <div>
              <span className="font-bold text-muted-foreground">Destino:</span>
              <p className="text-foreground">{createdRequest.destination_address}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <span className="font-bold text-muted-foreground">Valor Acordado:</span>
              <span className="font-mono font-black text-base text-foreground">
                {formatMoney(createdRequest.estimated_price_cents)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              asChild
              className="w-full sm:w-auto h-11 px-6 rounded-2xl font-bold text-xs bg-primary text-primary-foreground"
            >
              <Link to="/conta/mobilidade">
                <span>Ver Minhas Corridas & Mudanças</span>
                <ArrowRight className="size-4 ml-1.5" />
              </Link>
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setStep(1);
                setCreatedRequest(null);
              }}
              className="w-full sm:w-auto h-11 rounded-2xl text-xs"
            >
              Fazer Outro Chamado
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
