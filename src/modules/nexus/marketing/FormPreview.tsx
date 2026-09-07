import { useState } from 'react';
import { FormField } from './FormBuilder';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface Props {
  fields: FormField[];
  title: string;
  description?: string;
  submitText?: string;
  theme?: 'light' | 'dark' | 'brand';
  accentColor?: string;
}

export function FormPreview({ fields, title, description, submitText = 'Enviar', theme = 'light', accentColor = '#6366f1' }: Props) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [rating, setRating] = useState<Record<string, number>>({});

  const bgClass = theme === 'dark' ? 'bg-zinc-900 text-white' : theme === 'brand' ? 'bg-gradient-to-br from-indigo-50 to-purple-50' : 'bg-white';
  const cardClass = theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-border';
  const labelClass = theme === 'dark' ? 'text-zinc-300' : 'text-foreground/60';
  const inputClass = theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500' : 'bg-muted/30 border-border';

  const sv = (id: string, v: any) => setValues(prev => ({ ...prev, [id]: v }));

  const renderField = (field: FormField) => {
    if (field.hidden) return null;

    if (field.type === 'divider') return <hr key={field.id} className="border-border my-2" />;

    if (field.type === 'heading') return (
      <div key={field.id}>
        <h3 className="text-lg font-black text-foreground">{field.label}</h3>
        {field.defaultValue && <p className="text-sm text-foreground/50 mt-1">{field.defaultValue}</p>}
      </div>
    );

    if (field.type === 'paragraph') return (
      <p key={field.id} className="text-sm text-foreground/60 leading-relaxed">{field.defaultValue || field.label}</p>
    );

    const wrapClass = field.width === 'half' ? 'col-span-1' : 'col-span-2';

    const inner = (() => {
      switch (field.type) {
        case 'textarea':
          return <Textarea value={values[field.id] || ''} onChange={e => sv(field.id, e.target.value)}
            placeholder={field.placeholder} rows={3} className={cn('rounded-xl resize-none text-sm', inputClass)} />;

        case 'boolean':
          return (
            <div className="flex items-center gap-3 h-11">
              <Switch checked={!!values[field.id]} onCheckedChange={v => sv(field.id, v)} />
              <span className="text-sm text-foreground/60">{values[field.id] ? 'Sim' : 'Não'}</span>
            </div>
          );

        case 'select':
          return (
            <select value={values[field.id] || ''} onChange={e => sv(field.id, e.target.value)}
              className={cn('w-full h-11 rounded-xl border px-3 text-sm font-medium appearance-none', inputClass)}>
              <option value="">{field.placeholder || 'Selecione...'}</option>
              {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          );

        case 'radio':
          return (
            <div className="space-y-2">
              {(field.options || []).map(o => (
                <label key={o} className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn('h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all',
                    values[field.id] === o ? 'border-primary bg-primary' : 'border-border group-hover:border-foreground/40')}>
                    {values[field.id] === o && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm text-foreground/70">{o}</span>
                  <input type="radio" className="hidden" value={o} checked={values[field.id] === o} onChange={() => sv(field.id, o)} />
                </label>
              ))}
            </div>
          );

        case 'checkbox': {
          const checked: string[] = values[field.id] || [];
          return (
            <div className="space-y-2">
              {(field.options || []).map(o => (
                <label key={o} className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn('h-4 w-4 rounded border-2 flex items-center justify-center transition-all',
                    checked.includes(o) ? 'border-primary bg-primary' : 'border-border group-hover:border-foreground/40')}>
                    {checked.includes(o) && <span className="text-white text-[10px]">✓</span>}
                  </div>
                  <span className="text-sm text-foreground/70">{o}</span>
                  <input type="checkbox" className="hidden" checked={checked.includes(o)}
                    onChange={() => sv(field.id, checked.includes(o) ? checked.filter(c => c !== o) : [...checked, o])} />
                </label>
              ))}
            </div>
          );
        }

        case 'rating':
          return (
            <div className="flex gap-1">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => sv(field.id, n)}
                  onMouseEnter={() => setRating(r => ({ ...r, [field.id]: n }))}
                  onMouseLeave={() => setRating(r => ({ ...r, [field.id]: 0 }))}>
                  <Star className={cn('h-7 w-7 transition-all',
                    n <= (rating[field.id] || values[field.id] || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-foreground/20')} />
                </button>
              ))}
            </div>
          );

        case 'range':
          return (
            <div className="space-y-1">
              <input type="range" min={field.min ?? 0} max={field.max ?? 100} step={field.step ?? 1}
                value={values[field.id] ?? field.defaultValue ?? field.min ?? 0}
                onChange={e => sv(field.id, e.target.value)}
                className="w-full accent-primary" />
              <div className="flex justify-between text-[10px] text-foreground/30">
                <span>{field.min ?? 0}</span>
                <span className="font-bold text-foreground/60">{values[field.id] ?? field.defaultValue ?? field.min ?? 0}</span>
                <span>{field.max ?? 100}</span>
              </div>
            </div>
          );

        case 'file':
          return (
            <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 bg-muted/20 cursor-pointer hover:border-foreground/30 transition-all">
              <p className="text-sm font-bold text-foreground/40">Clique ou arraste o arquivo</p>
              <input type="file" className="hidden" />
            </div>
          );

        default:
          return (
            <Input type={field.type === 'cpf' || field.type === 'cnpj' || field.type === 'cep' || field.type === 'name' ? 'text' : field.type}
              value={values[field.id] || ''}
              onChange={e => sv(field.id, e.target.value)}
              placeholder={field.placeholder}
              minLength={field.minLength}
              maxLength={field.maxLength}
              defaultValue={field.defaultValue}
              className={cn('h-11 rounded-xl text-sm', inputClass)} />
          );
      }
    })();

    return (
      <div key={field.id} className={wrapClass}>
        {!['boolean','divider'].includes(field.type) && (
          <Label className={cn('text-[11px] font-black uppercase tracking-widest mb-1.5 block', labelClass)}>
            {field.label} {field.required && <span className="text-destructive">*</span>}
          </Label>
        )}
        {inner}
        {field.helpText && <p className="text-[11px] text-foreground/40 mt-1">{field.helpText}</p>}
      </div>
    );
  };

  return (
    <div className={cn('rounded-2xl p-6 h-full overflow-auto', bgClass)}>
      {/* Form card */}
      <div className={cn('rounded-2xl border p-8 max-w-lg mx-auto shadow-sm', cardClass)}>
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-black text-foreground">{title || 'Título do formulário'}</h2>
          {description && <p className="text-sm text-foreground/50 mt-2">{description}</p>}
        </div>

        {/* Fields grid */}
        <div className="grid grid-cols-2 gap-5">
          {fields.filter(f => !f.hidden).map(renderField)}
        </div>

        {/* Submit */}
        {fields.length > 0 && (
          <button
            type="button"
            style={{ backgroundColor: accentColor }}
            className="mt-8 w-full h-12 rounded-xl text-white text-sm font-black hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            {submitText || 'Enviar'} →
          </button>
        )}

        {fields.length === 0 && (
          <div className="py-10 text-center text-foreground/20 text-sm">
            Adicione campos para ver o preview
          </div>
        )}
      </div>
    </div>
  );
}
