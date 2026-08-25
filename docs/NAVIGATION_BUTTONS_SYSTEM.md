# Sistema Global de Gestão de Botões de Navegação, Mídias & Categorias (JAH Platform)

Este documento é a **Fonte Única de Verdade (Single Source of Truth)** para a arquitetura, taxonomia, rotas e customização visual de todos os botões de navegação, chips de categorias e hotpages panorâmicas da plataforma JAH.

---

## 🏛️ 1. Visão Geral da Arquitetura

O sistema de botões e categorias da JAH foi construído para fornecer **personalização irrestrita de mídias e texturas** em todas as 25+ páginas públicas do marketplace e classificados, mantendo desempenho extremo e legibilidade impecável.

### Camadas de Completude Quádrupla:
1. **Banco de Dados (Supabase Postgres):**
   - Tabela: `hotpages`
   - Colunas Visuais: `slug`, `title`, `target_route`, `badge_label`, `bg_media_type` (`none` | `video` | `gif` | `image`), `bg_media_url`, `bg_color`, `bg_overlay_opacity`, `bg_texture` (`none` | `noise` | `dots` | `grid` | `mesh` | `glass`), `custom_icon_url`, `module`, `sort_order`, `is_active`.
2. **BFF & Server Functions (`src/services/hotpage.functions.ts`):**
   - `listHotpages({ data: { module } })`: Leitura em cache rápida para qualquer página.
   - `createHotpage()`, `updateHotpage()`, `deleteHotpage()`: Mutação segura com validação estrita via Zod e autorização administrativa.
3. **Componente Canônico de Consumo (`DynamicMediaChip.tsx` & `DiscoveryControlBar.tsx`):**
   - Suporte a vídeo MP4 em loop silencioso (`autoPlay loop muted playsInline`), GIF animado ou fotos PNG/JPG.
   - Contraste tipográfico automático com overlay configurável e textura de superfície.
   - Ícone personalizado com suporte a PNG transparente ou vetor SVG.
4. **Painel de Gestão no Workspace (`/workspace/marketing/hotpages`):**
   - Seletor de Módulo/Página para gerenciar botões de qualquer seção.
   - **Live Visual Preview** em tempo real mostrando o botão exato e o card panorâmico.
   - Uploaders diretos com integração ao Supabase Storage (`public_media`).

---

## 🗺️ 2. Mapeamento & Inventário Global de Botões por Página

