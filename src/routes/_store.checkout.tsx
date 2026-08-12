import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import {
  getCart,
  getGlobalCarts,
  cancelCart,
  updateCartShipping,
  applyCouponToCart,
  updateCartContact,
} from "@/services/cart.functions";
import { checkGiftCardBalance } from "@/services/giftcard.functions";
import { processCheckout } from "@/services/checkout.functions";
import {
  initiatePaymentTransaction,
  getPublicPaymentMethods,
  getGatewayStatus,
} from "@/services/payment.functions";
import { calculateShipping } from "@/services/shipping.functions";
import { getPublicStoreProfile } from "@/services/catalog.functions";
import { getProfile } from "@/services/auth.functions";
import { getCustomerAddresses } from "@/services/customer.functions";
import {
  CheckCircle2,
  Ticket,
  MessageCircle,
  User,
  Truck,
  CreditCard,
  ShoppingBag,
  AlertCircle,
  MapPin,
  Loader2,
  Gift,
  QrCode,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Surface } from "@/components/ui/surface";
export const Route = createFileRoute("/_store/checkout")({
  head: () => ({ meta: [{ title: "Checkout" }] }),
  validateSearch: (search: Record<string, unknown>): { store?: string } => {
    return {
      store: (search.store as string) || undefined,
    };
  },
  loaderDeps: ({ search: { store } }) => ({ store }),
  loader: async ({ deps: { store } }) => {
    const [
      cart,
      globalCarts,
      profileRes,
      paymentMethodsRes,
      gatewayStatus,
      userProfile,
      userAddresses,
    ] = await Promise.all([
      getCart(),
      getGlobalCarts().catch(() => []),
      getPublicStoreProfile(store ? { data: { storeId: store } } : undefined),
      getPublicPaymentMethods(store ? { data: { storeId: store } } : undefined),
      getGatewayStatus(store ? { data: { storeId: store } } : undefined),
      getProfile().catch(() => null),
      getCustomerAddresses().catch(() => []),
    ]);

    return {
      initialCart: cart || {
        id: "",
        items: [],
        totalCents: 0,
        subtotalCents: 0,
        discountCents: 0,
        shippingCents: 0,
        shippingMethod: "",
        couponCode: null,
        itemCount: 0,
      },
      globalCarts,
      storeProfile: profileRes || null,
      paymentMethods: paymentMethodsRes || [],
      isGatewayConfigured: gatewayStatus || false,
      userProfile: userProfile || null,
      userAddresses: userAddresses || [],
    };
  },
  component: CheckoutPage,
});

interface ManualPaymentOption {
  id: string;
  name: string;
  instructions: string;
  surcharge_percentage: number;
  discount_percentage: number;
}

