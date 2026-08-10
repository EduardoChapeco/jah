# Dossiê 05: Operações, Fulfillment e Arquitetura Financeira

**Status**: Especificação Final  
**Domínio**: Finance, Operations & PDV

---

## 1. Necessidade Humana

**Quem utiliza?** Vendedores de balcão (PDV), Financeiro, Estoquista, Motoboys/Entregadores e o Cliente (acompanhando pedido).
**Por que utiliza?** Lojas físicas precisam de um PDV ágil. O financeiro precisa reconciliar vendas online com faturamento físico. Entregadores precisam do mapa e prestação de contas.
**Problema que resolve:** O abismo entre o online e o offline. Compras feitas online entram num painel (Fulfillment). Vendas feitas no balcão entram no PDV da mesma Loja, consumindo o mesmo estoque e unificando o extrato.
**Resultado esperado:** Separação estrita entre `Orders` (O compromisso de venda) e `Cash_Entries` (O dinheiro de fato). Pagamentos manuais, troco, múltiplos cartões num mesmo pedido do PDV, e Split de comissões.

---

## 2. Fluxo Principal

1. **Venda Presencial (PDV):**
   - Vendedor (Role `seller` na Store A) abre o Caixa (`cash_shifts`).
   - Escaneia código de barras (BFF busca por EAN).
   - Adiciona 3 itens. Subtotal R$ 100,00.
   - Aplica Desconto de R$ 10,00 no subtotal.
   - Cliente paga R$ 50 no Débito e R$ 40 em Dinheiro.
   - Fecha pedido. Estoque sofre baixa automática, Caixa registra +40 em Dinheiro e +50 em Débito. Imprime recibo.
2. **Venda Online e Separação (Fulfillment):**
   - Pedido online cai como `paid` e `unfulfilled`.
   - Estoquista vê na tela de Picking List.
   - Ele separa o item fisicamente, escaneia pra bipar que está ok.
   - Status vai pra `ready_for_pickup` (ou enviado pra Motoboy).
3. **Logística (Entregas):**
   - Motoboy da loja vê a corrida. Confirma aceite. Rota é traçada.
   - Tira foto do pacote na porta do cliente. Confirma entrega. Pedido `completed`.
4. **Acerto Financeiro (Repasse):**
   - Motoboy acumulou R$ 120 de taxas de entrega na semana.
   - Financeiro gera "Fatura do Entregador" e clica em Pagar.
   - Uma saída de `cash_entries` de R$ -120 é computada no DRE da Loja.

---

## 3. Fluxos Alternativos e Resiliência

- **Venda sem Caixa Aberto:**
  - O sistema impede o botão "Finalizar Venda" no PDV se não houver um `shift` ativo para aquele usuário ou loja (configurável).
- **Pagamento Online Rejeitado:**
  - Pedido fica `payment_failed`. O estoque NÃO é baixado.
- **Devolução/Troca no PDV:**
  - Cliente traz a peça. Vendedor puxa a venda velha. Clica "Devolver 1 item".
  - O sistema gera `stock_movements` (+1), gera um crédito no caixa (`cash_entries` com valor negativo, ou devolução no cartão) e atualiza o `orders` histórico com anotação.

---

## 4. Máquina de Estados e Transições

**`orders` (O Pedido/Compromisso)**

- `pending`: Aguardando pagamento.
- `paid`: Pagamento efetuado.
- `unfulfilled`: Pagamento ok, não separado.
- `fulfilled` / `shipped`: Entregue à transportadora ou pronto pra retirada.
- `completed`: Cliente recebeu.
- `cancelled`: Estornado ou recusado.

**`cash_shifts` (Turnos de Caixa Físico)**

- `open`: Recebendo lançamentos manuais.
- `closed`: Fechado pelo gerente. Congelado.

**`deliveries` (Logística)**

- `pending`: Criada, sem entregador.
- `accepted`: Motoboy a caminho da loja.
- `in_transit`: Pacote na moto indo pro cliente.
- `delivered`: Fim.
- `failed`: Cliente não estava.

---

## 5. Regras de Negócio e Concorrência

1. **Desconto no PDV:**
   - O desconto num pedido não é só um número solto. Ele deve ser rateado (pro-rata) entre os itens se houver comissão por vendedor, para não penalizar o vendedor A sendo que o produto descontado era do vendedor B.
2. **Double-Spending de Comissões:**
   - Comissões calculadas num fechamento (`orders.completed`) ganham ID idempotente. Se tentar gerar de novo, bloqueia.

---

## 6. Experiência de UI/UX (Rotas)

- PDV: `/admin/pdv` (Tela Fullscreen, otimizada para touch e leitor de código de barras, sem navegação lateral).
- Pedidos: `/admin/pedidos` (Tabela Kanban de Separação).
- Caixa Central: `/admin/caixa` (Extrato financeiro, aba de Fechamento).

---

## 7. Persistência (Modelagem Base Canônica)

- **`orders`**: `id`, `store_id`, `customer_profile_id`, `total_cents`, `status`, `payment_status`, `fulfillment_status`.
- **`order_items`**: `id`, `order_id`, `product_id`, `variant_id`, `price_cents_snapshot`, `quantity`.
- **`cash_shifts`**: `id`, `store_id`, `opened_at`, `closed_at`, `opened_by`.
- **`cash_entries`**: `id`, `shift_id`, `amount_cents` (+ ou -), `type (cash, credit, pix)`, `description`.
- **`deliveries`**: `id`, `order_id`, `driver_profile_id`, `fee_cents`, `status`.

---

## 8. Contratos e BFF

- `createCashShift(store_id, opening_balance)`: Somente Role de gerente ou dono.
- `processPDVSale(payload)`: Transação ACID. Faz insert em `orders`, `order_items`, `cash_entries` e `stock_movements`. Se um falhar, Roolback em tudo.

---

## 9. Segurança e RLS (Row Level Security)

- `cash_entries` e `cash_shifts`: RLS rígido, ninguém fora da `store_members` tem leitura. Somente Roles financeiras têm escrita.

---

## 10. Propagação e Sincronização

- Um pedido online entra em `paid`. Dispara Server Sent Event (SSE) ou Realtime via Supabase pro painel da loja apitar (Som de campainha) alertando nova venda para separação.

---

## 11. Observabilidade (Auditoria)

- Tabela `audit_logs` salva qualquer "Sangria" ou "Suprimento" de caixa não justificado. Toda alteração de `stock_quantity` feita na mão (Inventário manual) deve exigir justificativa escrita ("Dano na goteira").

---

## 12. Critério de Conclusão

Este domínio estará pronto quando:

1. Conseguirmos abrir caixa, vender no cartão e no dinheiro no PDV, fechando a transação.
2. Venda descontar estoque de imediato.
3. Caixa fechar batendo os valores de Cents absolutos.
4. Extrato financeiro da loja mostrar perfeitamente as entradas via PDV segregadas de Vendas Online (PIX via Gateway).
