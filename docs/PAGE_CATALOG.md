# JAH Platform — Catálogo Canônico de Páginas (Page Catalog)

**Versão:** 1.0 — Fonte única de verdade para anatomia, fluxo e design de cada tela.
**Legenda de Status:**

- `✅ IMPLEMENTADO` — Rota existe e funciona.
- `⚠️ LEGADO` — Rota existe mas tem dívida de design system.
- `🔴 GAP` — Rota projetada, ainda não implementada.
- `🔵 PARCIAL` — Existe mas com funcionalidades faltando.

> **Como usar:** Cada verbete descreve UMA rota canônica. A ordem segue a jornada do ator. Para detalhes de regras de negócio, ver `BUSINESS_FLOWS.md`. Para tokens e shells, ver `DESIGN.md`.

---

# Família 1 — Social / Público (_store.*)

---

## P-001 · Feed / Para Você

**Rota:** `/_store/` (`_store.index.tsx`) | **Status:** `⚠️ LEGADO`
**Shell:** Social Shell | **Padrão:** social-feed | **Ator:** Todos

### Anatomia Desktop

```
[Rail Esquerda 240px] [Feed Central 600-620px] [Rail Direita 320px]
- Rail E: Logo, nav (Início, Explorar, Atividade, Perfil), botão Publicar
- Feed: search compacta, composer inline, stream de posts
- Rail D: Sugestões de perfis, trending (futuro)
```

### Anatomia Mobile

```
[Topbar compacta 48px] [Feed 100%] [Bottom Nav 56px]
- Topbar: logo JAH centrado, ícone busca, ícone composer
- Feed: composer colapsável, posts em stack vertical
- Bottom Nav: Início / Explorar / Publicar+ / Atividade / Perfil
```

### Estados

- **Loading:** skeleton de 3 posts (avatar + linhas de texto).
- **Empty:** "Nenhuma publicação ainda. [Publicar]".
- **Error:** "Não foi possível carregar. [Tentar novamente]".

### Ações

- Curtir post (otimístico), comentar, compartilhar link, salvar, reportar.
- Publicar via composer inline (abre PublishSheet).

### Conexões

- Post → P-005 (detalhe do post).
- Busca → P-003 (explorar).
- Perfil do autor → P-004 (perfil pessoal).

---

## P-002 · Seguindo

**Rota:** `/_store/mural` (`_store.mural.tsx`) | **Status:** `⚠️ LEGADO`
**Shell:** Social Shell | **Padrão:** social-feed | **Ator:** Autenticado

### Anatomia

Mesmo shell do P-001, mas feed filtrado por contas seguidas.

### Estados Extras

- **Empty:** "Você ainda não segue ninguém. [Explorar perfis]".

---

## P-003 · Explorar e Busca

**Rota:** `/_store/buscar` (`_store.buscar.tsx`) | **Status:** `⚠️ LEGADO`
**Shell:** Public Discovery Shell | **Padrão:** search | **Ator:** Todos

### Anatomia Desktop

```
[Search bar full-width topo]
[Filtros de tipo: Tudo | Lojas | Produtos | Eventos | Pessoas | Classificados]
[Resultados em grid/list conforme tipo]
```

### Anatomia Mobile

- Search bar sticky no topo.
- Chips horizontais com scroll para filtrar tipo.
- Resultados em lista (não grid) para leitura rápida.

### Estados

- **Inicial (sem query):** Trending searches, categorias populares.
- **Com resultado:** Seções por tipo (ex: "3 lojas encontradas", "12 produtos").
- **Empty:** "Nenhum resultado para '{q}'. Tente outro termo."

### Ações

- Clicar em resultado → rota específica da entidade.
- Salvar busca (futuro).

---

## P-004 · Perfil Pessoal

**Rota:** `/_store/conta/perfil` (`_store.conta.perfil.tsx`) | **Status:** `⚠️ LEGADO`
**Shell:** Social Shell | **Padrão:** profile | **Ator:** Próprio usuário / Visitantes

### Anatomia

```
[Avatar 80px] [Nome] [Username] [Bio] [Links externos]
[Seguidores | Seguindo | Posts]
[Tabs: Publicações | Avaliações | Salvos]
[Grid/lista de conteúdo da tab ativa]
```

### Modo Edição

- Desktop: right sheet com FormField canônico para cada campo.
- Mobile: página full-screen `/conta/perfil/editar`.

### Ações (próprio perfil)

- Editar Perfil (abre sheet/página).
- Compartilhar Perfil (copia link).

### Ações (perfil alheio)

- Seguir / Deixar de Seguir.
- Enviar Mensagem → P-008.
- Reportar perfil.

---

## P-005 · Publicação / Thread

**Rota:** `/_store/...` (detalhe de post — GAP de rota dedicada) | **Status:** `🔴 GAP`
**Shell:** Social Shell | **Padrão:** post | **Ator:** Todos

### Anatomia

```
[Post original com mídia expandida]
[Ações: Curtir, Comentar, Compartilhar]
[Seção de comentários / respostas]
[Composer de resposta inline]
```

### Conexões

- Entidade referenciada no post → página da entidade (produto, evento, serviço).

---

## P-006 · Atividade / Notificações