| Página / Módulo | Rota Canônica | Botões / Categorias Principais | Roteamento Padrão |
|---|---|---|---|
| **Home (Início)** | `/` | Ofertas, Delivery, Mercados, Farmácia, Bebidas, Açougue, Eletrônicos, Moda, Casa, Pet, Construção, Limpeza, Livros, Serviços, Imóveis, Beleza, Doações, Vagas, Eventos, Classificados, Turismo, Mobilidade | `/ofertas`, `/gastronomia`, `/mercado`, `/farmacia`, `/bebidas`, etc. |
| **Ofertas Relâmpago** | `/ofertas` | Todas as Ofertas, Super Descontos, Compre 2 Leve 1, Frete Grátis, Queima de Estoque | `/ofertas?categoria=...` |
| **Mercado & Hortifrúti** | `/mercado` | Todos, Hortifrúti, Padaria, Carnes, Laticínios, Mercearia, Limpeza, Bebidas, Pet | `/mercado?categoria=...` |
| **Gastronomia & Delivery** | `/gastronomia` | Todos, Lanches, Pizzas, Japonesa, Brasileira, Sobremesas, Saudável, Bebidas | `/gastronomia?categoria=...` |
| **Farmácia & Saúde** | `/farmacia` | Todos, Medicamentos, Cuidados Pessoais, Suplementos, Dermocosméticos, Infantil | `/farmacia?categoria=...` |
| **Classificados Locais** | `/classificados` | Todos, Veículos & Carros, Imóveis & Moradia, Eletrônicos, Móveis, Moda & Desapego, Ferramentas | `/classificados?categoria=...` |
| **Empregos & Vagas** | `/empregos` | Todas as Vagas, Tecnologia, Vendas & Comércio, Gastronomia, Construção, Administrativo, Freelancers | `/empregos?setor=...` |
| **Agenda Cultural & Eventos** | `/agenda` | Todos, Shows & Festas, Gastronômico, Esportes, Feiras & Negócios, Teatros & Cultura | `/agenda?tipo=...` |
| **Turismo & Roteiros** | `/turismo` | Todos, Ecoturismo, Gastronômico, Histórico, Parques, Hotéis & Pousadas, Passeios | `/turismo?categoria=...` |
| **Portal de Notícias** | `/noticias` | Todas, Cidade & Cotidiano, Economia, Polícia, Esportes, Cultura, Opinião | `/noticias?categoria=...` |
| **Serviços Especializados** | `/servicos` | Todos, Reformas & Obras, Eletricistas, Encanadores, TI & Design, Jurídico, Aulas | `/servicos?categoria=...` |
| **Mobilidade & Caronas** | `/mobilidade` | Todas as Rotas, Caronas Compartilhadas, Moto Entrega, Fretes Rápidos, Vans | `/mobilidade?tipo=...` |
| **Moda & Vestuário** | `/moda` | Todos, Feminino, Masculino, Infantil, Calçados, Acessórios, Moda Praia | `/moda?categoria=...` |
| **Pet Shop & Veterinária** | `/pet` | Todos, Ração & Alimentos, Farmácia Pet, Acessórios, Higiene & Banho, Brinquedos | `/pet?categoria=...` |
| **Casa & Decoração** | `/casa` | Todos, Móveis, Decoração, Iluminação, Cama & Banho, Utensílios | `/casa?categoria=...` |
| **Construção & Reformas** | `/construcao` | Todos, Materiais Básicos, Tintas, Elétrica, Hidráulica, Ferramentas, Pisos | `/construcao?categoria=...` |
| **Eletrônicos & Tech** | `/eletronicos` | Todos, Smartphones, Computadores, Áudio & Vídeo, Acessórios, Games | `/eletronicos?categoria=...` |
| **Livros & Papelaria** | `/livros` | Todos, Livros, Material Escolar, Escritório, Arte & Artesanato, Mochilas | `/livros?categoria=...` |
| **Limpeza & Higiene** | `/limpeza` | Todos, Desinfetantes, Sabões & Detergentes, Descartáveis, Acessórios de Limpeza | `/limpeza?categoria=...` |
| **Açougue & Carnes** | `/acougue` | Todos, Bovinos, Suínos, Aves, Espetos & Churrasco, Linguiças Artesanais | `/acougue?categoria=...` |
| **Bebidas & Adega** | `/bebidas` | Todos, Cervejas Especiais, Vinhos, Destilados, Refrigerantes, Sucos & Águas | `/bebidas?categoria=...` |
| **Beleza & Barbearias** | `/beleza` | Todos, Barbearias, Salões de Beleza, Manicure, Estética, Sobrancelhas & Cílios | `/beleza?categoria=...` |
| **Doações & Solidariedade** | `/doacoes` | Todas as Causas, Roupas, Alimentos, Animais, Móveis, Voluntariado | `/doacoes?causa=...` |

---

## 🎨 3. Capacidades Visuais de Cada Botão

1. **Vídeo MP4 em Fundo:**
   - Permite veicular mini-vídeos com looping fluido, autoplay, sem áudio e acelerados por hardware no dispositivo do usuário.
2. **GIF Animado ou Foto em Alta Resolução:**
   - Permite dar movimento e identidade visual única a campanhas temáticas (ex: Páscoa, Black Friday, Verão).
3. **Texturas de Fundo Sofisticadas:**
   - `noise`: Ruído pontilhado fosco para estilo editorial.
   - `dots`: Grid de micropontos com iluminação.
   - `grid`: Linhas técnicas finas em 10px.
   - `mesh`: Gradiente fluido translúcido.
   - `glass`: Vidro fosco com desfoque de fundo (`backdrop-blur-md`).
4. **Controle de Opacidade do Overlay:**
   - Permite controlar de 0% a 90% a camada preta sobre a mídia, garantindo contraste perfeito para o texto e ícone.
5. **Ícone Customizado:**
   - Upload de PNGs transparentes ou ícones vetoriais customizados da marca ou da categoria.
6. **Rota de Destino Customizável:**
   - Redirecionamento direto para qualquer URL interna (`/ofertas`, `/gastronomia`, etc.) ou landing page específica.
