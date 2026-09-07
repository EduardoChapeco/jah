import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, ClipboardList, Eye, Copy, ExternalLink, Trash2,
  Settings2, Globe, Activity, ChevronRight, ArrowLeft,
  LayoutPanelLeft, Palette, Share2, BarChart3, Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switcher } from '@/components/ui/switcher';
import { useEmpresa } from '@/hooks/useEmpresa';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FormBuilder, FormField } from './FormBuilder';
import { FormPreview } from './FormPreview';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';

const ACCENT_COLORS = [
  '#6366f1','#f43f5e','#10b981','#f59e0b','#3b82f6',
  '#8b5cf6','#06b6d4','#ec4899','#14b8a6','#84cc16',
];

type EditorTab = 'campos' | 'design' | 'configuracoes' | 'respostas';

interface CaptureForm {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  status: string;
  views_count: number;
  config: {
    fields: FormField[];
    submitButtonText?: string;
    theme?: 'light' | 'dark' | 'brand';
    accentColor?: string;
    redirectUrl?: string;
    successMessage?: string;
  };
  created_at: string;
  entry_count?: number;
}

export default function LeadCaptureForms() {
  const { empresa } = useEmpresa();
  const qc = useQueryClient();
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingForm, setEditingForm] = useState<CaptureForm | null>(null);
  const [editorTab, setEditorTab] = useState<EditorTab>('campos');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Local form state while editing
  const [draft, setDraft] = useState<CaptureForm['config'] & { title: string; description: string; slug: string; status: string }>({
    title: '', description: '', slug: '', status: 'active',
    fields: [], submitButtonText: 'Enviar', theme: 'light',
    accentColor: '#6366f1', redirectUrl: '', successMessage: '',
  });

  useEffect(() => {
    if (editingForm) {
      setDraft({
        title: editingForm.title,
        description: editingForm.description || '',
        slug: editingForm.slug,
        status: editingForm.status,
        fields: editingForm.config?.fields || [],
        submitButtonText: editingForm.config?.submitButtonText || 'Enviar',
        theme: editingForm.config?.theme || 'light',
        accentColor: editingForm.config?.accentColor || '#6366f1',
        redirectUrl: editingForm.config?.redirectUrl || '',
        successMessage: editingForm.config?.successMessage || '',
      });
    }
  }, [editingForm]);

  const { data: forms = [], isLoading } = useQuery<CaptureForm[]>({
    queryKey: ['lead-forms', empresa?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_capture_forms')
        .select('*, lead_capture_entries(count)')
        .eq('empresa_id', empresa!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((f: any) => ({
        ...f,
        entry_count: f.lead_capture_entries?.[0]?.count || 0,
      }));
    },
    enabled: !!empresa?.id,
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['form-entries', editingForm?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('lead_capture_entries')
        .select('*, lead:clientes_leads(nome, email)')
        .eq('form_id', editingForm!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!editingForm?.id && editorTab === 'respostas',
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        slug: draft.slug.trim(),
        status: draft.status,
        config: {
          fields: draft.fields,
          submitButtonText: draft.submitButtonText,
          theme: draft.theme,
          accentColor: draft.accentColor,
          redirectUrl: draft.redirectUrl,
          successMessage: draft.successMessage,
        },
      };
      const safePayload = { ...payload, config: payload.config as any };
      if (editingForm?.id && editingForm.id !== 'new') {
        const { error } = await (supabase as any).from('lead_capture_forms').update(safePayload).eq('id', editingForm.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('lead_capture_forms').insert([{ ...safePayload, empresa_id: empresa!.id }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead-forms'] });
      toast.success('Formulário salvo!');
      setView('list');
      setEditingForm(null);
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao salvar'),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lead_capture_forms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lead-forms'] }); toast.success('Removido'); setDeleteTarget(null); },
  });

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/capture/${slug}`);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Link copiado!');
  };

  const openNew = () => {
    setEditingForm({ id: 'new', title: '', description: null, slug: '', status: 'active', views_count: 0, config: { fields: [] }, created_at: '' });
    setEditorTab('campos');
    setView('editor');
  };

  const openEdit = (f: CaptureForm) => {
    setEditingForm(f);
    setEditorTab('campos');
    setView('editor');
  };

  const sd = (k: string, v: any) => setDraft(d => ({ ...d, [k]: v }));

  // ── LIST VIEW ──────────────────────────────────────────────────────────
  if (view === 'list') return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Formulários</h1>
          <p className="text-sm text-muted-foreground">Capture leads com formulários personalizados</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-foreground text-background text-sm font-black hover:opacity-90 transition-all">
          <Plus className="h-3.5 w-3.5" /> Novo formulário
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : forms.length === 0 ? (
        <div className="py-24 flex flex-col items-center gap-4 border-2 border-dashed border-border rounded-2xl">
          <ClipboardList className="h-12 w-12 text-foreground/15" />
          <p className="text-xl font-black text-foreground/20">Nenhum formulário ainda</p>
          <button onClick={openNew}
            className="flex items-center gap-2 h-10 px-5 rounded-xl bg-foreground text-background text-sm font-black hover:opacity-90 transition-all">
            <Plus className="h-3.5 w-3.5" /> Criar formulário
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map(form => {
            const conversion = form.views_count > 0 ? ((form.entry_count! / form.views_count) * 100).toFixed(1) : '0';
            return (
              <div key={form.id}
                className="group flex flex-col border border-border rounded-2xl bg-background hover:border-foreground/20 hover:shadow-sm transition-all overflow-hidden">
                {/* Color bar */}
                <div className="h-1.5 w-full" style={{ backgroundColor: form.config?.accentColor || '#6366f1' }} />

                <div className="p-5 flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <Badge className={cn('text-[9px] font-black uppercase rounded-lg px-2 border-0',
                      form.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-muted text-muted-foreground')}>
                      {form.status === 'active' ? 'Publicado' : 'Rascunho'}
                    </Badge>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => copyLink(form.slug)}
                        className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-all">
                        {copied === form.slug ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-foreground/40" />}
                      </button>
                      <a href={`/capture/${form.slug}`} target="_blank" rel="noreferrer"
                        className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-all">
                        <ExternalLink className="h-3.5 w-3.5 text-foreground/40" />
                      </a>
                      <button onClick={() => setDeleteTarget(form.id)}
                        className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:border-destructive/30 hover:bg-destructive/5 transition-all">
                        <Trash2 className="h-3.5 w-3.5 text-destructive/60" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-foreground leading-tight">{form.title}</h3>
                    <p className="text-[11px] text-foreground/30 mt-0.5">{form.config?.fields?.length || 0} campos</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                    {[
                      { label: 'Leads', value: form.entry_count ?? 0 },
                      { label: 'Visitas', value: form.views_count || 0 },
                      { label: 'Conversão', value: `${conversion}%` },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30">{s.label}</p>
                        <p className="text-lg font-black text-foreground">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <button onClick={() => openEdit(form)}
                    className="w-full h-10 rounded-xl bg-foreground text-background text-sm font-black hover:opacity-90 transition-all flex items-center justify-center gap-2">
                    <Settings2 className="h-3.5 w-3.5" /> Editar formulário
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black">Excluir formulário?</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/50">Todos os leads capturados por este formulário serão desvinculados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMut.mutate(deleteTarget)}
              className="rounded-xl bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  // ── EDITOR VIEW ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Editor Header */}
      <div className="shrink-0 flex items-center justify-between pb-4 border-b border-border mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView('list'); setEditingForm(null); }}
            className="h-9 w-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-all">
            <ArrowLeft className="h-4 w-4 text-foreground/50" />
          </button>
          <div>
            <input
              value={draft.title}
              onChange={e => sd('title', e.target.value)}
              placeholder="Nome do formulário..."
              className="text-lg font-black bg-transparent border-none outline-none text-foreground placeholder:text-foreground/20 w-72"
            />
            <p className="text-[10px] text-foreground/30 font-black uppercase">{draft.fields.length} campo(s)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={draft.status} onValueChange={v => sd('status', v)}>
            <SelectTrigger className="h-9 w-36 rounded-xl border-border text-sm font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border">
              <SelectItem value="active">Publicado</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
            </SelectContent>
          </Select>
          <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !draft.title.trim()}
            className="flex items-center gap-2 h-9 px-5 rounded-xl bg-foreground text-background text-sm font-black hover:opacity-90 disabled:opacity-50 transition-all">
            {saveMut.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="shrink-0 mb-4">
        <Switcher
          value={editorTab}
          onValueChange={v => setEditorTab(v as EditorTab)}
          items={[
            { value: 'campos', label: 'Campos' },
            { value: 'design', label: 'Design' },
            { value: 'configuracoes', label: 'Configurações' },
            { value: 'respostas', label: `Respostas${editingForm?.entry_count ? ` (${editingForm.entry_count})` : ''}` },
          ]}
        />
      </div>

      {/* Editor body: 2-column split (builder + preview) for campos/design */}
      {(editorTab === 'campos' || editorTab === 'design') && (
        <div className="flex-1 grid grid-cols-2 gap-5 min-h-0">
          {/* Left: builder or design */}
          <div className="overflow-hidden flex flex-col border border-border rounded-2xl bg-background">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30">
                {editorTab === 'campos' ? 'Construtor de campos' : 'Aparência'}
              </p>
            </div>
            <div className="flex-1 p-4 overflow-hidden">
              {editorTab === 'campos' ? (
                <FormBuilder fields={draft.fields} onChange={f => sd('fields', f)} />
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Texto do botão</Label>
                    <Input value={draft.submitButtonText || ''} onChange={e => sd('submitButtonText', e.target.value)}
                      placeholder="Enviar" className="h-11 rounded-xl border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Tema</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', label: 'Claro', bg: 'bg-white border-border' },
                        { value: 'dark', label: 'Escuro', bg: 'bg-zinc-900 border-zinc-700' },
                        { value: 'brand', label: 'Gradiente', bg: 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100' },
                      ].map(t => (
                        <button key={t.value} onClick={() => sd('theme', t.value)}
                          className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                            t.bg, draft.theme === t.value ? 'border-foreground ring-2 ring-foreground/20' : '')}>
                          <span className="text-xs font-black text-foreground/60">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Cor de destaque</Label>
                    <div className="flex flex-wrap gap-2">
                      {ACCENT_COLORS.map(c => (
                        <button key={c} onClick={() => sd('accentColor', c)}
                          className={cn('h-8 w-8 rounded-xl border-2 transition-all', draft.accentColor === c ? 'border-foreground scale-110' : 'border-transparent')}
                          style={{ backgroundColor: c }} />
                      ))}
                      <input type="color" value={draft.accentColor || '#6366f1'} onChange={e => sd('accentColor', e.target.value)}
                        className="h-8 w-8 rounded-xl border border-border cursor-pointer" title="Cor personalizada" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Live preview */}
          <div className="overflow-hidden flex flex-col border border-border rounded-2xl">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Preview ao vivo</p>
              {draft.slug && (
                <a href={`/capture/${draft.slug}`} target="_blank" rel="noreferrer"
                  className="text-[10px] font-black text-foreground/40 hover:text-foreground flex items-center gap-1 transition-all">
                  <ExternalLink className="h-3 w-3" /> Abrir
                </a>
              )}
            </div>
            <div className="flex-1 overflow-auto">
              <FormPreview
                fields={draft.fields}
                title={draft.title || 'Título do formulário'}
                description={draft.description}
                submitText={draft.submitButtonText}
                theme={draft.theme as any}
                accentColor={draft.accentColor}
              />
            </div>
          </div>
        </div>
      )}

      {/* Configurações */}
      {editorTab === 'configuracoes' && (
        <div className="flex-1 overflow-auto">
          <div className="max-w-xl space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Descrição</Label>
              <Textarea value={draft.description} onChange={e => sd('description', e.target.value)}
                placeholder="Descrição exibida no topo do formulário..." rows={3}
                className="rounded-xl border-border bg-background resize-none" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Slug (URL)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground/30 font-mono whitespace-nowrap">/capture/</span>
                <Input value={draft.slug} onChange={e => sd('slug', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                  placeholder="meu-formulario" className="h-11 rounded-xl border-border bg-background font-mono" />
              </div>
              {draft.slug && (
                <button onClick={() => copyLink(draft.slug)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-foreground/40 hover:text-foreground transition-all">
                  {copied === draft.slug ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                  {window.location.origin}/capture/{draft.slug}
                </button>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Mensagem de sucesso</Label>
              <Textarea value={draft.successMessage || ''} onChange={e => sd('successMessage', e.target.value)}
                placeholder="Obrigado! Entraremos em contato em breve." rows={2}
                className="rounded-xl border-border bg-background resize-none" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Redirecionar após envio</Label>
              <Input value={draft.redirectUrl || ''} onChange={e => sd('redirectUrl', e.target.value)}
                placeholder="https://..." type="url" className="h-11 rounded-xl border-border bg-background" />
            </div>
            <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-background">
              <div>
                <Label className="text-sm font-bold">Status</Label>
                <p className="text-[11px] text-foreground/40">Formulário público e captando leads</p>
              </div>
              <Switch checked={draft.status === 'active'} onCheckedChange={v => sd('status', v ? 'active' : 'draft')} />
            </div>
          </div>
        </div>
      )}

      {/* Respostas */}
      {editorTab === 'respostas' && (
        <div className="flex-1 overflow-auto">
          {entries.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 border-2 border-dashed border-border rounded-2xl">
              <Activity className="h-10 w-10 text-foreground/15" />
              <p className="text-sm font-black text-foreground/30">Nenhuma resposta ainda</p>
              {draft.slug && (
                <a href={`/capture/${draft.slug}`} target="_blank" rel="noreferrer"
                  className="text-sm font-bold text-foreground/40 hover:text-foreground transition-all flex items-center gap-1">
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir formulário público
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry: any) => (
                <div key={entry.id} className="flex items-center gap-4 p-4 border border-border rounded-2xl bg-background">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-black text-primary shrink-0">
                    {entry.lead?.nome?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{entry.lead?.nome || 'Anônimo'}</p>
                    <p className="text-[11px] text-foreground/40">{entry.lead?.email}</p>
                  </div>
                  <p className="text-[11px] text-foreground/30 shrink-0">
                    {format(new Date(entry.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
