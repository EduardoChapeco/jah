import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACCENT_COLORS, STORE_TYPES, type StepProps } from "./types";
import { Pencil, Upload } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function IdentityStep({ data, onChange }: StepProps) {
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  // Fetch categories from DB
  const { data: categories } = useQuery({
    queryKey: ["ad-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_categories")
        .select("id, name, slug")
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (!data.customSlug) {
      onChange({ slug: toSlug(data.name) });
    }
  }, [data.name, data.customSlug]);

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "banner"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === "logo") {
      onChange({ logoFile: file, logoPreview: url });
    } else {
      onChange({ bannerFile: file, bannerPreview: url });
    }
  };

  // Map store type to suggested category slugs
  const storeType = STORE_TYPES.find((t) => t.id === data.storeType);

  return (
    <div className="max-w-2xl mx-auto px-4 space-y-6">
      <h1 className="text-2xl font-bold text-foreground text-center">
        Identidade da sua loja
      </h1>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="store-name">Nome da loja *</Label>
        <Input
          id="store-name"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Ex: Pizzaria do João"
          className="text-lg h-12"
          maxLength={80}
        />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>starble.com/</span>
          {data.customSlug ? (
            <Input
              value={data.slug}
              onChange={(e) => onChange({ slug: toSlug(e.target.value) })}
              className="h-7 w-48 text-sm"
              maxLength={60}
            />
          ) : (
            <span className="font-medium text-foreground">{data.slug || "..."}</span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => onChange({ customSlug: !data.customSlug })}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Tagline */}
      <div className="space-y-2">
        <Label htmlFor="tagline">Slogan / Tagline</Label>
        <Input
          id="tagline"
          value={data.tagline}
          onChange={(e) => onChange({ tagline: e.target.value })}
          placeholder="Uma frase curta sobre seu negócio"
          maxLength={120}
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>Categoria principal *</Label>
        <Select value={data.categoryId} onValueChange={(v) => onChange({ categoryId: v })}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {storeType && (
          <p className="text-xs text-muted-foreground">
            Tipo selecionado: {storeType.icon} {storeType.label}
          </p>
        )}
      </div>

      {/* Logo & Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Logo</Label>
          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e, "logo")}
          />
          <button
            onClick={() => logoRef.current?.click()}
            className="w-28 h-28 rounded-full border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden hover:border-primary transition-colors mx-auto"
          >
            {data.logoPreview ? (
              <img src={data.logoPreview} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
          </button>
        </div>

        <div className="space-y-2">
          <Label>Banner (16:9)</Label>
          <input
            ref={bannerRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e, "banner")}
          />
          <button
            onClick={() => bannerRef.current?.click()}
            className="w-full aspect-video rounded-xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden hover:border-primary transition-colors"
          >
            {data.bannerPreview ? (
              <img src={data.bannerPreview} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <Upload className="h-6 w-6" />
                <span className="text-xs">Upload banner</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Accent color */}
      <div className="space-y-2">
        <Label>Cor de destaque</Label>
        <div className="flex gap-3 flex-wrap">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onChange({ accentColor: color })}
              className={`w-9 h-9 rounded-full border-2 transition-transform ${
                data.accentColor === color
                  ? "border-foreground scale-110 ring-2 ring-offset-2 ring-primary"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
