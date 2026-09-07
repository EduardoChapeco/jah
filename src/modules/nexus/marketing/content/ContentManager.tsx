
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash, Search, MoreVertical, Eye } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import { PublicPost } from '@/types';

export default function ContentManager() {
    const { id: empresaId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<PublicPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!empresaId) return;
        
        async function fetchPosts() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('public_posts' as any)
                    .select('*')
                    .eq('empresa_id', empresaId)
                    .order('created_at', { ascending: false });

                if (error) {
                     console.error(error);
                }
                if (data) setPosts(data as any);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchPosts();
    }, [empresaId]);

    async function handleDelete(id: string) {
        if (!confirm('Tem certeza que deseja excluir este post?')) return;
        try {
            const { error } = await supabase.from('public_posts' as any).delete().eq('id', id);
            if (error) throw error;
            toast.success('Post excluído com sucesso');
            setPosts(posts.filter(p => p.id !== id));
        } catch (err: any) {
            toast.error('Erro ao excluir', { description: err.message || 'Erro desconhecido' });
        }
    }

    const filteredPosts = posts.filter(post => 
        post.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                   <h2 className="text-2xl font-bold tracking-tight text-slate-900">Gerenciador de Conteúdo</h2>
                   <p className="text-slate-500">Blog, Notícias e Comunicados.</p>
                </div>
                <Button onClick={() => navigate('novo')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Novo Post
                </Button>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="Buscar posts..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9"
                />
            </div>

            <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead>Título</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Publicação</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">Carregando...</TableCell>
                            </TableRow>
                        ) : filteredPosts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                    Nenhum post encontrado. Crie o primeiro!
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPosts.map((post) => (
                                <TableRow key={post.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{post.title}</span>
                                            <span className="text-xs text-muted-foreground">/{post.slug}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            post.published ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                                        }`}>
                                            {post.published ? 'Publicado' : 'Rascunho'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {post.published_at ? format(new Date(post.published_at), "dd 'de' MMM, yyyy", { locale: ptBR }) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => navigate(`${post.id}`)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link to={`/p/preview/${post.slug}`} target="_blank">
                                                        <Eye className="mr-2 h-4 w-4" /> Visualizar
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(post.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                                    <Trash className="mr-2 h-4 w-4" /> Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
