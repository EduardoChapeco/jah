import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  GripVertical, Trash2, Plus, ChevronDown, ChevronUp,
  Type, AlignLeft, Mail, Phone, Hash, Calendar, CheckSquare,
  CircleDot, List, ToggleLeft, Star, Upload, Link2, Globe,
  User, MapPin, CreditCard, Clock, Sliders, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];        // for select/radio/checkbox
  helpText?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  width?: 'full' | 'half';   // layout
  hidden?: boolean;
  defaultValue?: string;
}

const FIELD_TYPES = [
  { group: 'Texto', items: [
    { type: 'text',      label: 'Texto curto',    icon: Type },
    { type: 'textarea',  label: 'Texto longo',    icon: AlignLeft },
    { type: 'email',     label: 'Email',          icon: Mail },
    { type: 'tel',       label: 'Telefone',       icon: Phone },
    { type: 'url',       label: 'URL / Link',     icon: Link2 },
    { type: 'password',  label: 'Senha',          icon: '🔒' },
  ]},
  { group: 'Números & Datas', items: [
    { type: 'number',    label: 'Número',         icon: Hash },
    { type: 'range',     label: 'Slider',         icon: Sliders },
    { type: 'date',      label: 'Data',           icon: Calendar },
    { type: 'time',      label: 'Hora',           icon: Clock },
    { type: 'datetime-local', label: 'Data + Hora', icon: Calendar },
  ]},
  { group: 'Escolha', items: [
    { type: 'select',    label: 'Seleção',        icon: List },
    { type: 'radio',     label: 'Múltipla escolha', icon: CircleDot },
    { type: 'checkbox',  label: 'Caixas de opção', icon: CheckSquare },
    { type: 'boolean',   label: 'Sim / Não',      icon: ToggleLeft },
  ]},
  { group: 'Pessoal', items: [
    { type: 'cpf',       label: 'CPF',            icon: CreditCard },
    { type: 'cnpj',      label: 'CNPJ',           icon: CreditCard },
    { type: 'cep',       label: 'CEP',            icon: MapPin },
    { type: 'name',      label: 'Nome completo',  icon: User },
  ]},
  { group: 'Avaliação & Arquivo', items: [
    { type: 'rating',    label: 'Avaliação (estrelas)', icon: Star },
    { type: 'file',      label: 'Upload de arquivo', icon: Upload },
  ]},
  { group: 'Layout', items: [
    { type: 'heading',   label: 'Título / Seção', icon: '📌' },
    { type: 'divider',   label: 'Divisor',        icon: '➖' },
    { type: 'paragraph', label: 'Parágrafo',      icon: AlignLeft },
  ]},
];

const getTypeIcon = (type: string) => {
  for (const g of FIELD_TYPES) {
    const f = g.items.find(i => i.type === type);
    if (f) return f.icon;
  }
  return Type;
};

const getTypeLabel = (type: string) => {
  for (const g of FIELD_TYPES) {
    const f = g.items.find(i => i.type === type);
    if (f) return f.label;
  }
  return type;
};

