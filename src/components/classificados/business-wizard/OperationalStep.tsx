import { useState } from "react";
import { Clock, CreditCard, Truck, MapPin, Globe, Phone } from "lucide-react";

export interface OperationalData {
  operatingHours: string;
  workDays: string[];
  acceptsDelivery: boolean;
  deliveryRadius: string;
  paymentMethods: string[];
  hasWhatsappOrders: boolean;
  website: string;
  instagram: string;
}

const DAYS = [
  { key: "seg", label: "Seg" }, { key: "ter", label: "Ter" },
  { key: "qua", label: "Qua" }, { key: "qui", label: "Qui" },
  { key: "sex", label: "Sex" }, { key: "sab", label: "Sáb" },
  { key: "dom", label: "Dom" },
];

const PAYMENT_OPTIONS = [
  "Dinheiro", "PIX", "Cartão de crédito", "Cartão de débito",
  "Vale-refeição", "Vale-alimentação", "Boleto",
];

interface Props {
  data: OperationalData;
  onChange: (data: OperationalData) => void;
  niche: string;
}

export function OperationalStep({ data, onChange, niche }: Props) {
  const patch = (partial: Partial<OperationalData>) => onChange({ ...data, ...partial });

  const toggleDay = (key: string) => {
    const days = data.workDays.includes(key)
      ? data.workDays.filter(d => d !== key)
      : [...data.workDays, key];
    patch({ workDays: days });
  };

  const togglePayment = (method: string) => {
    const methods = data.paymentMethods.includes(method)
      ? data.paymentMethods.filter(m => m !== method)
      : [...data.paymentMethods, method];
    patch({ paymentMethods: methods });
  };

  const showDelivery = ["restaurant", "retail", "mobility"].includes(niche);
  const showWhatsapp = ["restaurant", "retail", "beauty", "services", "freelancer"].includes(niche);

  return (
    <div className="space-y-6">
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "hsl(var(--text-primary))", marginBottom: 4 }}>
          Operação do negócio
        </h2>
        <p style={{ fontSize: 12, color: "hsl(var(--text-tertiary))" }}>
          Configure horários, pagamentos e canais. Você pode alterar tudo depois.
        </p>
      </div>

      {/* Operating Hours */}
      <div className="card" style={{ padding: 16 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
          <Clock size={16} style={{ color: "hsl(var(--orange))" }} />
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--text-primary))" }}>Horário de funcionamento</h3>
        </div>
        <div className="input-wrap" style={{ marginBottom: 12 }}>
          <input
            className="input"
            placeholder="Ex: 08:00 - 22:00"
            value={data.operatingHours}
            onChange={(e) => patch({ operatingHours: e.target.value })}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {DAYS.map(d => (
            <button
              key={d.key}
              type="button"
              onClick={() => toggleDay(d.key)}
              className={data.workDays.includes(d.key) ? "chip chip-orange" : "chip chip-gray"}
              style={{ cursor: "pointer", fontSize: 11 }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Delivery / Coverage */}
      {showDelivery && (
        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
            <Truck size={16} style={{ color: "hsl(var(--green))" }} />
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--text-primary))" }}>Delivery / Entrega</h3>
          </div>
          <label className="flex items-center gap-3" style={{ marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={data.acceptsDelivery}
              onChange={(e) => patch({ acceptsDelivery: e.target.checked })}
              className="w-4 h-4 accent-[hsl(var(--orange))]"
            />
            <span style={{ fontSize: 13, color: "hsl(var(--text-primary))" }}>Realizo entregas</span>
          </label>
          {data.acceptsDelivery && (
            <div className="input-wrap">
              <label className="input-label">Raio de entrega (km)</label>
              <input
                className="input"
                type="number"
                min="1"
                placeholder="Ex: 10"
                value={data.deliveryRadius}
                onChange={(e) => patch({ deliveryRadius: e.target.value })}
              />
            </div>
          )}
        </div>
      )}

      {/* Payment Methods */}
      <div className="card" style={{ padding: 16 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
          <CreditCard size={16} style={{ color: "hsl(var(--blue))" }} />
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--text-primary))" }}>Formas de pagamento</h3>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {PAYMENT_OPTIONS.map(method => (
            <button
              key={method}
              type="button"
              onClick={() => togglePayment(method)}
              className={data.paymentMethods.includes(method) ? "chip chip-blue" : "chip chip-gray"}
              style={{ cursor: "pointer", fontSize: 11 }}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* Social / Channels */}
      <div className="card" style={{ padding: 16 }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
          <Globe size={16} style={{ color: "hsl(var(--purple))" }} />
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--text-primary))" }}>Canais online</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="input-wrap">
            <label className="input-label">Instagram</label>
            <input
              className="input"
              placeholder="@seuinsta"
              value={data.instagram}
              onChange={(e) => patch({ instagram: e.target.value })}
            />
          </div>
          <div className="input-wrap">
            <label className="input-label">Website</label>
            <input
              className="input"
              placeholder="https://seusite.com"
              value={data.website}
              onChange={(e) => patch({ website: e.target.value })}
            />
          </div>
        </div>
        {showWhatsapp && (
          <label className="flex items-center gap-3" style={{ marginTop: 12 }}>
            <input
              type="checkbox"
              checked={data.hasWhatsappOrders}
              onChange={(e) => patch({ hasWhatsappOrders: e.target.checked })}
              className="w-4 h-4 accent-[hsl(var(--green))]"
            />
            <span style={{ fontSize: 12, color: "hsl(var(--text-primary))" }}>
              <Phone size={12} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
              Aceitar pedidos por WhatsApp
            </span>
          </label>
        )}
      </div>
    </div>
  );
}