**Rota:** `/_store/conta/` (aba atividade) | **Status:** `🔵 PARCIAL`
**Shell:** Social Shell | **Padrão:** activity | **Ator:** Autenticado

### Anatomia

```
[Tabs: Tudo | Curtidas | Comentários | Seguimentos | Pedidos]
[Lista de eventos com: ícone-tipo, ator, ação, objeto, timestamp]
```

### Tipos de notificação

- Alguém curtiu seu post.
- Alguém comentou.
- Alguém te seguiu.
- Pedido atualizado.
- Agendamento confirmado.
- Orçamento aprovado.

---

## P-007 · Salvos / Coleção

**Rota:** GAP | **Status:** `🔴 GAP`
**Shell:** Social Shell | **Padrão:** collection | **Ator:** Autenticado

### Anatomia

```
[Tabs: Posts | Produtos | Eventos]
[Grid de itens salvos]
```

---

## P-007b · Detalhe do Classificado Público (Mobg-Style)

**Rota:** `/_store/classificados/$id` (`_store.classificados.$id.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Social / Public Shell | **Padrão:** classified-detail | **Ator:** Todos

### Anatomia Desktop (Split Grid 7/5)

```
[Coluna Esquerda 7 cols]
- Galeria de Mídia (4:3/16:10) com player de vídeo integrado e thumbnails
- Descrição Completa do Anúncio (whitespace-pre-wrap)
- Ficha Técnica Dinâmica da Categoria (Veículos, Imóveis, Serviços ou Desapego)
- Localização Aproximada (Privacidade Protegida, sem número exato)

[Coluna Direita Sticky 5 cols]
- Card Flutuante de Negociação: Categoria Badge + Timestamp
- Título do Anúncio (H1)
- Valor Destaque (formatMoney ou "A Combinar") + Indicação "Aceita Propostas"
- Botão Primário: "Conversar no WhatsApp" (com mensagem pré-formatada)
- Botão Secundário: "Compartilhar Anúncio" (Web Share API)
- Card do Anunciante: Avatar, Nome e link para Perfil Público
- Dica de Segurança e Negociação
```

---

## P-007c · Editor de Classificados Split-View & Live Preview

**Rota:** `/_store/conta/classificados/novo` (`_store.conta.classificados.novo.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Dedicated In-Page Editor | **Padrão:** split-editor | **Ator:** Autenticado

### Anatomia Desktop

```
[Topbar Operacional 56px: Voltar, Título, Ações (Publicar Anúncio)]
[Painel Esquerdo 440px-480px (Scroll Interno)]
- 1. Seleção de Categoria (Desapego, Veículo, Imóvel, Serviço, Vaga)
- 2. Informações Básicas (Título, Descrição, Valor R$, Negociável, Condição)
- 3. Atributos da Categoria (Marca, Modelo, Ano, Km, Câmbio, m², Quartos, etc.)
- 4. MediaUploader (Fotos e Vídeos com dropzone)
- 5. Localização (Bairro Público) e WhatsApp

[Painel Direito flex-1 (Canvas de Preview Vivo)]
- Live Truthful Preview: Renderiza exatamente o layout público em tempo real
```

### Anatomia Mobile

```
[Topbar com Switcher: [Editar] / [Prévia]]
[Editor Full-Screen ou Preview Full-Screen conforme tab ativa]
[Barra Inferior Fixa com Botão "Publicar Anúncio"]
```

---

## P-008 · Mensagens — Inbox

**Rota:** `/_store/conta/conversas/$id` (`_store.conta.conversas.$id.tsx`) | **Status:** `🔵 PARCIAL`
**Shell:** Social Shell | **Padrão:** inbox + conversation | **Ator:** Autenticado

### Anatomia Desktop (Master-Detail)

```
[Lista de conversas 320px] [Thread ativa flex-1]
- Lista: avatar, nome, último preview, timestamp, não-lido badge
- Thread: histórico de mensagens, input de resposta, attachment
```

### Anatomia Mobile

- Rota `/conta/conversas` = lista de conversas (empilhado).
- Clicar = navega para `/conta/conversas/$id` (thread full-screen).

### Ações

- Enviar mensagem de texto.
- Anexar imagem.
- Referenciar entidade (produto, pedido, orçamento).
- Arquivar conversa.
- Bloquear remetente.

---

## P-009 · Diretório de Negócios

**Rota:** `/_store/diretorio` (`_store.diretorio.tsx`) | **Status:** `⚠️ LEGADO`
**Shell:** Public Discovery Shell | **Padrão:** directory | **Ator:** Todos

### Anatomia Desktop

```
[Filtros: Categoria, Bairro, Status] [Listing principal]
[Card: logo, nome, categoria, bairro, status, ação (WhatsApp/Rota)]
```

### Anatomia Mobile

- Search bar + chips de categoria no topo.
- Cards em lista (não grid 2 colunas).
- Mapa em sheet separado.

---

## P-010 · Eventos — Explorar

**Rota:** `/_store/evento/$id` (`_store.evento.$id.tsx`) | **Status:** `🔵 PARCIAL`
**Shell:** Public Discovery Shell | **Padrão:** cards | **Ator:** Todos

### Anatomia (Listing — GAP, existe só o detalhe)

- Grid 2-4 colunas: mídia 4:3, data, título, local, preço.

### Anatomia (Detalhe do Evento)

```
[Mídia hero]
[Nome do Evento] [Data e Hora] [Local]
[CTA: Comprar Ingresso / Confirmar Presença]
[Programação / Lineup]
[Mapa]
[Updates da organização]
```

---

## P-011 · Classificados

**Rota:** `/_store/conta/classificados` (`_store.conta.classificados.index.tsx`) | **Status:** `🔵 PARCIAL`
**Shell:** Public Discovery Shell | **Padrão:** cards | **Ator:** Todos

### Anatomia Listing

- Busca, filtros (categoria, localização, preço, condição).
- Grid de cards: foto, título, preço, condição, localização.

### Anatomia Detalhe

- Galeria, nome, preço, condição, localização, perfil do vendedor.
- Ação: Contatar (abre mensagem ou WhatsApp).
- Segurança/Denúncia.

---

## P-012 · Mercado — Home de Lojas

**Rota:** `/_store/mercado` (`_store.mercado.tsx`) | **Status:** `⚠️ LEGADO`
**Shell:** Public Discovery Shell | **Padrão:** market | **Ator:** Todos

### Anatomia

```
[Search bar]
[Chips de categoria horizontal]
[Seção "Lojas perto de você" — se provider geolocation ativo]
[Seção "Lojas em Destaque"]
[Seção "Produtos recentes"]
```

---

## P-013 · Storefront / Loja Pública

**Rota:** `/_store/perfil-da-loja` (`_store.perfil-da-loja.tsx`) | **Status:** `⚠️ LEGADO`
**Shell:** Public Discovery Shell | **Padrão:** storefront | **Ator:** Todos

### Anatomia

```
[Cover image full-width]
[Logo + Nome + Status (Aberto/Fechado)]
[CTAs: WhatsApp, Agendar, Ver Catálogo]
[Tabs: Catálogo | Serviços | Eventos | Avaliações | Sobre]
[Conteúdo da tab ativa]
```

### Estados

- **Loja fechada:** banner "Fechado" com horário de abertura.
- **Loja inativa/suspensa:** página de erro.

---

## P-014 · Produto Público (Detalhe)

**Rota:** `/_store/produto/$slug` (`_store.produto.$slug.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Public Discovery Shell | **Padrão:** entity | **Ator:** Todos

### Anatomia Desktop

```
[Galeria ~50% esquerda] [Info + Ação ~50% direita]
- Galeria: imagem principal + miniaturas, zoom hover
- Info: breadcrumb, nome, preço/compare_at, variantes, quantidade, extras, CTA
- Abaixo: Descrição, Atributos, Avaliações, Produtos Relacionados
```

### Anatomia Mobile

```
[Galeria hero full-width]
[Nome, preço, variantes]
[Acordeão: Descrição | Detalhes | Avaliações]
[Sticky Bottom Bar: Quantidade + "Adicionar ao Carrinho"]
```

### Estados especiais

- **Esgotado:** CTA "Avise-me quando chegar" (captura e-mail).
- **Pré-venda ativa:** CTA "Fazer pré-venda" com data estimada.
- **Produto com agendamento:** CTA "Agendar" → `/agendar`.

---

## P-015 · Serviço Público (Detalhe)

**Rota:** `/_store/agendar` (`_store.agendar.index.tsx`) | **Status:** `🔵 PARCIAL`
**Shell:** Public Discovery Shell | **Padrão:** service_public | **Ator:** Todos

### Anatomia

```
[Mídia / Portfolio do serviço]
[Nome | Duração | Preço]
[Profissional/Recurso disponível]
[Calendário de disponibilidade]
[CTA: Agendar Agora]
[Descrição detalhada]
[Política de cancelamento]
```

---

## P-016 · Link-in-Bio Público

**Rota:** `/_store/bio/$slug` (`_store.bio.$slug.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Minimal (sem nav padrão) | **Padrão:** biolink | **Ator:** Todos

### Anatomia

- Renderizado pelo Editorial Presentation System.
- Qualquer preset visual configurado pelo dono.
- Sem shell operacional ao redor.

---

## P-017 · Agendamento — Seleção de Slot

**Rota:** `/_store/agendar` (`_store.agendar.tsx`) | **Status:** `🔵 PARCIAL`
**Shell:** Public Discovery Shell | **Padrão:** stepper | **Ator:** Todos

### Fluxo em Etapas

1. Selecionar serviço (se não veio de produto específico).
2. Selecionar profissional/recurso (se loja permite escolha).
3. Selecionar data no calendário.
4. Selecionar horário disponível.
5. Preencher dados pessoais.
6. Confirmar → e-mail enviado.

---

# Família 2 — Conta do Cliente (_store.conta.*)

---

## P-018 · Painel da Conta

**Rota:** `/_store/conta` (`_store.conta.index.tsx`) | **Status:** `⚠️ LEGADO`
**Shell:** Minimal (autenticado) | **Padrão:** dashboard compacto | **Ator:** Cliente autenticado

### Anatomia

```
[Avatar + Nome + Email]
[Links rápidos: Pedidos, Endereços, Configurações]
[Últimos pedidos (3)]
[Próximos agendamentos (2)]
```

### Regra Anti-Protótipo

Sem KPI cards decorativos. Apenas links diretos e resumo real de atividade.

---

## P-019 · Meus Pedidos (Lista)

**Rota:** `/_store/conta/pedidos` (`_store.conta.pedidos.index.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Minimal | **Padrão:** list | **Ator:** Cliente

### Anatomia

```
[Tabs: Todos | Em andamento | Entregues | Cancelados]
[Rows: número, data, status, valor, ação]
```

---

## P-020 · Detalhe do Pedido (Cliente)

**Rota:** `/_store/conta/pedidos/$id` (`_store.conta.pedidos.$id.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Minimal | **Padrão:** entity detail | **Ator:** Cliente

### Anatomia

```
[Número do pedido | Status badge]
[Timeline do status]
[Itens comprados]
[Endereço de entrega]
[Resumo financeiro]
[Rastreamento (se disponível)]
[Ações: Solicitar Troca | Avaliar | Baixar Recibo]
```

### Regras

- Botão "Solicitar Troca" aparece apenas dentro do prazo.
- Link de rastreio abre transportadora real (nunca simulado).

---

## P-021 · Solicitar Troca/Devolução (Cliente)

**Rota:** `/_store/conta/trocas` (`_store.conta.trocas.tsx`) | **Status:** `🔵 PARCIAL`
**Shell:** Minimal | **Padrão:** stepper | **Ator:** Cliente

### Anatomia

Formulário em etapas: selecionar itens → motivo → fotos → confirmação.

---

## P-022 · Endereços

**Rota:** `/_store/conta/enderecos` (`_store.conta.enderecos.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Minimal | **Padrão:** list + form | **Ator:** Cliente

---

## P-023 · Créditos em Conta

**Rota:** `/_store/conta/creditos` (`_store.conta.creditos.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Minimal | **Padrão:** ledger | **Ator:** Cliente

### Anatomia

- Saldo atual em destaque.
- Histórico de créditos/débitos com tipo e data.

---

## P-024 · Gift Cards

**Rota:** `/_store/conta/gift-cards` (`_store.conta.gift-cards.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Minimal | **Padrão:** list | **Ator:** Cliente

---

## P-025 · Histórico de Pagamentos

**Rota:** `/_store/conta/pagamentos` (`_store.conta.pagamentos.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Minimal | **Padrão:** ledger | **Ator:** Cliente

---

## P-026 · Avaliações do Cliente

**Rota:** `/_store/conta/avaliacoes` (`_store.conta.avaliacoes.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Minimal | **Padrão:** list | **Ator:** Cliente

---

## P-027 · Suporte / Tickets

**Rota:** `/_store/conta/suporte` (`_store.conta.suporte.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Minimal | **Padrão:** inbox | **Ator:** Cliente

---

## P-028 · Comissões do Parceiro/Afiliado (Cliente)

**Rota:** GAP — `/_store/conta/comissoes` | **Status:** `🔴 GAP`
**Shell:** Minimal | **Padrão:** ledger | **Ator:** Parceiro/Afiliado autenticado

### Anatomia

```
[Saldo disponível para saque]
[Saldo em hold (aguardando prazo)]
[Histórico: data, pedido, valor, status]
[Botão: Gerar Fatura/PayoutRequest]
```

---

# Família 3 — Workspace de Gestão (workspace.*)

---

## W-001 · Painel Inicial

**Rota:** `/workspace` | **Status:** `⚠️ LEGADO`
**Shell:** Organization Workspace Shell | **Padrão:** dashboard operacional | **Ator:** Staff

### Anatomia CORRETA (anti-protótipo)

```
[Toolbar: período selector]
[Strip de métricas: Pedidos hoje | Faturamento hoje | Agendamentos hoje | Alertas]
[Painel "Operação Agora": últimos pedidos, próximos agendamentos, estoque em alerta]
[Sem 8 KPI cards decorativos]
```

### Regra

Mostrar apenas o que gera decisão. Lojista bate o olho e sabe o que precisa fazer.

---

## W-002 · PDV — Frente de Caixa

**Rota:** `/workspace/pdv` (`workspace.pdv.index.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace (sem sidebar, modo full-screen) | **Padrão:** pos | **Ator:** Seller, Owner

### Anatomia Desktop

```
[Product Browser 65-72%] [Cart + Payment 28-35%]
- Product Browser: search, barcode input, category tabs, product grid
- Cart: items com qty, discounts, coupon, gift card, payment methods, total
```

### Anatomia Mobile

- Tela 1: busca + grid de produtos.
- Tela 2 (FAB com contador): carrinho + pagamento.

---

## W-003 · Comandas (PDV Adicional)

**Rota:** `/workspace/pdv/comandas` (`workspace.pdv.comandas.tsx`) | **Status:** `🔵 PARCIAL`
**Shell:** Workspace | **Padrão:** operational board | **Ator:** Seller, Owner

### Conceito

Para restaurantes/bares: mesas e comandas abertas por mesa.

---

## W-004 · Pedidos — Lista/Board

**Rota:** `/workspace/pedidos` (`workspace.pedidos.index.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace | **Padrão:** orders | **Ator:** Owner, Manager, Seller

### Anatomia

- Toggle: Board (Kanban) / Lista (DataGrid).
- Board: colunas de status com drag-and-drop.
- DataGrid: busca, filtros, bulk actions, impressão.

---

## W-005 · Detalhe do Pedido (Lojista)

**Rota:** `/workspace/pedidos/$id` (`workspace.pedidos.$id.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace | **Padrão:** order_detail | **Ator:** Owner, Manager

### Anatomia

Ver `BUSINESS_FLOWS.md — Módulo 3.2` para anatomia completa.

---

## W-006 · Gestor Avançado de Pedidos

**Rota:** `/workspace/pedidos/gestor` (`workspace.pedidos.gestor.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace | **Padrão:** operational board | **Ator:** Owner, Manager

---

## W-007 · Trocas e Devoluções (Lojista)

**Rota:** `/workspace/pedidos/trocas` (`workspace.pedidos.trocas.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace | **Padrão:** returns | **Ator:** Owner, Manager

### Anatomia

```
[Tabs: Pendentes | Em Análise | Aprovadas | Concluídas | Recusadas]
[DataGrid: ID, Cliente, Pedido, Motivo, Prazo, Status]
[Filtros de prazo, urgência, período]
```

---

## W-008 · Frota e Entregas

**Rota:** `/workspace/pedidos/frota` (`workspace.pedidos.frota.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace | **Padrão:** delivery_board | **Ator:** Owner, Manager

### Anatomia

```
[Board Kanban: Para Atribuir | Em Rota | Concluído | Incidente]
[Painel lateral: info do entregador selecionado + GPS real-time]
[Botão: Gerar Link Mágico para Avulso]
```

---

## W-009 · Entregadores (GAP)

**Rota:** GAP — `/workspace/pedidos/entregadores` | **Status:** `🔴 GAP`
**Shell:** Workspace | **Padrão:** couriers | **Ator:** Owner, Manager

### Anatomia

```
[DataGrid: foto, nome, veículo, status, ativas, último check-in]
[Inline actions: ver entregas, fatura, histórico]
[Botão: Cadastrar novo entregador]
```

### Detalhe do Entregador (GAP)

- Entregas do dia.
- Histórico completo.
- Documentos (CNH, foto).
- Extrato de pagamentos.
- Incidentes registrados.

---

## W-010 · Recibo de Pedido (Impressão)

**Rota:** `/workspace_/pedidos/$id/recibo` (`workspace_.pedidos.$id.recibo.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Minimal (print-only) | **Padrão:** document | **Ator:** Owner, Manager

---

## W-011 · Catálogo de Produtos

**Rota:** `/workspace/catalogo/produtos` (`workspace.catalogo.produtos.index.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace | **Padrão:** catalog | **Ator:** Owner, Manager, Content

### Anatomia

```
[Toolbar: busca, filtros (status, categoria, estoque), botão "+ Novo Produto"]
[Tabs: Todos | Ativos | Rascunhos | Arquivados]
[DataGrid/Rows: imagem thumb, nome, SKU, preço, estoque, status, ações inline]
[Expand row: variantes]
[Bulk: ativar, arquivar, exportar]
```

---

## W-012 · Novo Produto

**Rota:** `/workspace/catalogo/produtos/novo` (`workspace.catalogo.produtos.novo.tsx`) | **Status:** `🔵 PARCIAL`
**Shell:** Workspace (Editor) | **Padrão:** editor_product | **Ator:** Owner, Manager

### Anatomia Desktop

```
[Breadcrumb: Catálogo > Produtos > Novo]
[Coluna principal: formulário em seções]
[Coluna preview ~300px: miniatura da vitrine]
[Seções (progressive disclosure):
  1. Principal: nome, descrição, tipo
  2. Mídia: MediaUploader (galeria real)
  3. Precificação: preço, compare_at, custo
  4. Variantes: matriz de opções (cor x tamanho)
  5. Extras/Modificadores
  6. Estoque: SKU, barcode, quantidade por local
  7. Disponibilidade: pré-venda, encomenda, lead time
  8. Categorias e Coleções
  9. SEO: slug, meta title, meta description
  10. Canais: online, PDV, marketplace
]
[Botões: Salvar Rascunho | Publicar]
```

---

## W-013 · Editor de Produto

**Rota:** `/workspace/catalogo/produtos/$id` (`workspace.catalogo.produtos.$id.tsx`) | **Status:** `🔵 PARCIAL`
**Shell:** Workspace (Editor) | **Padrão:** editor_product | **Ator:** Owner, Manager

Mesma anatomia que W-012, mas em modo edição com dados pré-populados.

---

## W-014 · Categorias

**Rota:** `/workspace/catalogo/categorias` (`workspace.catalogo.categorias.index.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace | **Padrão:** simple_list | **Ator:** Owner, Manager

---

## W-015 · Nova Categoria

**Rota:** `/workspace/catalogo/categorias/novo` | **Status:** `✅ IMPLEMENTADO`

---

## W-016 · Editar Categoria

**Rota:** `/workspace/catalogo/categorias/$id` | **Status:** `✅ IMPLEMENTADO`

---

## W-017 · Coleções

**Rota:** `/workspace/catalogo/colecoes` | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace | **Padrão:** collection_admin | **Ator:** Owner, Manager

---

## W-018 · Tipos de Produto / Atributos

**Rota:** `/workspace/catalogo/tipos` (`workspace.catalogo.tipos.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace | **Padrão:** data_grid | **Ator:** Owner

---

## W-019 · Controle de Estoque

**Rota:** `/workspace/estoque` (`workspace.estoque.index.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace | **Padrão:** inventory | **Ator:** Owner, Manager, Stock

### Anatomia

```
[Toolbar: busca, filtro por localização, botão ajuste]
[DataGrid: produto, SKU, disponível, reservado, mínimo, status]
[Expand row: movimentações recentes]
[Bulk: ajuste em lote]
```

### Ações Inline

- Ajuste (+/-): abre dialog pequeno com quantidade e motivo.
- Ver histórico de movimentações.
- Transferência entre locais.

---

## W-020 · Alertas de Estoque

**Rota:** `/workspace/estoque/alertas` (`workspace.estoque.alertas.tsx`) | **Status:** `✅ IMPLEMENTADO`

---

## W-021 · Movimentações de Estoque

**Rota:** `/workspace/estoque/movimentos` (`workspace.estoque.movimentos.tsx`) | **Status:** `✅ IMPLEMENTADO`

---

## W-022 · Calendário / Agenda

**Rota:** `/workspace/agenda` (`workspace.agenda.index.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace | **Padrão:** calendar | **Ator:** Owner, Manager

### Anatomia Desktop

```
[Resource Rail 200px: lista de profissionais/equipamentos com status]
[Toolbar: período, visualização (dia/semana/mês), botão + Novo]
[Timeline: colunas por dia/hora, blocos de compromissos coloridos por recurso]
```

### Anatomia Mobile

- Day timeline view.
- Switcher de recurso (dropdown compacto no topo).
- FAB para novo agendamento → full-screen sheet.

---

## W-023 · Recursos da Agenda

**Rota:** `/workspace/agenda/recursos` (`workspace.agenda.recursos.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace | **Padrão:** simple_list | **Ator:** Owner

### Anatomia

```
[Tabs: Pessoas | Equipamentos | Espaços]
[List rows: foto, nome, tipo, status, disponibilidade padrão]
[Ação: Editar disponibilidade → AvailabilityEditor sheet]
```

---

## W-024 · Catálogo de Serviços

**Rota:** `/workspace/agenda/servicos` (`workspace.agenda.servicos.index.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace | **Padrão:** service_list | **Ator:** Owner, Manager

---

## W-025 · Editor de Serviço

**Rota:** GAP (edição inline na lista) | **Status:** `🔵 PARCIAL`
**Shell:** Workspace | **Padrão:** editor_service | **Ator:** Owner

### Seções

Ver `BUSINESS_FLOWS.md — Módulo 6 / Editor de Serviço`.

---

## W-026 · Clientes — Diretório

**Rota:** `/workspace/clientes` (`workspace.clientes.index.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace | **Padrão:** customers | **Ator:** Owner, Manager

---

## W-027 · Detalhe do Cliente

**Rota:** `/workspace/clientes/$id` (`workspace.clientes.$id.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace | **Padrão:** customer_detail | **Ator:** Owner, Manager

---

## W-028 · CRM / Pipeline (GAP)

**Rota:** GAP — `/workspace/crm` | **Status:** `🔴 GAP`
**Shell:** Workspace | **Padrão:** kanban | **Ator:** Owner, Manager

### Anatomia

```
[Tabs: Pipeline (Kanban) | Lista]
[Kanban: colunas por estágio (Lead, Contactado, Proposta, Negociação, Fechado, Perdido)]
[Card: nome, valor estimado, dono, próxima tarefa, last activity]
```

---

## W-029 · Orçamentos — Lista (GAP)

**Rota:** GAP — `/workspace/orcamentos` | **Status:** `🔴 GAP`
**Shell:** Workspace | **Padrão:** quotes | **Ator:** Owner, Manager

---

## W-030 · Detalhe do Orçamento (GAP)

**Rota:** GAP — `/workspace/orcamentos/$id` | **Status:** `🔴 GAP`
**Shell:** Workspace | **Padrão:** quote_detail | **Ator:** Owner, Manager

---

## W-031 · Caixa

**Rota:** `/workspace/financeiro/caixa` (`workspace.financeiro.caixa.index.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace | **Padrão:** cash | **Ator:** Owner, Finance

### Anatomia

```
[Status do turno atual: Aberto / Fechado]
[Resumo: Abertura, Entradas, Saídas, Saldo esperado, Saldo contado, Diferença]
[Ações próximas: Sangria | Suprimento | Fechar Caixa]
[Histórico de lançamentos do turno]
```

---

## W-032 · Lançamentos do Caixa

**Rota:** `/workspace/financeiro/caixa/lancamentos` | **Status:** `✅ IMPLEMENTADO`

---

## W-033 · Turnos de Caixa

**Rota:** `/workspace/financeiro/caixa/turnos` | **Status:** `✅ IMPLEMENTADO`

---

## W-034 · Pagamentos Recebidos

**Rota:** `/workspace/financeiro/pagamentos` | **Status:** `✅ IMPLEMENTADO`

---

## W-035 · Comprovantes Manuais

**Rota:** `/workspace/financeiro/comprovantes` | **Status:** `✅ IMPLEMENTADO`

---

## W-036 · Comissões da Equipe

**Rota:** `/workspace/financeiro/comissoes` | **Status:** `✅ IMPLEMENTADO`

---

## W-037 · Comissões de Parceiros/Afiliados (GAP)

**Rota:** GAP — `/workspace/financeiro/afiliados` | **Status:** `🔴 GAP`
**Shell:** Workspace | **Padrão:** ledger | **Ator:** Owner, Finance

### Anatomia

```
[DataGrid: parceiro, conversões no período, valor gerado, comissão, status]
[Filtros: período, status (pendente/hold/liberado/pago)]
[Ação: Gerar fatura para parceiro]
```

---

## W-038 · Financeiro de Funcionários

**Rota:** `/workspace/financeiro/funcionarios` | **Status:** `✅ IMPLEMENTADO`

---

## W-039 · Avaliações (Workspace)

**Rota:** `/workspace/cms/avaliacoes` | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace | **Padrão:** reviews | **Ator:** Owner, Manager

---

## W-040 · Stories

**Rota:** `/workspace/cms/stories` | **Status:** `✅ IMPLEMENTADO`

---

## W-041 · Link-in-Bio Editor

**Rota:** `/workspace/cms/bio` | **Status:** `✅ IMPLEMENTADO`
**Shell:** Builder Shell | **Padrão:** builder_bio | **Ator:** Owner, Content

---

## W-042 · Páginas / Builder

**Rota:** `/workspace/cms/paginas` | **Status:** `✅ IMPLEMENTADO`
**Shell:** Builder Shell | **Padrão:** builder | **Ator:** Owner, Content

### Anatomia Desktop

```
[Library/Layers 220px] [Canvas flex] [Inspector 280px] [Topbar 50px]
- Topbar: voltar, nome da página, save status, preview, publish
- Library: tipos de seção para adicionar, componentes
- Canvas: preview real do site renderizado
- Inspector: configurações da seção selecionada (tokens canônicos apenas)
```

---

## W-043 · Editor de Página/Builder (modo canvas)

**Rota:** `/workspace/builder/$documentId/editor` | **Status:** `✅ IMPLEMENTADO`

---

## W-044 · Navegação / Menus

**Rota:** `/workspace/cms/navegacao` | **Status:** `✅ IMPLEMENTADO`

---

## W-045 · Estúdio / Gerador de Post-Flyer

**Rota:** `/workspace/estudio` (`workspace.estudio.index.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Builder Shell | **Padrão:** generator | **Ator:** Owner, Content

---

## W-046 · Carrinhos Abandonados

**Rota:** `/workspace/marketing/carrinhos` | **Status:** `✅ IMPLEMENTADO`

---

## W-047 · Gift Cards (Workspace)

**Rota:** `/workspace/marketing/gift-cards` | **Status:** `✅ IMPLEMENTADO`

---

## W-048 · Publicar no Mural

**Rota:** `/workspace/mural/novo` | **Status:** `✅ IMPLEMENTADO`

---

## W-049 · Integrações

**Rota:** `/workspace/configuracoes/integracoes` | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace | **Padrão:** integrations | **Ator:** Owner

### Anatomia

```
[Grid de providers: Melhor Envio, MercadoPago, Asaas, Meta Pixel, Google Analytics]
[Card de provider: logo, nome, capability, status, last check, botão Configurar]
[Status: 'active' | 'testing' | 'error' | 'unconfigured' — nunca boolean]
```

### Regra

Provider sem credencial: card mostra "Não configurado" e botão "Configurar". Nunca simula sucesso.

---

## W-050 · Fretes e Cotações

**Rota:** `/workspace/configuracoes/fretes/cotacoes` | **Status:** `✅ IMPLEMENTADO`

---

## W-051 · Configurações da Loja

**Rota:** `/workspace/configuracoes/loja` | **Status:** `🔵 PARCIAL`
**Shell:** Workspace | **Padrão:** settings | **Ator:** Owner

### Anatomia

```
[Nav lateral de settings 200px]
[Seções: Perfil | Horários | Políticas | Notificações | Branding | Equipe | Impressoras | Parceiros]
```

---

## W-052 · Equipe e Permissões (GAP)

**Rota:** GAP — `/workspace/configuracoes/equipe` | **Status:** `🔴 GAP`
**Shell:** Workspace | **Padrão:** team | **Ator:** Owner

### Anatomia

```
[DataGrid: foto, nome, email, cargo, role, status]
[Ações: Convidar, Editar permissões, Desativar]
[Modelo de permissões: capability-based, não apenas dropdown de role]
```

---

## W-053 · Configurações de Nicho/Onboarding (GAP)

**Rota:** GAP — `/workspace/configuracoes/nicho` | **Status:** `🔴 GAP`
**Shell:** Workspace | **Padrão:** settings | **Ator:** Owner

### Conceito

Permite ao lojista alterar o nicho da empresa (ex: migrar de "Loja" para "Beleza/Saúde").
Renomeia módulos na sidebar conforme o nicho selecionado.

---

## W-054 · Configuração de Parceiros/Afiliados (GAP)

**Rota:** GAP — `/workspace/configuracoes/parceiros` | **Status:** `🔴 GAP`
**Shell:** Workspace | **Padrão:** settings | **Ator:** Owner

---

# Família 4 — Admin Master (admin-master.*)

---

## A-001 · Painel Geral do Admin

**Rota:** `/admin-master` (`admin-master.index.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Admin Master Shell | **Padrão:** admin | **Ator:** Admin Master

---

## A-002 · Gestão de Lojas/Tenants

**Rota:** `/admin-master/lojas` (`admin-master.lojas.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Admin Master Shell | **Padrão:** admin_table | **Ator:** Admin Master

---

## A-003 · Faturas da Plataforma

**Rota:** `/admin-master/faturas` (`admin-master.faturas.tsx`) | **Status:** `✅ IMPLEMENTADO`

---

## A-004 · Usuários e Acessos (GAP)

**Rota:** GAP — `/admin-master/usuarios` | **Status:** `🔴 GAP`
**Shell:** Admin Master Shell | **Padrão:** admin_table | **Ator:** Admin Master

---

## A-005 · Moderação de Conteúdo (GAP)

**Rota:** GAP — `/admin-master/moderacao` | **Status:** `🔴 GAP`
**Shell:** Admin Master Shell | **Padrão:** moderation | **Ator:** Admin Master

### Anatomia

```
[Tabs: Reportados | Em análise | Resolvidos]
[DataGrid: tipo conteúdo, autor, motivo, reports count, data]
[Ação inline: Visualizar | Remover | Advertir | Banir]
[Chat de auditoria: notas dos moderadores por item]
```

---

---

## P-058 · SimLab IA — Enxame de Validação Preditiva

**Rota:** `/workspace/simulacao` (`workspace.simulacao.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace Shell | **Padrão:** simulation_engine | **Ator:** Lojista, Produtor, Staff

### Anatomia Desktop

```
[Header com Badge Beta IA e Ação Primária "Simular Proposta"]
[Grid 5/7:]
- Esquerda: Formulário de Proposta (Nicho, Título, Preço BRL, Pitch) + Lista de Personas Calibradas.
- Direita: Score Cards (Atratividade, Conversão %, Elasticidade Preço) + Objeções + Feedbacks Individuais por Persona.
```

### Estados

- **Inicial:** Card com ícone e instruções convidando a rodar a primeira simulação.
- **Loading:** Animação de processamento estocástico do enxame de personas.

---

## P-059 · Campanhas de Anúncios (Ads Engine)

**Rota:** `/workspace/marketing/anuncios` (`workspace.marketing.anuncios.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace Shell | **Padrão:** ads_dashboard | **Ator:** Lojista, Produtor, Conteúdo

### Anatomia Desktop

```
[Header com Métricas Gerais: Impressões, Cliques, CTR Médio, Investimento]
[Lista de Campanhas com status Veiculando/Pausado, badge de formato e métricas]
[Botão primário "+ Criar Anúncio" e atalho para SimLab IA]
```

---

## P-060 · Criar Anúncio Patrocinado

**Rota:** `/workspace/marketing/anuncios/novo` (`workspace.marketing.anuncios.novo.tsx`) | **Status:** `✅ IMPLEMENTADO`
**Shell:** Workspace Shell | **Padrão:** form_with_preview | **Ator:** Lojista, Produtor

### Anatomia Desktop

```
[Grid 7/5:]
- Esquerda: Formulário de Anúncio (Título, Formato, Localização/Raio km, Orçamento Diário/Total).
- Direita: Card de Estimativa de Impacto com IA (Alcance Diário Estimado de Pessoas e Cliques Previstos).
```

---

# Resumo de GAPs — Rotas Projetadas

| #       | Rota                                  | Módulo                 | Prioridade |
| ------- | ------------------------------------- | ---------------------- | ---------- |
| GAP-001 | `/_store/conta/comissoes`             | Afiliados (cliente)    | Alta       |
| GAP-002 | `/workspace/orcamentos`               | Orçamentos (lista)     | Alta       |
| GAP-003 | `/workspace/orcamentos/$id`           | Orçamentos (detalhe)   | Alta       |
| GAP-004 | `/workspace/pedidos/entregadores`     | Gestão de Entregadores | Alta       |
| GAP-005 | `/workspace/pedidos/entregadores/$id` | Detalhe do Entregador  | Média      |
| GAP-006 | `/workspace/financeiro/afiliados`     | Comissões de Parceiros | Alta       |
| GAP-007 | `/workspace/configuracoes/equipe`     | Equipe e Permissões    | Alta       |
| GAP-008 | `/workspace/configuracoes/parceiros`  | Config de Afiliados    | Alta       |
| GAP-009 | `/workspace/configuracoes/nicho`      | Onboarding por Nicho   | Média      |
| GAP-010 | `/workspace/crm`                      | CRM Pipeline           | Média      |
| GAP-011 | `/admin-master/usuarios`              | Admin Usuários         | Média      |
| GAP-012 | `/admin-master/moderacao`             | Admin Moderação        | Média      |
| GAP-013 | `/_store/conta/orcamentos`            | Orçamentos (cliente)   | Média      |
| GAP-014 | `/_store/conta/agendamentos`          | Agendamentos (cliente) | Média      |
| GAP-015 | `/workspace/agenda/servicos/$id`      | Editor de Serviço      | Alta       |
