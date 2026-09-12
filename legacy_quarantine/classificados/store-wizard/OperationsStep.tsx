import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DAYS_OF_WEEK, type StepProps, type DayHours, type DeliveryArea } from "./types";
import { Copy, Plus, Trash2 } from "lucide-react";

const SERVICE_MODES = [
  { id: "delivery", label: "Delivery", desc: "Entrega ao cliente" },
  { id: "pickup", label: "Retirada no local", desc: "Pickup" },
  { id: "dine_in", label: "Consumo no local", desc: "Mesa/balcão" },
  { id: "online", label: "Online/Remoto", desc: "Serviços digitais" },
  { id: "appointment", label: "Agenda", desc: "Horário marcado" },
];

const PAYMENT_METHODS = [
  { id: "cash", label: "Dinheiro" },
  { id: "pix", label: "PIX" },
  { id: "debit", label: "Cartão de débito" },
  { id: "credit", label: "Cartão de crédito" },
  { id: "meal_voucher", label: "Vale refeição" },
  { id: "bank_transfer", label: "Transferência bancária" },
  { id: "boleto", label: "Boleto" },
  { id: "payment_link", label: "Link de pagamento" },
];

const MEAL_BRANDS = ["Alelo", "Sodexo", "VR", "Ticket", "Ben Visa Vale", "iFood"];

