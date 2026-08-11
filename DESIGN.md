# DESIGN.md — Plataforma JAH (Design System Canônico Dual)

> Fonte única de verdade do design system da plataforma comunitária JAH. Segue a especificação aberta
> Google Labs `DESIGN.md`: tokens semânticos em YAML + justificativa humana.
> Os valores canônicos vivem em `src/styles.css`. 
> 
> **MANDATO DE DESIGN V4:** O produto JAH opera sob uma arquitetura visual dividida. A Operação (dashboards, catálogos, PDV, admin) utiliza um design system "Clean", minimalista e silencioso (referências: iFood, Neutto, Mobg, Luma). A apresentação pública (Feeds, Murais, Posts Especiais) pode utilizar as clássicas formatações culturais "Underground" (Zines, Cartazes, Tickets), restritas exclusivamente à *exibição* de dados.

## 1. Direção Criativa: Operacional "Clean"

```yaml
brand: Jah
tagline: Community Commerce OS (Gestão Limpa, Expressão Livre)
voice: direto, neutro, eficiente, silencioso
mood: minimalista, alto contraste funcional, bordas suaves, densidade adaptável
principles:
  - "O Operacional deve desaparecer para que o dado brilhe. Sem ruídos."
  - "Contraste forte de texto preto denso sobre fundos esbranquiçados levemente acinzentados."
  - "Cores semânticas (vermelho destrutivo, verde sucesso, azul/info, laranja ação) restritas às interações e selos/badges."
  - "Bordas finas (1px) e raios contidos (radius-md: ~8px a 12px) constroem a interface, sombras são quase inexistentes (somente em popovers/drawers)."
  - "Tipografia 100% utilitária (Inter, Roboto ou equivalente sans-serif)."
anti_patterns:
  - "Surface/Zine-style em painéis de retaguarda, formulários ou tabelas."
  - "Cantos agressivamente afiados ou brutalismo exagerado no Admin."
  - "Gradientes, Glassmorphism, Sombras longas ou botões gigantes sem propósito."
  - "Fontes condensadas/display ilegíveis em contextos operacionais densos."
```

## 2. Direção Criativa: Apresentação "Editorial" (Restrita ao Feed/Superfície Pública)

```yaml
context: "Renderizadores de posts, vitrines de eventos especiais, lambe-lambes e flyers digitais."
principles:
  - "A estética cultural da JAH vive aqui como uma camada de estilo separada do conteúdo."
  - "Usuários selecionam um 'Preset' visual (ex: PosterSurface, TicketSurface)."
  - "Usa-se tipografia pesada (display_cultural), texturas de grain/papel, brutalismo, e cores saturadas."
```

## 3. Tokens de Cor (Operacional Clean)

```yaml
color_tokens:
  background:
    value: "#FAFAFA (oklch 0.98 0 0)"
    role: "Fundo principal (silencioso e clínico)"
  foreground:
    value: "#0F1115 (oklch 0.2 0 0)"
    role: "Texto principal de alta legibilidade"
  card:
    value: "#FFFFFF"
    role: "Superfícies de destaque contidas"
  muted:
    value: "#6B7280"
    role: "Texto secundário, placeholders e help texts"
  primary:
    value: "#18181B (oklch 0.25 0 0)"
    role: "Ação primária corporativa/neutra (quase preto)"
  primary_foreground:
    value: "#FFFFFF"
  accent / signal-orange:
    value: "#FF5E00 (oklch 0.65 0.2 45)"
    role: "Chamadas de atenção exclusivas JAH, botões de checkout, interações vitais"
  border:
    value: "#E5E7EB"
    role: "Divisões estruturais levíssimas (1px solid)"
  destructive:
    value: "#EF4444"
    role: "Cancelamentos, exclusões e erros"
  success:
    value: "#10B981"
```

## 4. Tipografia (Focada na Tarefa)

```yaml
fonts:
  ui_sans:
    family: "Inter, system-ui, sans-serif"
    weights: [400, 500, 600, 700]
    use: "100% da interface operacional."
  display_cultural:
    family: "Bebas Neue, Anton ou equivalente pesada/condensada"
    weights: [400, 700]
    use: "SOMENTE nos renderizadores visuais do feed (Tickets/Posters). NUNCA em painéis operacionais."

scale:
  h1: { size: "1.875rem", weight: 700, line: 1.2 }
  h2: { size: "1.5rem", weight: 600, line: 1.3 }
  h3: { size: "1.25rem", weight: 600, line: 1.4 }
  body: { size: "0.875rem (14px) ou 1rem (16px)", weight: 400, line: 1.5 }
  small: { size: "0.75rem (12px)", weight: 400, color: "muted" }
```

## 5. Primitivas de UI (Componentes Canônicos Operacionais)

```yaml
components:
  Cards: "Fundo branco puro, borda E5E7EB (1px solid), radius de 12px, shadow quase zero (apenas sm para separar). Sem backgrounds exóticos."
  Inputs: "Altura h-10 ou h-12. Fundo branco, borda cinza clara. Foco visível (ring) azul neutro ou preto. Radius de 8px."
  Tabelas: "Data grids densos. Sem card wrapper redundante no mobile (vira stack). Padding contido. Hover nas linhas com cinza levíssimo."
  Modais/Drawers: "Drawer (Side Panel) deslizando da direita para edições avançadas (Padrão iFood). Fundo branco, sombra pesada para flutuar acima do conteúdo, backdrop escuro 50%."
  Truthful_Preview: "Em páginas de criação (Master-Detail/Dedicated Page), o preview fica na coluna direita mostrando EXATAMENTE como a entidade será vista publicamente, sem 'mockups fakes' de celular."
```

## 6. Estados e Navegação em Profundidades

```yaml
states:
  loading: "Skeletons neutros (cinza clarinho) ou spinners discretos no botão acionado. Nada de loading de página cheia pulando."
  empty: "Gráfico SVG muito limpo (traço fino) + título curto + descrição amigável + botão principal (Criar Novo). Nada de telas 'arrancadas'."
  unconfigured: "Badges amarelos ou states indicando (Pendente de Integração)."

navigation:
  sidebar: "Esquerda, ícones sólidos, expansível. Fundo quase branco ou dark sutil (a depender do tema geral, mantendo contraste alto com a área principal)."
  mobile: "Bottom nav bar para as ações primárias da operação (PDV, Pedidos, etc). Telas secundárias viram modais empilhados full-screen."
```
