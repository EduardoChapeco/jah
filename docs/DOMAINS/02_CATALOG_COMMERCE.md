# Dossiê 02: Catálogo, Classificados e Experiência de Marketplace

**Status**: Especificação Final  
**Domínio**: Commerce & Catalog Management

---

## 1. Necessidade Humana

**Quem utiliza?** Vendedores (Lojas, Artistas, Brechós, Pessoas Físicas) e Compradores.
**Por que utiliza?** O Vendedor quer ofertar um produto novo, um item usado (classificado) ou um infoproduto. O Comprador quer encontrar itens por interesse, buscar e comprar.
**Problema que resolve:** Em e-commerces tradicionais, há uma distinção rígida de catálogo que impossibilita a coexistência de um produto profissional de grade (cor e tamanho) com um anúncio pontual (um tênis usado único) e um serviço (orçamento).
**Resultado esperado:** Um motor de catálogo canônico que abstrai "Itens" sob o Tenant. Se a pessoa anuncia um livro usado, ela usa a interface rápida de "Classificado". Se ela lança uma coleção de roupas, usa a interface avançada de "Produto com Variantes". O consumidor vê tudo no Feed e na Busca unificada.

---

## 2. Fluxo Principal

1. **Criação de Produto (Modo Lojista Profissional):**
   - Usuário em contexto `store` acessa `Catálogo > Novo Produto`.
   - Adiciona título, descrição, fotos, categorias.
   - Ativa `Variações` (Ex: Cor e Tamanho).
   - O sistema gera a matriz de `variants` (SKUs).
   - Ele define estoque para Preto-M e Branco-G, mas não permite salvar Branco-P com estoque sem preço. Combinações irreais são desativadas.
   - Publica o produto (Estado `published`). O produto surge no Feed (Propagação).
2. **Criação de Classificado (Modo Usuário Casual):**
   - No Feed Pessoal, usuário clica em `Anunciar`.
   - Interface enxuta: Foto, Título, Preço, Estado (Novo/Usado), Aceita Troca.
   - Salva. O backend converte isso no mesmo motor de catálogo subjacente, mas amarrado ao `store_id` (que neste caso, pode ser uma micro-loja ou projeto invisível associado ao perfil dele).
3. **Descoberta e Carrinho:**
   - O Comprador vê um pôster do Artista A e um Classificado do Usuário B.
   - O carrinho da Jah mantém isolamento por Tenant. Ele não faz checkout único de duas origens (por enquanto).
   - Ele adiciona o pôster ao carrinho `A`. Checkout e fechamento de Pedido.

---

## 3. Fluxos Alternativos e Resiliência

- **Estoque Negativo (Concorrência):**
  - **Problema:** Dois usuários clicam em comprar a última peça ao mesmo tempo.
  - **Solução:** Na transição do Carrinho para o Pagamento, a API faz um lock otimista (`SELECT ... FOR UPDATE` no Supabase não é trivial via API, então usamos constraint de `check (stock >= 0)`). A segunda transação falha com restrição no DB. O usuário é avisado "Produto esgotou enquanto você comprava".
- **Alteração de Preço em Produto no Carrinho:**
  - O vendedor altera o preço de 100 para 150.
  - O usuário que já tinha o item no carrinho (mas não fechou) recebe um aviso no refresh: "O preço do item foi atualizado". (O preço canônico sempre vem do Banco no momento do checkout, e não do cache do carrinho do cliente).
- **Classificado Denunciado:**
  - Produto recebe 5 denúncias. Status vai para `under_review`. Some do feed e da busca.

---

## 4. Máquina de Estados e Transições

**`products` (Produto/Classificado)**

- `draft`: Em edição. Visível só para staff do tenant.
- `published`: Ativo e indexado.
- `archived`: Retirado de venda.
- `under_review`: Moderação de segurança.
- `sold`: Exclusivo para itens de estoque unitário (Classificados).

---

## 5. Regras de Negócio e Concorrência

1. **Variantes e Combinações:**
   - A base atual pode ter `product_options` (Cor) e `product_option_values` (Azul, Vermelho).
   - Uma matriz gera os `product_variants`.
   - Regra de Ouro: Variações impossíveis (ex: Tênis tamanho 50) não devem ser geradas com "estoque zero". Devem ser `is_active = false` ou não criadas.
2. **Isolamento de Carrinho:**
   - `cart` pertence a um `store_id`. Se a pessoa adicionar item de outra loja, pergunta se deseja limpar o carrinho atual ou criar um paralelo. (Sempre paralelo no banco, mas UI focada).

---

## 6. Experiência de UI/UX (Rotas)

- Lojista: `/admin/catalogo/produtos` (Tabela rica, filtros de status).
- Novo Produto Lojista: `/admin/catalogo/produtos/novo` (Abre `Sheet` lateral 75% ou Tela Cheia). **NUNCA Modal pequeno.**
- Novo Classificado: Modal simplificado no Feed (UI Social).
- Vitrine: `/:storeSlug/produtos/:produtoSlug`.

---

## 7. Persistência (Modelagem Base Canônica)

- **`products`**: `id`, `store_id (FK)`, `title`, `description`, `base_price_cents`, `status`, `type (product, classified, digital)`.
- **`product_variants`**: `id`, `product_id (FK)`, `sku`, `price_cents_override`, `stock_quantity`, `is_active`.
- **`product_images`**: `id`, `product_id`, `url`, `order`.
- **`carts` e `cart_items`**: Mantidos em cache temporário (Redis/Supabase) ou local storage hibridizado (Sincronizado via Supabase se logado).

---

## 8. Contratos e BFF

- `createProduct(data, store_id)`: BFF verifica se `identity.store_id == store_id` e `role in [owner, manager, seller]`.
- `updateVariantStock(variantId, quantity)`: Lança falha se quantity < 0 e a configuração da loja não permite estoque negativo.

---

## 9. Segurança e RLS (Row Level Security)

- **Read Público**: `status = published` (Todos podem ver).
- **Read Privado**: `store_members` vinculados ao `store_id` do produto podem ver `draft` e `archived`.
- **Write**: Restrito ao backend (Service Role) onde a mutação valida `assertStoreAccess`.

---

## 10. Propagação e Sincronização

- Um produto publicado dispara um hook que insere uma "Atividade" (Pub) no Feed da Loja, garantindo visibilidade instantânea.
- Editar o preço de um produto **NÃO** altera o preço de um `order_item` histórico. Cópia imutável (Snapshot) é regra vital no fechamento.

---

## 11. Observabilidade (Auditoria)

- Controle rígido de `stock_movements`.
- Ninguém muda estoque escrevendo `stock = 10`. O sistema deve logar: "Balanço Manual: +2", "Venda: -1", "Devolução: +1". A tabela `product_variants.stock_quantity` deve ser preferencialmente um contador recalculado ou estritamente auditado via triggers.

---

## 12. Critério de Conclusão

Este domínio estará pronto quando:

1. Puder criar produto com e sem variante usando o `<Sheet>` gigante sem gargalos.
2. Comprador adicionar no carrinho e simular checkout (estoque travado).
3. Alteração de preço não quebrar pedidos passados.
4. UI do catálogo suportar navegação e filtros rápidos.
