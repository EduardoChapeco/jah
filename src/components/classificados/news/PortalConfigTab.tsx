import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, Palette, Settings2, ExternalLink } from "lucide-react";
import { usePortalConfig, useUpsertPortalConfig, type PortalConfig } from "@/hooks/useNewsPortal";
import { NEWS_CATEGORIES } from "@/hooks/useNewsMining";

interface Props {
  companyId: string;
  companySlug?: string;
}

export default function PortalConfigTab({ companyId, companySlug }: Props) {
  const { data: config, isLoading } = usePortalConfig(companyId);
  const upsert = useUpsertPortalConfig();

  const [name, setName] = useState("Meu Portal");
  const [primaryColor, setPrimaryColor] = useState("#f97316");
  const [accentColor, setAccentColor] = useState("#1e293b");
  const [curation, setCuration] = useState("automatic");
  const [interval, setInterval] = useState(60);
  const [allowRepost, setAllowRepost] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [categories, setCategories] = useState<string[]>(["geral", "tecnologia", "negocios"]);

  useEffect(() => {
    if (config) {
      setName(config.portal_name);
      setPrimaryColor(config.primary_color);
      setAccentColor(config.accent_color);
      setCuration(config.curation_mode);
      setInterval(config.mining_interval_minutes);
      setAllowRepost(config.allow_repost);
      setCommentsEnabled(config.comments_enabled);
      setIsPublished(config.is_published);
      setCategories(config.categories || []);
    }
  }, [config]);

  const handleSave = () => {
    upsert.mutate({
      company_id: companyId,
      portal_name: name,
      slug: companySlug || null,
      primary_color: primaryColor,
      accent_color: accentColor,
      curation_mode: curation,
      mining_interval_minutes: interval,
      allow_repost: allowRepost,
      comments_enabled: commentsEnabled,
      is_published: isPublished,
      categories,
    });
  };

  const toggleCategory = (cat: string) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const portalUrl = companySlug ? `/portal/${companySlug}` : null;

  return (
    <div className="space-y-4">
      {portalUrl && isPublished && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Seu portal está publicado!</span>
              </div>
              <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  <ExternalLink className="h-3 w-3 mr-1" /> Abrir Portal
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Settings2 className="h-4 w-4" /> Geral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Nome do Portal</Label>
              <Input className="h-8 text-sm" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Publicado</Label>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>
            <div>
              <Label className="text-xs">Curadoria</Label>
              <Select value={curation} onValueChange={setCuration}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automático (publica tudo)</SelectItem>
                  <SelectItem value="manual">Manual (aprovar antes)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Frequência de Mineração</Label>
              <Select value={String(interval)} onValueChange={v => setInterval(Number(v))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">A cada 30 min</SelectItem>
                  <SelectItem value="60">A cada 1 hora</SelectItem>
                  <SelectItem value="360">A cada 6 horas</SelectItem>
                  <SelectItem value="1440">A cada 24 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Permitir Repost</Label>
              <Switch checked={allowRepost} onCheckedChange={setAllowRepost} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Comentários</Label>
              <Switch checked={commentsEnabled} onCheckedChange={setCommentsEnabled} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4" /> Aparência & Categorias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Cor Primária</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
                  <Input className="h-8 text-xs flex-1" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Cor de Destaque</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
                  <Input className="h-8 text-xs flex-1" value={accentColor} onChange={e => setAccentColor(e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs mb-2 block">Categorias Exibidas</Label>
              <div className="flex flex-wrap gap-1.5">
                {NEWS_CATEGORIES.map(cat => (
                  <Badge key={cat} variant={categories.includes(cat) ? "default" : "outline"}
                    className="text-[10px] capitalize cursor-pointer" onClick={() => toggleCategory(cat)}>
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={upsert.isPending}>
          {upsert.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
          Salvar Configuração
        </Button>
      </div>
    </div>
  );
}
