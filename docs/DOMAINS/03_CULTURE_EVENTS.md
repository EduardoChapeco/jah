# Dossiê 03: Eventos Culturais, Ingressos e Check-in

**Status**: Especificação Final  
**Domínio**: Event & Ticketing Management

---

## 1. Necessidade Humana

**Quem utiliza?** Produtores de Cultura, Artistas, Donos de Casas Noturnas (Lojistas) e Festeiros/Público.
**Por que utiliza?** O Produtor quer centralizar a venda antecipada, ter previsibilidade de caixa, administrar listas VIP/cortesias e ter um check-in rápido na porta (sem internet caindo). O Público quer achar o rolê no feed, comprar o ingresso rápido (com PIX/Cartão), ter o QR Code salvo na Apple Wallet/Google Pay ou no próprio app da Jah, e não sofrer golpe na porta.
**Problema que resolve:** Fragmentação. Hoje o produtor vende no Sympla (pagando 10%), faz a divulgação no Instagram, o financeiro em planilha e o PDV do bar na maquininha. A Jah une tudo sob a mesma Organização. O mesmo usuário que posta no feed pode virar ingresso na porta.
**Resultado esperado:** Motor escalável de Eventos. Eventos pequenos podem usar apenas modo "Divulgação" (RSVP free). Eventos gigantes ativam Controle de Lotes (Virada automática), Check-in em alta densidade, Repasse Financeiro acoplado e QR Codes Seguros.

---

## 2. Fluxo Principal

1. **Criação do Evento:**
   - Produtor clica em "Criar Evento". Adiciona flyer, data, hora, local (físico ou online) e line-up.
   - Ativa "Venda de Ingressos".
   - Cria **Lote Promocional** (Preço: R$ 30,00, Capacidade: 100, Expira: sexta-feira).
   - Publica o evento.
2. **Descoberta e Compra:**
   - Usuário vê o Flyer no Feed da Jah (estilo zine). Clica.
   - Seleciona 2 ingressos (Lote Promocional).
   - O sistema trava as 2 vagas temporariamente no carrinho (TTL: 15 min).
   - O usuário paga (ex: Pix).
   - O webhook do Gateway confirma.
3. **Emissão e Entrega:**
   - O Backend intercepta o `payment_success`.
   - Gera 2 registros reais na tabela `tickets`, atribuindo a posse ao `profile_id` do comprador.
   - Gera um token JWT/QR Code assinado criptograficamente.
4. **O Dia do Evento (Check-in):**
   - O porteiro usa a interface móvel "Door/Check-in".
   - Lê o QR Code da tela do cliente.
   - O sistema valida a assinatura e altera o status de `valid` para `used`.
   - Caso o evento esteja sem sinal, o sistema utiliza o cache offline de PKI (Chave Pública) para validar o JWT na catraca, emitindo a requisição para o banco assim que a conexão retornar.

---

## 3. Fluxos Alternativos e Resiliência

- **Venda Esgotada no Pagamento:**
  - Usuário demorou 20 minutos no PIX. O TTL de 15 min expirou. Quando ele paga, o lote virou.
  - O sistema acata o dinheiro em saldo (Wallet Jah) ou gera o ingresso do Lote 2 cobrando o excedente? A regra Jah: Devolve automaticamente via PIX estorno (se gateway permitir), ou retém em Wallet (com opção de estorno 1 click) mandando push pro cliente.
- **Cambista / Troca de Titularidade:**
  - Se permitido pelo produtor, o cliente clica no ingresso -> "Transferir".
  - Informa o email/id do amigo.
  - A posse (`owner_profile_id`) do ticket muda. Um log de auditoria documenta isso.
- **Cancelamento do Evento:**
  - Status vai para `cancelled`.
  - Todos os ingressos `valid` viram `refunded`. Um batch job agenda os estornos no Gateway.

---

## 4. Máquina de Estados e Transições

**`events` (Evento Real)**

- `draft`: Construindo.
- `published`: Divulgado/Vendas abertas.
- `active`: Acontecendo agora (Check-in rodando).
- `finished`: Acabou. (Para balanço financeiro).
- `cancelled`: Estornar tudo.

**`ticket_lots` (Lotes)**

