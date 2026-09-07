
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Palette, Clock, LayoutTemplate, ExternalLink, Save } from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';

interface PublicProfileData {
    id?: string;
    slug: string;
    cover_url: string | null;
    avatar_url: string | null;
    bio: string | null;
    theme_config: {
        primaryColor: string;
        secondaryColor: string;
        borderRadius: string;
    };
    settings: {
        show_reviews: boolean;
        show_map: boolean;
        show_products: boolean;
        show_events: boolean;
    };
}

const DEFAULT_THEME = {
    primaryColor: '#0f172a',
    secondaryColor: '#475569', 
    borderRadius: '1rem'
};

const DEFAULT_SETTINGS = {
    show_reviews: true,
    show_map: true,
    show_products: true,
    show_events: true
};

export default function PublicPageEditor() {
    const { id: empresaId } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<PublicProfileData | null>(null);
    const [empresa, setEmpresa] = useState<any>(null);

    useEffect(() => {
        async function loadData() {
            if (!empresaId) return;
            try {
                // Fetch basic empresa data
                const { data: empresaData, error: empresaError } = await supabase
                    .from('empresas')
                    .select('nome, slug') // Assuming slug exists on empresas or we generate one
                    .eq('id', empresaId)
                    .single();
                
                if (empresaError) throw empresaError;
                setEmpresa(empresaData);

                // Fetch public profile
                const { data: profileData, error: profileError } = await supabase
                    .from('public_profiles' as any)
                    .select('*')
                    .eq('empresa_id', empresaId)
                    .maybeSingle();

                if (profileError) {
                    // Check if error is "relation does not exist" - user needs migration
                    console.error("Profile fetch error:", profileError);
                }

                if (profileData) {
                    setProfile(profileData as any);
                } else {
                    // Initial state for new profile
                    setProfile({
                        slug: (empresaData as any).slug || (empresaData as any).nome?.toLowerCase().replace(/\s+/g, '-'),
                        cover_url: null,
                        avatar_url: null,
                        bio: null,
                        theme_config: DEFAULT_THEME,
                        settings: DEFAULT_SETTINGS
                    });
                }
            } catch (err: any) {
                console.error(err);
                toast.error("Erro ao carregar dados", { description: err.message });
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [empresaId]);

    const handleSave = async () => {
        if (!empresaId || !profile) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('public_profiles' as any)
                .upsert({
                    empresa_id: empresaId,
                    slug: profile.slug,
                    cover_url: profile.cover_url,
                    avatar_url: profile.avatar_url,
                    bio: profile.bio,
                    theme_config: profile.theme_config,
                    settings: profile.settings,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'empresa_id' });

            if (error) throw error;
            toast.success("Página pública atualizada com sucesso!");
        } catch (err: any) {
             console.error(err);
             toast.error("Erro ao salvar", { description: err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingState />;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                   <h2 className="text-2xl font-bold tracking-tight text-slate-900">Editor da Página Pública</h2>
                   <p className="text-slate-500">Personalize a identidade visual e o conteúdo da sua página.</p>
                </div>
                <div className="flex gap-3">
                     {profile?.slug && (
                        <Button variant="outline" asChild className="gap-2">
                            <a href={`/p/${profile.slug}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                                Ver Página
                            </a>
                        </Button>
                     )}
                     <Button onClick={handleSave} disabled={saving} className="gap-2">
                         <Save className="h-4 w-4" />
                         {saving ? 'Salvando...' : 'Salvar Alterações'}
                     </Button>
                </div>
            </div>

            <Tabs defaultValue="geral" className="space-y-6">
                <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-sm h-12">
                    <TabsTrigger value="geral" className="rounded-lg px-4 h-9 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
                        <Globe className="h-4 w-4 mr-2" /> Geral
                    </TabsTrigger>
                    <TabsTrigger value="aparencia" className="rounded-lg px-4 h-9 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
                        <Palette className="h-4 w-4 mr-2" /> Aparência
                    </TabsTrigger>
                    <TabsTrigger value="conteudo" className="rounded-lg px-4 h-9 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
                        <LayoutTemplate className="h-4 w-4 mr-2" /> Conteúdo
                    </TabsTrigger>
                    <TabsTrigger value="horarios" className="rounded-lg px-4 h-9 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
                        <Clock className="h-4 w-4 mr-2" /> Horários
                    </TabsTrigger>
                </TabsList>

                {/* GERAL */}
                <TabsContent value="geral">
                    <Card>
                        <CardHeader>
                            <CardTitle>Identificação</CardTitle>
                            <CardDescription>Configure o endereço e informações básicas da sua página.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="slug">Endereço da Página (Slug)</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground bg-slate-50 px-3 py-2 border border-r-0 border-slate-200 rounded-l-md text-sm">eventios.app/p/</span>
                                    <Input 
                                        id="slug" 
                                        value={profile?.slug || ''} 
                                        onChange={e => setProfile({...profile!, slug: e.target.value})}
                                        className="rounded-l-none"
                                        placeholder="minha-empresa"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Este será o link público para compartilhar sua página.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio / Descrição Curta</Label>
                                <Textarea 
                                    id="bio"
                                    value={profile?.bio || ''} 
                                    onChange={e => setProfile({...profile!, bio: e.target.value})}
                                    placeholder="Conte um pouco sobre sua empresa..."
                                    rows={4}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* APARENCIA */}
                <TabsContent value="aparencia">
                     <Card>
                        <CardHeader>
                            <CardTitle>Identidade Visual</CardTitle>
                            <CardDescription>Defina as cores e imagens da sua página.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Cor Principal</Label>
                                    <div className="flex gap-2 items-center">
                                        <div 
                                            className="h-10 w-10 rounded-lg border shadow-sm cursor-pointer hover:scale-105 transition-transform"
                                            style={{ backgroundColor: profile?.theme_config?.primaryColor || DEFAULT_THEME.primaryColor }}
                                        />
                                        <Input 
                                            value={profile?.theme_config?.primaryColor || DEFAULT_THEME.primaryColor}
                                            onChange={e => setProfile({
                                                ...profile!, 
                                                theme_config: { ...profile!.theme_config, primaryColor: e.target.value } 
                                            })}
                                            placeholder="#HEX"
                                        />
                                    </div>
                                </div>

                                 <div className="space-y-2">
                                    <Label>Arredondamento dos Cantos</Label>
                                     <Input 
                                        value={profile?.theme_config?.borderRadius || DEFAULT_THEME.borderRadius}
                                        onChange={e => setProfile({
                                            ...profile!, 
                                            theme_config: { ...profile!.theme_config, borderRadius: e.target.value } 
                                        })}
                                        placeholder="Ex: 1rem, 8px"
                                    />
                                    <p className="text-xs text-muted-foreground">Use valores CSS válidos (px, rem).</p>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t">
                                <Label>Capa da Página (Cover URL)</Label>
                                <Input 
                                    value={profile?.cover_url || ''} 
                                    onChange={e => setProfile({...profile!, cover_url: e.target.value})}
                                    placeholder="https://"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* CONTEUDO */}
                <TabsContent value="conteudo">
                     <Card>
                        <CardHeader>
                            <CardTitle>Seções Visíveis</CardTitle>
                            <CardDescription>Escolha quais blocos aparecem na sua página pública.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Avaliações</Label>
                                    <p className="text-sm text-muted-foreground">Exibir nota e comentários de clientes.</p>
                                </div>
                                <Switch 
                                    checked={profile?.settings?.show_reviews ?? true}
                                    onCheckedChange={v => setProfile({
                                        ...profile!, 
                                        settings: { ...profile!.settings, show_reviews: v } 
                                    })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Mapa de Localização</Label>
                                    <p className="text-sm text-muted-foreground">Mostrar mapa com o endereço da empresa.</p>
                                </div>
                                <Switch 
                                    checked={profile?.settings?.show_map ?? true}
                                    onCheckedChange={v => setProfile({
                                        ...profile!, 
                                        settings: { ...profile!.settings, show_map: v } 
                                    })}
                                />
                            </div>
                             <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Vitrine de Produtos</Label>
                                    <p className="text-sm text-muted-foreground">Destacar produtos principais na página inicial.</p>
                                </div>
                                <Switch 
                                    checked={profile?.settings?.show_products ?? true}
                                    onCheckedChange={v => setProfile({
                                        ...profile!, 
                                        settings: { ...profile!.settings, show_products: v } 
                                    })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                {/* HORARIOS */}
                <TabsContent value="horarios">
                    <Card>
                        <CardHeader>
                            <CardTitle>Horário de Funcionamento</CardTitle>
                            <CardDescription>Em breve: editor completo de horários semanais.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                <Clock className="mx-auto h-12 w-12 opacity-20 mb-4" />
                                <p>O editor de horários estará disponível na próxima atualização.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}
