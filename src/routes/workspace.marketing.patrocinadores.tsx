import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Megaphone,
  Plus,
  Trash2,
  ExternalLink,
  Sliders,
  CheckCircle2,
  Loader2,
  Building2,
  Star,
  Eye,
} from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  listWorkspaceSponsors,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  type SponsorDTO,
} from "@/services/news.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/workspace/marketing/patrocinadores")({
  head: () => ({ meta: [{ title: "Gestão de Patrocinadores & Anunciantes | Wider Workspace" }] }),
  loader: async () => {
    const sponsors = await listWorkspaceSponsors().catch(() => []);
    return { sponsors };
  },
  component: WorkspacePatrocinadoresPage,
});

function WorkspacePatrocinadoresPage() {
  const { sponsors: initialSponsors } = Route.useLoaderData();
  const [sponsors, setSponsors] = useState<SponsorDTO[]>(initialSponsors || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [tier, setTier] = useState<"gold" | "silver" | "standard" | "supporter">("standard");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Saiba Mais");
  const [description, setDescription] = useState("");

  const refreshSponsors = async () => {
    const updated = await listWorkspaceSponsors().catch(() => []);
    setSponsors(updated);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName("");
    setTier("standard");
    setLogoUrl("");
    setBannerUrl("");
    setWebsiteUrl("");
    setCtaLabel("Saiba Mais");
    setDescription("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sp: SponsorDTO) => {
    setEditingId(sp.id);
    setName(sp.name);
    setTier(sp.tier);
    setLogoUrl(sp.logo_url || "");
    setBannerUrl(sp.banner_url || "");
    setWebsiteUrl(sp.website_url || "");
    setCtaLabel(sp.cta_label || "Saiba Mais");
    setDescription(sp.description || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Informe o nome do patrocinador.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateSponsor({
          data: {
            id: editingId,
            name: name.trim(),
            tier,
            logo_url: logoUrl.trim() || null,
            banner_url: bannerUrl.trim() || null,
            website_url: websiteUrl.trim() || null,
            cta_label: ctaLabel.trim(),
            description: description.trim() || null,
          },
        });
        toast.success("Patrocinador atualizado com sucesso!");
      } else {
        await createSponsor({
          data: {
            name: name.trim(),
            tier,
            logo_url: logoUrl.trim() || undefined,
            banner_url: bannerUrl.trim() || undefined,
            website_url: websiteUrl.trim() || undefined,
            cta_label: ctaLabel.trim(),
            description: description.trim() || undefined,
          },
        });
        toast.success("Novo patrocinador cadastrado!");
      }
      setIsModalOpen(false);
      await refreshSponsors();
    } catch (err: unknown) {
      toast.error(
        (err instanceof Error ? err.message : String(err)) || "Erro ao salvar patrocinador.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover este patrocinador?")) return;
    try {
      await deleteSponsor({ data: { id } });
      toast.success("Patrocinador removido com sucesso.");
      await refreshSponsors();
    } catch {
      toast.error("Erro ao remover patrocinador.");
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Marketing & Monetização
            </span>
            <span className="text-xs text-muted-foreground font-mono">Espaços Comerciais</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground mt-1">
            Patrocinadores & Anunciantes
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Cadastre parceiros e marcas anunciantes para exibição em matérias, posts e stories com medição de retorno.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleOpenCreate} className="rounded-2xl font-bold gap-2 text-xs">
            <Plus className="size-4" />
            <span>Novo Patrocinador</span>
          </Button>
        </div>
      </div>

      {/* Grid de Patrocinadores */}
      {sponsors.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border-0 bg-card/50 space-y-4">
          <Megaphone className="size-12 text-muted-foreground/40 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Nenhum patrocinador cadastrado</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Cadastre marcas e comércios parceiros para veicular propagandas nativas com métricas reais de visualização.
            </p>
          </div>
          <Button onClick={handleOpenCreate} className="rounded-2xl font-bold text-xs">
            <Plus className="size-4 mr-1.5" />
            <span>Cadastrar Primeiro Patrocinador</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sponsors.map((sp) => (
            <div
              key={sp.id}
              className="p-5 rounded-3xl  bg-card hover-elevate transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      sp.tier === "gold"
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        : sp.tier === "silver"
                          ? "bg-zinc-500/15 text-zinc-600 dark:text-zinc-300 border border-zinc-500/30"
                          : "bg-primary/10 text-primary border border-primary/20"
                    }`}
                  >
                    {sp.tier === "gold"
                      ? "★ Master Gold"
                      : sp.tier === "silver"
                        ? "Silver"
                        : "Padrão"}
                  </span>
                  <Badge variant={sp.active ? "default" : "secondary"} className="text-[10px]">
                    {sp.active ? "Ativo" : "Pausado"}
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-muted  p-1.5 flex items-center justify-center shrink-0">
                    {sp.logo_url ? (
                      <img
                        src={sp.logo_url}
                        alt={sp.name}
                        className="max-h-full object-contain"
                      />
                    ) : (
                      <Building2 className="size-5 text-muted-foreground/50" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate">{sp.name}</h3>
                    {sp.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {sp.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="pt-3  flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEdit(sp)}
                  className="h-8 px-2.5 text-xs font-bold"
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(sp.id)}
                  className="size-8 rounded-xl text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden sm:rounded-3xl bg-background">
          <DialogHeader className="p-6 pb-4  bg-muted/20">
            <DialogTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
              <Megaphone className="size-5 text-primary" />
              <span>{editingId ? "Editar Patrocinador" : "Novo Patrocinador"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre mídias e links que serão inseridos nos artigos e stories.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Nome da Empresa / Marca</Label>
              <Input
                placeholder="Ex: Sicredi Alto Uruguai"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl h-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Nível / Tier</Label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl  bg-background text-xs font-semibold"
                >
                  <option value="gold">★ Master Gold</option>
                  <option value="silver">Silver</option>
                  <option value="standard">Standard</option>
                  <option value="supporter">Apoiador</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Texto do Botão (CTA)</Label>
                <Input
                  placeholder="Ex: Saiba Mais"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  className="rounded-xl h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">URL do Logotipo</Label>
              <Input
                placeholder="https://..."
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="rounded-xl h-10 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">URL do Banner In-Article (Opcional)</Label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                className="rounded-xl h-10 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Link de Destino (Site / WhatsApp)</Label>
              <Input
                placeholder="https://seusite.com.br"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="rounded-xl h-10 font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Descrição Curta</Label>
              <textarea
                placeholder="Uma frase sobre o serviço oferecido pelo parceiro..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full p-3 rounded-xl  bg-background text-xs resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 ">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl font-bold bg-primary text-primary-foreground"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="size-4 mr-2" />
                )}
                <span>Salvar Patrocinador</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
