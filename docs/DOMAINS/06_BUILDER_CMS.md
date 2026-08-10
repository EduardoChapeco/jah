# Dossiê 06: Motor Visual Único (Jah Studio & CMS)

**Status**: Especificação Final  
**Domínio**: CMS, Builder & Visual Renderer

---

## 1. Necessidade Humana

**Quem utiliza?** Criadores de Conteúdo, Donos de Loja, Bandas e o próprio Sistema (para gerar Ingressos e Recibos).
**Por que utiliza?** Para personalizar a aparência de suas Lojas (Storefronts), montar Landing Pages (Biolinks, Portfólios) e customizar os templates de Impressão (Recibo de PDV, Ingresso Físico) sem precisar de desenvolvedores.
**Problema que resolve:** Em e-commerces antigos, a "Home da Loja" é fixa e travada em código. Se a pessoa quer um Biolink, precisa do Linktree. Se quer um site, precisa do Wix. O Builder da Jah unifica isso: um único motor JSON-to-React que desenha Lojas, Perfis e Documentos Visuais sob os padrões rígidos de estética da Rua (Zines, Lambe-lambe, Flyers).
**Resultado esperado:** Uma arquitetura agnóstica de renderização baseada em Documentos JSON versionados e "Data Bindings". O sistema não guarda um HTML sujo, guarda uma árvore estruturada de nós que herdam de um catálogo fixo de Componentes (Blocks).

---

## 2. Fluxo Principal

1. **Criação de um Biolink (Perfil Pessoal):**
   - Usuário clica em "Editar Meu Perfil".
   - Abre o `Jah Studio` em Modo Simplificado. O `document` base do tipo `profile` é carregado.
   - Ele adiciona um bloco "Galeria de Fotos" e um bloco "Classificados Recentes".
   - Ele clica em "Salvar". O JSON vira um draft. "Publicar" gera a `version` ativa.
2. **Criação de Storefront (Modo Lojista):**
   - Na aba "Loja Online", o Lojista abre o Studio em Modo Avançado.
   - Ele arrasta um bloco "Vitrine Inteligente".
   - **Data Binding:** Ele liga o bloco à query dinâmica `latest_products`. O construtor **NÃO** copia os produtos pro JSON, ele salva a instrução de query.
   - A loja é publicada.
3. **Criação de Documento (Motor Interno):**
   - O gerente do PDV customiza o Template de Impressão Térmica (Recibo 58mm).
   - O Builder restringe os blocos disponíveis a apenas Texto Monospace e Tabela de Itens, impedindo imagens pesadas.

---

## 3. Fluxos Alternativos e Resiliência

- **Componente Descontinuado no Frontend:**
  - **Problema:** Um documento salvo na Fase 1 usa o bloco `HeroCarousel`, mas na Fase 3 nós removemos esse componente do código-fonte.
  - **Solução:** O Renderer (motor React que lê o JSON) deve possuir um _Fallback Boundary_. Ao ler `HeroCarousel` e não encontrar no registro, ele renderiza um "Componente Não Suportado" estilizadamente no modo Admin, e ignora silenciosamente em Produção (ou renderiza um genérico `<Surface>`). O App nunca quebra por causa de JSON legado.
- **Sobrescrita Acidental (Concorrência):**
  - Duas pessoas com acesso `content` salvam a Home da Loja ao mesmo tempo.
  - O banco checa a versão (`updated_at` ou `version`). O segundo save avisa "O documento foi alterado por João. Recarregue a página".

---

## 4. Máquina de Estados e Transições

**`builder_documents`**

- `draft`: Apenas salvo em cache ou rascunho de banco.
- `published`: Rodando ao vivo na URL de destino.
- `archived`: Documento guardado como histórico.

---

## 5. Regras de Negócio e Concorrência

1. **Catálogo Estrito de Blocos:**
   - O Builder não é um editor de código livre. É restrito a uma paleta pré-curada (`@/components/ui`, `Surface`, etc). Isso garante que um usuário nunca crie algo esteticamente feio ou fora dos Tokens do Design System da Jah.
2. **Separação de Dados e UI:**
   - Um bloco de "Produto" deve salvar no JSON `productId: "uuid"`.
   - No runtime (SSR via TanStack Start), a página lê o JSON, identifica todos os `productId` e faz _UMA ÚNICA QUERY_ agregada ao banco para buscar os preços reais atuais, hidratando os blocos no servidor.

---

## 6. Experiência de UI/UX (Rotas)

- Edição de Loja: `/admin/builder/:documentId/editor`
- Edição de Perfil: `/_store/conta/editar-perfil` (Usa o mesmo motor por trás, mas com UI de assistente passo-a-passo no frontend).
- Visualização ao Vivo: Qualquer rota pública resolve e renderiza o Document.

---

## 7. Persistência (Modelagem Base Canônica)

- **`builder_documents`**: `id`, `store_id (FK opcional)`, `profile_id (FK opcional)`, `type (storefront, profile, ticket, receipt, post)`, `content (JSONB)`, `status`.
- **`builder_versions`**: Tabela de append-only para guardar o histórico de JSONB. Permite o rollback (Botão: "Desfazer cagada de sexta-feira").

---

## 8. Contratos e BFF

- `publishDocument(id, jsonContent)`: Salva no `builder_documents` e gera snapshot na `builder_versions`. Limpa o Cache de CDN Edge para a rota que consome esse documento.

---

## 9. Segurança e RLS (Row Level Security)

- Leitura (`status = published`): Publicamente aberto se `type` for público, protegido se for um layout de PDV.
- Escrita: `assertStoreAccess` com roles `owner`, `admin`, `manager`, `content`. (Seller, Finance, Stock não podem mexer no layout da loja).

---

## 10. Propagação e Sincronização

- Um bloco que aponta pra um Produto `uuid` será automaticamente invisível (desenhado com height 0 ou Skeleton) caso o Produto seja inativado ou arquivado, sem necessidade de editar a Página.

---

## 11. Observabilidade (Auditoria)

- Logar em `audit_logs`: "Página Home atualizada por Ana do Marketing", anexando o ID da versão anterior para rastreio.

---

## 12. Critério de Conclusão

Este domínio estará pronto quando:

1. Conseguirmos trocar o layout da Vitrine de uma loja via Studio.
2. Conseguirmos criar a Página Pública de um Evento usando blocos do Builder.
3. Conseguirmos gerar a impressão de um PDF de ingresso com QR Code dinamicamente usando exatamente a mesma mecânica de nós visuais, mas num PDF Renderer via Puppeteer ou Server Function.
