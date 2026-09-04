# DOSSIÊ MÁXIMO DE AUDITORIA FORENSE E MEGA PLANO DE ENGENHARIA DE UNIFICAÇÃO (JAH MASTER OS)
**Classificação:** Documento Canônico de Arquitetura e Engenharia de Software (Staff / Principal Architect Level)  
**Repositório Central:** `Documents/jah` (JAH Core Operating System)  
**Data de Consolidação:** 04 de Setembro de 2026  
**Status da Auditoria:** 100% de cobertura nos 9 repositórios locais do ecossistema:
1. `jah` (Core OS Multi-Tenant & Multi-Nicho)
2. `wider` (SuperApp: RH/Ponto, Courier, Atendimento, 70+ Engines, KDS, PDV, Workflows, Studio Gráfico/Vídeo)
3. `persona-nexus` (Motor de Eventos, Subpainéis Tokenizados, Kanban, AI Insights, Ingressos)
4. `simwork` (SimLab V2: Populações sintéticas demográficas, simulador generativo de personas)
5. `ENGIOS` (Orquestrador de Agentes IA, Servidor MCP, 17 provedores LLM, Squads autônomos)
6. `cloudblock` (Visual Page Builder com 40 blocos modulares de alta conversão)
7. `machine` / `studiomachine` (Gerador de Carrosséis Virais, Editor de Marca com IA Google Gemini)
8. `classificadoswaesy` (WMS Picking com leitor de código de barras, App do Garçom, Construtor PWA)
9. `travelagencias` & `turisagencias` (Layout de Poltronas de Ônibus, Embarques e Vouchers com QR Code)

---

## 1. DIRETRIZES PÉTREAS DE UNIFICAÇÃO (ZERO DEPRECIAÇÃO & ZERO DUPLICAÇÃO)

1. **Zero Duplicação de Código:**
   - O JAH já possui alicerces sólidos em `src/services/` (ex: `builder.functions.ts` com 2.847 linhas, `mobility.functions.ts` com 1.048 linhas, `events.functions.ts`, `simlab.functions.ts`, `telemetry.functions.ts`).
   - Não criaremos novos builders ou serviços concorrentes. Toda tecnologia madura extraída dos satélites será **incorporada, estendida e nativizada** sobre os alicerces existentes do JAH.
2. **Nativização Estrita para a Stack JAH Elite:**
   - **Roteamento:** Banido `react-router-dom` e `remix`. 100% das páginas rodam em **TanStack Router** (`createFileRoute` tipado em `src/routes/`).
   - **Camada de Dados & Backend:** Banidas queries descontroladas no cliente. Todas as chamadas de banco de dados são encapsuladas em **TanStack Start Server Functions** (`createServerFn({ method: 'POST' }).validator(zodSchema).handler(...)`).
   - **Design System Apple HIG:** Banidas dependências visuais legadas (como `BloesyTabs`). Todos os componentes adotam **Radix UI Primitives + Tailwind CSS v4 + Phosphor/Lucide**, obedecendo ao Apple Human Interface Guidelines:
     - Elevações em camadas: `Background` -> `Card` -> `Floating Bar` -> `Sheet/Modal`.
     - Touch targets mínimos estritos de 44px e contraste WCAG AA/AAA.
     - Microinterações e feedback visual de loading em todas as ações.
   - **Multi-Tenancy Restrito:** Amarrar todas as tabelas e queries ao `store_id` com políticas de RLS atômicas (`public.is_store_staff(store_id)` e `auth.uid()`).
   - **Zero Mock Policy:** Toda funcionalidade possui persistência real em Postgres, DDL com constraints, validação de schema e tratamento de exceções de ponta a ponta.

---

## 2. INVENTÁRIO FORENSE DE TODAS AS ENGINES, CÉREBROS E MÓDULOS

