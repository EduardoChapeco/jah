
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RichTextEditor } from '@/components/ui/rich-text-editor';


interface PostData {
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    cover_url: string;
    published: boolean;
    tags: string; // Comma separated for input
}

export default function PostEditor() {
    const { id: empresaId, postId } = useParams<{ id: string; postId: string }>();
    const navigate = useNavigate();
    const isNew = postId === 'novo';
    
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [post, setPost] = useState<PostData>({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        cover_url: '',
        published: false,
        tags: ''
    });

    const handleImageUpload = async (file: File): Promise<string> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${empresaId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('public-content')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('public-content')
                .getPublicUrl(fileName);

            return data.publicUrl;
        } catch (error: any) {
            toast.error('Erro no upload da imagem', { description: error.message });
            return '';
        }
    };

    const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = await handleImageUpload(file);
            if (url) {
                setPost(prev => ({ ...prev, cover_url: url }));
            }
        }
    };

    useEffect(() => {
        if (!isNew && postId) {
            fetchPost();
        }
    }, [postId]);

    async function fetchPost() {
        try {
            const { data, error } = await supabase
                .from('public_posts' as any)
                .select('*')
                .eq('id', postId)
                .single();

            if (error) throw error;
            if (data) {
                const d = data as any;
                setPost({
                    title: d.title,
                    slug: d.slug,
                    content: d.content || '',
                    excerpt: d.excerpt || '',
                    cover_url: d.cover_url || '',
                    published: d.published,
                    tags: d.tags ? d.tags.join(', ') : ''
                });
            }
        } catch (err: any) {
            toast.error('Erro ao carregar post', { description: err.message });
            navigate(`/empresa/${empresaId}/marketing/content`);
        } finally {
            setLoading(false);
        }
    }

    const handleSave = async () => {
        if (!post.title || !post.slug) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                empresa_id: empresaId,
                title: post.title,
                slug: post.slug.toLowerCase().replace(/\s+/g, '-'),
                content: post.content,
                excerpt: post.excerpt,
                cover_url: post.cover_url,
                published: post.published,
                published_at: post.published ? new Date().toISOString() : null,
                tags: post.tags.split(',').map(t => t.trim()).filter(Boolean),
                updated_at: new Date().toISOString()
            };

            let error;
            if (isNew) {
                const { error: insertError } = await supabase.from('public_posts' as any).insert(payload);
                error = insertError;
            } else {
                const { error: updateError } = await supabase
                    .from('public_posts' as any)
                    .update(payload)
                    .eq('id', postId);
                error = updateError;
            }

            if (error) throw error;

            toast.success('Post salvo com sucesso!');
            navigate(`/empresa/${empresaId}/marketing/content`);
        } catch (err: any) {
            console.error(err);
            toast.error('Erro ao salvar', { description: err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                         <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                             {isNew ? 'Novo Post' : 'Editar Post'}
                         </h2>
                    </div>
                </div>
                <div className="flex gap-2">
                     <Button variant="outline" onClick={() => setPost({...post, published: !post.published})}>
                         {post.published ? 'Publicado' : 'Rascunho'}
                     </Button>
                     <Button onClick={handleSave} disabled={saving} className="gap-2">
                         <Save className="h-4 w-4" />
                         {saving ? 'Salvando...' : 'Salvar'}
                     </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Título</Label>
                                <Input 
                                    id="title"
                                    value={post.title}
                                    onChange={e => setPost({...post, title: e.target.value, slug: isNew ? e.target.value.toLowerCase().replace(/\s+/g, '-') : post.slug})}
                                    placeholder="Título do post..."
                                    className="text-lg font-medium"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="content">Conteúdo</Label>
                                <div className="min-h-[400px]">
                                    <RichTextEditor 
                                        value={post.content} 
                                        onChange={(val) => setPost({...post, content: val})}
                                        onImageUpload={handleImageUpload}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="slug">Slug (URL)</Label>
                                <Input 
                                    id="slug"
                                    value={post.slug}
                                    onChange={e => setPost({...post, slug: e.target.value})}
                                    className="font-mono text-xs"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="excerpt">Resumo</Label>
                                <Textarea 
                                    id="excerpt"
                                    value={post.excerpt}
                                    onChange={e => setPost({...post, excerpt: e.target.value})}
                                    rows={3}
                                    placeholder="Breve descrição para listagens..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Imagem de Capa</Label>
                                <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 cursor-pointer transition-colors relative overflow-hidden group">
                                    <input 
                                        type="file" 
                                        className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                                        onChange={handleCoverSelect}
                                        accept="image/*"
                                    />
                                    {post.cover_url ? (
                                        <>
                                            <img src={post.cover_url} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs z-10 pointer-events-none">
                                                Alterar Imagem
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon className="h-8 w-8 text-slate-300 pointer-events-none" />
                                            <span className="text-xs text-slate-500 pointer-events-none">Clique para upload</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tags">Tags</Label>
                                <Input 
                                    id="tags"
                                    value={post.tags}
                                    onChange={e => setPost({...post, tags: e.target.value})}
                                    placeholder="notícias, eventos, promoções"
                                />
                                <p className="text-xs text-muted-foreground">Separadas por vírgula.</p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                                <Label htmlFor="published">Publicado</Label>
                                <Switch 
                                    id="published"
                                    checked={post.published}
                                    onCheckedChange={v => setPost({...post, published: v})}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
