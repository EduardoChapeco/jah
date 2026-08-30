import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Mail,
  User,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Info,
  RefreshCw,
  Building2,
} from "lucide-react";
import {
  listTeamMembers,
  inviteTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
} from "@/services/admin-team.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/workspace/configuracoes/equipe")({
  head: () => ({
    meta: [
      { title: "Equipe & Permissões de Acesso | Workspace Wider" },
      { name: "description", content: "Gerencie os membros, colaboradores e níveis de permissão da sua loja com isolamento total." },
    ],
  }),
  loader: async () => {
    try {
      const members = await listTeamMembers();
      return { members: members || [] };
    } catch {
      return { members: [] };
    }
  },
  component: WorkspaceTeamPage,
});

const ROLE_DEFINITIONS: Record<
  string,
  { label: string; description: string; color: string }
> = {
  owner: {
    label: "Proprietário(a)",
    description: "Acesso total irrestrito, faturamento e gestão da loja",
    color: "bg-primary/15 text-primary border-primary/30",
  },
  admin: {
    label: "Administrador",
    description: "Gestão operacional completa, produtos, pedidos e equipe",
    color: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  },
  manager: {
    label: "Gerente",
    description: "Operação do catálogo, pedidos, estoque e relatórios",
    color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  seller: {
    label: "Vendedor / PDV",
    description: "Frente de caixa, criação de pedidos e atendimento",
    color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  finance: {
    label: "Financeiro",
    description: "Extratos, fluxo de caixa, pagamentos e conciliação",
    color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  stock: {
    label: "Estoque & Expedição",
    description: "Controle de inventário, reposição e despacho de entregas",
    color: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
  },
  content: {
    label: "Marketing & Conteúdo",
    description: "Criação de banners, histórias, cupons e vitrines",
    color: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  },
  support: {
    label: "Suporte ao Cliente",
    description: "Visualização de pedidos e suporte pós-venda",
    color: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
  },
};

export default function WorkspaceTeamPage() {
  const { members } = Route.useLoaderData();
  const router = useRouter();

  // Estados do Modal de Convite
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<
    "admin" | "manager" | "seller" | "finance" | "content" | "stock" | "support"
  >("seller");
  const [isInviting, setIsInviting] = useState(false);

  // Estados de Remoção
  const [memberToRemove, setMemberToRemove] = useState<any | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) {
      toast.error("Preencha o nome e o e-mail do colaborador.");
      return;
    }

    setIsInviting(true);
    try {
      await inviteTeamMember({
        data: {
          email: inviteEmail.trim(),
          fullName: inviteName.trim(),
          role: inviteRole,
        },
      });

      toast.success("Colaborador vinculado à sua loja com sucesso!");
      setIsInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("seller");
      router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao convidar colaborador.");
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (profileId: string, newRole: any) => {
    try {
      await updateTeamMemberRole({
        data: {
          id: profileId,
          role: newRole,
        },
      });
      toast.success("Cargo do colaborador atualizado com sucesso!");
      router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao alterar permissão.");
    }
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    setIsRemoving(true);
    try {
      await removeTeamMember({
        data: {
          profileId: memberToRemove.id,
        },
      });
      toast.success("Acesso do colaborador revogado com sucesso!");
      setMemberToRemove(null);
      router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao remover colaborador.");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="size-6 text-primary" />
            <span>Equipe & Colaboradores</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie os acessos, cargos e operadores da sua loja com isolamento seguro multi-tenant.
          </p>
        </div>

        <Button
          onClick={() => setIsInviteOpen(true)}
          className="h-10 rounded-xl font-bold text-xs gap-2 shadow-xs cursor-pointer"
        >
          <UserPlus className="size-4" />
          <span>Convidar Colaborador</span>
        </Button>
      </div>

      {/* ── Banner de Isolamento Multi-Tenant & Zero-Trust ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
        <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
          <ShieldCheck className="size-5" />
        </div>
        <div className="space-y-0.5 flex-1 min-w-0">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
            <span>Privacidade & Isolamento Estrito de Workspace</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary font-bold">
              Zero-Trust RLS
            </Badge>
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Cada colaborador vinculado abaixo terá permissões aplicadas <strong>exclusivamente para esta loja</strong>.
            Nenhum dado, pedido, faturamento ou catálogo de outros comerciantes é acessível.
          </p>
        </div>
      </div>

      {/* ── Tabela de Colaboradores ── */}
      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <span>Membros Ativos</span>
            <Badge variant="secondary" className="text-[11px] font-bold">
              {members.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.invalidate()}
            className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="size-3.5" />
            <span>Atualizar</span>
          </Button>
        </div>

        {members.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="size-12 rounded-2xl bg-muted text-muted-foreground mx-auto flex items-center justify-center">
              <Users className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">Nenhum colaborador encontrado</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Convide os membros da sua equipe para delegar funções como frente de caixa, estoque e financeiro.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {members.map((m: any) => {
              const roleInfo = ROLE_DEFINITIONS[m.role] || {
                label: m.role,
                description: "Cargo operacional",
                color: "bg-muted text-muted-foreground border-border",
              };
              const isOwner = m.role === "owner";

              return (
                <div
                  key={m.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden border border-primary/20">
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt={m.full_name} className="size-full object-cover" />
                      ) : (
                        <span>{(m.full_name || "C").charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-foreground truncate">
                          {m.full_name || "Colaborador sem nome"}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0.5 font-bold rounded-lg border ${roleInfo.color}`}
                        >
                          {roleInfo.label}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate font-mono">
                        {m.email || "E-mail não público"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!isOwner ? (
                      <>
                        <Select
                          defaultValue={m.role}
                          onValueChange={(newVal) => handleRoleChange(m.id, newVal)}
                        >
                          <SelectTrigger className="h-8 text-xs font-semibold rounded-xl w-36 bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {Object.entries(ROLE_DEFINITIONS)
                              .filter(([k]) => k !== "owner")
                              .map(([key, item]) => (
                                <SelectItem key={key} value={key} className="text-xs">
                                  {item.label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMemberToRemove(m)}
                          className="size-8 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                          title="Revogar Acesso"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </>
                    ) : (
                      <span className="text-[11px] text-muted-foreground font-medium px-2 py-1 bg-muted/30 rounded-lg">
                        Proprietário Principal
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal de Convite de Colaborador ── */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader className="space-y-1 text-left">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2">
              <UserPlus className="size-5" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">Convidar Colaborador</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Vincule um novo membro à equipe da sua loja definindo seu papel de atuação.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInviteSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-bold text-foreground">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  required
                  placeholder="Ex: João da Silva"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="pl-9 h-10 rounded-xl text-xs bg-muted/30"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-bold text-foreground">E-mail de Acesso</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  required
                  type="email"
                  placeholder="colaborador@empresa.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="pl-9 h-10 rounded-xl text-xs bg-muted/30"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <Label className="text-xs font-bold text-foreground">Cargo & Nível de Permissão</Label>
              <Select
                value={inviteRole}
                onValueChange={(v: any) => setInviteRole(v)}
              >
                <SelectTrigger className="h-10 rounded-xl text-xs bg-muted/30 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl max-h-64">
                  {Object.entries(ROLE_DEFINITIONS)
                    .filter(([k]) => k !== "owner")
                    .map(([key, item]) => (
                      <SelectItem key={key} value={key} className="text-xs py-2">
                        <div className="space-y-0.5">
                          <p className="font-bold text-foreground">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground">{item.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-[11px] text-muted-foreground flex items-start gap-2">
              <Info className="size-4 text-primary shrink-0 mt-0.5" />
              <span>O colaborador receberá acesso imediato e restrito única e exclusivamente à sua loja.</span>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteOpen(false)}
                className="h-10 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isInviting}
                className="h-10 rounded-xl text-xs font-bold bg-foreground text-background hover:opacity-90"
              >
                {isInviting ? "Vinculando..." : "Convidar para a Equipe"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Diálogo de Confirmação de Remoção ── */}
      <AlertDialog
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent className="rounded-3xl p-6 sm:max-w-md">
          <AlertDialogHeader className="space-y-2 text-left">
            <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-1">
              <ShieldAlert className="size-6" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Revogar Acesso do Colaborador?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Tem certeza que deseja revogar o acesso de <strong>{memberToRemove?.full_name}</strong> ({memberToRemove?.email})? O colaborador perderá imediatamente o acesso ao painel desta loja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4 gap-2">
            <AlertDialogCancel className="h-10 rounded-xl text-xs font-semibold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              disabled={isRemoving}
              className="h-10 rounded-xl text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Revogando..." : "Revogar Acesso"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