interface Props {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

export function FormBuilder({ fields, onChange }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const add = (type: string) => {
    const base: FormField = {
      id: crypto.randomUUID(),
      type,
      label: getTypeLabel(type),
      placeholder: '',
      required: false,
      width: 'full',
    };
    if (['select', 'radio', 'checkbox'].includes(type)) {
      base.options = ['Opção 1', 'Opção 2'];
    }
    const next = [...fields, base];
    onChange(next);
    setExpandedId(base.id);
  };

  const remove = (id: string) => onChange(fields.filter(f => f.id !== id));

  const update = (id: string, patch: Partial<FormField>) =>
    onChange(fields.map(f => f.id === id ? { ...f, ...patch } : f));

  const move = (from: number, to: number) => {
    const next = [...fields];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const handleDrop = (toIdx: number) => {
    if (draggingIdx === null || draggingIdx === toIdx) return;
    move(draggingIdx, toIdx);
    setDraggingIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="flex gap-5 h-full">
      {/* ── Left: Field palette ────────────────────────────────── */}
      <div className="w-56 shrink-0">
        <ScrollArea className="h-full pr-2">
          <div className="space-y-4 pb-4">
            {FIELD_TYPES.map(group => (
              <div key={group.group}>
                <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30 mb-2">{group.group}</p>
                <div className="space-y-1">
                  {group.items.map(item => {
                    const Icon = typeof item.icon === 'string' ? null : item.icon;
                    return (
                      <button
                        key={item.type}
                        onClick={() => add(item.type)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border bg-background hover:border-foreground/20 hover:bg-muted/50 transition-all text-left group"
                      >
                        <span className="w-5 text-center">
                          {Icon ? <Icon className="h-3.5 w-3.5 text-foreground/40 group-hover:text-foreground/60" /> : <span className="text-sm">{item.icon as string}</span>}
                        </span>
                        <span className="text-[11px] font-bold text-foreground/60 group-hover:text-foreground">{item.label}</span>
                        <Plus className="h-3 w-3 text-foreground/20 ml-auto group-hover:text-foreground/50" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* ── Right: Canvas ──────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <ScrollArea className="h-full">
          {fields.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl gap-3">
              <Plus className="h-8 w-8 text-foreground/15" />
              <p className="text-sm font-black text-foreground/30">Adicione campos do painel à esquerda</p>
            </div>
          ) : (
            <div className="space-y-2 pb-6">
              {fields.map((field, idx) => {
                const isExp = expandedId === field.id;
                const IconComp = typeof getTypeIcon(field.type) === 'string' ? null : getTypeIcon(field.type) as any;
                return (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={() => setDraggingIdx(idx)}
                    onDragOver={e => { e.preventDefault(); setDragOverIdx(idx); }}
                    onDragLeave={() => setDragOverIdx(null)}
                    onDrop={() => handleDrop(idx)}
                    onDragEnd={() => { setDraggingIdx(null); setDragOverIdx(null); }}
                    className={cn(
                      'rounded-2xl border border-border bg-background transition-all',
                      dragOverIdx === idx && draggingIdx !== idx && 'border-foreground/30 ring-2 ring-foreground/10',
                      draggingIdx === idx && 'opacity-40'
                    )}
                  >
                    {/* Row header */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <GripVertical className="h-4 w-4 text-foreground/20 cursor-grab shrink-0" />
                      {IconComp && <IconComp className="h-4 w-4 text-foreground/30 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{field.label || '(sem label)'}</p>
                        <p className="text-[10px] text-foreground/30">{getTypeLabel(field.type)}{field.required ? ' · obrigatório' : ''}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {field.width === 'half' && (
                          <span className="text-[9px] font-black uppercase text-foreground/30 bg-muted px-1.5 py-0.5 rounded-md">½</span>
                        )}
                        <button onClick={() => setExpandedId(isExp ? null : field.id)}
                          className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-all">
                          {isExp ? <ChevronUp className="h-3.5 w-3.5 text-foreground/40" /> : <ChevronDown className="h-3.5 w-3.5 text-foreground/40" />}
                        </button>
                        <button onClick={() => remove(field.id)}
                          className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:border-destructive/30 hover:bg-destructive/5 transition-all">
                          <Trash2 className="h-3.5 w-3.5 text-destructive/60" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded config */}
                    {isExp && (
                      <div className="border-t border-border px-4 py-4 space-y-4">
                        {/* Label */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-foreground/30">Label</Label>
                            <Input value={field.label} onChange={e => update(field.id, { label: e.target.value })}
                              className="h-9 rounded-xl border-border bg-muted/30 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-foreground/30">Placeholder</Label>
                            <Input value={field.placeholder || ''} onChange={e => update(field.id, { placeholder: e.target.value })}
                              className="h-9 rounded-xl border-border bg-muted/30 text-sm" />
                          </div>
                        </div>

                        {/* Help text */}
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-foreground/30">Texto de ajuda</Label>
                          <Input value={field.helpText || ''} onChange={e => update(field.id, { helpText: e.target.value })}
                            placeholder="Instrução adicional abaixo do campo..." className="h-9 rounded-xl border-border bg-muted/30 text-sm" />
                        </div>

                        {/* Default value */}
                        {!['heading','divider','paragraph','file','boolean'].includes(field.type) && (
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-foreground/30">Valor padrão</Label>
                            <Input value={field.defaultValue || ''} onChange={e => update(field.id, { defaultValue: e.target.value })}
                              className="h-9 rounded-xl border-border bg-muted/30 text-sm" />
                          </div>
                        )}

                        {/* Options for select/radio/checkbox */}
                        {['select','radio','checkbox'].includes(field.type) && (
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-foreground/30">Opções</Label>
                            {(field.options || []).map((opt, oi) => (
                              <div key={oi} className="flex gap-2">
                                <Input value={opt}
                                  onChange={e => {
                                    const opts = [...(field.options || [])];
                                    opts[oi] = e.target.value;
                                    update(field.id, { options: opts });
                                  }}
                                  className="h-8 rounded-xl border-border bg-muted/30 text-sm flex-1" />
                                <button onClick={() => update(field.id, { options: (field.options || []).filter((_, i) => i !== oi) })}
                                  className="h-8 w-8 rounded-xl border border-border flex items-center justify-center hover:bg-destructive/5 shrink-0">
                                  <Trash2 className="h-3 w-3 text-destructive/60" />
                                </button>
                              </div>
                            ))}
                            <button onClick={() => update(field.id, { options: [...(field.options || []), `Opção ${(field.options?.length || 0) + 1}`] })}
                              className="w-full h-8 rounded-xl border border-dashed border-border text-[11px] font-bold text-foreground/40 hover:text-foreground hover:border-foreground/30 transition-all flex items-center justify-center gap-1.5">
                              <Plus className="h-3 w-3" /> Adicionar opção
                            </button>
                          </div>
                        )}

                        {/* Number limits */}
                        {['number','range'].includes(field.type) && (
                          <div className="grid grid-cols-3 gap-3">
                            {[['Mínimo','min'],['Máximo','max'],['Passo','step']].map(([l,k]) => (
                              <div key={k} className="space-y-1.5">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-foreground/30">{l}</Label>
                                <Input type="number" value={(field as any)[k] ?? ''}
                                  onChange={e => update(field.id, { [k]: parseFloat(e.target.value) || undefined })}
                                  className="h-9 rounded-xl border-border bg-muted/30 text-sm" />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Text limits */}
                        {['text','textarea','email','tel','url','name','cpf','cnpj','cep'].includes(field.type) && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-foreground/30">Mín. caracteres</Label>
                              <Input type="number" value={field.minLength ?? ''} onChange={e => update(field.id, { minLength: parseInt(e.target.value) || undefined })}
                                className="h-9 rounded-xl border-border bg-muted/30 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[9px] font-black uppercase tracking-widest text-foreground/30">Máx. caracteres</Label>
                              <Input type="number" value={field.maxLength ?? ''} onChange={e => update(field.id, { maxLength: parseInt(e.target.value) || undefined })}
                                className="h-9 rounded-xl border-border bg-muted/30 text-sm" />
                            </div>
                          </div>
                        )}

                        {/* Paragraph / heading content */}
                        {['paragraph','heading'].includes(field.type) && (
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-foreground/30">Conteúdo</Label>
                            <Textarea value={field.defaultValue || ''} onChange={e => update(field.id, { defaultValue: e.target.value })}
                              rows={3} className="rounded-xl border-border bg-muted/30 resize-none text-sm" />
                          </div>
                        )}

                        {/* Toggles row */}
                        <div className="flex flex-wrap gap-3 pt-1">
                          {!['heading','divider','paragraph'].includes(field.type) && (
                            <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-xl">
                              <Label className="text-[10px] font-black uppercase text-foreground/40 cursor-pointer">Obrigatório</Label>
                              <Switch checked={!!field.required} onCheckedChange={v => update(field.id, { required: v })} />
                            </div>
                          )}
                          <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-xl">
                            <Label className="text-[10px] font-black uppercase text-foreground/40 cursor-pointer">Meia largura</Label>
                            <Switch checked={field.width === 'half'} onCheckedChange={v => update(field.id, { width: v ? 'half' : 'full' })} />
                          </div>
                          <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-xl">
                            <Label className="text-[10px] font-black uppercase text-foreground/40 cursor-pointer">Oculto</Label>
                            <Switch checked={!!field.hidden} onCheckedChange={v => update(field.id, { hidden: v })} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
