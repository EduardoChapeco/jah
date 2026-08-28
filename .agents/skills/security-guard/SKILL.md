---
name: security-guard
description: "Auditor de Segurança Server-Side, Zero-Trust Client, RLS Deny-by-Default, Prevenção de Injeção e Proteção Multi-Tenant para a plataforma Wider."
---

# Security Guard — Protocolo de Blindagem Server-Side (BigTech Standard)

> **Missão:** Garantir que NENHUM dado possa ser violado, adulterado ou injetado por clientes maliciosos, impondo validação 100% server-side, integridade transacional e isolamento multi-tenant absoluto.

---

## 🛡️ 1. Princípios Invioláveis de Segurança

1. **Zero Client Trust (Confiança Zero no Frontend):**
   - Preços, taxas, estoques, saldos de tokens e permissões NUNCA são aceitos a partir do payload do cliente. O backend (`src/services/*`) busca e valida a verdade a partir do banco de dados e da sessão segura (`getServerIdentity()`).
2. **RLS Deny-by-Default com `(SELECT auth.uid())`:**
   - Todas as tabelas têm Row Level Security ativo. Operações de mutação direta do cliente são bloqueadas. Apenas procedures `SECURITY DEFINER` e funções de servidor autenticadas podem executar alterações sensíveis.
3. **Validação Estrita de Schemas Zod:**
   - Todo input de Server Function (`createServerFn`) deve ser rigorosamente tipado e validado com Zod antes de qualquer acesso a banco.
4. **Proteção Contra Replay & Idempotência:**
   - Webhooks financeiros e recargas de saldo exigem chaves de idempotência únicas e tabelas de inbox transacional (`ON CONFLICT DO NOTHING`).
5. **Ledger Imutável & Prova de Solvência:**
   - Tabelas financeiras e de tokens são *append-only* com triggers de bloqueio a `UPDATE` e `DELETE`, protegidas por hashes criptográficos SHA-256 encadeados.
