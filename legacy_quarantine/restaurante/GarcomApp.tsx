import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  UtensilsCrossed, ShoppingCart, CheckCircle, ArrowLeft, Bell,
  Plus, X, CreditCard, Clock
} from "lucide-react";
import { toast } from "sonner";

interface Mesa {
  id: string;
  numero: number;
  status: "livre" | "ocupada" | "aguardando_conta";
  capacidade?: number;
}

interface ItemPedido {
  nome: string;
  quantidade: number;
  preco: number;
}

export default function GarcomApp() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeView, setActiveView] = useState<"mesas" | "mesa">("mesas");
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [itens, setItens] = useState<ItemPedido[]>([]);

  const { data: mesas } = useQuery({
    queryKey: ["garcom-mesas", companyId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("pedidos")
        .select("id, metadata")
        .eq("company_id", companyId!)
        .in("status", ["pendente", "em_preparo"])
        .order("created_at");
      // Return mock mesas since table structure may vary
      return [
        { id: "1", numero: 1, status: "livre" as const, capacidade: 4 },
        { id: "2", numero: 2, status: "ocupada" as const, capacidade: 2 },
        { id: "3", numero: 3, status: "aguardando_conta" as const, capacidade: 6 },
        { id: "4", numero: 4, status: "livre" as const, capacidade: 4 },
        { id: "5", numero: 5, status: "livre" as const, capacidade: 2 },
        { id: "6", numero: 6, status: "ocupada" as const, capacidade: 4 },
      ] as Mesa[];
    },
    enabled: !!companyId,
  });

  const STATUS_MESA_STYLE: Record<string, { color: string; label: string }> = {
    livre: { color: "hsl(140 60% 50% / .15)", label: "Livre" },
    ocupada: { color: "hsl(var(--primary) / .12)", label: "Ocupada" },
    aguardando_conta: { color: "hsl(40 80% 50% / .15)", label: "Conta" },
  };

  const totalPedido = itens.reduce((sum, i) => sum + i.quantidade * i.preco, 0);

  const addItem = (nome: string, preco: number) => {
    setItens(prev => {
      const existing = prev.find(i => i.nome === nome);
      if (existing) return prev.map(i => i.nome === nome ? { ...i, quantidade: i.quantidade + 1 } : i);
      return [...prev, { nome, quantidade: 1, preco }];
    });
  };

  const removeItem = (nome: string) => {
    setItens(prev => prev.filter(i => i.nome !== nome));
  };

  const enviarPedido = async () => {
    if (!selectedMesa || itens.length === 0) return;
    const { error } = await (supabase as any).from("pedidos").insert({
      company_id: companyId,
      user_id: user?.id,
      status: "pendente",
      total: totalPedido,
      metadata: { mesa: selectedMesa.numero, itens },
    });
    if (!error) {
      toast.success(`Pedido Mesa ${selectedMesa.numero} enviado!`);
      setItens([]);
      setActiveView("mesas");
      qc.invalidateQueries({ queryKey: ["garcom-mesas"] });
    } else toast.error("Erro ao enviar pedido");
  };

  // Mock menu items
  const menuItems = [
    { nome: "X-Burguer", preco: 28 }, { nome: "Batata Frita", preco: 12 },
    { nome: "Refrigerante", preco: 8 }, { nome: "Suco", preco: 10 },
    { nome: "Água", preco: 5 }, { nome: "Pizza P", preco: 35 },
  ];

  if (activeView === "mesa" && selectedMesa) {
    return (
      <div style={{ minHeight: "100vh", background: "hsl(var(--bg-base))", display: "flex", flexDirection: "column" }}>
        <header style={{
          position: "sticky", top: 0, zIndex: 10,
          background: "hsl(var(--bg-surface))", borderBottom: "1px solid hsl(var(--b1))",
          padding: "0 16px", height: 56, display: "flex", alignItems: "center", gap: 12,
        }}>
          <button className="gl ghost sm" onClick={() => { setActiveView("mesas"); setItens([]); }}>
            <ArrowLeft size={14} />
          </button>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Mesa {selectedMesa.numero}</div>
        </header>

        <div style={{ flex: 1, padding: 16, maxWidth: 600, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "hsl(var(--text-secondary))" }}>Cardápio</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {menuItems.map(item => (
              <button key={item.nome} className="gl ghost sm" style={{ justifyContent: "space-between" }} onClick={() => addItem(item.nome, item.preco)}>
                <span>{item.nome}</span>
                <span style={{ color: "hsl(var(--primary))", fontWeight: 700 }}>R$ {item.preco}</span>
              </button>
            ))}
          </div>

          {itens.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 13, color: "hsl(var(--text-secondary))", marginTop: 8 }}>Pedido atual</div>
              {itens.map(item => (
                <div key={item.nome} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 14px", background: "hsl(var(--bg-surface))",
                  borderRadius: "var(--r3)", border: "1px solid hsl(var(--b1))",
                }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{item.quantidade}×</span>
                    <span style={{ fontSize: 13, marginLeft: 6 }}>{item.nome}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>R$ {(item.quantidade * item.preco).toFixed(2)}</span>
                    <button className="gl ghost sm" onClick={() => removeItem(item.nome)}><X size={12} /></button>
                  </div>
                </div>
              ))}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 16px", background: "hsl(var(--primary) / .08)",
                borderRadius: "var(--r4)", border: "1px solid hsl(var(--primary) / .2)",
              }}>
                <span style={{ fontWeight: 700 }}>Total</span>
                <span style={{ fontWeight: 700, fontSize: 18, color: "hsl(var(--primary))" }}>R$ {totalPedido.toFixed(2)}</span>
              </div>
              <button className="gl" style={{ width: "100%", justifyContent: "center", padding: "12px" }} onClick={enviarPedido}>
                <ShoppingCart size={14} /> Enviar Pedido para Cozinha
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "hsl(var(--bg-base))", display: "flex", flexDirection: "column" }}>
      <header style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "hsl(var(--bg-surface))", borderBottom: "1px solid hsl(var(--b1))",
        padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="gl ghost sm" onClick={() => navigate(-1)}><ArrowLeft size={14} /></button>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>App do Garçom</div>
            <div style={{ fontSize: 10, color: "hsl(var(--text-tertiary))", textTransform: "uppercase", letterSpacing: ".08em" }}>✦ Mesas & Pedidos</div>
          </div>
        </div>
        <button className="gl ghost sm"><Bell size={14} /></button>
      </header>

      <div style={{ flex: 1, padding: 16, maxWidth: 600, width: "100%", margin: "0 auto" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "hsl(var(--text-secondary))", marginBottom: 12 }}>
          Mapa de Mesas
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {mesas?.map(mesa => {
            const s = STATUS_MESA_STYLE[mesa.status];
            return (
              <button
                key={mesa.id}
                onClick={() => { setSelectedMesa(mesa); setActiveView("mesa"); }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  padding: "20px 8px", borderRadius: "var(--r4)", border: "1px solid hsl(var(--b1))",
                  cursor: "pointer", transition: "all .15s", background: s.color,
                }}
              >
                <UtensilsCrossed size={20} style={{ marginBottom: 6, opacity: .7 }} />
                <span style={{ fontWeight: 700, fontSize: 16 }}>Mesa {mesa.numero}</span>
                <span style={{ fontSize: 10, marginTop: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", opacity: .7 }}>{s.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          {Object.entries({ livre: "Livre", ocupada: "Ocupada", aguardando_conta: "Aguardando conta" }).map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "hsl(var(--text-tertiary))" }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: STATUS_MESA_STYLE[k].color, border: "1px solid hsl(var(--b1))" }} />
              {v}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
