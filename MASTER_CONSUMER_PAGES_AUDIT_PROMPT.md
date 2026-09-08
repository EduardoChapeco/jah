# 🏛️ PROMPT MASTER BIGTECH — AUDITORIA, ESTABILIZAÇÃO & REFINAMENTO DAS PÁGINAS DO CONSUMIDOR
## Conselho Executivo BigTech · Red Team · Completude Séptupla · Design Ops & Apple HIG

> **REGIME DE ENGENHARIA:** Vinculante e Obrigatório para Qualquer Agente/IA  
> **ESCOPO:** Auditoria e Estabilização das 112 Rotas Voltadas ao Usuário Comum (`src/routes/_store.*`)  
> **STATUS:** 🟢 **100% EXECUTADO & VALIDADO** (Build Verde Exit Code 0, 252/252 Vitest Passando)

---

### 🧭 1. DIRETRIZES FUNDAMENTAIS DO CONSELHO EXECUTIVO

#### 1.1 Regra Inviolável da Separação Mobile vs. Desktop
1. **O Desktop Nunca Pode Ser um Celular Esticado:** Nenhuma página pública de detalhes ou fluxo transacional pode ficar confinada em `max-w-xl` ou `max-w-2xl` no centro da tela. Em telas `>= lg:` (1024px+), o layout DEVE ser split em 2 colunas (`lg:grid-cols-12 gap-8`):
   - Coluna Principal (`col-span-7` ou `col-span-8`): Fotos, descrição, itinerário, mapa.
   - Coluna Lateral Fixa (`col-span-5` ou `col-span-4`): Painel de ação, cálculo de frete/lotes, resumo de preços e CTA primário.
2. **O Mobile Nunca Pode Sofrer Invasão de Desktop:** No mobile, as ações primárias vivem no terço inferior da tela (**Thumb Zone**), com alvos de toque mínimos de **44x44px (`h-11`)**, gavetas inferiores (`Sheet`) em vez de modais centrados, e conclusão de compras/contatos em no máximo **3 toques**.
3. **Zero Vazamento de Componentes (Zero Bleed):** Barras fixas no rodapé devem ter `md:hidden` ou `lg:hidden`. A barra lateral contextual deve ter `hidden lg:flex`. Botões de ação como "Editar Perfil" nunca podem renderizar duplicados na mesma tela.

#### 1.2 Erradicação de Grids Compressivas
- Substituir qualquer `grid-cols-3` ou `grid-cols-4` sem breakpoints por layout adaptativo:
  - Fichas técnicas: `grid-cols-2 sm:grid-cols-4 gap-2.5`.
  - Horários de agendamento: `grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2`.
  - Cards de métricas e sessões: `grid-cols-1 sm:grid-cols-2 md:grid-cols-3`.

#### 1.3 Higiene Visual & Silêncio Absoluto (Anti-AI Smell)
- **H1 Silencioso:** No máximo 3 palavras ("Mercado", "Buscar", "Mensagens", "Pedidos", "Agendamentos", "Métricas", "Processos", "Indicações").
- **Zero Caixas Conversacionais:** Eliminar banners "Bem-vindo ao...", "Aqui você pode acompanhar..." e textos redundantes embaixo de inputs.
- **Design System Neutro:** Erradicar cores Tailwind hardcoded (`text-indigo-600`, `bg-blue-500`) em favor dos tokens semânticos (`var(--color-primary)`, `var(--color-border)`, `var(--color-muted)`).

---

### 📋 2. MATRIZ DE EXECUÇÃO EM 4 MICRO-FASES

#### FASE A: Descompressão de Grids no Mobile & Ajuste de Breakpoints
- [x] `_store.classificados.$id.tsx`: Migrar ficha técnica de veículo/imóvel/vaga de `grid-cols-3` para `grid-cols-2 sm:grid-cols-4 gap-2.5`. Eliminar cores `indigo-500`.
- [x] `_store.agendar.index.tsx`: Ajustar seletor de horários de `grid-cols-4` para `grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2` com touch targets de 44px de altura.
- [x] `_store.pedido.$publicToken.confirmacao.tsx`: Substituir grade de 4 colunas do resumo por lista vertical limpa.
- [x] `_store.conta.pacotes.tsx`: Ajustar grid de sessões para `grid-cols-1 sm:grid-cols-2 md:grid-cols-3`.
- [x] `_store.entrega.$token.tsx`: Ajustar dados do entregador/veículo para lista com layout split no desktop.

#### FASE B: Expansão e Desbloqueio do Desktop (Fim do Desktop-Celular)
- [x] `_store.evento.$id.tsx`: Remover `max-w-2xl`. Implementar layout split `lg:grid-cols-12` (Coluna 7: Banner hero 16:9 + atrações; Coluna 5: Lotes de ingressos + botão de compra fixo à direita).
- [x] `_store.turismo.$id.tsx`: Remover `max-w-xl`. Implementar layout split `lg:grid-cols-12` (Coluna 7: Galeria + itinerário; Coluna 5: Card de reserva + seletor de passageiros).
- [x] `_store.carrinho.tsx`: Remover `max-w-lg`. Implementar split layout (Coluna 8: Itens por loja; Coluna 4: Resumo de frete/cupons e botão "Finalizar Pedido").
- [x] `_store.ofertas.tsx`: Remover `max-w-xl`. Expandir para grid responsiva fluida de 4 colunas no desktop (`sm:grid-cols-2 lg:grid-cols-4`).

#### FASE C: Higiene de Headers & Erradicação de AI-Smell
- [x] Simplificar H1s em `_store.conta.agendamentos.tsx`, `_store.conta.metricas.tsx`, `_store.conta.processos.tsx`, `_store.convite.tsx` e `_store.entregador.cadastro.tsx`.
- [x] Eliminar caixas conversacionais explicativas redundantes.
- [x] Garantir que em `_store.membro.$id.tsx` o botão "Editar Perfil" exista exatamente 1 vez por viewport (`sm:hidden` nas abas móveis, `hidden sm:inline-flex` no card desktop).

#### FASE D: Validação do Red Team & Runtime Proof
- [x] Executar `node scripts/audit_consumer_pages.js` (Garantir 0 grids compressivas).
- [x] Executar `node scripts/audit_narrow_containers.js` (Garantir 0 páginas críticas com container encolhido).
- [x] Executar `cmd /c "npm run build"` (Garantir compilação limpa com Exit Code 0).
