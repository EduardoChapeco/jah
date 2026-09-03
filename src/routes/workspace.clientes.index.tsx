import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  TrendingUp,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Tag,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Archive,
  ExternalLink,
  MessageCircle,
  MoreVertical,
  Filter,
  DollarSign,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/state/states";
import { listCustomers, archiveCustomer } from "@/services/crm.functions";
import { listTeamMembers } from "@/services/admin-team.functions";
import { formatMoney } from "@/lib/money";
import { NewClientWizard } from "@/components/crm/NewClientWizard";

export const Route = createFileRoute("/workspace/clientes/")({
  head: () => ({ meta: [{ title: "Carteira de Clientes | Workspace" }] }),
  loader: async () => {
    const [customers, teamRes] = await Promise.all([
      listCustomers().catch(() => []),
      listTeamMembers().catch(() => []),
    ]);
    return {
      customers: customers || [],
      team: teamRes || [],
    };
  },
  component: CarteiraClientesPage,
});

function CarteiraClientesPage() {
  const { customers, team } = Route.useLoaderData();
  const router = useRouter();

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");

  // Filtros em memória
  const filteredCustomers = useMemo(() => {
    return customers.filter((c: any) => {
      // Busca textual
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = c.fullName?.toLowerCase().includes(q);
        const matchLegal = c.legalName?.toLowerCase().includes(q);
        const matchEmail = c.email?.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q);
        const matchDoc = c.document?.toLowerCase().includes(q);
        const matchCity = c.city?.toLowerCase().includes(q);
        if (!matchName && !matchLegal && !matchEmail && !matchPhone && !matchDoc && !matchCity) {
          return false;
        }
      }

      // Status
      if (statusFilter !== "all" && c.status !== statusFilter) {
        return false;
      }

      // Tipo (PF / PJ)
      if (kindFilter !== "all" && c.kind !== kindFilter) {
        return false;
      }

      // Canal de aquisição
      if (channelFilter !== "all" && c.channel !== channelFilter) {
        return false;
      }

      return true;
    });
  }, [customers, searchTerm, statusFilter, kindFilter, channelFilter]);

  // Contagens para métricas
  const totalCount = customers.length;
  const activeCount = customers.filter((c: any) => c.status === "active").length;
  const b2bCount = customers.filter((c: any) => c.kind === "company").length;
  const b2cCount = customers.filter((c: any) => c.kind !== "company").length;
  const docsExpiringCount = customers.filter(
    (c: any) => (c.docAlerts?.expired || 0) > 0 || (c.docAlerts?.soon || 0) > 0
  ).length;

  const handleArchive = async (customerId: string, name: string) => {
    if (!confirm(`Deseja arquivar o cliente "${name}"? Ele poderá ser restaurado futuramente.`)) {
      return;
    }
    try {
      await archiveCustomer({ data: { customerId } });
      toast.success("Cliente arquivado com sucesso.");
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Erro ao arquivar cliente.");
    }
  };

  const openWhatsApp = (phone?: string | null, name?: string) => {
    if (!phone) {
      toast.error("Cliente não possui telefone/WhatsApp cadastrado.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    const formatted = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const message = encodeURIComponent(`Olá ${name || ""}! Entramos em contato da equipe de atendimento.`);
    window.open(`https://wa.me/${formatted}?text=${message}`, "_blank");
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* ── 1. Banner de Separação: Funil Comercial vs. Carteira de Clientes ── */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>Funil de Vendas & CRM Comercial</span>
              <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                Pipeline de Negócios
              </Badge>
            </h4>
            <p className="text-xs text-muted-foreground">
              Acompanhe oportunidades abertas, propostas enviadas e etapas de fechamento no Kanban comercial.
            </p>
          </div>
        </div>

        <Link
          to="/workspace/comercial"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all shrink-0 hover:no-underline"
        >
          <span>Acessar Funil Comercial</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* ── 2. Header da Carteira de Clientes ── */}
      <PageHeader
        title="Carteira de Clientes"
        subtitle="Base cadastral master de clientes, empresas parceiras (B2B), documentos, histórico 360° e preferências."
        action={
          <Button
            size="sm"
            onClick={() => setIsWizardOpen(true)}
            className="h-9 px-4 rounded-xl font-bold text-xs bg-primary text-primary-foreground shadow-sm gap-1.5 cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Novo Cliente</span>
          </Button>
        }
      />

      {/* ── 3. Cards de Métricas da Carteira ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Total na Carteira
          </span>
          <div className="text-2xl font-black text-foreground">{totalCount}</div>
          <span className="text-[10px] text-muted-foreground">Clientes cadastrados</span>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Clientes Ativos
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {activeCount}
          </div>
          <span className="text-[10px] text-muted-foreground">Base apta para compras</span>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Pessoa Física (B2C)
          </span>
          <div className="text-2xl font-black text-foreground">{b2cCount}</div>
          <span className="text-[10px] text-muted-foreground">Passageiros e avulsos</span>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Empresas (B2B)
          </span>
          <div className="text-2xl font-black text-primary">{b2bCount}</div>
          <span className="text-[10px] text-muted-foreground">Contas corporativas</span>
        </div>

        <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
            <AlertTriangle className="size-3 text-amber-500" />
            Doc. com Alerta
          </span>
          <div className={`text-2xl font-black ${docsExpiringCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
            {docsExpiringCount}
          </div>
          <span className="text-[10px] text-muted-foreground">Passaportes ou CNHs</span>
        </div>
      </div>

      {/* ── 4. Barra de Filtros Avançados ── */}
      <div className="bg-card p-3 rounded-2xl border border-border space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {/* Busca Textual */}
          <div className="relative sm:col-span-1">
            <Search className="size-3.5 absolute left-3 top-3 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar nome, CPF, e-mail, cidade..."
              className="h-9 pl-9 rounded-xl text-xs bg-background"
            />
          </div>

          {/* Filtro Status */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
              <SelectValue placeholder="Status: Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Status: Todos</SelectItem>
              <SelectItem value="active">Apenas Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
              <SelectItem value="blocked">Bloqueados</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro Tipo PF/PJ */}
          <Select value={kindFilter} onValueChange={setKindFilter}>
            <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
              <SelectValue placeholder="Tipo: Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tipo: Todos (PF e PJ)</SelectItem>
              <SelectItem value="individual">Pessoa Física (B2C)</SelectItem>
              <SelectItem value="company">Empresa (PJ / B2B)</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro Canal */}
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="h-9 rounded-xl text-xs bg-background">
              <SelectValue placeholder="Canal: Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Canal: Todos</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="direct">Balcão / Direto</SelectItem>
              <SelectItem value="indicacao">Indicação</SelectItem>
              <SelectItem value="site">Site / E-commerce</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="google">Google</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resumo de Filtro e Limpeza Rápida */}
        {(searchTerm || statusFilter !== "all" || kindFilter !== "all" || channelFilter !== "all") && (
          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground px-1">
            <span>
              Exibindo <strong>{filteredCustomers.length}</strong> de <strong>{customers.length}</strong> clientes
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setKindFilter("all");
                setChannelFilter("all");
              }}
              className="h-7 text-xs font-semibold text-primary"
            >
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>

      {/* ── 5. Tabela de Clientes da Carteira ── */}
      {filteredCustomers.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-border bg-card/40 p-8 space-y-3">
          <Users className="size-12 mx-auto text-muted-foreground/30" />
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground">Nenhum cliente encontrado</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {searchTerm || statusFilter !== "all" || kindFilter !== "all" || channelFilter !== "all"
                ? "Nenhum cliente atende aos filtros atuais. Tente ajustar os parâmetros de busca."
                : "Sua carteira de clientes ainda está vazia. Comece cadastrando passageiros ou empresas parceiras."}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsWizardOpen(true)}
            className="rounded-xl font-bold text-xs gap-1.5 h-9 bg-primary text-primary-foreground"
          >
            <Plus className="size-4" />
            <span>Cadastrar Primeiro Cliente</span>
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[300px] text-xs font-bold text-foreground">Cliente / Razão Social</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Tipo</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Documento</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Contato / WhatsApp</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Localização</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Documentos</TableHead>
                <TableHead className="text-xs font-bold text-foreground">Status</TableHead>
                <TableHead className="text-right text-xs font-bold text-foreground">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((c: any) => {
                const isCompany = c.kind === "company";
                const hasExpiredDocs = (c.docAlerts?.expired || 0) > 0;
                const hasSoonDocs = (c.docAlerts?.soon || 0) > 0;

                return (
                  <TableRow key={c.id} className="hover:bg-muted/20 transition-colors">
                    {/* Nome & Razão Social */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`size-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isCompany
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {isCompany ? <Building2 className="size-4" /> : c.fullName[0]?.toUpperCase() || <User className="size-4" />}
                        </div>
                        <div className="min-w-0">
                          <Link
                            to="/workspace/clientes/$id"
                            params={{ id: c.id }}
                            className="font-bold text-xs text-foreground hover:text-primary hover:underline transition-colors block truncate"
                          >
                            {c.fullName}
                          </Link>
                          {c.legalName && c.legalName !== c.fullName && (
                            <span className="text-[10px] text-muted-foreground block truncate font-mono">
                              {c.legalName}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Tipo PF / PJ */}
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase">
                        {isCompany ? "PJ (B2B)" : "PF (B2C)"}
                      </Badge>
                    </TableCell>

                    {/* Documento CPF / CNPJ */}
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {c.document || "—"}
                      </span>
                    </TableCell>

                    {/* Contato & WhatsApp */}
                    <TableCell>
                      <div className="flex flex-col text-xs space-y-0.5">
                        {c.phone ? (
                          <button
                            type="button"
                            onClick={() => openWhatsApp(c.phone, c.fullName)}
                            className="font-mono text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="size-3 shrink-0" />
                            <span>{c.phone}</span>
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                        {c.email && (
                          <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                            {c.email}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Localização */}
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {c.city ? `${c.city} - ${c.state || "UF"}` : "—"}
                      </span>
                    </TableCell>

                    {/* Alertas de Documentos */}
                    <TableCell>
                      {hasExpiredDocs ? (
                        <Badge variant="destructive" className="text-[10px] font-bold py-0 h-5 gap-1">
                          <AlertTriangle className="size-2.5" />
                          <span>{c.docAlerts.expired} Vencido</span>
                        </Badge>
                      ) : hasSoonDocs ? (
                        <Badge variant="secondary" className="text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400 py-0 h-5 gap-1">
                          <Clock className="size-2.5" />
                          <span>{c.docAlerts.soon} Vence em breve</span>
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Regular</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant={c.status === "active" ? "secondary" : "outline"}
                        className={`text-[10px] font-semibold ${
                          c.status === "active"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "text-muted-foreground"
                        }`}
                      >
                        {c.status === "active" ? "Ativo" : c.status === "blocked" ? "Bloqueado" : "Inativo"}
                      </Badge>
                    </TableCell>

                    {/* Menu de Ações */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to="/workspace/clientes/$id"
                          params={{ id: c.id }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted/60 text-foreground hover:bg-muted transition-colors hover:no-underline"
                        >
                          Ficha 360°
                        </Link>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7 rounded-lg">
                              <MoreVertical className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl text-xs">
                            <DropdownMenuItem asChild>
                              <Link to="/workspace/clientes/$id" params={{ id: c.id }} className="cursor-pointer gap-2">
                                <FileText className="size-3.5" />
                                <span>Ver Ficha Completa</span>
                              </Link>
                            </DropdownMenuItem>

                            {c.phone && (
                              <DropdownMenuItem
                                onClick={() => openWhatsApp(c.phone, c.fullName)}
                                className="cursor-pointer gap-2 text-emerald-600"
                              >
                                <MessageCircle className="size-3.5" />
                                <span>Iniciar WhatsApp</span>
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              onClick={() => handleArchive(c.id, c.fullName)}
                              className="cursor-pointer gap-2 text-destructive"
                            >
                              <Archive className="size-3.5" />
                              <span>Arquivar Cliente</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── 6. Wizard Multi-Etapa de Novo Cliente ── */}
      <NewClientWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => router.invalidate()}
        teamMembers={team.map((m: any) => ({
          id: m.id || m.profile_id,
          fullName: m.profiles?.full_name || m.full_name || "Membro da Equipe",
          role: m.role,
        }))}
      />
    </div>
  );
}