### 2.1. Studio Gráfico e de Vídeo Avançado (`wider/src/components/studio` + `machine`)
* **Propósito:** Equipar o lojista e o criador de conteúdo com um Canva + CapCut integrado diretamente no painel do JAH.
* **Componentes de Imagem & Design:**
  - `StudioCanvas.tsx`: Canvas vetorial com guias magnéticas de alinhamento (`SnapGuides.tsx`), sobreposição de grid (`GridOverlay.tsx`) e elementos manipuláveis (`ImageElement`, `ShapeElement`, `TextElement`).
  - `BrandKitPanel.tsx`: Painel de kit de identidade visual (paletas de cores, tipografia corporativa e logos).
  - `Mockup3DPanel.tsx`, `LottieLibraryPanel.tsx`, `StickerLibraryPanel.tsx`: Mockups 3D, adesivos e animações Lottie.
  - `AIGeneratorPanel.tsx`: Geração de fundos de imagem e criativos com IA.
* **Componentes de Edição de Vídeo:**
  - `VideoStudioPage.tsx` + `VideoStudioTimeline.tsx`: Linha do tempo multipista com clipes arrastáveis (`DraggableClip.tsx`), corte e sobreposição.
  - `MusicPanel.tsx`, `EffectsPanel.tsx`, `FiltersPanel.tsx`, `TextOverlayPanel.tsx`: Trilhas sonoras, filtros e legendas animadas.
* **Machine (IA de Conteúdo Viral com Google Gemini):**
  - `CarouselWizard.tsx` + `SlideRenderer.tsx`: Gerador automático de carrosséis de alta retenção para redes sociais com copywriting persuasivo do Google Gemini (`geminiService.ts`).

### 2.2. Construtor de Aplicativos PWA por Empresa (`classificadoswaesy/src/pages/PWAEditorPage.tsx`)
* **Propósito:** Permitir que cada empresa cliente publique seu próprio aplicativo PWA personalizado com sua identidade visual.
* **Recursos e Contratos:**
  - Configuração visual: nome do app (`app_name`), cor primária (`theme_color`), cor de fundo (`background_color`), modo offline (`offline_enabled`).
  - Seções Reordenáveis (`SECTION_TYPES`, `usePwaSections`, `useReorderPwaSections`): vitrines, banners, atalhos de categoria e stories.
  - Campanhas de Push Notification (`useCreatePushCampaign`): disparos segmentados de notificações direto no celular dos clientes.
  - Acesso a Hardware (`PWASettingsPage.tsx` no Wider): biometria facial/digital (`useBiometricCredentials`), geolocalização e câmera.

### 2.3. Portal de Reputação & Reivindicação Estilo "Reclame Aqui" (`wider/src/pages/claim`)
* **Propósito:** Hub de confiança e resolução de conflitos empresariais, permitindo reclamações públicas, respostas mediadas e verificação de posse.
* **Recursos e Contratos:**
  - `ClaimProfilePage.tsx`: Reivindicação de perfil corporativo via e-mail institucional, contrato social/CNPJ, SMS de celular cadastrado na Receita ou verificação social.
  - `ClaimIntelligencePage.tsx`: Painel de inteligência de mercado pós-claim com pontuação de visibilidade (`visibility_score`), menções em notícias, análise regional e monitoramento de concorrentes.
  - `TrustBadge.tsx`: Selo de reputação auditada para ser embutido nos sites das empresas.

### 2.4. Portais de Empregos da Empresa (`wider/src/pages/company` e `classificadoswaesy`)
* **Propósito:** Página pública de carreiras própria da empresa para publicação de vagas, recepção de candidaturas e gestão em funil Kanban.
* **Transição Fluida para o RH:** Ao contratar o candidato no funil, o JAH transfere o perfil para o Hub do Colaborador, ativando imediatamente seu ponto eletrônico e folha de pagamento.

### 2.5. SimLab V2: Simulador Estocástico & Generativo de Personas com IA
* **Propósito:** Populações sintéticas demográficas brasileiras para avaliação em massa de ofertas, produtos e páginas antes de gastar com tráfego pago.
* **Origem:** `simwork/docs/prds/PRD-SIMLAB-V2.md` e `simwork/simlab/`.
* **Catálogo `seed_personas.json`:** Personas hiperdetalhadas (como *Carla, 32 anos, mãe de classe média em Porto Alegre, analista administrativa, renda R$ 5.800*), com valores, medos, hábitos de consumo e pesos para 7 gatilhos psicológicos (`urgency`, `social_proof`, `discount`, `hedonic`, `authority`, `social`, `friction`).
* **Modo Generativo Profundo:** Invoca LLM (`GPT-4o-mini` / Gemini) para simular o comportamento de compra da persona, gerando objeções centrais (`keyObjection`), citações reais (`quote`) e probabilidade de conversão.
* **Painel:** `SimlabReviewPanel.tsx` no JAH com scorecard de interesse e propensão à ação.

