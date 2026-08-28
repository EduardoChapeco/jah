import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Users,
  Search,
  ArrowRight,
  Plus,
  ArrowLeftRight,
  CheckCircle,
  Archive,
  MessageSquare,
  Mail,
  Phone,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  FileText,
  ShieldCheck,
  Calendar,
  DollarSign,
  AlignLeft,
} from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";

import { PageHeader } from "@/components/commerce/page-header";
import { formatDateTime } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Surface } from "@/components/ui/surface";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/state/states";
import {
  listCustomers,
  createCustomer,
  listLeads,
  updateLeadStatus,
  promoteLeadToCustomer,
  updateLeadDetails,
} from "@/services/crm.functions";
import { listTeamMembers } from "@/services/admin-team.functions";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/datetime";

export const Route = createFileRoute("/workspace/clientes/")({
  head: () => ({ meta: [{ title: "Clientes & Leads" }] }),
  loader: async () => {
    const [customers, leadsRes, teamRes] = await Promise.all([
      listCustomers().catch(() => []),
      listLeads().catch(() => []),
      listTeamMembers().catch(() => []),
    ]);
    return {
      customers: customers || [],
      leads: leadsRes || [],
      team: teamRes || [],
    };
  },
  component: CustomersPage,
});

function CustomersPage() {
  const { customers, leads, team } = Route.useLoaderData();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("customers");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const selectedLead = leads.find((l: any) => l.id === selectedLeadId);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    tagsRaw: "",
    notes: "",
    taxId: "",
    isConsentLgpd: false,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email) {
      toast.error("Nome e E-mail são obrigatórios");
      return;
    }
    setIsSaving(true);
    try {
      const tags = form.tagsRaw
        ? form.tagsRaw
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      await createCustomer({
        data: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          tags,
          notes: form.notes,
        },
      });

      toast.success("Cliente cadastrado com sucesso!");
      setIsOpen(false);
      setForm({
        fullName: "",
        email: "",
        phone: "",
        tagsRaw: "",
        notes: "",
        taxId: "",
        isConsentLgpd: false,
      });
      router.invalidate();
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro inesperado");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (
    leadId: string,
    status: "new" | "contacted" | "converted" | "lost",
  ) => {
    try {
      await updateLeadStatus({ data: { leadId, status } });
      toast.success("Lead atualizado");
      router.invalidate();
    } catch {
      toast.error("Falha ao atualizar lead");
    }
  };

  const handlePromote = async (leadId: string) => {
    try {
      toast.loading("Promovendo lead a cliente...", { id: "promote" });
      await promoteLeadToCustomer({ data: { leadId } });
      toast.success("Lead promovido a cliente com sucesso!", { id: "promote" });
      router.invalidate();
    } catch {
      toast.error("Falha ao promover lead", { id: "promote" });
    }
  };

  // RFM Classification
  const [rfmFilter, setRfmFilter] = useState<"all" | "vip" | "recurring" | "new" | "at_risk">("all");

  const getCustomerRfm = (c: any) => {
    if (c.ltvCents >= 50000 || c.orderCount >= 5) {
      return {
        id: "vip",
        label: "VIP / Campeão",
        badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
        message: `Olá ${c.name}! Como cliente VIP especial da nossa loja, gostaríamos de compartilhar novidades exclusivas em primeira mão!`,
      };
    }
    if (c.orderCount >= 2) {
      return {
        id: "recurring",
        label: "Recorrente",
        badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
        message: `Olá ${c.name}! Agradecemos por ser um cliente fiel da nossa loja. Confira nossas novidades da semana!`,
      };
    }
    if (c.orderCount === 1) {
      return {
        id: "new",
        label: "Novo Cliente",
        badgeClass: "bg-info/15 text-info dark:text-info border-info/30",
        message: `Olá ${c.name}! Esperamos que tenha gostado da sua primeira compra conosco. Estamos à disposição para qualquer dúvida!`,
      };
    }
    return {
      id: "at_risk",
      label: "Em Risco / Inativo",
      badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
      message: `Olá ${c.name}! Sentimos sua falta. Preparamos uma condição especial para você conferir nossos novos produtos!`,
    };
  };

  // Filter customers by search term & RFM
  const filteredCustomers = customers.filter((c: any) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tags.some((t: string) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (rfmFilter === "all") return true;
    const rfm = getCustomerRfm(c);
    return rfm.id === rfmFilter;
  });

  // Group leads for Kanban Columns
  const leadsNew = leads.filter((l: any) => l.status === "new");
  const leadsContacted = leads.filter((l: any) => l.status === "contacted");
  const leadsConverted = leads.filter((l: any) => l.status === "converted");
  const leadsLost = leads.filter((l: any) => l.status === "lost");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM"
        title="Clientes & Leads"
        actions={
          <Button size="sm" onClick={() => setIsOpen(true)} className="rounded-xl font-bold text-xs gap-1.5">
            <Plus className="size-4" aria-hidden />
            Cadastrar Cliente
          </Button>
        }
      />

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="sm:max-w-md p-6 bg-background overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-border/40">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <UserCheck className="size-5 text-primary" />
              <span>Novo Cliente</span>
            </SheetTitle>
            <SheetDescription className="text-xs">
              Cadastre os dados e habilite o histórico e segmentação RFM no CRM.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Nome Completo *</Label>
              <Input
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Ex: João da Silva"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">CPF ou CNPJ</Label>
              <Input
                value={form.taxId}
                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                placeholder="000.000.000-00"
                className="h-9 text-xs font-mono rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">E-mail *</Label>
              <Input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="joao@email.com"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">WhatsApp / Telefone</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(49) 99999-9999"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Tags (Separadas por vírgula)</Label>
              <Input
                value={form.tagsRaw}
                onChange={(e) => setForm({ ...form, tagsRaw: e.target.value })}
                placeholder="atacado, vip, eventos"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Anotações do CRM</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Preferências de compra, observações especiais..."
                className="text-xs rounded-xl resize-none h-20 leading-relaxed"
              />
            </div>

            <SheetFooter className="pt-3">
              <Button type="submit" disabled={isSaving} className="w-full rounded-xl font-bold text-xs h-10">
                {isSaving ? "Salvando..." : "Cadastrar Cliente"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={!!selectedLeadId} onOpenChange={(open) => !open && setSelectedLeadId(null)}>
        {selectedLead && (
          <LeadDetailsSheetContent lead={selectedLead} onClose={() => setSelectedLeadId(null)} />
        )}
      </Sheet>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card border border-border/70 rounded-2xl px-4 py-3 mb-6">
          <TabsList className="grid grid-cols-3 h-9 w-auto min-w-[320px]">
            <TabsTrigger value="customers" className="text-xs font-bold">
              Clientes CRM ({filteredCustomers.length})
            </TabsTrigger>
            <TabsTrigger value="kanban" className="text-xs font-bold">
              Funil de Leads ({leads.length})
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-xs font-bold">
              Mensagens
            </TabsTrigger>
          </TabsList>

          {activeTab === "customers" && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="search"
                  placeholder="Buscar cliente ou tag..."
                  className="pl-8 text-xs w-full rounded-xl h-9 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Customers CRM List */}
        <TabsContent value="customers" className="space-y-4">
          {/* Filtros Rápidos de Segmentação RFM */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: "Todos os Clientes" },
              { id: "vip", label: "VIP / Campeões" },
              { id: "recurring", label: "Recorrentes" },
              { id: "new", label: "Novos" },
              { id: "at_risk", label: "Em Risco (Inativos)" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRfmFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  rfmFilter === tab.id
                    ? "bg-foreground text-background"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredCustomers.length === 0 ? (
            <EmptyState title="Nenhum cliente encontrado neste segmento" />
          ) : (
            <div className="bg-card border border-border/70 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 border-b border-border/60">
                      <TableHead className="font-bold text-xs">Cliente</TableHead>
                      <TableHead className="font-bold text-xs">Segmento RFM</TableHead>
                      <TableHead className="text-center font-bold text-xs">Pedidos</TableHead>
                      <TableHead className="text-right font-bold text-xs">LTV Total</TableHead>
                      <TableHead className="font-bold text-xs">Tags</TableHead>
                      <TableHead className="text-right font-bold text-xs">Ações Rápidas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((c: any) => {
                      const rfm = getCustomerRfm(c);
                      const whatsappLink = c.phone
                        ? `https://wa.me/${c.phone.replace(/\D/g, "")}?text=${encodeURIComponent(rfm.message)}`
                        : null;

                      return (
                        <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <div className="font-bold text-foreground text-xs flex items-center gap-2">
                              {c.name}
                              {c.isConsentLgpd && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 h-4 px-1"
                                >
                                  LGPD
                                </Badge>
                              )}
                            </div>
                            {c.email && (
                              <p className="text-[10px] text-muted-foreground truncate">
                                {c.email}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] font-bold ${rfm.badgeClass}`}>
                              {rfm.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-xs font-mono font-bold">
                            {c.orderCount}
                          </TableCell>
                          <TableCell className="text-right text-xs font-black text-foreground font-mono">
                            {formatMoney(c.ltvCents)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {c.tags.length > 0 ? (
                                c.tags.slice(0, 2).map((tag: string) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-[10px] h-5 border-border/30"
                                  >
                                    {tag}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {whatsappLink && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  asChild
                                  className="size-7 rounded-lg text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                                  title="Enviar mensagem contextual no WhatsApp"
                                >
                                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                                    <Phone className="size-3.5" />
                                  </a>
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="h-7 text-xs font-bold rounded-lg"
                              >
                                <Link to="/workspace/clientes/$id" params={{ id: c.id }}>
                                  Detalhes
                                  <ArrowRight className="ml-1 size-3" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Funil Kanban Pipeline */}
        <TabsContent value="kanban" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            {/* Column 1: New */}
            <div className="bg-surface-paper   rounded-xl overflow-hidden">
              <div className="p-3 pb-2  bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-foreground">Novos Leads</span>
                  <Badge variant="secondary" className="h-5 text-[10px]">
                    {leadsNew.length}
                  </Badge>
                </div>
              </div>
              <div className="p-2 space-y-2">
                {leadsNew.map((l: any) => (
                  <LeadCard
                    key={l.id}
                    lead={l}

                    onStatusChange={handleStatusChange}
                    onPromote={handlePromote}
                  />
                ))}
                {leadsNew.length === 0 && (
                  <div className="p-6 text-center text-[10px] text-muted-foreground border border-dashed bg-card/50">
                    Nenhum lead novo.
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Contacted */}
            <div className="bg-surface-paper   rounded-xl overflow-hidden">
              <div className="p-3 pb-2  bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-warning">Em Contato</span>
                  <Badge
                    variant="warning"
                    className="h-5 text-[10px] bg-warning/15 text-warning border-warning/30"
                  >
                    {leadsContacted.length}
                  </Badge>
                </div>
              </div>
              <div className="p-2 space-y-2">
                {leadsContacted.map((l: any) => (
                  <LeadCard
                    key={l.id}
                    lead={l}

                    onStatusChange={handleStatusChange}
                    onPromote={handlePromote}
                  />
                ))}
                {leadsContacted.length === 0 && (
                  <div className="p-6 text-center text-[10px] text-muted-foreground border border-dashed bg-card/50">
                    Nenhum em contato.
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Converted */}
            <div className="bg-surface-paper   rounded-xl overflow-hidden">
              <div className="p-3 pb-2  bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-success">Convertidos</span>
                  <Badge
                    variant="outline"
                    className="h-5 text-[10px] bg-success/15 text-success border-success/30"
                  >
                    {leadsConverted.length}
                  </Badge>
                </div>
              </div>
              <div className="p-2 space-y-2">
                {leadsConverted.map((l: any) => (
                  <LeadCard
                    key={l.id}
                    lead={l}

                    onStatusChange={handleStatusChange}
                    onPromote={handlePromote}
                  />
                ))}
                {leadsConverted.length === 0 && (
                  <div className="p-6 text-center text-[10px] text-muted-foreground border border-dashed bg-card/50">
                    Nenhum convertido.
                  </div>
                )}
              </div>
            </div>

            {/* Column 4: Lost */}
            <div className="bg-surface-paper   rounded-xl overflow-hidden">
              <div className="p-3 pb-2  bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-muted-foreground">
                    Arquivados
                  </span>
                  <Badge variant="outline" className="h-5 text-[10px]">
                    {leadsLost.length}
                  </Badge>
                </div>
              </div>
              <div className="p-2 space-y-2">
                {leadsLost.map((l: any) => (
                  <LeadCard
                    key={l.id}
                    lead={l}

                    onStatusChange={handleStatusChange}
                    onPromote={handlePromote}
                  />
                ))}
                {leadsLost.length === 0 && (
                  <div className="p-6 text-center text-[10px] text-muted-foreground border border-dashed bg-card/50">
                    Nenhum arquivado.
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Message Logs */}
        <TabsContent value="messages" className="space-y-4">
          {leads.length === 0 ? (
            <EmptyState title="Nenhuma mensagem registrada" />
          ) : (
            <div className="bg-surface-paper  rounded-xl  overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 ">
                      <TableHead>Remetente</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((l: any) => (
                      <TableRow key={l.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-semibold text-sm">
                          <div>
                            <p>{l.full_name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{l.email}</p>
                            {l.phone && (
                              <p className="text-[10px] text-muted-foreground font-mono">
                                {l.phone}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs leading-relaxed max-w-md whitespace-pre-wrap py-3 text-muted-foreground">
                          {l.message || <span className="italic">Sem mensagem</span>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <span className="font-semibold text-xs whitespace-nowrap text-muted-foreground block text-right">
                            {formatDateTime(l.created_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              l.status === "new"
                                ? "default"
                                : l.status === "contacted"
                                  ? "warning"
                                  : l.status === "converted"
                                    ? "success"
                                    : "outline"
                            }
                            className="text-[10px] capitalize"
                          >
                            {l.status === "new"
                              ? "Novo"
                              : l.status === "contacted"
                                ? "Em Contato"
                                : l.status === "converted"
                                  ? "Convertido"
                                  : "Perdido"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface LeadCardProps {
  lead: any;
  onStatusChange: (leadId: string, status: any) => void;
  onPromote: (leadId: string) => void;
}

function LeadCard({ lead, onStatusChange, onPromote }: LeadCardProps) {
  return (
    <div className="bg-background   hover:border-primary/50 transition-colors rounded-xl p-3 space-y-3 relative group">
      <div className="space-y-1">
        <h4 className="text-xs font-black tracking-tight text-foreground truncate">
          {lead.full_name}
        </h4>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 truncate">
          <Mail className="size-3 text-muted-foreground/75" />
          {lead.email}
        </p>
        {lead.phone && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 truncate">
            <Phone className="size-3 text-muted-foreground/75" />
            {lead.phone}
          </p>
        )}
      </div>

      {lead.message && (
        <div className="p-2 bg-muted/40  text-[10px] text-muted-foreground leading-relaxed line-clamp-3">
          {lead.message}
        </div>
      )}

      <div className="flex items-center justify-between gap-1 pt-1.5 ">
        {/* Stage controls */}
        <div className="flex items-center gap-0.5">
          {lead.status !== "new" && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground"
              onClick={() => {
                const prevStatus =
                  lead.status === "contacted"
                    ? "new"
                    : lead.status === "converted"
                      ? "contacted"
                      : "contacted";
                onStatusChange(lead.id, prevStatus);
              }}
              title="Voltar Coluna"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
          )}
          {lead.status !== "lost" && lead.status !== "converted" && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground"
              onClick={() => {
                const nextStatus = lead.status === "new" ? "contacted" : "converted";
                onStatusChange(lead.id, nextStatus);
              }}
              title="Avançar Coluna"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          )}
        </div>

        {/* Promotion Action */}
        <div className="flex items-center gap-1">
          {lead.status !== "converted" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Arquivar Lead"
              >
                <Archive className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-primary hover:bg-primary/10"
                title="Promover a Cliente"
              >
                <UserCheck className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LeadDetailsSheetContent({
  lead,
  team = [],
  onClose,
}: {
  lead: any;
  team?: any[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    notes: lead.notes || "",
    source: lead.source || "",
    estimated_value_cents: (lead.estimated_value_cents / 100).toFixed(2) || "",
    follow_up_at: lead.follow_up_at ? new Date(lead.follow_up_at).toISOString().split("T")[0] : "",
    assigned_to: lead.assigned_to || "unassigned",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateLeadDetails({
        data: {
          leadId: lead.id,
          notes: form.notes || null,
          source: form.source || null,
          estimated_value_cents: form.estimated_value_cents
            ? Math.round(parseFloat(form.estimated_value_cents) * 100)
            : null,
          follow_up_at: form.follow_up_at ? new Date(form.follow_up_at).toISOString() : null,
          assigned_to: form.assigned_to === "unassigned" ? null : form.assigned_to,
        },
      });
      toast.success("Lead atualizado");
      router.invalidate();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SheetContent side="right" className="sm:max-w-md p-0 overflow-y-auto">
      <SheetHeader className="px-6 py-4  bg-muted/30">
        <SheetTitle className="flex items-center gap-2 text-xl font-bold">
          <UserCheck className="size-5 text-primary" />
          Detalhes do Lead
        </SheetTitle>
        <SheetDescription>{lead.full_name}</SheetDescription>
      </SheetHeader>

      <form onSubmit={handleSave} className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
              <Users className="size-3.5" /> Responsável
            </Label>
            <Select
              value={form.assigned_to}
              onValueChange={(v) => setForm({ ...form, assigned_to: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sem responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Sem responsável</SelectItem>
                {team.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="size-3.5" /> Valor Estimado (R$)
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.estimated_value_cents}
              onChange={(e) => setForm({ ...form, estimated_value_cents: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-3.5" /> Agendar Follow-up
            </Label>
            <Input
              type="date"
              value={form.follow_up_at}
              onChange={(e) => setForm({ ...form, follow_up_at: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
              <Search className="size-3.5" /> Origem / Source
            </Label>
            <Input
              type="text"
              placeholder="Ex: Instagram, Indicação, Feira..."
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
              <AlignLeft className="size-3.5" /> Anotações do Vendedor
            </Label>
            <Textarea
              placeholder="Preferências, dores, próximas etapas..."
              className="min-h-[100px]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {lead.message && (
            <div className="space-y-1 pt-4 ">
              <Label className="text-[10px] uppercase text-muted-foreground">
                Mensagem Original (Contato)
              </Label>
              <div className="text-sm p-3 bg-muted/30 rounded-xl  text-foreground/80 whitespace-pre-wrap">
                {lead.message}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="pt-4 ">
          <Button type="button" variant="ghost">
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </SheetFooter>
      </form>
    </SheetContent>
  );
}