export function OperationsStep({ data, onChange }: StepProps) {
  const toggleService = (id: string) => {
    const modes = data.serviceModes.includes(id)
      ? data.serviceModes.filter((m) => m !== id)
      : [...data.serviceModes, id];
    onChange({ serviceModes: modes });
  };

  const togglePayment = (id: string) => {
    const methods = data.paymentMethods.includes(id)
      ? data.paymentMethods.filter((m) => m !== id)
      : [...data.paymentMethods, id];
    onChange({ paymentMethods: methods });
  };

  const toggleMealBrand = (brand: string) => {
    const brands = data.mealVoucherBrands.includes(brand)
      ? data.mealVoucherBrands.filter((b) => b !== brand)
      : [...data.mealVoucherBrands, brand];
    onChange({ mealVoucherBrands: brands });
  };

  const updateDay = (key: string, partial: Partial<DayHours>) => {
    onChange({
      hours: { ...data.hours, [key]: { ...data.hours[key], ...partial } },
    });
  };

  const copyToAll = () => {
    const firstActive = Object.values(data.hours).find((d) => d.active);
    if (!firstActive) return;
    const newHours: Record<string, DayHours> = {};
    for (const day of DAYS_OF_WEEK) {
      newHours[day.key] = { ...firstActive, active: true };
    }
    onChange({ hours: newHours });
  };

  const addDeliveryArea = () => {
    onChange({
      deliveryAreas: [...data.deliveryAreas, { name: "", time: "", price: "" }],
    });
  };

  const updateDeliveryArea = (index: number, partial: Partial<DeliveryArea>) => {
    const areas = [...data.deliveryAreas];
    areas[index] = { ...areas[index], ...partial };
    onChange({ deliveryAreas: areas });
  };

  const removeDeliveryArea = (index: number) => {
    onChange({ deliveryAreas: data.deliveryAreas.filter((_, i) => i !== index) });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 space-y-8">
      <h1 className="text-2xl font-bold text-foreground text-center">
        Configurações de operação
      </h1>

      {/* Hours */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Horário de funcionamento</Label>
          <Button type="button" variant="outline" size="sm" onClick={copyToAll}>
            <Copy className="h-3 w-3 mr-1" /> Copiar para todos
          </Button>
        </div>
        <div className="space-y-2">
          {DAYS_OF_WEEK.map((day) => {
            const d = data.hours[day.key];
            return (
              <div key={day.key} className="flex items-center gap-3 p-2 rounded-lg border bg-card">
                <Switch
                  checked={d.active}
                  onCheckedChange={(v) => updateDay(day.key, { active: v })}
                />
                <span className="w-20 text-sm font-medium">{day.label}</span>
                {d.active ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Input
                      type="time"
                      value={d.open}
                      onChange={(e) => updateDay(day.key, { open: e.target.value })}
                      className="h-8 w-28"
                    />
                    <span className="text-muted-foreground">às</span>
                    <Input
                      type="time"
                      value={d.close}
                      onChange={(e) => updateDay(day.key, { close: e.target.value })}
                      className="h-8 w-28"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Fechado</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Service modes */}
      <section className="space-y-3">
        <Label className="text-base font-semibold">Formas de atendimento</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SERVICE_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => toggleService(mode.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                data.serviceModes.includes(mode.id)
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <Checkbox checked={data.serviceModes.includes(mode.id)} />
              <div>
                <p className="text-sm font-medium">{mode.label}</p>
                <p className="text-xs text-muted-foreground">{mode.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Delivery config */}
      {data.serviceModes.includes("delivery") && (
        <section className="space-y-4 p-4 rounded-xl border bg-card">
          <Label className="text-base font-semibold">Configuração de delivery</Label>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Pedido mínimo (R$)</Label>
              <Input
                value={data.deliveryMinOrder}
                onChange={(e) => onChange({ deliveryMinOrder: e.target.value })}
                placeholder="0,00"
                maxLength={10}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tempo de preparo</Label>
              <Select value={data.deliveryPrepTime} onValueChange={(v) => onChange({ deliveryPrepTime: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["15", "30", "45", "60", "90"].map((v) => (
                    <SelectItem key={v} value={v}>{v} min</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">Aceita motoboy parceiro</Label>
            <Switch checked={data.partnerDriver} onCheckedChange={(v) => onChange({ partnerDriver: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Entregador próprio</Label>
            <Switch checked={data.ownDriver} onCheckedChange={(v) => onChange({ ownDriver: v })} />
          </div>

          {/* Delivery areas */}
          <div className="space-y-2">
            <Label className="text-xs">Áreas de entrega</Label>
            {data.deliveryAreas.map((area, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={area.name}
                  onChange={(e) => updateDeliveryArea(i, { name: e.target.value })}
                  placeholder="Bairro/Área"
                  className="flex-1"
                  maxLength={100}
                />
                <Input
                  value={area.time}
                  onChange={(e) => updateDeliveryArea(i, { time: e.target.value })}
                  placeholder="min"
                  className="w-16"
                  maxLength={5}
                />
                <Input
                  value={area.price}
                  onChange={(e) => updateDeliveryArea(i, { price: e.target.value })}
                  placeholder="R$"
                  className="w-20"
                  maxLength={10}
                />
                <Button variant="ghost" size="icon" onClick={() => removeDeliveryArea(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addDeliveryArea}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar área
            </Button>
          </div>
        </section>
      )}

      {/* Pickup config */}
      {data.serviceModes.includes("pickup") && (
        <section className="p-4 rounded-xl border bg-card space-y-2">
          <Label className="text-base font-semibold">Retirada no local</Label>
          <div className="space-y-1">
            <Label className="text-xs">Tempo de espera</Label>
            <Select value={data.pickupWaitTime} onValueChange={(v) => onChange({ pickupWaitTime: v })}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["10", "15", "20", "30", "45", "60"].map((v) => (
                  <SelectItem key={v} value={v}>{v} min</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>
      )}

      {/* Payment methods */}
      <section className="space-y-3">
        <Label className="text-base font-semibold">Formas de pagamento</Label>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.id}
              onClick={() => togglePayment(method.id)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm ${
                data.paymentMethods.includes(method.id)
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <Checkbox checked={data.paymentMethods.includes(method.id)} />
              {method.label}
            </button>
          ))}
        </div>

        {/* Cash config */}
        {data.paymentMethods.includes("cash") && (
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <Label className="text-sm">Troco disponível</Label>
            <Switch checked={data.changeAvailable} onCheckedChange={(v) => onChange({ changeAvailable: v })} />
          </div>
        )}

        {/* PIX config */}
        {data.paymentMethods.includes("pix") && (
          <div className="p-3 rounded-lg border space-y-1">
            <Label className="text-xs">Chave PIX</Label>
            <Input
              value={data.pixKey}
              onChange={(e) => onChange({ pixKey: e.target.value })}
              placeholder="Sua chave PIX"
              maxLength={100}
            />
          </div>
        )}

        {/* Credit config */}
        {data.paymentMethods.includes("credit") && (
          <div className="p-3 rounded-lg border grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Máx parcelas</Label>
              <Select value={data.maxInstallments} onValueChange={(v) => onChange({ maxInstallments: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}x</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Sem juros até</Label>
              <Select value={data.noInterestInstallments} onValueChange={(v) => onChange({ noInterestInstallments: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}x</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Meal voucher brands */}
        {data.paymentMethods.includes("meal_voucher") && (
          <div className="p-3 rounded-lg border space-y-2">
            <Label className="text-xs">Bandeiras aceitas</Label>
            <div className="flex flex-wrap gap-2">
              {MEAL_BRANDS.map((brand) => (
                <button
                  key={brand}
                  onClick={() => toggleMealBrand(brand)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${
                    data.mealVoucherBrands.includes(brand)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
