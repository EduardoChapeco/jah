# DESIGN.md — Plataforma JAH (Design System Canônico Dual & Apple HIG)

> **Fonte Única de Verdade (Single Source of Truth)** do Design System da plataforma comunitária JAH.
> Segue a especificação aberta Google Labs `DESIGN.md`: tokens semânticos em YAML + justificativa humana + diretrizes Apple Human Interface Guidelines (HIG).
> Os valores canônicos de CSS vivem em `src/styles.css`.

---

## 1. Arquitetura Visual Dual (Operacional Clean vs. Apresentação Editorial)

O produto JAH opera sob uma separação arquitetural estrita entre **Operação** e **Exibição Cultural**:

```yaml
brand: Jah
tagline: Community Commerce OS (Gestão Limpa, Expressão Livre)
voice: direto, neutro, eficiente, confiável, silencioso
mood: minimalista, alto contraste funcional, bordas suaves, densidade adaptável
principles:
  - "O Operacional deve desaparecer para que o dado e a produtividade brilhem. Zero ruído."
  - "Contraste nítido de texto preto denso sobre fundos esbranquiçados levemente acinzentados."
  - "Cores semânticas (vermelho destrutivo, verde sucesso, azul/info, laranja ação) restritas às interações vitais e badges."
  - "Bordas finas (1px) e raios contidos (radius-md: 12px a 16px) constroem a interface; sombras são quase inexistentes (restritas a popovers e sheets)."
  - "Tipografia 100% utilitária (Inter, system-ui, sans-serif)."
  - "Alvos de toque móveis sempre com área mínima de 44x44px (Regra de Ouro Apple HIG)."
  - "Mídia 100% Full Bleed: Imagens de cards sangram até a borda sem margens ou paddings externos."
  - "Avatares em Squircle: Formato quadrado com cantos arredondados (rounded-2xl/3xl) sem bordas grossas artificiais."
anti_patterns:
  - "Surface/Zine-style em painéis de retaguarda, formulários ou tabelas administrativas."
  - "Cantos agressivamente afiados ou brutalismo no Admin/Workspace."
  - "Gradientes caóticos, Glassmorphism pesado ou botões gigantes sem propósito."
  - "Bordas brancas grossas artificiais (border-4/border-8) em avatares e logos."
  - "Imagens de cards fechadas dentro de padding externo (gerando margem branca/cinza indesejada)."
  - "Formulários públicos abertos de avaliação sem comprovação de compra entregue."
```

---

## 2. Regra Canônica de Mídia Full Bleed em Cards

Todos os cards de produtos, classificados, eventos, empresas do diretório, lojas e passeios devem seguir a regra estrita de **Mídia 100% Full Bleed**:

```tsx
// ESTRUTURA CANÔNICA DO CARD
<div className="group rounded-3xl border border-border bg-card overflow-hidden shadow-2xs hover:border-foreground/30 transition-all flex flex-col justify-between">
  {/* 1. MÍDIA FULL BLEED (100% na borda superior, sem padding no container pai) */}
  <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
    <img src={imageUrl} alt={title} className="size-full object-cover group-hover:scale-105 transition-transform duration-500" />
    {/* Badges flutuantes no topo da mídia */}
  </div>

  {/* 2. CORPO COM PADDING INTERNO */}
  <div className="p-4 pt-2 space-y-2 flex-1 flex flex-col justify-between">
    {/* Avatar Squircle sobreposto se houver (-mt-6 ml-4 size-12 rounded-2xl border border-border/60) */}
    {/* Título, preço, localização e tags */}
    {/* Barra de ações com botões padronizados */}
  </div>
</div>
```

---

## 3. Regra Canônica de Avatares & Fotos de Perfil (Squircle)

- **Faca de Corte Única**: Proporção 1:1 (`cropShape="rect"` e `aspectRatio={1}`).
- **Geometria Visual**: Squircle com cantos arredondados suaves (`rounded-2xl` a `rounded-3xl`).
- **Tratamento de Borda**: Fina e limpa (`border border-border/60`), eliminando qualquer borda branca grossa artificial.

---

## 4. Hierarquia de Elevação & Superfícies (Liquid Glass & HIG Layers)

```yaml
elevation_hierarchy:
  level_0_background:
    token: "var(--color-background)"
    value: "oklch(0.99 0 0) light / oklch(0.12 0 0) dark"
    role: "Fundo base do viewport e da aplicação"
  level_1_card:
    token: "var(--color-card)"
    border: "1px solid var(--color-border)"
    radius: "rounded-2xl (16px a 18px)"
    shadow: "shadow-2xs ou shadow-xs"
    role: "Superfície padrão para agrupamento de dados, produtos, tabelas e formulários"
  level_2_floating_bar:
    token: "bg-background/95 backdrop-blur-md border-b border-border/40"
    role: "Barras fixas de navegação (TopBar, BottomNav, Sub-headers) com altura invariável e zero layout shift"
  level_3_overlay:
    token: "bg-card rounded-2xl sm:rounded-3xl shadow-xl border border-border"
    backdrop: "bg-black/50 backdrop-blur-xs"
    role: "Modais (Dialog), Gavetas Fullscreen (SheetPage/Drawers) e Menus Flutuantes"
```

---

## 5. Tokens de Cor Semânticos

```yaml
color_tokens:
  background:
    value: "#FAFAFA (oklch 0.99 0 0)"
    role: "Fundo principal (silencioso e clínico)"
  foreground:
    value: "#0F1115 (oklch 0.12 0 0)"
    role: "Texto principal de alta legibilidade (preto denso)"
  card:
    value: "#FFFFFF (oklch 1 0 0)"
    role: "Superfícies de destaque e cartões de conteúdo"
  muted:
    value: "#6B7280 (oklch 0.45 0 0)"
    role: "Texto secundário, legendas e placeholders"
  primary:
    value: "#18181B (oklch 0.12 0 0)"
    role: "Ação primária corporativa/neutra (quase preto)"
  primary_foreground:
    value: "#FFFFFF"
  accent / signal-orange:
    value: "#FF5400"
    role: "Destaque de conversão e badges de alta energia"
  success:
    value: "#10B981"
    role: "Pedidos concluídos, status verificado, WhatsApp"
  destructive:
    value: "#EF4444"
    role: "Cancelamento, remoção, alertas críticos"
```