function CheckoutPage() {
  const {
    initialCart,
    globalCarts,
    storeProfile,
    paymentMethods,
    userProfile,
    userAddresses,
    isGatewayConfigured,
  } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();

  const [cart, setCart] = useState(initialCart);
  const [activeStep, setActiveStep] = useState(1); // 1: Identificação, 2: Entrega, 3: Pagamento, 4: Confirmar
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToken, setSuccessToken] = useState("");

  // Credit card & installment states
  const [selectedInstallment, setSelectedInstallment] = useState<number>(1);
  const [creditCardData, setCreditCardData] = useState({
    number: "",
    holderName: "",
    expiryDate: "",
    cvv: "",
  });

  // Address inputs & calculations
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [noShippingRatesFound, setNoShippingRatesFound] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);

  // Promo & Gift Card code states
  const [promoCode, setPromoCode] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [appliedGiftCard, setAppliedGiftCard] = useState<{
    code: string;
    balanceCents: number;
  } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerDocument: "",
    addressZipcode: "",
    addressStreet: "",
    addressNumber: "",
    addressComplement: "",
    addressDistrict: "",
    addressCity: "",
    addressState: "",
    paymentMethod: (isGatewayConfigured
      ? "pix"
      : paymentMethods.length > 0
        ? "manual"
        : "receipt") as "pix" | "manual" | "credit_card" | "receipt",
    paymentMethodId: (!isGatewayConfigured && paymentMethods.length > 0
      ? (paymentMethods[0] as any).id
      : "") as string, // UUID of chosen manual payment option
    shippingMethod: "manual_table" as "manual_table" | "pickup" | "manual_quote",
    shippingAddress: {
      zipcode: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    },
  });

  // Keep local cart state synced on loader updates
  useEffect(() => {
    setCart(initialCart);
  }, [initialCart]);

  // Pre-fill user profile info if logged in
  useEffect(() => {
    if (userProfile) {
      setFormData((prev) => ({
        ...prev,
        customerName: prev.customerName || userProfile.fullName || "",
        customerEmail: prev.customerEmail || userProfile.email || "",
        customerPhone: prev.customerPhone || userProfile.phone || "",
        customerDocument: prev.customerDocument || userProfile.cpf || "",
      }));
    }
  }, [userProfile]);

  // Pre-fill default saved address if available
  useEffect(() => {
    if (userAddresses && userAddresses.length > 0) {
      const defaultAddr = userAddresses.find((a: any) => a.is_default) || userAddresses[0];
      if (defaultAddr && defaultAddr.zipcode) {
        const cleanZip = defaultAddr.zipcode.replace(/\D/g, "");
        setFormData((prev) => {
          if (prev.shippingAddress.zipcode) return prev;
          return {
            ...prev,
            shippingAddress: {
              zipcode: cleanZip,
              street: defaultAddr.street || "",
              number: defaultAddr.number || "",
              complement: defaultAddr.complement || "",
              neighborhood: defaultAddr.neighborhood || "",
              city: defaultAddr.city || "",
              state: defaultAddr.state || "",
            },
          };
        });
        if (cleanZip.length === 8) {
          handleCepChange(cleanZip, true);
        }
      }
    }
  }, [userAddresses]);

  // Cep autofill & dynamic shipping cost calculation
  const handleAdvanceToDelivery = async () => {
    try {
      if (formData.customerEmail || formData.customerPhone) {
        await updateCartContact({
          data: {
            guestEmail: formData.customerEmail || undefined,
            guestPhone: formData.customerPhone || undefined,
          },
        });
      }
    } catch (e) {
      console.error("Falha silenciosa ao salvar lead", e);
    }
    setActiveStep(2);
  };

  const handleCepChange = async (val: string, skipAutofill = false) => {
    const cep = val.replace(/\D/g, "");
    setFormData((prev) => ({
      ...prev,
      shippingAddress: { ...prev.shippingAddress, zipcode: cep },
    }));

    if (cep.length === 8) {
      setIsCalculatingShipping(true);
      setNoShippingRatesFound(false);
      try {
        if (!skipAutofill) {
          // Auto-fill address fields from ViaCep
          const zipRes = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          const zipData = await zipRes.json();
          if (!zipData.erro) {
            setFormData((prev) => ({
              ...prev,
              shippingAddress: {
                ...prev.shippingAddress,
                street: zipData.logradouro || prev.shippingAddress.street,
                neighborhood: zipData.bairro || prev.shippingAddress.neighborhood,
                city: zipData.localidade || prev.shippingAddress.city,
                state: zipData.uf || prev.shippingAddress.state,
              },
            }));
          }
        }

        // Calculate shipping rates
        const shipRes = await calculateShipping({ data: { zipcode: cep } });
        if (shipRes && Array.isArray(shipRes) && shipRes.length > 0) {
          setShippingRates(shipRes);
          setNoShippingRatesFound(false);
        } else {
          setShippingRates([]);
          setNoShippingRatesFound(true);
        }
      } catch (err) {
        console.error("Erro no cálculo de frete:", err);
        toast.error("Erro ao calcular o frete.");
      } finally {
        setIsCalculatingShipping(false);
      }
    } else {
      setShippingRates([]);
    }
  };

  // Select shipping rate
  const handleSelectRate = async (rate: any) => {
    setSelectedRateId(rate.id);
    setFormData((prev) => ({ ...prev, shippingMethod: "manual_table" }));

    try {
      await updateCartShipping({
        data: {
          method: "delivery",
          zipcode: formData.shippingAddress.zipcode,
          cents: rate.price_cents,
        },
      });
      // Invalidate router cache to pull updated cart totals
      router.invalidate();
    } catch (e) {
      toast.error("Erro ao atualizar frete.");
    }
  };

  // Request custom shipping quote
  const handleRequestQuote = async () => {
    setSelectedRateId("quote");
    setFormData((prev) => ({ ...prev, shippingMethod: "manual_quote" }));

    try {
      await updateCartShipping({
        data: {
          zipcode: formData.shippingAddress.zipcode,
          method: "manual_quote",
          cents: 0,
        },
      });
      router.invalidate();
      toast.success("Cotação de frete personalizada selecionada!");
    } catch (e) {
      toast.error("Erro ao atualizar cotação.");
    }
  };

  // Handle local pickup
  const handleSelectPickup = async () => {
    setSelectedRateId("pickup");
    setFormData((prev) => ({ ...prev, shippingMethod: "pickup" }));

    try {
      await updateCartShipping({
        data: { method: "pickup", zipcode: "", cents: 0 },
      });
      router.invalidate();
    } catch (e) {
      toast.error("Erro ao atualizar retirada.");
    }
  };

  // Surcharges & discount reactive calculation
  const getSelectedPaymentMethodInfo = () => {
    if (formData.paymentMethod === "manual" && formData.paymentMethodId) {
      const match = paymentMethods.find((p: any) => p.id === formData.paymentMethodId);
      if (match) return match as ManualPaymentOption;
    }
    return null;
  };

  const paymentSettings = storeProfile?.settings?.payment_settings || {};
  const pixDiscountPercent = Number(paymentSettings.pix_discount_percentage || 0);
  const maxInstallments = Number(paymentSettings.max_installments || 12);
  const interestFreeInstallments = Number(paymentSettings.interest_free_installments || 3);
  const installmentInterestRate = Number(paymentSettings.installment_interest_rate || 2.99);

  const paymentInfo = getSelectedPaymentMethodInfo();
  let paymentSurchargeCents = 0;
  let paymentDiscountCents = 0;

  if (paymentInfo) {
    if (Number(paymentInfo.discount_percentage) > 0) {
      paymentDiscountCents = Math.floor(
        cart.subtotalCents * (Number(paymentInfo.discount_percentage) / 100),
      );
    } else if (Number(paymentInfo.surcharge_percentage) > 0) {
      paymentSurchargeCents = Math.floor(
        cart.subtotalCents * (Number(paymentInfo.surcharge_percentage) / 100),
      );
    }
  } else if (formData.paymentMethod === "pix" && pixDiscountPercent > 0) {
    paymentDiscountCents = Math.floor(cart.subtotalCents * (pixDiscountPercent / 100));
  }

  // Calculate installment options helper
  const calculateInstallmentOptions = (totalCents: number) => {
    const maxInst = maxInstallments;
    const freeInst = interestFreeInstallments;
    const monthlyRate = installmentInterestRate / 100;

    const options = [];
    for (let i = 1; i <= maxInst; i++) {
      if (i <= freeInst) {
        const installmentValue = Math.round(totalCents / i);
        options.push({
          number: i,
          valueCents: installmentValue,
          totalCents: installmentValue * i,
          interestFree: true,
          formattedText: `${i}x de ${formatMoney(installmentValue)} sem juros`,
        });
      } else {
        const p = totalCents;
        const r = monthlyRate;
        const n = i;
        let installmentValue = 0;
        if (r === 0) {
          installmentValue = Math.round(p / n);
        } else {
          const factor = Math.pow(1 + r, n);
          installmentValue = Math.round((p * (r * factor)) / (factor - 1));
        }
        options.push({
          number: i,
          valueCents: installmentValue,
          totalCents: installmentValue * n,
          interestFree: false,
          formattedText: `${i}x de ${formatMoney(installmentValue)} com juros (${(r * 100).toFixed(2)}% a.m.)`,
        });
      }
    }
    return options;
  };

  // Calculate totals before applying Gift Card
  const preGiftTotalCents =
    cart.subtotalCents +
    (formData.shippingMethod === "pickup" ? 0 : cart.shippingCents) -
    cart.discountCents -
    paymentDiscountCents +
    paymentSurchargeCents;

  // Deduct Gift Card value
  const giftCardDeductionCents = appliedGiftCard
    ? Math.min(appliedGiftCard.balanceCents, preGiftTotalCents)
    : 0;

  const finalTotalCents = preGiftTotalCents - giftCardDeductionCents;
  const installmentOptions = calculateInstallmentOptions(finalTotalCents);
  const activeInstallmentOption = installmentOptions.find((o) => o.number === selectedInstallment);
  const checkoutTotalCents =
    formData.paymentMethod === "credit_card" && activeInstallmentOption
      ? activeInstallmentOption.totalCents
      : finalTotalCents;

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    setIsApplyingPromo(true);
    try {
      // 1. Try coupon first
      const codeUpper = promoCode.toUpperCase().trim();
      const res = await applyCouponToCart({ data: { code: codeUpper } });
      if (res) {
        toast.success(res.message || "Cupom aplicado!");
        setPromoCode("");
        setAppliedGiftCard(null); // Clear gift card if coupon works
        router.invalidate();
        return;
      }

      // 2. Try gift card lookup
      const gcRes = await checkGiftCardBalance({ data: { code: promoCode.trim() } });
      if (gcRes && gcRes.balanceCents > 0) {
        setAppliedGiftCard({
          code: promoCode.trim(),
          balanceCents: gcRes.balanceCents,
        });
        toast.success(`Vale-presente de ${formatMoney(gcRes.balanceCents)} aplicado!`);
        setPromoCode("");
        return;
      }

      toast.error("Cupom ou Vale-presente inválido ou expirado.");
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "Código inválido ou expirado.");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  // Process checkout submission
  const handleSubmitOrder = async () => {
    if (isSubmitting) return;

    // Validate fields based on shipping choice
    if (formData.shippingMethod !== "pickup") {
      const { zipcode, street, number, neighborhood, city, state } = formData.shippingAddress;
      if (!zipcode || !street || !number || !neighborhood || !city || !state) {
        toast.error("Por favor, preencha todos os campos obrigatórios do endereço.");
        return;
      }

      if (!selectedRateId) {
        toast.error("Por favor, escolha uma opção de entrega ou solicite uma cotação.");
        return;
      }
    }

    // Validate credit card inputs
    if (formData.paymentMethod === "credit_card") {
      const { number, holderName, expiryDate, cvv } = creditCardData;
      if (
        !number ||
        number.length < 15 ||
        !holderName ||
        !expiryDate ||
        expiryDate.length < 5 ||
        !cvv ||
        cvv.length < 3
      ) {
        toast.error("Por favor, preencha todos os campos obrigatórios do Cartão de Crédito.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await processCheckout({
        data: {
          cartId: cart.id,
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          customerDocument: formData.customerDocument,
          shippingMethod: formData.shippingMethod,
          shippingAddress:
            formData.shippingMethod === "pickup" ? undefined : formData.shippingAddress,
          paymentMethod: formData.paymentMethod,
          paymentMethodId:
            formData.paymentMethod === "manual" ? formData.paymentMethodId : undefined,
          giftCardCode: appliedGiftCard?.code || undefined,
        },
      });

      if (
        formData.shippingMethod !== "manual_quote" &&
        formData.paymentMethod !== "manual" &&
        checkoutTotalCents > 0
      ) {
        try {
          await initiatePaymentTransaction({
            data: {
              orderId: res.orderId || res.orderToken,
              publicToken: res.orderToken,
              method: formData.paymentMethod === "credit_card" ? "credit_card" : "pix",
              amountCents: checkoutTotalCents,
            },
          });
        } catch (payErr: unknown) {
          console.error("Erro na transação inicial do pagamento:", payErr);
          toast.warning(
            `O pedido #${res.orderToken} foi gerado, mas a inicialização automática do pagamento falhou (${(payErr instanceof Error ? payErr.message : String(payErr)) || "erro de rede"}). Direcionando para as instruções de pagamento do seu pedido...`,
          );
          // Redirecionamento obrigatório pois o pedido já foi persistido no banco e o carrinho finalizado
          navigate({
            to: "/pedido/$publicToken/confirmacao",
            params: { publicToken: res.orderToken },
          });
          return;
        }
      }

      toast.success("Pedido realizado com sucesso!");

      // Redirecionamento canônico ao invés de view local
      // Checa se há outros carrinhos pendentes para voltar ao hub (a esteira de checkout)
      const remainingCarts = globalCarts.filter((c: any) => c.id !== cart.id);
      if (remainingCarts.length > 0) {
        toast.info(`Você tem mais ${remainingCarts.length} pacote(s) aguardando pagamento.`);
        navigate({ to: "/checkout" });
      } else {
        navigate({
          to: "/pedido/$publicToken/confirmacao",
          params: { publicToken: res.orderToken },
        });
      }
    } catch (err: unknown) {
      if ((err instanceof Error ? err.message : String(err)) && (err instanceof Error ? err.message : String(err)).includes("unconfigured_integration")) {
        toast.error(
          "Integração de pagamento não configurada. A compra não pode ser concluída no momento.",
        );
      } else {
        toast.error((err instanceof Error ? err.message : String(err)) || "Erro inesperado ao finalizar compra.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelThisCart = async () => {
    if (
      confirm(
        "Você tem certeza que deseja desistir desta compra específica? O pacote desta loja será removido da sua sacola.",
      )
    ) {
      try {
        await cancelCart({ data: { cartId: cart.id } });
        toast.success("Pacote removido com sucesso.");
        navigate({ to: "/checkout" });
      } catch (err: unknown) {
        toast.error((err instanceof Error ? err.message : String(err)) || "Erro ao remover pacote.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-5xl py-12 mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-border pb-6">
          <h1 className="text-4xl font-semibold text-foreground tracking-tight flex items-center gap-3">
            <ShoppingBag className="size-8 text-primary" strokeWidth={3} />
            Finalizar Compra
          </h1>
          <Button
            variant="outline"
            className="border border-border bg-muted/30 text-foreground rounded-md font-bold shadow-sm"
            onClick={handleCancelThisCart}
          >
            Desistir desta compra
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Accordion Steps Layout */}
          <div className="lg:col-span-2 space-y-4">
            {/* Passo 1: Seus Dados */}
            <Surface
              variant="default"
              padding="none"
              className="overflow-hidden border border-border shadow-sm mb-4"
            >
              <button
                onClick={() => setActiveStep(1)}
                className={cn(
                  "w-full flex items-center justify-between p-5 border-b border-border font-bold font-sans text-muted-foreground text-xl transition-colors",
                  activeStep === 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-foreground hover:bg-secondary",
                )}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={cn(
                      "size-8 rounded-md border border-current flex items-center justify-center text-sm font-mono font-black",
                      activeStep > 1
                        ? "bg-secondary text-foreground"
                        : activeStep === 1
                          ? "bg-background text-foreground"
                          : "bg-primary text-primary-foreground",
                    )}
                  >
                    1
                  </span>
                  Identificação
                </span>
                {activeStep > 1 && (
                  <span className="text-xs font-mono uppercase font-black bg-primary text-primary-foreground px-2 py-1 shadow-sm">
                    Editar
                  </span>
                )}
              </button>

              {activeStep === 1 && (
                <div className="p-6 space-y-4">
                  {userProfile && (
                    <div className="flex items-center gap-2 p-3 bg-primary/5 text-primary text-xs font-medium border border-primary/10">
                      <User className="size-4 shrink-0" />
                      <span>
                        Conectado como <strong>{userProfile.email}</strong>. Seus dados foram
                        preenchidos automaticamente.
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Nome Completo *</Label>
                      <Input
                        required
                        placeholder="Nome completo do destinatário"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>E-mail *</Label>
                      <Input
                        type="email"
                        required
                        placeholder="seuemail@exemplo.com"
                        value={formData.customerEmail}
                        onChange={(e) =>
                          setFormData({ ...formData, customerEmail: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>WhatsApp / Telefone *</Label>
                      <Input
                        type="tel"
                        required
                        placeholder="(99) 99999-9999"
                        value={formData.customerPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, customerPhone: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>CPF / CNPJ (Opcional)</Label>
                      <Input
                        placeholder="000.000.000-00"
                        value={formData.customerDocument}
                        onChange={(e) =>
                          setFormData({ ...formData, customerDocument: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4 border-t border-border gap-4 mt-6">
                    <Button
                      className="bg-primary text-primary-foreground border border-border font-bold rounded-md px-6 shadow-sm"
                      disabled={
                        !formData.customerName || !formData.customerEmail || !formData.customerPhone
                      }
                      onClick={handleAdvanceToDelivery}
                    >
                      Continuar para Entrega
                    </Button>
                  </div>
                </div>
              )}
            </Surface>

            {/* Passo 2: Entrega */}
            <Surface
              variant="default"
              padding="none"
              className={cn(
                "overflow-hidden border border-border shadow-sm mb-4 transition-opacity",
                activeStep < 2 && !formData.customerName && "opacity-50",
              )}
            >
              <button
                onClick={() => formData.customerName && setActiveStep(2)}
                disabled={activeStep < 2 && !formData.customerName}
                className={cn(
                  "w-full flex items-center justify-between p-5 border-b border-border font-bold font-sans text-muted-foreground text-xl transition-colors",
                  activeStep === 2
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-foreground hover:bg-secondary",
                )}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={cn(
                      "size-8 rounded-md border border-current flex items-center justify-center text-sm font-mono font-black",
                      activeStep > 2
                        ? "bg-secondary text-foreground"
                        : activeStep === 2
                          ? "bg-background text-foreground"
                          : "bg-primary text-primary-foreground",
                    )}
                  >
                    2
                  </span>
                  Entrega ou Retirada
                </span>
                {activeStep > 2 && (
                  <span className="text-xs font-mono uppercase font-black bg-primary text-primary-foreground px-2 py-1 shadow-sm">
                    Editar
                  </span>
                )}
              </button>

              {activeStep === 2 && (
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, shippingMethod: "manual_table" })}
                      className={`flex flex-col items-center justify-center p-4 border gap-2 transition-all ${formData.shippingMethod !== "pickup" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}
                    >
                      <Truck className="size-6 text-muted-foreground" />
                      <span className="text-sm font-semibold">Entregar no Endereço</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectPickup}
                      className={`flex flex-col items-center justify-center p-4 border gap-2 transition-all ${formData.shippingMethod === "pickup" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}
                    >
                      <MapPin className="size-6 text-muted-foreground" />
                      <span className="text-sm font-semibold">Retirar na Loja</span>
                    </button>
                  </div>

                  {formData.shippingMethod !== "pickup" ? (
                    <div className="space-y-4">
                      {userAddresses && userAddresses.length > 0 && (
                        <div className="space-y-3 bg-muted/20 p-4 border mb-4">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-primary" /> Meus Endereços Cadastrados
                          </Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {userAddresses.map((addr: any) => {
                              const cleanZip = (addr.zipcode || "").replace(/\D/g, "");
                              const isSelected =
                                formData.shippingAddress.zipcode === cleanZip &&
                                formData.shippingAddress.street === addr.street &&
                                formData.shippingAddress.number === addr.number;
                              return (
                                <button
                                  key={addr.id}
                                  type="button"
                                  onClick={async () => {
                                    const selectedStreet =
                                      addr.street || addr.address_line1 || addr.logradouro || "";

                                    setFormData((prev) => ({
                                      ...prev,
                                      shippingAddress: {
                                        zipcode: cleanZip,
                                        street: selectedStreet,
                                        number: addr.number || "",
                                        complement: addr.complement || "",
                                        neighborhood: addr.neighborhood || addr.bairro || "",
                                        city: addr.city || "",
                                        state: addr.state || "",
                                      },
                                    }));

                                    if (cleanZip.length === 8) {
                                      setIsCalculatingShipping(true);
                                      setNoShippingRatesFound(false);
                                      try {
                                        const shipRes = await calculateShipping({
                                          data: { zipcode: cleanZip },
                                        });
                                        if (
                                          shipRes &&
                                          Array.isArray(shipRes) &&
                                          shipRes.length > 0
                                        ) {
                                          setShippingRates(shipRes);
                                          setNoShippingRatesFound(false);
                                        } else {
                                          setShippingRates([]);
                                          setNoShippingRatesFound(true);
                                        }
                                      } catch (e) {
                                        setShippingRates([]);
                                        setNoShippingRatesFound(true);
                                      } finally {
                                        setIsCalculatingShipping(false);
                                      }
                                    }
                                  }}
                                  className={`p-3 border text-left text-xs space-y-1 transition-all ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary font-medium" : "hover:bg-card bg-background"}`}
                                >
                                  <div className="flex items-center justify-between font-semibold">
                                    <span className="truncate">
                                      {addr.street}, {addr.number}
                                    </span>
                                    {addr.is_default && (
                                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">
                                        Padrão
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-muted-foreground truncate">
                                    {addr.neighborhood} - {addr.city}/{addr.state}
                                  </p>
                                  <p className="font-mono text-muted-foreground">{addr.zipcode}</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>CEP *</Label>
                          <Input
                            placeholder="89800-000"
                            maxLength={9}
                            value={formData.shippingAddress.zipcode}
                            onChange={(e) => handleCepChange(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label>Rua / Logradouro *</Label>
                          <Input
                            placeholder="Rua Exemplo"
                            value={formData.shippingAddress.street}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                shippingAddress: {
                                  ...formData.shippingAddress,
                                  street: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Número *</Label>
                          <Input
                            placeholder="123"
                            value={formData.shippingAddress.number}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                shippingAddress: {
                                  ...formData.shippingAddress,
                                  number: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label>Complemento</Label>
                          <Input
                            placeholder="Apto 101"
                            value={formData.shippingAddress.complement}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                shippingAddress: {
                                  ...formData.shippingAddress,
                                  complement: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Bairro *</Label>
                          <Input
                            placeholder="Centro"
                            value={formData.shippingAddress.neighborhood}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                shippingAddress: {
                                  ...formData.shippingAddress,
                                  neighborhood: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cidade *</Label>
                          <Input
                            value={formData.shippingAddress.city}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                shippingAddress: {
                                  ...formData.shippingAddress,
                                  city: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Estado (UF) *</Label>
                          <Select
                            value={formData.shippingAddress.state}
                            onValueChange={(v) =>
                              setFormData({
                                ...formData,
                                shippingAddress: { ...formData.shippingAddress, state: v },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="UF" />
                            </SelectTrigger>
                            <SelectContent>
                              {[
                                "SP",
                                "RJ",
                                "MG",
                                "RS",
                                "PR",
                                "SC",
                                "BA",
                                "DF",
                                "GO",
                                "PE",
                                "CE",
                              ].map((uf) => (
                                <SelectItem key={uf} value={uf}>
                                  {uf}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Shipping Rates Options */}
                      <div className="border-t pt-4 mt-4">
                        <Label className="text-sm font-semibold mb-2 block">
                          Selecione o Frete
                        </Label>
                        {isCalculatingShipping ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2 font-normal">
                            <Loader2 className="animate-spin size-4" />
                            Calculando fretes disponíveis...
                          </div>
                        ) : shippingRates.length > 0 ? (
                          <div className="grid gap-2">
                            {shippingRates.map((rate) => (
                              <button
                                key={rate.id}
                                type="button"
                                onClick={() => handleSelectRate(rate)}
                                className={`flex items-center justify-between p-3 border text-left transition-all ${selectedRateId === rate.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}
                              >
                                <div>
                                  <p className="font-semibold text-sm">{rate.name}</p>
                                  {rate.estimated_days && (
                                    <p className="text-xs text-muted-foreground font-normal">
                                      Prazo: {rate.estimated_days} dias úteis
                                    </p>
                                  )}
                                </div>
                                <p className="font-bold text-sm">{formatMoney(rate.price_cents)}</p>
                              </button>
                            ))}
                          </div>
                        ) : noShippingRatesFound && formData.shippingAddress.zipcode ? (
                          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-4 space-y-3">
                            <div className="flex gap-2">
                              <AlertCircle className="size-5 text-amber-600 dark:text-amber-500 shrink-0" />
                              <div className="text-sm text-amber-800 dark:text-amber-300 font-normal">
                                <p className="font-semibold">
                                  Nenhum frete automático cadastrado para este bairro.
                                </p>
                                <p className="text-xs">
                                  Você pode solicitar uma cotação de frete personalizada. Nossa
                                  vendedora informará o valor do frete antes de solicitar o
                                  pagamento.
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              className="bg-background text-foreground border-amber-300 hover:bg-amber-100"
                              onClick={handleRequestQuote}
                            >
                              Solicitar Cotação de Frete
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground font-normal">
                            Digite o CEP para ver as opções de entrega.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/30 border space-y-1">
                      <p className="font-semibold text-sm">Retirada na Jah</p>
                      <p className="text-xs text-muted-foreground font-normal">
                        Rua Principal, Chapecó - SC. Horário: Seg a Sex 09h às 18h.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end pt-6 border-t border-border gap-4 mt-6">
                    <Button
                      variant="outline"
                      className="border border-border text-foreground font-bold rounded-md px-6"
                      onClick={() => setActiveStep(1)}
                    >
                      Voltar
                    </Button>
                    <Button
                      className="bg-primary text-primary-foreground border border-border font-bold rounded-md px-6 shadow-sm"
                      disabled={
                        formData.shippingMethod !== "pickup" &&
                        (!formData.shippingAddress.zipcode ||
                          !formData.shippingAddress.street ||
                          !selectedRateId)
                      }
                      onClick={() => setActiveStep(3)}
                    >
                      Continuar para Pagamento
                    </Button>
                  </div>
                </div>
              )}
            </Surface>

            {/* Passo 3: Pagamento */}
            <Surface
              variant="default"
              padding="none"
              className={cn(
                "overflow-hidden border border-border shadow-sm mb-4 transition-opacity",
                activeStep < 3 && "opacity-50",
              )}
            >
              <button
                onClick={() => activeStep >= 3 && setActiveStep(3)}
                disabled={activeStep < 3}
                className={cn(
                  "w-full flex items-center justify-between p-5 border-b border-border font-bold font-sans text-muted-foreground text-xl transition-colors",
                  activeStep === 3
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-foreground hover:bg-secondary",
                )}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={cn(
                      "size-8 rounded-md border border-current flex items-center justify-center text-sm font-mono font-black",
                      activeStep > 3
                        ? "bg-secondary text-foreground"
                        : activeStep === 3
                          ? "bg-background text-foreground"
                          : "bg-primary text-primary-foreground",
                    )}
                  >
                    3
                  </span>
                  Forma de Pagamento
                </span>
                {activeStep > 3 && (
                  <span className="text-xs font-mono uppercase font-black bg-primary text-primary-foreground px-2 py-1 shadow-sm">
                    Editar
                  </span>
                )}
              </button>

              {activeStep === 3 && (
                <div className="p-6 space-y-6">
                  <div>
                    {!isGatewayConfigured && paymentMethods.length === 0 && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30 p-5 space-y-4 mb-6">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="size-5 shrink-0 text-amber-600 dark:text-amber-500" />
                          <p className="text-sm font-semibold">
                            Esta loja ainda não aceita pagamentos automáticos pelo site.
                          </p>
                        </div>
                        <p className="text-xs">
                          Para finalizar sua compra, você deverá enviar seu pedido diretamente para
                          a loja através do WhatsApp.
                        </p>
                        <Button
                          type="button"
                          className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center justify-center gap-2"
                          onClick={() => {
                            const wppNumber = storeProfile?.phone?.replace(/\D/g, "");
                            if (wppNumber) {
                              const text = encodeURIComponent(
                                `Olá! Gostaria de finalizar o pedido da minha sacola no valor de ${formatMoney(checkoutTotalCents)}.`,
                              );
                              window.open(`https://wa.me/55${wppNumber}?text=${text}`, "_blank");
                            } else {
                              toast.error("Número de WhatsApp da loja não disponível.");
                            }
                          }}
                        >
                          <MessageCircle className="size-4" /> Finalizar pelo WhatsApp
                        </Button>
                      </div>
                    )}

                    {isGatewayConfigured && (
                      <>
                        <Label className="text-sm font-semibold mb-3 block">
                          Opções Principais
                        </Label>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                paymentMethod: "pix",
                                paymentMethodId: "",
                              })
                            }
                            className={`flex items-center justify-center p-3 border gap-2 font-medium transition-all ${formData.paymentMethod === "pix" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}
                          >
                            PIX
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                paymentMethod: "credit_card",
                                paymentMethodId: "",
                              })
                            }
                            className={`flex items-center justify-center p-3 border gap-2 font-medium transition-all ${formData.paymentMethod === "credit_card" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}
                          >
                            Cartão de Crédito
                          </button>
                        </div>
                      </>
                    )}

                    {/* PIX instructions card */}
                    {formData.paymentMethod === "pix" && (
                      <div className="bg-primary/5 border border-primary/20 p-5 space-y-3 mb-6">
                        <div className="flex items-center gap-2">
                          <QrCode className="size-5 text-primary animate-pulse" />
                          <span className="font-bold text-sm text-foreground">
                            Pagamento Instantâneo via PIX
                          </span>
                        </div>
                        {pixDiscountPercent > 0 && (
                          <p className="text-xs text-success font-semibold bg-success px-2.5 py-1 rounded border border-green-200 w-fit">
                            Desconto Ativo: Economize {pixDiscountPercent}% no total da sua compra!
                          </p>
                        )}
                        {storeProfile?.pixKey && (
                          <div className="space-y-1 bg-background p-3 border border-border mt-2">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                              Chave PIX da Loja
                            </span>
                            <p className="text-sm font-mono font-bold select-all text-foreground break-all">
                              {storeProfile.pixKey}
                            </p>
                          </div>
                        )}
                        {storeProfile?.paymentInstructions && (
                          <p className="text-xs text-muted-foreground whitespace-pre-line bg-background/50 p-2.5 rounded border border-dashed mt-2">
                            {storeProfile.paymentInstructions}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Credit Card inputs & dynamic installments */}
                    {formData.paymentMethod === "credit_card" && (
                      <div className="border border-border p-5 space-y-4 bg-muted/10 mb-6">
                        <div className="flex items-center gap-2">
                          <CreditCard className="size-5 text-primary" />
                          <span className="font-semibold text-sm">Dados do Cartão de Crédito</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-xs">Número do Cartão *</Label>
                            <Input
                              placeholder="0000 0000 0000 0000"
                              value={creditCardData.number}
                              onChange={(e) => {
                                const val = e.target.value
                                  .replace(/\D/g, "")
                                  .replace(/(.{4})/g, "$1 ")
                                  .trim();
                                setCreditCardData({
                                  ...creditCardData,
                                  number: val.substring(0, 19),
                                });
                              }}
                            />
                          </div>
                          <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-xs">Nome do Titular *</Label>
                            <Input
                              placeholder="Nome impresso no cartão"
                              value={creditCardData.holderName}
                              onChange={(e) =>
                                setCreditCardData({ ...creditCardData, holderName: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Validade *</Label>
                            <Input
                              placeholder="MM/AA"
                              maxLength={5}
                              value={creditCardData.expiryDate}
                              onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, "");
                                if (val.length > 2) {
                                  val = `${val.substring(0, 2)}/${val.substring(2, 4)}`;
                                }
                                setCreditCardData({ ...creditCardData, expiryDate: val });
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">CVV *</Label>
                            <Input
                              placeholder="123"
                              maxLength={4}
                              value={creditCardData.cvv}
                              onChange={(e) =>
                                setCreditCardData({
                                  ...creditCardData,
                                  cvv: e.target.value.replace(/\D/g, ""),
                                })
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5 border-t pt-4">
                          <Label className="text-xs font-semibold">Opções de Parcelamento *</Label>
                          <Select
                            value={String(selectedInstallment)}
                            onValueChange={(v) => setSelectedInstallment(Number(v))}
                          >
                            <SelectTrigger className="w-full bg-background">
                              <SelectValue placeholder="Selecione as parcelas" />
                            </SelectTrigger>
                            <SelectContent>
                              {installmentOptions.map((opt) => (
                                <SelectItem key={opt.number} value={String(opt.number)}>
                                  {opt.formattedText}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {paymentMethods.length > 0 && (
                      <>
                        <Label className="text-sm font-semibold mb-3 block">
                          Opções Manuais da Loja
                        </Label>
                        <div className="grid gap-2">
                          {paymentMethods.map((method: any) => (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  paymentMethod: "manual",
                                  paymentMethodId: method.id,
                                })
                              }
                              className={`flex items-center justify-between p-4 border text-left transition-all ${formData.paymentMethod === "manual" && formData.paymentMethodId === method.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50"}`}
                            >
                              <div>
                                <p className="font-semibold text-sm">{method.name}</p>
                                {method.instructions && (
                                  <p className="text-xs text-muted-foreground truncate max-w-sm mt-0.5 font-normal">
                                    {method.instructions}
                                  </p>
                                )}
                              </div>
                              {Number(method.discount_percentage) > 0 ? (
                                <span className="text-xs font-semibold text-success bg-success px-2 py-0.5 rounded-full">
                                  -{method.discount_percentage}% Desconto
                                </span>
                              ) : Number(method.surcharge_percentage) > 0 ? (
                                <span className="text-xs font-semibold text-destructive bg-destructive/5 px-2 py-0.5 rounded-full">
                                  +{method.surcharge_percentage}% Acréscimo
                                </span>
                              ) : null}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex justify-end pt-6 border-t border-border gap-4 mt-6">
                    <Button
                      variant="outline"
                      className="border border-border text-foreground font-bold rounded-md px-6"
                      onClick={() => setActiveStep(2)}
                    >
                      Voltar
                    </Button>
                    <Button
                      onClick={() => setActiveStep(4)}
                      className="bg-primary text-primary-foreground border border-border font-bold rounded-md px-6 shadow-sm"
                    >
                      Continuar para Resumo
                    </Button>
                  </div>
                </div>
              )}
            </Surface>

            {/* Passo 4: Resumo e Confirmação */}
            <Surface
              variant="default"
              padding="none"
              className={cn(
                "overflow-hidden border border-border shadow-sm mb-4 transition-opacity",
                activeStep < 4 && "opacity-50",
              )}
            >
              <div
                className={cn(
                  "w-full flex items-center p-5 border-b border-border font-bold font-sans text-muted-foreground text-xl",
                  activeStep === 4
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-foreground",
                )}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={cn(
                      "size-8 rounded-md border border-current flex items-center justify-center text-sm font-mono font-black",
                      activeStep === 4
                        ? "bg-background text-foreground"
                        : "bg-primary text-primary-foreground",
                    )}
                  >
                    4
                  </span>
                  Resumo e Confirmação
                </span>
              </div>

              {activeStep === 4 && (
                <div className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <p className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">
                        Destinatário
                      </p>
                      <p className="font-medium text-foreground">{formData.customerName}</p>
                      <p className="text-muted-foreground font-normal">
                        {formData.customerEmail} | {formData.customerPhone}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">
                        Entrega
                      </p>
                      {formData.shippingMethod === "pickup" ? (
                        <p className="font-medium text-foreground">Retirada em Loja (Grátis)</p>
                      ) : (
                        <>
                          <p className="font-medium text-foreground">
                            Entrega:{" "}
                            {cart.shippingMethod === "manual_quote"
                              ? "Cotação de Frete"
                              : cart.shippingMethod || "Entrega Normal"}
                          </p>
                          <p className="text-muted-foreground font-normal">
                            {formData.shippingAddress.street}, {formData.shippingAddress.number}{" "}
                            {formData.shippingAddress.complement &&
                              `(${formData.shippingAddress.complement})`}{" "}
                            - {formData.shippingAddress.neighborhood},{" "}
                            {formData.shippingAddress.city} - {formData.shippingAddress.state}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="space-y-2 md:col-span-2 border-t pt-4">
                      <p className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">
                        Forma de Pagamento
                      </p>
                      <p className="font-medium text-foreground">
                        {formData.paymentMethod === "pix" && "PIX"}
                        {formData.paymentMethod === "credit_card" && (
                          <>
                            Cartão de Crédito ({selectedInstallment}x de{" "}
                            {formatMoney(
                              installmentOptions.find((o) => o.number === selectedInstallment)
                                ?.valueCents || 0,
                            )}
                            )
                          </>
                        )}
                        {formData.paymentMethod === "manual" && (paymentInfo?.name || "Manual")}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6 border-t border-border gap-4 mt-6">
                    <Button
                      variant="outline"
                      className="border border-border text-foreground font-bold rounded-md px-6"
                      onClick={() => setActiveStep(3)}
                    >
                      Voltar
                    </Button>
                    <Button
                      disabled={isSubmitting}
                      onClick={handleSubmitOrder}
                      className="px-8 font-black bg-primary text-primary-foreground border border-border rounded-md shadow-sm text-lg"
                    >
                      {isSubmitting ? "Finalizando..." : "Confirmar e Pagar"}
                    </Button>
                  </div>
                </div>
              )}
            </Surface>
          </div>

          <div className="space-y-6 lg:col-span-1">
            {/* Resumo Lateral de Valores */}
            <Surface
              variant="default"
              elevation="none"
              className="bg-secondary border border-border shadow-sm p-6 h-fit sticky top-24 rounded-md text-foreground"
            >
              <h2 className="text-2xl font-semibold font-bold mb-6 flex items-center gap-2">
                <ShoppingBag className="size-6 text-primary" strokeWidth={3} />
                Resumo do Pedido
              </h2>
              <div className="space-y-4 mb-6">
                {cart.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex flex-col text-sm border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between font-medium">
                      <span>
                        {item.qty}x {item.productTitle}
                      </span>
                      <span>{formatMoney(item.lineTotalCents)}</span>
                    </div>
                    {Object.entries(item.variantAttributes || {}).length > 0 && (
                      <span className="text-xs text-muted-foreground mt-0.5 font-normal">
                        {Object.entries(item.variantAttributes || {})
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" | ")}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2 mb-6 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatMoney(cart.subtotalCents)}</span>
                </div>

                {cart.couponCode && (
                  <div className="flex justify-between text-success">
                    <span className="flex items-center gap-1">
                      <Ticket className="h-4 w-4" /> Cupom ({cart.couponCode})
                    </span>
                    <span>-{formatMoney(cart.discountCents)}</span>
                  </div>
                )}

                <div className="flex justify-between text-muted-foreground">
                  <span>Entrega</span>
                  <span>
                    {formData.shippingMethod === "pickup"
                      ? "Grátis (Retirada)"
                      : cart.shippingMethod === "manual_quote"
                        ? "A ser cotado"
                        : formatMoney(cart.shippingCents)}
                  </span>
                </div>

                {paymentDiscountCents > 0 && (
                  <div className="flex justify-between text-success font-medium">
                    <span>
                      {formData.paymentMethod === "pix"
                        ? `Desconto PIX (-${pixDiscountPercent}%)`
                        : `Desconto Pagamento (${paymentInfo?.name || "Manual"})`}
                    </span>
                    <span>-{formatMoney(paymentDiscountCents)}</span>
                  </div>
                )}

                {paymentSurchargeCents > 0 && (
                  <div className="flex justify-between text-destructive font-medium">
                    <span>Taxa Pagamento ({paymentInfo?.name})</span>
                    <span>+{formatMoney(paymentSurchargeCents)}</span>
                  </div>
                )}

                {formData.paymentMethod === "credit_card" &&
                  activeInstallmentOption &&
                  !activeInstallmentOption.interestFree && (
                    <div className="flex justify-between text-destructive font-medium">
                      <span>Juros de Parcelamento ({installmentInterestRate}% a.m.)</span>
                      <span>
                        +{formatMoney(activeInstallmentOption.totalCents - finalTotalCents)}
                      </span>
                    </div>
                  )}

                {appliedGiftCard && giftCardDeductionCents > 0 && (
                  <div className="flex justify-between text-success font-medium">
                    <span className="flex items-center gap-1">
                      <Gift className="h-4 w-4" /> Vale-Presente ({appliedGiftCard.code})
                    </span>
                    <span>-{formatMoney(giftCardDeductionCents)}</span>
                  </div>
                )}
              </div>

              {/* Promo code apply input */}
              <div className="border-t border-border pt-6 mb-4 mt-6">
                <Label className="text-sm font-bold text-foreground uppercase tracking-wider block mb-3 font-semibold">
                  Cupom ou Vale-Presente
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Código"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    disabled={isApplyingPromo}
                    className="h-10 font-mono uppercase text-sm border border-border bg-background rounded-md focus-visible:ring-poster-red text-foreground font-bold"
                  />
                  <Button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={isApplyingPromo || !promoCode}
                    className="h-10 font-black bg-primary text-primary-foreground border border-border rounded-md shadow-sm px-6"
                  >
                    {isApplyingPromo ? "..." : "Aplicar"}
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-border pt-6 mb-4 mt-2">
                <span className="font-bold text-foreground text-xl font-semibold">Total</span>
                <span className="font-black text-4xl text-primary font-semibold tracking-tight drop-shadow-sm">
                  {formatMoney(checkoutTotalCents)}
                </span>
              </div>
            </Surface>
          </div>
        </div>
      </div>
    </div>
  );
}
