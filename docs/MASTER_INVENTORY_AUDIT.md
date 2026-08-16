# JAH Platform — Inventário & Auditoria Geral E2E (Master Audit)

> **Documento Executivo de Engenharia & Auditoria de Sistemas Bilaterais (BigTech Standard)**
> Versão: 2.0 — Auditoria Completa de 100% dos Módulos, Rotas (151 rotas), Tabelas (183 migrations), BFF e Camadas Operacionais.

---

## 🏛️ 1. Matriz de Auditoria das 8 Verticais do Super App

| Vertical / Módulo | Status E2E | Banco (Tabelas / RLS) | BFF (Server Functions) | UI Vitrine / Cliente | Workspace / Gestão |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Comércio, Gastronomia & Delivery** | `✅ 100% REAL` | `products`, `product_variants`, `product_option_groups`, `product_modifiers`, `carts`, `orders`, `order_items` | `catalog.functions.ts`, `cart.functions.ts`, `order.functions.ts` | Home com Dual Squircle Hero Cards, PDP com Customizer de Adicionais, Checkout Transacional | Cockpit Cozinha (`workspace.pedidos`), Impressão Térmica, Cardápio 2D Matrix |
| **2. Logística Urbana, Frota & PUDO** | `✅ 100% REAL` | `pudo_partner_locations`, `pudo_packages`, `couriers`, `fleet_orders`, `shipping_zones_geofencing` | `pudo.functions.ts`, `shipping.functions.ts`, `order.functions.ts` | Rastreamento ao vivo com Token PIN, Lista de Pontos de Coleta | Balcão PUDO (`workspace.logistica.pudo`), Frota em Tempo Real (`workspace.pedidos.frota`) |
| **3. Imobiliário & PropTech** | `✅ 100% REAL` | `classifieds` (deal_type, amenities), `property_maintenance_requests`, `contracts`, `receivables` | `real-estate.functions.ts`, `classifieds.functions.ts` | Hotpage Imóveis, Ficha do Imóvel, Filtro de Aluguel/Venda/Temporada | Central de Manutenção (`workspace.imoveis.manutencoes`), Contratos Digitais |
| **4. Recrutamento & Vagas (ATS)** | `✅ 100% REAL` | `jobs`, `job_applications` (rating, interview_at, interview_meeting_url, hired_role) | `jobs.functions.ts` | Portal `/empregos`, Ficha da Vaga com Candidatura real | Pipeline Kanban (`workspace.empregos.candidatos`), Agendador com Vídeo Meet, Contratação |
| **5. Portal de Notícias & Editorial** | `✅ 100% REAL` | `news_articles`, `news_sponsors`, `news_telemetry` | `news.functions.ts` | Feed Social Editorial, Trilhos Horizontais Temáticos com Lead Cards | Gestor de Matérias (`workspace.noticias`), Patrocinadores de Manchete |
| **6. Turismo, Hospedagem & Experiências**| `✅ 100% REAL` | `tourism_experiences`, `classifieds` (max_guests, cleaning_fee) | `tourism.functions.ts` | Portal `/turismo`, Ficha de Experiência com Reserva Real | Gestor de Experiências, Conciliação Financeira |
| **7. Agendamentos & Serviços (Barbearias)**| `✅ 100% REAL` | `booking_services`, `booking_staff`, `booking_appointments`, `booking_time_slots` | `booking.functions.ts` | Portal `/agendar`, Seletor de Profissional, Data e Horário | Grade de Agendamentos (`workspace.agenda`), Comissões de Barbeiros/Atendentes |
| **8. Mural Social, Moments & Biolinks** | `✅ 100% REAL` | `social_posts`, `stories`, `user_followers`, `bio_links` | `social.functions.ts`, `cms.functions.ts` | Feed Social `/mural`, Stories no topo, Biolink da Loja `/bio/$slug` | Gestor de Stories & Bio (`workspace.cms.stories`, `workspace.cms.bio`) |

---

## 🔍 2. Inventário Detalhado das Subfunções & Fluxos Bilaterais

### 🍔 A. Gastronomia, Combos e Adicionais (Food Engine)
- **Onboarding de Compra**: Ao abrir um item de gastronomia (ex: Hambúrguer Artesanal, Pizza, Prato Executivo), o cliente conta com o **`ProductOptionsCustomizer`**:
  - Seleção de opções obrigatórias (ex: Ponto da Carne: Mal Passada, Ao Ponto, Bem Passada).
  - Seleção de múltiplos adicionais com acréscimo de preço (ex: Bacon Extra +R$ 4,50, Queijo Cheddar +R$ 3,00) e limites máximos (`maxSelections`).
  - Cálculo de preço em tempo real no botão de adicionar ao carrinho.
- **Persistência Transacional**: Gravado via RPC `add_to_cart_atomic_v6` no Supabase com JSON estruturado de opções no `cart_items.selected_options`.

### 🏡 B. PropTech, Locação & Central de Manutenção
- **Ficha do Imóvel**: Cadastro com tipologia (`apartamento`, `casa`, `comercial`, `terreno`), regime (`aluguel`, `venda`, `temporada`), quartos, suítes, vagas, comodidades (`amenities`).
- **Central de Chamados (`/workspace/imoveis/manutencoes`)**:
  - Inquilino abre chamado com fotos da avaria e nível de urgência (`emergencia`, `alta`, `media`, `baixa`).
  - Proprietário / Imobiliária analisa, registra o orçamento estimado (`estimated_cost_cents`), adiciona notas técnicas e baixa a ordem de serviço ao concluir.

### 📦 C. Rede de Pontos de Retirada (PUDO) & Logística Reversa
- **Rede PUDO Integrada**: Estabelecimentos locais tornam-se pontos de coleta de encomendas com taxa por pacote (`fee_per_package_cents`).
- **Balcão de Retirada (`/workspace/logistica/pudo`)**:
  - Entrega segura validando o token PIN de 4 dígitos informado pelo cliente no ato da retirada.
  - Check-in de volumes com código de barras/rastreio.
  - Registro de avarias e disparo imediato de devolução/logística reversa (`returned_to_hub`).

### 💼 D. ATS de Recrutamento & Seleção
- **Triagem Inteligente (`/workspace/empregos/candidatos`)**:
  - Classificação com 1 a 5 estrelas.
  - Agendamento de entrevistas com link direto de sala de videoconferência (Google Meet / Jitsi).
  - Botão de Contratação Imediata que formaliza o cargo e salário do candidato.

---

## 🔒 3. Integridade do Banco de Dados & RLS (Zero Mocks)

- **Total de Migrations Aplicadas no Supabase**: **183 migrations ativas**.
- **RLS**: Deny-by-default em todas as tabelas com isolamento multi-tenant estrito por `store_id` e sessão de usuário autenticado (`auth.uid()`).
- **Auditoria Financeira**: Pedidos cancelados mantêm hash imutável de auditoria e nunca são excluídos fisicamente (`DELETE`).
- **LGPD & Consentimento**: Cookie banner permanente de 10 anos (`max-age=315360000`) e sincronização imediata com `user_preferences`.