### 2.6. Cérebro Cognitivo & ModuleAuditor (`wider/src/core/brain/ModuleAuditor.ts`)
* **Propósito:** Validador em tempo de execução que atua como barreira (Brain Blocker) contra módulos vazios ou incompletos.
* **Critérios:** `hasSchema`, `hasEvents`, `hasUI`, `hasCRUD`, `hasPermissions`, `affectsRevenue` e `dependenciesMet`.
* **Reputação Vetorial:** `TrustVectorRadar.tsx` e `ArchetypeBadge.tsx` calculam em tempo real a confiabilidade do vendedor.

### 2.7. CloudBlock: 40 Blocos Visuais de Construção de Páginas (`cloudblock/src/components/blocks/`)
* **Biblioteca:** 40 componentes modulares prontos cobrindo layouts em BentoGrid, itinerários dia a dia, contadores regressivos, links de bio, cotações de serviço, avaliações, FAQs e botões flutuantes de atendimento.
* **Conexão no JAH:** Integrados diretamente ao motor [builder.functions.ts](file:///C:/Users/Excelência%20Tour%20SMO/Documents/jah/src/services/builder.functions.ts) (2.847 linhas já prontas no JAH).

### 2.8. Operações de Campo & Frente de Loja
* **KDS (Kitchen Display System) para Gastronomia:** `kds.engine.ts` + `KDSDisplay.tsx` com praças de preparo, temporizadores de SLA e recall de pedidos.
* **App do Garçom:** `GarcomApp.tsx` com mapa visual de mesas (`livre`, `ocupada`, `aguardando_conta`), comanda digital e fechamento rápido.
* **WMS Picking com Scanner:** `PickingPage.tsx` com separação de lotes de pedidos por leitor de código de barras (`ScanLine`), câmera e romaneio de expedição.
* **PDV Multi-Pagamento:** `MultiPaymentPanel.tsx` (divisão Dinheiro + PIX + Cartão), `ReceiptPreview.tsx` e `SupervisorAuthModal.tsx` com autorização por PIN.

### 2.9. Flexibilidade Multinicho Universal
* **`conditional-step-engine.ts`:** Motor de etapas condicionais (`show_if`, `skip_if`, `require_if`) que adapta dinamicamente formulários e checkout conforme o nicho.
* **`NicheCalculationEngine.ts`:** 7 modelos matemáticos de precificação nativos (`fixed`, `per_person`, `per_hour`, `per_day`, `per_kg`, `quote`).
* **`FormFieldEngine.ts`:** 20+ tipos de campos dinâmicos com presets por nicho.
* **Workflows Visuais:** `WorkflowVisualBuilder.tsx` com nós e conectores (`FlowNode`, `FlowConnector`) para automação de regras e gatilhos.

### 2.10. Hub do Colaborador & Ponto Eletrônico
* **Ponto Eletrônico com GPS:** `employee_time_entries` registrando `clock_in`, `lunch_out`, `lunch_in`, `clock_out` com geolocalização JSONB e IP.
* **Holerites & Vales:** `employee_payslips` com breakdown salarial e PDF; `employee_requests` para solicitação de adiantamentos/vales com aprovação do gestor.
* **Segurança por PIN:** `employee_pins`, `context_sessions` e `pin_audit_log` para operações rápidas em terminais compartilhados.

### 2.11. Atendimento Omnichannel Dual-Layer & Gestão de Chamados
* **Visão Externa (Cliente):** Thread contínua corporativa com a empresa (`_store.conta.conversas.$id.tsx`).
* **Visão Interna (Atendente/Gestor):** Caixa de entrada multicanal (`AtendimentoInboxPage`), divisão por setores/filas e transferência de chamados com histórico imutável.
* **Supervisão & SLA:** Cálculo analítico em tempo real de FRT (Primeira Resposta), MTTR (Resolução) e satisfação.

### 2.12. Orquestração de Agentes IA & MCP (`ENGIOS`)
* Suporte nativo ao **Model Context Protocol (MCP)** e execução de squads autônomos de agentes com verificação de saída e WebContainers.

---

## 3. ARQUITETURA SEMÂNTICA MULTINICHO & CASOS DE USO

```
                                  ==============================
                                         JAH OPERATING OS
                                  ==============================
                                                |
                 +------------------------------+------------------------------+
                 |                              |                              |
         [CORE UNIVERSAL]               [MOTORES TRANSVERSAIS]          [DOMÍNIOS DE NICHO]
       - Identidade / Permissões      - Hub do Colaborador (Ponto/RH)  - @jah/turismo
       - Ledger Financeiro Multi-Loja - Omnichannel SAC Dual-Layer     - @jah/eventos
       - Design System Apple HIG      - Mobilidade & Logística Courier  - @jah/gastronomia
       - Cérebro & ModuleAuditor      - Studio Gráfico & Vídeo Machine  - @jah/varejo-wms
       - Telemetria de Anúncios       - Construtor PWA & Page Builder   - @jah/servicos-saude
                                      - Workflows & SimLab Personas     - @jah/juridico-jus
```

### Casos de Uso Especializados:
1. **Turismo & Viagens (`@jah/turismo`):**
   Agência monta viagem rodoviária -> Define layout de poltronas de ônibus com mapa visual -> Passageiro compra e escolhe assento -> Emite voucher com QR Code -> Guia realiza check-in no embarque via leitura óptica.
2. **Gastronomia & Bares (`@jah/gastronomia`):**
   Garçom anota pedido no salão via `GarcomApp` -> Pedido cai instantaneamente na cozinha no `KDSDisplay` com timer de SLA -> Prato pronto é despachado -> Cliente paga com divisão PIX + Cartão no `MultiPaymentPanel`.
3. **Eventos & Festivais (`@jah/eventos`):**
   Produtor cria evento -> Cria sub-painéis operacionais isolados ("Bar Pista", "Bar VIP", "Portaria") -> Fornece link tokenizado para cada operador -> Operador transaciona no PDV isolado sem ver o financeiro global -> IA (`AIInsights`) projeta lotação e consumo.
4. **Varejo, Moda & WMS (`@jah/varejo-wms`):**
   Loja vende produtos com grade de variação -> Pedido cai na expedição -> Operador de armazém usa `PickingPage` bipando código de barras com leitor óptico -> Romaneio térmico e etiqueta despachada.
5. **Serviços & Clínicas (`@jah/servicos-saude`):**
   Consultório cadastra profissionais e consultórios -> Paciente agenda horário na agenda visual -> Profissional atende e registra evolução no prontuário -> Pagamento registrado.
6. **Jurídico & Escritórios (`@jah/juridico-jus`):**
   Cliente abre demanda no portal -> Escritório envia proposta de honorários -> Contrato assinado na tela com `SignaturePad` -> Prazos processuais são monitorados na timeline.

---

## 4. O MEGA PLANO DE MIGRAÇÃO: AS 24 MICROFASES COM PORTÕES DE AUDITORIA

```
========================================================================================
                   DECOMPOSIÇÃO EM 24 MICROFASES COM PORTÕES DE AUDITORIA
========================================================================================

[ONDA 1: SCHEMAS DDL & BANCO DE DADOS CONSOLIDADO]
  ├── Microfase 1.1: Migration do Hub do Colaborador (employee_time_entries, employee_payslips, employee_requests, employee_pins)
  ├── Microfase 1.2: Migration de Gastronomia & PDV (kds_orders, kds_stations, mesas de salão, sessões de caixa e multi-pagamento)
  ├── Microfase 1.3: Migration de Eventos & Subpainéis (eventos_subpaineis com token isolado, eventos_equipe, terceirizados, itens)
  └── Microfase 1.4: Migration de WMS Picking, Workflows Visuais, PWA Builder e Claim/Reputação estilo Reclame Aqui
      └── [GATE 1]: Auditoria DDL (Foreign Keys, RLS Multi-Tenant store_id e Zero Colunas Órfãs)

[ONDA 2: INGESTÃO DE ENGINES CENTRAIS NO CORE JAH]
  ├── Microfase 2.1: Ingestão de `conditional-step-engine.ts` e `NicheCalculationEngine.ts` em `src/lib/engines/`
  ├── Microfase 2.2: Ingestão de `FormFieldEngine.ts` com 20+ tipos de campos semânticos
  ├── Microfase 2.3: Ingestão do `ModuleAuditor.ts` (Validador de integridade em runtime)
  └── Microfase 2.4: Ingestão do Motor SimLab V2 (Catálogo de personas + IA generativa)
      └── [GATE 2]: Auditoria de Tipagem & Testes Unitários das Engines (Vitest 100% Pass)

[ONDA 3: SERVER FUNCTIONS & CONTRATOS BACKEND (TANSTACK START)]
  ├── Microfase 3.1: Expansão de `hr.functions.ts` (Ponto com GPS/IP, holerites com PDF e vales)
  ├── Microfase 3.2: Expansão de `pdv.functions.ts` (KDS, comandas de mesas e multi-pagamento)
  ├── Microfase 3.3: Expansão de `events.functions.ts` (Subpainéis tokenizados e previsão de público com IA)
  ├── Microfase 3.4: Criação de `wms.functions.ts` (Picking em lote e conferência com leitor óptico)
  ├── Microfase 3.5: Criação de `pwa.functions.ts` e `claim.functions.ts` (PWA Builder e Reclame Aqui)
  └── Microfase 3.6: Expansão de `support-tickets.functions.ts` (Handover e SLAs de supervisão)
      └── [GATE 3]: Auditoria de Contratos BDD & Zod Schemas (Validação estrita sem Mocks)

[ONDA 4: ESTÚDIOS CRIATIVOS, BUILDER & CLOUDBLOCK]
  ├── Microfase 4.1: Nativização dos 40 blocos do CloudBlock integrados ao `builder.functions.ts`
  ├── Microfase 4.2: Transplante do Studio Gráfico com Canvas, Guias e Brand Kit
  ├── Microfase 4.3: Transplante do Video Studio com Linha do Tempo e Trilhas Sonoras
  └── Microfase 4.4: Ingestão do Machine (Gerador de Carrosséis Virais com IA Gemini)
      └── [GATE 4]: Auditoria de Renderização Visual, Arraste e Responsividade

[ONDA 5: INTERFACES NATIVIZADAS (APPLE HIG & RADIX UI)]
  ├── Microfase 5.1: Interface do Colaborador e Espelho de Ponto do Gestor (`workspace.rh.ponto.tsx` e `_store.conta.colaborador.tsx`)
  ├── Microfase 5.2: Central de Atendimento Omnichannel Dual-Layer (`workspace.suporte.tsx`)
  ├── Microfase 5.3: KDS de Cozinha e App do Garçom (`workspace.pdv.cozinha.tsx` e `_store.garcom.tsx`)
  ├── Microfase 5.4: Estação de Picking WMS com Scanner (`workspace.pedidos.expedicao.tsx`)
  ├── Microfase 5.5: Subpainéis de Eventos com Token Externo (`workspace.eventos.$id.subpaineis.tsx`)
  ├── Microfase 5.6: Editor de App PWA da Empresa e Portal de Claim/Reputação
  └── Microfase 5.7: Construtor Visual de Workflows (`workspace.automacoes.tsx`)
      └── [GATE 5]: Auditoria Silenciosa de Design Apple HIG (Touch targets 44px, WCAG AA)

[ONDA 6: HOMOLOGAÇÃO MULTINICHO, ISOLAMENTO & DEPLOY]
  ├── Microfase 6.1: Testes E2E de Ponta a Ponta com Playwright por Nicho
  └── Microfase 6.2: Verificação Final de Sanidade pelo `ModuleAuditor`
      └── [GATE 6]: Certificação Final de Produção (Zero Débito Técnico e 100% Funcional)
========================================================================================
```