- `scheduled`: Aguardando a data de início.
- `active`: Vendendo.
- `sold_out`: Atingiu limite `capacity`. Gatilho para ativar o próximo lote se houver.
- `expired`: Tempo limite atingido.

**`tickets` (O Documento Visual e Real)**

- `reserved`: No carrinho.
- `valid`: Pago, pronto pra porta.
- `used`: Entrou (Check-in).
- `revoked/refunded`: Cancelado ou Estornado (Fraude ou desistência).

---

## 5. Regras de Negócio e Concorrência

1. **Idempotência no Check-in:**
   - Duas recepcionistas escaneiam o mesmo ingresso no mesmo milissegundo.
   - Apenas UMA request pode retornar 200 OK. O banco deve fazer update com restrição: `UPDATE tickets SET status = 'used' WHERE id = X AND status = 'valid'`. A segunda falhará por não achar `valid`.
2. **Virada de Lote:**
   - Nunca basear a virada puramente no relógio do Frontend.
   - Um cron (Job Supabase Edge Function) ou a própria query da vitrine deve avaliar dinamicamente: `if (now() > end_date OR sold >= capacity) -> return next_lot`.
3. **Cortesias e Lista Vip:**
   - Produtor gera ingresso com `price = 0` na tabela. Bypass no fluxo financeiro (não gera `order`).

---

## 6. Experiência de UI/UX (Rotas)

- Vitrine Pública: `/eventos/:slug` (Design tipo cartaz, expansivo, vibrante).
- Meus Ingressos: `/_store/conta/ingressos` (Parece um ticket físico no Apple Wallet).
- Door/Check-in: `/admin/eventos/:id/checkin` (Dark mode obrigatório, alto contraste, botão gigante verde/vermelho).
- Dashboard Lojista: `/admin/eventos/:id` (Gráfico de vendas, faturamento em Cents formatado na regra canônica).

---

## 7. Persistência (Modelagem Base Canônica)

- **`events`**: `id`, `store_id (FK)`, `title`, `description_html`, `venue_name`, `starts_at (UTC)`, `ends_at (UTC)`.
- **`ticket_lots`**: `id`, `event_id (FK)`, `name`, `price_cents`, `capacity`, `sold`, `starts_at`, `ends_at`.
- **`tickets`**: `id`, `event_id (FK)`, `lot_id (FK)`, `order_id (FK)`, `owner_profile_id (FK)`, `status`, `qr_code_hash`, `checkin_at`.

---

## 8. Contratos e BFF

- `createTicketLots(data, event_id)`: Valida se cronologia faz sentido (Lote 2 não pode acabar antes do Lote 1).
- `checkinTicket(ticket_id, event_id)`: BFF valida permissões. Não basta ler o QR Code, quem faz a request deve ter `assertStoreAccess` na loja dona do evento com a role `owner`, `manager` ou `door` (Nova role que pode ser criada futuramente, por enquanto `seller`).

---

## 9. Segurança e RLS (Row Level Security)

- `tickets` não podem ser lidos publicamente. O cliente só enxerga `tickets` onde `owner_profile_id = auth.uid()`.
- Lojista lê todos os tickets onde `store_id = event.store_id`.

---

## 10. Propagação e Sincronização

- Evento publicado aparece no Feed (`posts` gerado automaticamente).
- Checkout concluído -> Gera Lançamento Financeiro (`cash_entries`) na conta (store) do Produtor. A comissão da Plataforma é retida.

---

## 11. Observabilidade (Auditoria)

- Tabela `audit_logs` deve registrar o ID da pessoa na porta (`actor_id`) que efetuou o check-in do ticket, para auditoria em caso de queixas "Meu ingresso já estava lido".

---

## 12. Critério de Conclusão

Este domínio estará pronto quando:

1. Produtor conseguir gerar 3 lotes automáticos.
2. Comprador esgotar o Lote 1 e o sistema mostrar o Lote 2.
3. Check-in falhar em bilhetes falsos, duplicados ou já lidos (garantia de idempotência na API).
4. Data/Hora for salva em ISO UTC e visualizada em `America/Sao_Paulo` (Regra #4 do AGENTS.md).
