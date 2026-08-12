# DESIGN.md — Design System (Jah Community Platform)

Este é o documento de referência oficial (Single Source of Truth) para o Design System da Jah Community Platform. A plataforma adota um estilo estritamente **Clean, Minimalista, Maduro e Operacional**, similar ao padrão iFood Admin, Luma e Apple.

> 🛑 **ATENÇÃO (REGRA ABSOLUTA): O estilo "Neo-Brutalismo" / "Zine" / "Punk" FOI TOTALMENTE BANIDO DAS SUPERFÍCIES OPERACIONAIS.**
> A estética cultural da JAH será preservada *apenas* em um boundary arquitetural estrito: o **Editorial Presentation System** (usado pelo Builder para renderizar páginas públicas e perfis). Toda a gestão, admin, PDV, catálogos e dashboards (o **Operational Design System**) são CLEAN.

## 1. Boundary Arquitetural

- **Operational Design System (O Padrão):** Foco em densidade, ergonomia, leitura rápida, progressive disclosure. Usado em 100% dos painéis, formulários, tabelas e catálogos funcionais. NENHUM token editorial (textura, fonte display, cor saturada hardcoded, modais gigantes sem motivo) pode vazar para cá.
- **Editorial Presentation System (A Exceção Isolada):** Presets visuais (Zine, Lambe-lambe, Vinyl) que o usuário pode aplicar *ao seu conteúdo* (site, link na bio, poster de evento). A ferramenta que *constrói* esse conteúdo continua clean.

## 2. Metáforas e Identidade Visual (Operacional)

- Interface clara, fundo neutro, superfícies brancas, bordas discretas (1px).
- Nenhuma sombra dura ou deslocamento brutalista. Sombras apenas para elevação suave (popovers, menus).
- Componentes leves, edição contextual e ações próximas ao objeto.

## 3. Tipografia Canônica

- A interface operacional usa uma única família tipográfica: `Inter` (sans-serif).
- Nenhuma fonte display, uppercase artificial, ou letter-spacing exagerado para textos operacionais.
- Escala: `text-xs` (meta/label), `text-sm` (body/control), `text-base` (section heading), `text-xl`/`text-2xl` (entity heading). Títulos gigantes (40px+) estão banidos da operação.

## 4. Cores Primitivas e Semânticas

**NUNCA utilize HEX crus.**
- Superfícies: `background` (neutro acinzentado), `surface` (branco), `surface-subtle`.
- Texto: `text-primary` (quase preto), `text-secondary` (cinza), `text-muted`.
- Ação Primária: `action-primary` (preto sólido ou cor canônica JAH discreta, sem saturar excessivamente).
- Cores de feedback: `success`, `warning`, `danger`, `info` (tons equilibrados, não fluorescentes).
- Bordas: `border-default` (baixo contraste).

## 5. Anatomia de Layouts Operacionais

- **Zero "Landing Pages" no App:** É proibido criar páginas administrativas com Hero (Título Gigante + Descrição Comercial). O contexto é dado pela URL, navegação selecionada ou nome da entidade.
- **Não envolver tudo em Card:** Listas e Data Grids devem respirar na superfície, sem caixas dentro de caixas. Cards apenas quando houver unidade semântica independente.
- **Desktop Amplo:** Use toda a viewport. Não restrinja painéis operacionais a colunas estreitas. 
- **Formulários (Progressive Disclosure):** Peça apenas o necessário primeiro. Oculte o avançado. Salve cedo.
- **Modais:** Modais centrais pequenos *somente* para confirmações/alertas curtos. Fluxos intermediários em Desktop usam `Sheet` (Side panel de ~60-75%). Mobile usa full-screen drawer ou pilha. Fluxos complexos usam página dedicada.

## 6. Prova Visual

Uma tela é considerada concluída se e somente se:
- Não parecer um protótipo, um dashboard genérico de IA, ou uma landing page.
- Estiver funcional em Mobile (recomposta, não apenas espremida) e Desktop.
- Houver feature parity completo com os contratos BFF.
- Todas as ações estiverem conectadas a dados reais (sem mocks ou 'fake data').
