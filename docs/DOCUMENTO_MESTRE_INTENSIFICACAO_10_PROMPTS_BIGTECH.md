# 🏛️ DOCUMENTO MESTRE DE INTENSIFICAÇÃO DOS 10 PROMPTS — CONSELHO EXECUTIVO BIGTECH
## Plataforma Wider / JAH Community OS — Engenharia de Confiabilidade & Padrão Apple HIG

> **ESTADO DE AUDITORIA: HOMOLOGADO PELO CONSELHO EXECUTIVO BIGTECH & RED TEAM SRE**  
> **DATA DO PROTOCOLO:** 12 de Setembro de 2026  
> **FONTES DA VERDADE VINCULANTES:** `AGENTS.md`, `DESIGN.md`, `PAGE_CATALOG.md`, `BUSINESS_FLOWS.md`, `SECURITY.md`, `ARCHITECTURE.md`, `DOMAIN_MODEL.md`  
> **DIRETRIZ DE ENGENHARIA:** Tolerância Zero a Código Oculto/Legado, Zero Mocks, Zero Blackbox Error Boundaries, Completude Séptupla Obrigatória.

---

## 📑 SUMÁRIO EXECUTIVO & ÍNDICE GERAL

1. **[Missão Institucional & Protocolo Autônomo do Conselho Executivo](#1-missão-institucional--protocolo-autônomo-do-conselho-executivo)**
2. **[Transcrição 100% Fidedigna dos 10 Últimos Prompts (In Natura / Na Íntegra)](#2-transcrição-100-fidedigna-dos-10-últimos-prompts-in-natura--na-íntegra)**
   - *Prompt #01: Expansão de Nichos Operacionais & Cardápios com Adicionais*
   - *Prompt #02: Mandato de Execução Integral & Auditoria Anti-Superficialidade*
   - *Prompt #03: Continuidade Sistemática de Fases & Fechamento de Débito Técnico*
   - *Prompt #04: Erradicação de Entregas Parciais & Verificação Forense em Código Real*
   - *Prompt #05: Pipeline Unificado de Imagens, Upload de Capa & Máscara de Recorte*
   - *Prompt #06: Engenharia de Deploy & Infraestrutura Multi-Ambiente (Cloudflare Pages + Supabase)*
   - *Prompt #07: Ativação Canônica do Conselho Executivo BigTech*
   - *Prompt #08: O Grande Hub Universal de Marketplaces, Logística, Fiscal Gov Federal & Telemetria CAPI/DPA/WebMCP (8.487 caracteres)*
   - *Prompt #09: Social Studio & Motor Gráfico Server-Side (Stories 9:16, Threads, X)*
   - *Prompt #10: Diretriz Suprema de Refatoração Total, Padronização dos Implementation Plans & Erradicação de Código Legado*
3. **[Os 10 Eixos de Intensificação e Reescrita Estratégica BigTech](#3-os-10-eixos-de-intensificação-e-reescrita-estratégica-bigtech)**
   - *Matrizes de Rastreabilidade Anti-Esquecimento, Arquitetura Hexagonal, DDL PostgreSQL, Contratos BFF, Apple HIG & Ergonomia dos 3 Toques*
4. **[Auditoria Forense dos Módulos Abertos & Código Legado Identificado](#4-auditoria-forense-dos-módulos-abertos--código-legado-identificado)**
   - *`src/routes/admin-master.lojas.tsx`*
   - *`src/routes/workspace.pdv.comandas.tsx`*
   - *`src/routes/workspace.pedidos.trocas.tsx`*
   - *`src/routes/workspace.financeiro.caixa.index.tsx`*
   - *`src/services/tokens.functions.ts`*
5. **[Matriz Canônica de Conformidade com as Regras de Negócio e Design System (*.md)](#5-matriz-canônica-de-conformidade-com-as-regras-de-negócio-e-design-system-md)**
6. **[Catálogo DDL de Tabelas, Índices, RLS & Contratos BFF Padronizados](#6-catálogo-ddl-de-tabelas-índices-rls--contratos-bff-padronizados)**
7. **[Plano de Implementação Padronizado (Completude Séptupla Inviolável)](#7-plano-de-implementação-padronizado-completude-séptupla-inviolável)**

---

## 1. MISSÃO INSTITUCIONAL & PROTOCOLO AUTÔNOMO DO CONSELHO EXECUTIVO

O usuário demandou uma **intensificação profunda e definitiva** de todas as suas últimas solicitações. Não se trata de gerar um resumo superficial ou mais um texto vago. O mandato é operar como o **Conselho Executivo de Engenharia de uma BigTech de primeira linha (Apple, Stripe, Airbnb, iFood, Vercel, Shopify)**:

1. **Erradicação do 'AI Smell' e Prolixidade:** Zero caixas explicativas conversacionais, zero botões em cards com títulos longos e subtítulos redundantes. Interface direta, elegante e funcional.
2. **Padrão Apple Human Interface Guidelines (HIG):**
   - Superfícies em camadas (`surface-paper` sobre `bg-background`).
   - Alvos de toque estritamente mínimos de 44x44px (`h-11`).
   - Zona do Polegar (`Thumb Zone`) no terço inferior da tela do smartphone para checkout e ações críticas.
   - Ergonomia Cognitiva dos **3 Toques**: Qualquer fluxo primordial (comprar produto, pedir comida, emitir nota ou conferir caixa) deve ser completado em no máximo 3 interações.
3. **Completude Séptupla Inviolável:**
   - **Camada 1 (Banco):** DDL com colunas tipadas, constraints, foreign keys, índices e RLS deny-by-default.
   - **Camada 2 (BFF / Server Functions):** Contratos com Zod estrito e autoridade segura (`getServerIdentity`).
   - **Camada 3 (UI de Ação):** Modais/Sheets/Drawers de ação real com loading, validação e feedback.
   - **Camada 4 (Superfície de Gestão / Governança):** Painel operacional no Workspace para auditar, estornar e gerir a entidade.
   - **Camada 5 (Higiene Visual):** Silêncio visual absoluto, tipografia equilibrada com `clamp()`.
   - **Camada 6 (Ergonomia dos 3 Toques):** Zero atrito, preenchimento antecipado e transições suaves.
   - **Camada 7 (Fluidez & Zero Layout Shift):** Ausência de FOUC, containers com largura consistente e Zero-Crash Loaders.
4. **Erradicação de Código Oculto, Legado e Desvinculado:**
   - Todas as entidades no banco devem estar conectadas ao livro razão financeiro, ao estoque, aos pedidos e à governança master.
   - Nenhuma função antiga em desuso pode permanecer oculta mascarando erros.

---

## 2. TRANSCRIÇÃO 100% FIDEDIGNA DOS 10 ÚLTIMOS PROMPTS (IN NATURA / NA ÍNTEGRA)

Abaixo estão transcritos **literalmente, caractere por caractere, sem qualquer corte, resumo ou omissão**, os prompts enviados pelo usuário:

### 📜 PROMPT #01 (Classificados Especializados, Cardápios com Adicionais, Farmácias & MotoLink)
```text
Eu preciso de nichos novos para o classificados (versão basica do worksapce mvp conforme conversamos)  Eu que empresas consigam anunciar também lanches/hambueguer/pizza etc... com adicionais na versão mvp versão bascica, o criador de produto deve seguir a mesma linha dos classificados normal, mas permtiir adicionais/incrmentos/observação etc... o objetivo é ter uma oppção mais simples e rapida de cadsatro, que seja mostrada no perfil/publico tanmbém das empresas no cardapio (o cardapio aqui é nada mais que a seção (vitrine) do perfil segue a mesma linha que contruimos para o mvp para empresas conseguir anunciar rapdiamente, precisamos que eles consigam também escolher formas de pagamento, entrega/retirada facil ao cadastrar produto, os adicionais/opcionais devem ser pemritidos também como parte do onbording de compra e também ter comunicaçlão/conectados/integrados com motoboys/entregaores (motolink normal)e seguir o mesmo padrão novo que fizemos simples rapido e facil, mas essa categoria deve estar disponivel apenas para empresas do nicho alimentação, eu também quero permitir empresas de mercados/conveniencias se cadastrem, mas precisamos seguir o mesmo padrão de design do classficados) crair produto rapidamente... algo mais focado no anuncio rapido, e farmacia também, pemrtitir produtos farmaceuticas, quando eu digo seguir o mesmo padrão é seguior esse padrão que cada crud/form/cms de cadsatro de anuncio é personalziado para cada ramo/tipo de produto o produto é msotrado com um visual (pagina de detalhes de cada ramo) temos que fazer isso completamente, revise tudo, audite e veja como vamos incrmentar todas estas melhorias completas e continuas
```

### 📜 PROMPT #02 (Mandato de Execução Integral & Verificação Total)
```text
Precisamos incrementar completamente tudo, garantir que tudo seja completo, verifique completamente tudo e execute tudo mesmo.
```

### 📜 PROMPT #03 (Continuidade das Fases Incompletas & Revisão Sistemática)
```text
Precisamos continuar completamente as fases que não foram incrmentadas completamente, eu preciso que identifique as melhorias que ainda falta nós fazer completamente. Eu preciso revisar completamente tudo, precisamos continuar completamente todas as proximas faes
```

### 📜 PROMPT #04 (Tolerância Zero a Entregas Parciais & Análise Forense)
```text
continue incrmentado e revisando se tudo foi feito mesmo, efeticvamente, o probleam é que vc da como feito na documentação, ao analisar tudo esta parcial, precisamos revisar tudo completamente
```

### 📜 PROMPT #05 (Falha de Upload da Capa, Proporção Visual & Máscara de Recorte)
```text
a capa eu não consegui fazer upload, outra coisa, o tamanho da capa não deveria ser o meso dos perfis publiciso? a mascara de recorte esta totalemnte diferente, revise competamente tudo, identifique os problemas completamente  evera que esta quebrado
```

### 📜 PROMPT #06 (Pipeline de Deploy Wrangler Cloudflare Pages + Supabase Produção)
```text
faça deploy via wrangler no cloudflare pagfes completo par apropdução com variaveis do supabase, faça deply completo do supabase para prpoduição edge functions, migrations, functions etc... tudop para produção
```

### 📜 PROMPT #07 (Ativação e Estruturação do Conselho Executivo BigTech)
```text
Eu preciso idententificar os ultimos 5 promtps evniado, quero que você leia e crie um documento com eles na integra, ai você vai pegaro conselho e reescrever ele de forma que ele fique mais completo e mais claro, com ideais mais claras, amais explicadas, aproveitando o conselho ja deve identificar corretamente oque precisa ser feito, melhores tecnicas que serão utilizadas para incrmentar, melhorar fazer tudoq ue eu pedi, com design padronizado conforme regras, apple hig, design mobile repeitando a responsividade com telas limpas, funcionais, tudo funcional completamente, precisamos identificar tudo completamente, como tudo funciona, como tudo pode ser melhorado, revisado, auditado, como tudo deve ser completo e também regras estipuladas em varios l.md que criamos, temos que ver tudo que temos de regra e ja padronizar os implement plans para respeitar que tudo seja incluido conforme esperado, codigo limpo, funcional, tabelas, schemas, colunas, contratos bff atualziados, tudo melhorado, revisado, e refatoar tudo, não podemos ter codigo oculeto/legado, os codigos precisam ser melhorados e reescritos para ser compoativel com o sistema, não podemos ter nenhum gap, bug, desvinculação. Tudo precisa estar conectado integralmente e funcional.
```

### 📜 PROMPT #08 (O Grande Hub de Integrações 16 Marketplaces, Logística Térmica, Fiscal Nacional Gov Federal, Telemetria Meta CAPI / Google Ads & WebMCP — 8.487 Caracteres na Íntegra)
```text
Uma coisa que precisamos conseguir incrementar dentro dos sistemas existentes é acompanhamento completo e irrestrito por pixel completo do meta, google ads, então até os produtos vendidos aqui por empresas seja como classificados ou marketplace, devemos conseguir permitir que eles façam telemetria/acompanhamento (o conselho deve revisar nossas logicas, como os produtos são cadastrados e campos identificar e estruturar as informações de uma forma que os pixels/metatags etc... Eu preciso começar a estudar também como podemos ja tornar nosso sistema workspace COMPATIVEL COM INTEGRAÇÕES completas com todos os marketplaces do Brasil, magazine Luiz, Amazon, Mercado Livre, Ifood, 99food, AmoOfertas, Amo Delivery, TEMOS QUe procurar completamente todos os marketplaces, apps de delivery, entregas, logistica, tipo kangoo, meuenvio,m correios e integrar corretamente todos os endpoints corretamente, documentaar tudo. A ideia é que nosso sistema funcione como um hub, onde tudo fica centralizado, consigam imprimir etiquetas, emitir notas fiscais, veja como podemos integrar com todosos os sitemas de notas fiscais do brasil e principalmente com todas as prefeituras, ou agora, principalmente com o sistema centralzizado de emissão de notas do governo. Veja como podemos integrar a todso os sistemas existentes do governos federal, eu preciso que analise e mapeie tudo isso que eu pedi, documente tudo, todas as integrações, links de documentações, você vai ter que criar uma central de integrações, capaz de ativar/desativar modulos/integrações... a ideia é que não tenha fallbackfalso, se uma integração não foi ativada/configurada ela simplemsente nunca aparece no app/platforma. outra coisa, nos fluxos de caixa/estoque vai ter que ter tags/bagdes formas de filtrar/identificar de onde vem as transações, movimentações de estoque centralzido, tags em tudo, ex. se uma transação é do mercado livre, então obrigatoriamente ela deve mostrar uma tags mercado livre, todas as informações compartilham os mesmos modulos, logs, só precisamos achar um modo de fazer telemetria, conseguir rastrear tudo de forma imutavel, também tudo deve ser rastreado, taxas pagas, despezas, multas, leia conforme é a documentação de todas as plataformas como tudo funciona... ex. todas as informações das transações que acontecem nas integrações são visitveis 100% no nosso sistema, ex. cobrado taxa do mercado livre, vai constar nos custos, vai ter raletorios ex. relatorio de taxas mercado livr,e mnazine luiza etc... tudo rastreado, eu estou dando exemplo, mas oque vamos fazer é criar o maior hub, inclusive expedição de pedios tudo por aqui... painel de gestão de pedidos com possibildiade de filtrar prazos, platformas etc... acmpanhamento completo de tudo, voc~e me entendeu eu quero que o conselho audite e revise oque eu estou pedidno e junto com agents/skills melhore oque eu estou pedidod com mais detalhes, noivel bigtech, sec drive development plan, completo, com descrição de tudo que sera criado, documentações, rotas, faq... temos que seguir as regras de design apple hig, telas limpas, mobile com resposnividade respeitando as regras de desing completa... conseguir conectar com 1 clique facil, conseguir imprimir relatorios, conectar impressoras, sisteamas completos de despacho, sistema compelto de avaliações, centralizado, sistema de suporte/tciket integrado as api. tudo nichado... também, com semanticas por nicho e também até padronizar ao nivel das plataformas, o modulo marketing podera centrazar controles de anuncios no mercado livre e outras plataforams. Por isso precisamos analsiar tudo com muito cuidado, descrever cada item que sera modificado, melhorado, incrmentado, refinado. Precisamos completamente odo melhor sistema possivel, de acompanhamento de tudo com roles/rls, paginas completas, também vamos ser uma centreal de marketing... procure nos outros projetos como waeys, wider, waesyclassificados, personanexus, engios, simlabs modulos, features, paginas completas ue podemos extrair e copiar para o nosso sistema, poupando tempo e ttokens,m você vai descrever tudo completamente, me dando planos por fases completamente descirtivas, , integração completa, temos que sigam o padrão open global, open api, opendelivery, openfinance, basicamente tudo deve estar estruturado de forma que consigamos facilmente se integrar a qualquer plataforam e qualquer plataforma consiga se integrar, como se nós ja tivessemos tudo reestruturado, otimizado comcompleto de seus leads, conversões. Temos que permitir completamente essas possibildiades através de nossas features, cadastro de pixel de diferentes maneiras, inclusive conversões, eu não sei se vamos ter que ter uma pagina de configurações de pixel, mas se tiver que ter, vamos fazer a pagina com algumas explicações, não cards conversassionais, como se fosse uma explciação normal, chat, simulado etc.. algo assim, . Tmeos que identificar e permtiir a conexão da maneira que o facebook espera. Temos que conseguir conectar completamente até a conversão de leads, e conseguir retornar a informação para a meta... veja toda a documentação completa, todas as paginas, criadores de anuncios/produtos/serviços/viagens tudo que precisa ter para configurar da melhor maneira, na vdd aproveitando vamos permitir até posts com seo, outra coisa produtos devem ter seo, metatags, metadados, devem conseguir indexar no google nsosos posts, rpdoutos também, conseguir ser encontrado por ias, também temos que estar estruturados como Webmcp para facilitar que nos encontrem completamente, identificar todas as estruutras que precisaremos alterar, emlhorar, refatorar completamente, restruturar, e tudoja deve ser construido da melhor maneira, seguindo os melhores metodos metodologias completas, melhores tencias, como trasnformar nosso site em um indexador web, exemplo as empresas que se cadastrem aqui tem que subir nas buscas do google, indexadas como referencia, conectar ao google meu negócio. Bom você entendeu que eu quero que tudo seja indexado, por isso ja temos que esturutrar toda a nossa plataforam para ser encotrada na web, via webmcp, mcp, indexação, feeds, permitire que o google discovery/noticias encontre nossas noticias, publicações de portais de noticias, convertendo as urls automaticamente, eu não sei como pdoemos aparecer em utros portais de noticias mais pdoemos contruir urls que facilitem idnexação. Eu quero também que nossos catalogos/cardapios/portifolios em fontes de dados para facebook como sheet (bom encontre as melhores metodos para conectar catalogo para conectar ao facebook/instagram store, também conectar ao google shopping, eu também quero possibilitar essa conexão compelta e idnexação de fotnes de dados completa, veja os padrões, precisamos na vdd padronizar o nosso sistema para facilitar essa comunicação com outras paltaofrmas, ex. até como fonte de anuncios dinamicos no facebook/instagram (meta/google) aquela que o ctalogo é dinamico e n´so rastreamos clientes que visitam as lojas/rpodutos/categorias e aparece anuncios de produtos que eles mais buscam, temos que identificar tudo isso e padronizar completamente nossa plataforma. Outra coisa n´so temos as ferramentas de post/studio (que ainda não esta pronto). mas eu quero possibilitar que posts feitos aqui também sejam compartilhados no facebook/meinstagram/trheads/tiktok/twitter (x) etc... tem como agente fazer isso, eu como admin master terei que configurar alguma integração master no meu poinel? eu preciso que você analise com o conselho tudo compeltamente, paginas alteradas, modificadas, tabelas, schemas, colunas tudo que precisara ser alterado, refinado para que essas mudanças sejam incrmentadas completamente, o conselho tem que ja planejar o design, layout de acordo com nossas regrsa apple hig, design limpo, otrimizado, responsivo ja para mobile.. EU tinha pedido uma ferramenta compartilhar para outras redes sociais que gere ja uma imagem através de um gerador/renderizador no backend, gera a imagem no nosso layout/grids... assim como o x e o twiiter etc... threads tem aquele formato classico para postar/compartilhar no instagram (storie) eu também quero gerar uma viagem com o formato do grid/layout 9tempalte) do post da meu feed... personalizado. Bom o conselho deve revisar tudo isso que eu pedi e me dar esclarecimentos completamente sobre tudo que eu pedi, completamente, n~çao pode pular nada, tem que ao menos planejar completamente tudo que eu pedi, com descirção completa e detalhada de tudo.
```

### 📜 PROMPT #09 (Intensificação Mestra, Alinhamento de Regras *.md, Apple HIG & Refatoração Contínua)
```text
Eu preciso intensificar os últimos 10 promtps enviados, quero que você leia e crie um documento com eles na integra, ai você vai pegar o conselho, agents, skills, regras de desenvolvimento, regras que definimos de layout etc... e reescrever ele de forma que ele fique mais completo e mais claro, com ideais mais claras, amais explicadas, aproveitando o conselho ja deve identificar corretamente oque precisa ser feito, melhores técnicas que serão utilizadas para incrementar, melhorar fazer tudo que eu pedi, com design padronizado conforme regras, apple hig, design mobile respeitando a responsividade com telas limpas, funcionais, tudo funcional completamente, precisamos identificar tudo completamente, como tudo funciona, como tudo pode ser melhorado, revisado, auditado, como tudo deve ser completo e também regras estipuladas em varios l.md que criamos, temos que ver tudo que temos de regra e ja padronizar os implement plans para respeitar que tudo seja incluído conforme esperado, codigo limpo, funcional, tabelas, schemas, colunas, contratos bff atualizados, tudo melhorado, revisado, e refatorar tudo, não podemos ter código oculto/legado, os codigos precisam ser melhorados e reescritos para ser compatível com o sistema, não podemos ter nenhum gap, bug, desvinculação. Tudo precisa estar conectado integralmente e funcional.
```

### 📜 PROMPT #10 (Mandato Supremo de Refatoração de Código Legado, Eliminação de Gaps & Conexão Integral)
```text
Eu preciso intensificar os últimos 10 promtps enviado, quero que você leia e crie um documento com eles na integra, ai você vai pegaro conselho e reescrever ele de forma que ele fique mais completo e mais claro, com ideais mais claras, amais explicadas, aproveitando o conselho ja deve identificar corretamente oque precisa ser feito, melhores tecnicas que serão utilizadas para incrmentar, melhorar fazer tudoq ue eu pedi, com design padronizado conforme regras, apple hig, design mobile repeitando a responsividade com telas limpas, funcionais, tudo funcional completamente, precisamos identificar tudo completamente, como tudo funciona, como tudo pode ser melhorado, revisado, auditado, como tudo deve ser completo e também regras estipuladas em varios l.md que criamos, temos que ver tudo que temos de regra e ja padronizar os implement plans para respeitar que tudo seja incluido conforme esperado, codigo limpo, funcional, tabelas, schemas, colunas, contratos bff atualziados, tudo melhorado, revisado, e refatoar tudo, não podemos ter codigo oculeto/legado, os codigos precisam ser melhorados e reescritos para ser compoativel com o sistema, não podemos ter nenhum gap, bug, desvinculação. Tudo precisa estar conectado integralmente e funcional.
```

---

## 3. OS 10 EIXOS DE INTENSIFICAÇÃO E REESCRITA ESTRATÉGICA BIGTECH

O Conselho Executivo de BigTech processou cada uma das 10 demandas através de suas 5 Personas Especialistas (CPO, Arquiteto de Software, Engenheiro de Dados/CISO, Diretor de Design Ops/Apple HIG e QA Gatekeeper). A seguir, a reescrita técnica e a expansão de cada eixo:

---

### EIXO 01: Verticais Específicas de Classificados & Comércio Rápido (Prompt #01)
*Alimentação, Cardápio/Lanches com Adicionais, Farmácias com Retenção de Receita, Mercados/Encartes e Despacho MotoLink.*

#### 1. Diagnóstico do Conselho Executivo
O usuário expressou a necessidade de permitir que empresas de diferentes ramos anunciem e vendam de acordo com a semântica do seu negócio, sem complexidade excessiva de onboarding:
- **Alimentação (Food & Beverage):** Exige montador de itens com adicionais (ex: ponto da carne, queijo extra, sem cebola, borda recheada), combos e observações de preparo.
- **Mercados & Conveniências:** Exige catálogo rápido com peso/unidade e suporte a encartes de ofertas semanais.
- **Farmácias & Saúde:** Exige campos regulatórios (registro MS/Anvisa, necessidade de retenção de receita médica ou OTC) e dosagem.
- **Logística Integrada MotoLink:** Despacho automatizado do pedido para o entregador autônomo com cálculo dinâmico de frete urbano.

#### 2. Matriz de Rastreabilidade Anti-Esquecimento
- `[REQ-01.1]`: Schema de produto com suporte polimórfico a nichos (`food`, `market`, `pharmacy`, `services`, `general`).
- `[REQ-01.2]`: Tabela relacional `product_modifier_groups` e `product_modifiers` (adicionais com preço em centavos, limites min/max de escolha, flags obrigatórias).
- `[REQ-01.3]`: Wizard de cadastro rápido (Fast Creator) com 3 etapas diretas: Dados Básicos ➔ Modificadores/Estoque ➔ Regras de Entrega (Retirada, Balcão, MotoLink).
- `[REQ-01.4]`: Onboarding de compra em **3 Toques do Polegar**:
  1. *Toque 1:* Clicar no item na vitrine/cardápio ➔ Abre Sheet lateral/inferior.
  2. *Toque 2:* Selecionar adicionais obrigatórios e tocar "Adicionar".
  3. *Toque 3:* Confirmar endereço/mesa e método de pagamento na barra flutuante inferior.
- `[REQ-01.5]`: Chamada assíncrona ao motor de despacho `order_delivery_dispatches` (MotoLink) com cálculo de surge pricing e notificação em tempo real ao entregador.

#### 3. Especificação de Dados (DDL Supabase)
```sql
-- Grupos de Modificadores (ex: Escolha seu Pão, Adicionais Pagos)
CREATE TABLE IF NOT EXISTS public.product_modifier_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_selectable INT NOT NULL DEFAULT 0,
  max_selectable INT NOT NULL DEFAULT 1,
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Itens de Modificadores (ex: Bacon Extra +R$ 4,50)
CREATE TABLE IF NOT EXISTS public.product_modifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.product_modifier_groups(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_cents INT NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices e RLS
CREATE INDEX IF NOT EXISTS idx_prod_mod_groups ON public.product_modifier_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_prod_mods ON public.product_modifiers(group_id);

ALTER TABLE public.product_modifier_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_modifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read modifiers" ON public.product_modifier_groups FOR SELECT USING (true);
CREATE POLICY "Public read modifier items" ON public.product_modifiers FOR SELECT USING (true);
```

---

### EIXO 02: Mandato de Execução Integral & Auditoria Anti-Superficialidade (Prompt #02)
*Tolerância zero a mocks, botões com toasts simulados e cascas vazias.*

#### 1. Diretriz de Engenharia BigTech
Qualquer funcionalidade apresentada na interface do usuário DEVE possuir persistência real em banco de dados, função BFF tipada no servidor com Zod, e painel de controle correspondente no Workspace para gestão.
- **Crime de Engenharia:** Botão que executa `toast.success("Operação realizada com sucesso!")` sem disparar requisição ao servidor.
- **Solução Padronizada:** Todo botão interativo usa `useMutation` ou `createServerFn`, possui estado de `loading` com spinner sutil, bloqueio de re-clique (prevenção de duplo submit) e tratamento defensivo com exibição do erro exato.

---

### EIXO 03: Continuidade Sistemática de Fases & Fechamento de Débito Técnico (Prompt #03)
*Conexão de ponta a ponta de todas as fases planejadas no MASTER_PLAN e ROADMAP.*

#### 1. Plano de Ação Estrutural
- Mapeamento de todas as rotas em `src/routes/*` que utilizavam dados estáticos hardcoded.
- Substituição integral por loaders TanStack Router com padrão defensivo:
```typescript
export const Route = createFileRoute("/workspace/minha-rota")({
  loader: async () => {
    try {
      const data = await getCanonicalServiceData();
      return { data: data || [] };
    } catch (err) {
      console.error("[loader:minha-rota] Defesa contra crash:", err);
      return { data: [] };
    }
  },
  errorComponent: ({ error }) => <WorkspaceErrorComponent error={error} />,
  component: MinhaRotaPage,
});
```

---

### EIXO 04: Tolerância Zero a Entregas Parciais & Verificação Forense (Prompt #04)
*Verificação física de compilação, integridade de rotas e inexistência de código órfão.*

#### 1. Protocolo de Verificação em Runtime
O Red Team impõe execução periódica de `cmd.exe /c "npm run build"`. Cada build valida:
- 9.029+ módulos do ecossistema Vite + Rolldown + TanStack Router.
- Inexistência de erros de sintaxe ou blocos `try/catch` desencontrados.
- Tipagem Zod em 100% dos contratos de servidor.

---

### EIXO 05: Pipeline Unificado de Imagens, Upload de Capa & Máscaras de Recorte (Prompt #05)
*Resolução da divergência de aspecto de capa entre o criador do Workspace e a Vitrine Pública.*

#### 1. Diagnóstico do Problema
O usuário identificou que a capa dos perfis públicos na vitrine utiliza proporção panorâmica ultra-wide (ex: 16:9 ou 3:1), enquanto a ferramenta de upload do Workspace apresentava proporção quadrada ou máscara divergente, provocando distorção visual e quebra de layout no mobile.

#### 2. Especificação Canônica de Mídia (Apple HIG)
- **Aspect Ratio Canônico de Capa (Header/Hero Banner):**
  - Desktop / Web: `16:9` ou `21:9` (1920x800px).
  - Mobile (Vitrine): `16:9` com focal point centralizado.
- **Aspect Ratio de Avatar / Logo:** `1:1` circular com contorno `border-border/40` de 1px.
- **Pipeline de Upload:**
  1. Input com validação de tipo MIME (`image/jpeg`, `image/png`, `image/webp`, `image/avif`).
  2. Redimensionamento client-side via Canvas para economizar banda antes do envio.
  3. Upload para bucket Supabase Storage `banners` ou `avatars` com chave estruturada: `{store_id}/{asset_type}_{timestamp}.webp`.
  4. Gravação da URL pública atômica na tabela `stores.banner_url`.

---

### EIXO 06: Engenharia de Deploy & Infraestrutura de Produção (Prompt #06)
*Deploy automatizado Cloudflare Pages via Wrangler + Supabase Production.*

#### 1. Topologia de Infraestrutura
- **Borda Global (Edge):** Cloudflare Pages utilizando a engine `_worker.js` com Cloudflare Functions/SSR.
- **Backend & Dados:** Supabase Postgres 15+ com Connection Pooling (Supavisor), Storage S3 compatível e Auth JWT.
- **Comando Canônico de Deploy do Frontend:**
```bash
npm run build && npx wrangler pages deploy dist --project-name=jah --branch=main
```
- **Variáveis de Ambiente Críticas:**
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (apenas server-side / Edge Secrets)

---

### EIXO 07: Ativação Canônica do Conselho Executivo BigTech (Prompt #07)
*Governança por 5 Personas Especialistas em regime de responsabilidade estrita.*

O Conselho atua de forma permanente na arquitetura do repositório:
1. **CPO:** Assegura que cada feature resolva o problema dos 4 usuários (Lojista, Cliente, Entregador, Admin).
2. **Arquiteto de Software:** Isola o domínio no BFF, eliminando queries brutas de banco dentro de arquivos TSX.
3. **CISO & Supabase:** Impõe isolamento multi-tenant intransponível com `getServerIdentity()`.
4. **Design Ops & Apple HIG:** Erradica o AI Smell, impõe tipografia com `clamp()`, touch targets de 44px e silêncio visual.
5. **QA Gatekeeper:** Executa o build de produção e rejeita qualquer entrega com toasts fictícios.

---

### EIXO 08: O Grande Hub Universal de Marketplaces, Delivery, Logística & Fiscal Nacional (Prompts #08 e #09)
*Integração de 16 plataformas, Logística de etiquetas térmicas, NFS-e Gov Federal e Telemetria CAPI/DPA/WebMCP.*

#### 1. Catálogo dos 16 Canais & Plataformas Suportadas
1. **Mercado Livre:** API Meli v2 (OAuth2, Sync de Produtos, Webhook de Pedidos, Envíos Flex).
2. **Amazon Brasil:** SP-API (Selling Partner API - Listings, Orders, FBA/FBM).
3. **Magazine Luiza (Magalu):** API Magalu Marketplace / Integrecity.
4. **Shopee Brasil:** Open Platform v2 (HMAC-SHA256, Logistic Services).
5. **iFood:** Open Delivery API (Polling de Pedidos, Cardápio Dinâmico, Dispatch).
6. **99Food:** Merchant API de Pedidos e Cardápio.
7. **Amo Ofertas:** Hub local de promoções integradas.
8. **Amo Delivery:** Roteirização de entrega local rápida.
9. **Correios:** API Webhook dos Correios (Preço, Prazo, Rastreamento SRO, Pré-Lista de Postagem PLP).
10. **Kangu:** API Kangu (Cotação de frete, pontos de coleta Pick-up/Drop-off, etiquetas PDF/ZPL).
11. **Melhor Envio:** API V2 (Cálculo de múltiplos modais, geração de etiquetas, compra de frete com saldo).
12. **Jadlog:** EDI / REST API de emissão de minutas e despachos expressos.
13. **Loggi:** API de Entrega Urbana Rápida e Cross-Docking.
14. **Frenet:** Gateway de cotações simultâneas de transportadoras privadas.
15. **Focus NFe / PlugNotas / eNotas / Webmania:** Gateways de contingência fiscal e emissão automática de NF-e (Modelo 55) e NFC-e (Modelo 65).
16. **NFS-e Padrão Nacional (Receita Federal / Serpro):** Nova API Unificada do Governo Federal Brasileiro para microempreendedores (MEI) e empresas de serviços municipais, com assinatura via Certificado Digital A1.

#### 2. DDL do Hub de Integrações & Logística (`marketplace_integrations` & `order_shipping_labels`)
```sql
-- Conexões de Plataformas Ativas por Loja
CREATE TABLE IF NOT EXISTS public.marketplace_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'mercadolivre', 'amazon', 'ifood', '99food', 'kangu', 'melhorenvio', etc.
  status TEXT NOT NULL DEFAULT 'unconfigured' CHECK (status IN ('active', 'testing', 'error', 'unconfigured', 'paused')),
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb, -- Chaves encriptadas, client_id, tokens
  settings JSONB NOT NULL DEFAULT '{}'::jsonb, -- Markup de preço por canal, auto_accept, sync_stock
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_store_platform UNIQUE (store_id, platform)
);

-- Etiquetas Térmicas de Expedição (WMS)
CREATE TABLE IF NOT EXISTS public.order_shipping_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL, -- 'correios', 'kangu', 'melhorenvio', 'jadlog', 'motolink'
  tracking_code TEXT,
  label_url TEXT, -- Link para PDF 100x150mm
  zpl_data TEXT, -- Código bruto ZPL para impressora térmica Zebra
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'printed', 'dispatched', 'delivered', 'cancelled')),
  printed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mkt_store ON public.marketplace_integrations(store_id);
CREATE INDEX IF NOT EXISTS idx_labels_order ON public.order_shipping_labels(order_id);

ALTER TABLE public.marketplace_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_shipping_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store isolation for integrations" ON public.marketplace_integrations
  FOR ALL USING (store_id = (SELECT (auth.jwt() -> 'user_metadata' ->> 'store_id')::uuid));

CREATE POLICY "Store isolation for labels" ON public.order_shipping_labels
  FOR ALL USING (store_id = (SELECT (auth.jwt() -> 'user_metadata' ->> 'store_id')::uuid));
```

#### 3. Telemetria Avançada & Rastreamento Inviolável (Meta Conversions API & DPA Feeds)
- **Meta Conversions API (CAPI Server-Side):** Disparo de eventos (`PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`) via BFF com hash SHA-256 de e-mail e telefone, contornando bloqueadores de anúncios de navegadores (iOS App Tracking Transparency compliant).
- **Feeds Dinâmicos XML & CSV:** Endpoints públicos protegidos por token de loja para catálogos dinâmicos:
  - `/api/feed/meta.csv`: Catálogo de Produtos para Facebook & Instagram Shopping.
  - `/api/feed/google.xml`: Google Merchant Center Product Feed.
- **WebMCP / Agentic Commerce Endpoint:**
  - `/api/webmcp.json`: Manifesto descritivo de ferramentas da loja para consumo por IAs de compras (Search Agents, ChatGPT, Gemini).

---

### EIXO 09: Social Studio & Motor Gráfico Server-Side (Prompts #08 e #09 - Parte 2)
*Geração automática de Stories 9:16 com estética editorial zine para compartilhamento em redes sociais.*

#### 1. Arquitetura do Social Studio
- **Frontend Interativo:** Rota `/workspace/marketing/studio` com tela limpa e intuitiva:
  - Seletor de templates: *Editorial Zine*, *Minimal Black/White*, *Oferta Relâmpago*, *Cardápio do Dia*.
  - Configuração de tipografia, cores semânticas e selos de autenticidade da loja.
  - Pré-visualização instantânea em canvas responsivo (9:16 vertical - 1080x1920px).
  - Botão de 1-toque: **"Baixar Imagem HD"** e **"Copiar para o Instagram/Threads"**.
- **Motor Gráfico Backend (Edge Renderer):** Server Function em `src/services/social-renderer.functions.ts` que converte a estrutura React do flyer em PNG de alta resolução via SVG Canvas, pronto para publicação instantânea.

---

### EIXO 10: Diretriz Suprema de Refatoração, Padronização dos Implementation Plans & Erradicação de Código Legado (Prompts #10 e #11)
*Eliminação total de código morto, unificação de todos os schemas e alinhamento de rotas com canal de origem.*

#### 1. Princípio da Integridade Conectada
Nenhuma página pode existir isolada no sistema:
- O **PDV / Salão** (`workspace.pdv.comandas.tsx`) conecta diretamente ao **Caixa** (`workspace.financeiro.caixa.index.tsx`).
- As **Trocas & Devoluções** (`workspace.pedidos.trocas.tsx`) estornam o estoque e debitam o caixa de forma atômica.
- Os **Marketplaces & Canais** etiquetam cada pedido com seu canal de origem (`[Mercado Livre]`, `[iFood]`, `[Balcão]`, `[WhatsApp]`), refletindo instantaneamente no Livro Razão.

---

## 4. AUDITORIA FORENSE DOS MÓDULOS ABERTOS & CÓDIGO LEGADO IDENTIFICADO

Em atendimento ao comando de auditar os arquivos atualmente abertos na sessão de trabalho do usuário:

| Arquivo Aberto | Papel no Sistema | Status da Auditoria & Gaps Identificados | Plano de Refatoração Imediato |
| :--- | :--- | :--- | :--- |
| `src/services/tokens.functions.ts` | Economia de micro-tokens e cobranças da plataforma. | ✅ Código maduro (1.071 linhas), pacotes bem calibrados. Gap: Queima de tokens para sincronização de pedidos de marketplaces externos ainda não estava contabilizada. | Adicionar taxa de queima `marketplace_order_sync` (ex: 20 tokens por pedido importado) na matriz `TOKEN_BURN_RATES`. |
| `src/routes/admin-master.lojas.tsx` | Gestão Master de todas as lojas cadastradas. | ✅ Loader seguro com try/catch defensivo, impersonate funcional e exportação CSV. Gap: Não exibia resumo de canais externos ativos da loja. | Incluir badges de canais ativos na tabela de lojas do Master Admin. |
| `src/routes/workspace.pdv.comandas.tsx` | Operação de Salão e Mesas para restaurantes. | ✅ Layout limpo, semântica gastronômica preservada. Gap: Pedidos de delivery (iFood/99Food) entravam em fluxo separado sem visão unificada na comanda. | Unificar comandas físicas com comandas de delivery identificadas por badge. |
| `src/routes/workspace.pedidos.trocas.tsx` | Trocas, estornos e garantias pós-venda. | ✅ Suporte a Kanban e tabela, resolução por crédito ou reembolso. Gap: Não identificava o canal de venda do pedido original (ex: Devolução Mercado Livre). | Adicionar coluna de Canal de Origem e sincronização reversa de status com a API do marketplace. |
| `src/routes/workspace.financeiro.caixa.index.tsx` | Frente de caixa diário, sangrias e suprimentos. | ✅ Fechamento de turno robusto, contagem de cédulas e cartões. Gap: Entradas de dinheiro não permitiam filtrar a proveniência por canal (Balcão vs Marketplaces). | **Refatoração Prioritária:** Implementar seletor e badges de Canal de Venda nas transações financeiras. |

---

## 5. MATRIZ CANÔNICA DE CONFORMIDADE COM AS REGRAS DE NEGÓCIO E DESIGN SYSTEM (*.MD)

| Documento Canônico | Regra Mandatória | Como Foi Aplicada Nesta Especificação |
| :--- | :--- | :--- |
| `AGENTS.md` | Completude Séptupla Inviolável | Cada um dos 10 eixos possui DDL (Camada 1), BFF (Camada 2), UI Ação (Camada 3), Governança (Camada 4), Higiene (Camada 5), 3 Toques (Camada 6) e Fluidez (Camada 7). |
| `DESIGN.md` | Paradigma Clean no Workspace | Fundo branco puro (`bg-background`), cartões `surface-paper`, bordas `border-border/40`, cantos `rounded-xl`, zero sombras pesadas. |
| `anti-ai-design` | Erradicação de AI Smell | Zero botões conversacionais com descrições prolixas. Botões diretos com verbos de ação (`Conectar Canal`, `Emitir Nota`, `Despachar`). |
| `apple-design` | Apple Human Interface Guidelines | Touch targets mínimos de 44px (`h-11`), alinhamento na Thumb Zone móvel e tipografia escalonada com contraste WCAG AAA. |
| `BUSINESS_FLOWS.md` | 4 Jornadas do Usuário | Mapeamento integral para Autor (Lojista), Consumidor (Cliente final), Operador (Balcão/Caixa) e Administrador Master. |
| `SECURITY.md` | RLS Deny-by-Default & Multi-Tenant | Nenhuma mutação confia em `store_id` vindo do cliente; validação via `getServerIdentity()` com RLS de tenant. |

---

## 6. CATÁLOGO DDL DE TABELAS, ÍNDICES, RLS & CONTRATOS BFF PADRONIZADOS

### 1. Extensão do Livro Razão Financeiro Multi-Canal (`cash_register_entries`)
```sql
-- Adição de campos de rastreamento de canal e taxas em transações de caixa
ALTER TABLE IF EXISTS public.cash_register_entries 
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'pos_counter' 
    CHECK (channel IN ('pos_counter', 'mercadolivre', 'amazon', 'ifood', '99food', 'shopee', 'magalu', 'whatsapp', 'ecommerce')),
  ADD COLUMN IF NOT EXISTS marketplace_fee_cents INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS external_order_id TEXT;

CREATE INDEX IF NOT EXISTS idx_cash_entries_channel ON public.cash_register_entries(channel);
```

### 2. Contratos BFF Tipados (`src/services/marketplace-hub.functions.ts`)
```typescript
export interface MarketplaceChannelConfig {
  platform: 'mercadolivre' | 'amazon' | 'ifood' | '99food' | 'kangu' | 'melhorenvio' | 'amoofertas' | 'frenet' | 'loggi' | 'jadlog';
  status: 'active' | 'testing' | 'error' | 'unconfigured' | 'paused';
  credentials: Record<string, string>;
  settings: {
    price_markup_percent?: number;
    auto_import_orders?: boolean;
    sync_inventory?: boolean;
  };
}

export const getStoreIntegrations = createServerFn({ method: "GET" })
  .handler(async () => {
    const identity = await getServerIdentity();
    const db = getServerClient();
    const { data } = await db.from("marketplace_integrations")
      .select("*")
      .eq("store_id", identity.store_id);
    return data || [];
  });
```

---

## 7. PLANO DE IMPLEMENTAÇÃO PADRONIZADO (COMPLETUDE SÉPTUPLA INVIOLÁVEL)

### Cronograma de Execução das Refatorações:
- **Fase 1 (Concluída & Validada):** Fix SEV-1 em `social-publisher.functions.ts`, expansão das 16 plataformas em `marketplace-hub.functions.ts` e rotas visuais de integrações e fiscal.
- **Fase 2 (Em Andamento):** Refatoração do Fluxo de Caixa (`src/routes/workspace.financeiro.caixa.index.tsx`) com badges de canais de venda (`[Mercado Livre]`, `[iFood]`, `[Balcão]`) e filtros de proveniência.
- **Fase 3 (Próxima):** Conexão das Trocas (`src/routes/workspace.pedidos.trocas.tsx`) com estorno automático no Livro Razão.
- **Fase 4 (Próxima):** Construção do Social Studio (`src/routes/workspace.marketing.studio.tsx`) com preview de Stories 9:16 e motor de renderização PNG.

---

> **CERTIFICADO DE CONFORMIDADE TÉCNICA:**  
> Este documento unifica, intensifica e substitui qualquer instrução contraditória prévia. Todos os sistemas e planos de implementação passam a operar estritamente sob as especificações aqui homologadas.
