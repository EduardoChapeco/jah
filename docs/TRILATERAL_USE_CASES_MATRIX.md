# 🏛️ MATRIZ TRILATERAL DE CASOS DE USO & GOVERNANÇA E2E (JAH SUPER APP)

> **Documento Estratégico e Vinculante do Conselho Executivo de BigTech**
> Mapeamento completo dos 12 Domínios Operacionais sob a ótica dos 3 Atores do Ecossistema:
> 1. **Consumidor / Cidadão (Consumer / User)**
> 2. **Lojista / Empreendedor / Autônomo / Anunciante (Merchant / Operator)**
> 3. **Administrador Master Global / Órgão Regulador (Platform Master Governance)**

---

## 📐 O TRIÂNGULO OPERACIONAL DE VALOR

```
                             [ 👑 ADMIN MASTER GLOBAL ]
                             Governança Central, Trust & Safety,
                             Dossiês Judiciais, KYC & Estornos
                                      ▲       ▲
                                     /         \
                 Auditoria, Mediação/           \ Auditoria, Faturamento,
                 & Direitos LGPD   /             \ Repasses & Intervenção
                                  /               \
                                 ▼                 ▼
             [ 👤 CONSUMIDOR ] ◄─────────────────────► [ 🏪 LOJISTA / OPERADOR ]
             Descoberta, Consumo,       Transação,      Publicação, Gestão, PDV,
             Agendamento, Avaliação     Atendimento     Equipe, Catálogo & Frotas
```

---

## 1. 🛍️ DOMÍNIO: E-COMMERCE, VAREJO & CATÁLOGO MULTI-TENANT

| Dimensão | 👤 Consumidor (User) | 🏪 Lojista / Operador (Merchant) | 👑 Admin Master Global (Master) |
| :--- | :--- | :--- | :--- |
| **Descoberta & Vitrine** | Navega por categorias, busca preditiva FTS, filtros por preço/tamanho/marca, ordenação por relevância. | Cria produtos, define título, marca, SEO, categorização e badges promocionais. | Audita produtos denunciados por pirataria ou propaganda enganosa; oculta itens globalmente. |
| **Variações & Estoque** | Escolhe combinações (ex: *Cor: Preto*, *Tamanho: 42*), visualiza fotos específicas e estoque disponível. | Gerencia matriz 2D de SKUs (`VariantMatrixGrid`), custos, códigos EAN/GTIN e regras de encomenda (*backorder*). | Visualiza saldo consolidado de inventário em toda a rede e rastreia itens em falta. |
| **Checkout & Pagamento** | Adiciona ao carrinho, calcula frete por CEP, aplica cupom/cashback, paga via PIX Copia & Cola ou Cartão. | Recebe pedido no painel com notificação sonora, visualiza endereço de entrega e dados do cliente. | Audita integridade transacional da RPC `process_checkout_transaction_v2` e monitora tentativas de fraude. |
| **Pós-Venda & Devolução** | Acompanha timeline do pedido (*Pago*, *Separando*, *Despachado*, *Entregue*), solicita troca/devolução (RMA). | Atualiza status do pedido, imprime etiqueta de envio, aprova ou recusa RMA com checklist de inspeção. | Intermedeia disputas de não entrega ou produto com avaria; executa estorno forçado se lojista for omisso. |

---

## 2. 🍔 DOMÍNIO: GASTRONOMIA, CARDÁPIOS DINÂMICOS & DELIVERY

| Dimensão | 👤 Consumidor (User) | 🏪 Lojista / Operador (Merchant) | 👑 Admin Master Global (Master) |
| :--- | :--- | :--- | :--- |
| **Personalização PDP** | Monta lanche/prato escolhendo obrigatoriamente *Ponto da Carne* e adicionando *Molhos Extras*, *Bacon (+R$ 4,50)*. | Cria grupos de opcionais (`OptionGroupsManager`), limites mín/máx de escolha, preços e franquia inclusa. | Garante que taxas abusivas ou descrições sanitariamente inadequadas sejam moderadas. |
| **Operação de Salão / Balcão** | Pede pelo cardápio digital na mesa via QR Code ou no balcão físico. | Lança comandas de mesa no PDV (`workspace.pdv`), controla troco inicial, sangrias e fechamento de turno. | Monitora conformidade fiscal e fechamentos de caixa das operações registradas. |
| **Cozinha (KDS) & Despacho** | Recebe estimativa de tempo de preparo e rastreia entrega pelo motoboy. | Cockpit Kanban da Cozinha (*A Fazer*, *No Fogo*, *Pronto*), impressão térmica ESC/POS 58mm/80mm e despacho para frota. | Rastreia tempo médio de entrega da região para alimentar o algoritmo de pontuação de lojas. |

---

## 3. 🏡 DOMÍNIO: PROPTECH, IMÓVEIS & GESTÃO DE LOCAÇÃO

| Dimensão | 👤 Consumidor (User) | 🏪 Lojista / Operador (Merchant) | 👑 Admin Master Global (Master) |
| :--- | :--- | :--- | :--- |
| **Busca & Ficha do Imóvel** | Filtra por finalidade (*Aluguel* / *Venda*), bairro, número de quartos, vagas, m² e comodidades (piscina, varanda). | Publica ficha técnica completa com fotos em alta definição, tour virtual e termos de garantia locatícia. | Audita anúncios duplicados ou imobiliárias sem CRECI válido; remove anúncios fantasmas. |
| **Proposta & Locação** | Envia proposta formal com documentação pessoal, comprovante de renda e solicita agendamento de vistoria. | Analisa propostas no pipeline, emite contrato de locação digital e vincula inquilino ao imóvel. | Guarda log imutável de aceite contratual e assinaturas eletrônicas para validade jurídica. |
| **Central de Manutenção** | Abre chamado de reparo pelo app anexando fotos/vídeos do vazamento/dano e urgência (*Baixa*, *Alta*, *Emergência*). | Recebe chamados em [`workspace.imoveis.manutencoes`](file:///c:/Users/Excelência Tour SMO/Documents/jah/src/routes/workspace.imoveis.manutencoes.tsx), aprova orçamento com prestador e dá baixa na OS. | Dossiê de chamados aberto serve de prova pericial em rescisões litigiosas de contrato de aluguel. |

---

## 4. 🚗 DOMÍNIO: AUTOTECH, VEÍCULOS & NÁUTICA

| Dimensão | 👤 Consumidor (User) | 🏪 Lojista / Operador (Merchant) | 👑 Admin Master Global (Master) |
| :--- | :--- | :--- | :--- |
| **Ficha Técnica Automotiva** | Consulta Ano Fab/Mod, Km, Câmbio, Combustível, opcionais (ar, teto solar) e laudo cautelar. | Cadastra veículos com tabela FIPE de referência, fotos 360º e dados de procedência/revisão. | Cruza denúncias de veículos clonados, sinistrados ou com alerta de roubo/furto com autoridades. |
| **Negociação & Proposta P2P** | Envia contraproposta de valor ou propõe veículo usado na troca com dados completos do seminovo. | Avalia propostas de troca no chat integrado, agenda test-drive e formaliza intenção de compra. | Registra a trilha de conversas e propostas para evitar golpes de falso intermediário ou falso sinal. |

---

## 5. ✂️ DOMÍNIO: SERVIÇOS ESPECIALIZADOS, SAÚDE & BARBEARIAS

| Dimensão | 👤 Consumidor (User) | 🏪 Lojista / Operador (Merchant) | 👑 Admin Master Global (Master) |
| :--- | :--- | :--- | :--- |
| **Agendamento Inteligente** | Seleciona serviços múltiplos (ex: *Corte + Barba* = 50 min), escolhe o profissional e a data no calendário. | Define horários de atendimento da equipe, duração de cada procedimento, comissões e bloqueios de intervalo. | Audita profissionais para garantir que áreas regulamentadas (medicina, odontologia) tenham registro ativo. |
| **Ficha de Atendimento & Retorno** | Recebe lembrete de horário por WhatsApp/Notificação e visualiza histórico de procedimentos. | Registra prontuário/ficha técnica interna do cliente (ex: numeração de tintura, preferências de corte). | Garante conformidade LGPD estrita sobre dados sensíveis de saúde e prontuários armazenados. |

---

## 6. 📦 DOMÍNIO: LOGÍSTICA URBANA, FROTAS & BALCÃO PUDO

| Dimensão | 👤 Consumidor (User) | 🏪 Lojista / Operador (Merchant) | 👑 Admin Master Global (Master) |
| :--- | :--- | :--- | :--- |
| **Ponto de Retirada (PUDO)** | Escolhe retirar pacote na loja parceira do bairro com horário estendido e recebe PIN de 4 dígitos. | Opera o balcão PUDO (`workspace.logistica.pudo`), bipa pacotes recebidos e entrega somente mediante validação do PIN. | Monitora taxa de permanência de volumes nos pontos e concilia comissão do parceiro por volume entregue. |
| **Logística Reversa & Avarias** | Devolve itens avariados no ponto PUDO mais próximo sem custo de frete. | Realiza checklist físico de danos na entrada da devolução (foto da caixa, lacre violado) antes de estornar. | Interfere em casos de extravio ou divergência entre a foto da devolução e o relato do comprador. |

---

## 7. 🚘 DOMÍNIO: MOBILIDADE URBANA & CORRIDAS REGIONAIS

| Dimensão | 👤 Consumidor (User) | 🏪 Lojista / Operador (Merchant/Motorista) | 👑 Admin Master Global (Master) |
| :--- | :--- | :--- | :--- |
| **Solicitação no Mapa** | Define partida e destino no MapLibre GL, escolhe categoria (*Carro*, *Moto*, *Frete*, *Mudança*) e vê preço fixo. | Motorista recebe corrida no cockpit (`_store.motorista`), visualiza trajeto, valor líquido e aceita/rejeita. | Rastreia a frota ativa no mapa global da cidade e monitora tempo de resposta e cancelamentos. |
| **Corrida & Segurança** | Embarca fornecendo PIN de segurança de 4 dígitos, compartilha rota ao vivo com familiares e avalia o motorista. | Valida o PIN no app para iniciar a viagem, segue rota com GPS integrado e finaliza a corrida com recebimento. | Dossiê Judicial Forense grava telemetria GPS completa (lat/lng, timestamps, velocidade) para perícias judiciais. |

---

## 8. 🧭 DOMÍNIO: TURISMO, HOSPEDAGENS & EXPERIÊNCIAS

| Dimensão | 👤 Consumidor (User) | 🏪 Lojista / Operador (Merchant) | 👑 Admin Master Global (Master) |
| :--- | :--- | :--- | :--- |
| **Reserva de Passeio/Estadia** | Seleciona data, número de adultos e crianças, opcionais inclusos (almoço colonial, transporte) e solicita reserva. | Recebe solicitações de reserva com dados de contato, confirma disponibilidade e gere grade de lotação. | Audita estabelecimentos turísticos e certifica selos de hospitalidade segura e sustentável. |

---

## 9. 🎟️ DOMÍNIO: EVENTOS, INGRESSOS & PORTARIA INTELIGENTE

| Dimensão | 👤 Consumidor (User) | 🏪 Lojista / Operador (Merchant) | 👑 Admin Master Global (Master) |
| :--- | :--- | :--- | :--- |
| **Compra & Emissão** | Compra ingressos por lote (*1º Lote*, *VIP*, *Meia-Entrada*), recebe ingresso com QR Code criptográfico dinâmico. | Cria eventos, programa virada automática de lotes por data ou quantidade de vendas e acompanha faturamento. | Intermedeia estornos de ingressos em caso de cancelamento oficial do evento ou mudança de data/local. |
| **Check-in na Portaria** | Apresenta QR Code na entrada do evento para leitura rápida pelo staff. | Scanner de portaria (`workspace.eventos.$id.checkin`) valida código, impede reutilização fraudulenta e mostra nome. | Registra log de acesso em tempo real com timestamp de entrada para controle de capacidade do recinto. |

---

## 10. 💼 DOMÍNIO: ATS, RECRUTAMENTO & VAGAS DE EMPREGO

| Dimensão | 👤 Consumidor (User) | 🏪 Lojista / Operador (Merchant) | 👑 Admin Master Global (Master) |
| :--- | :--- | :--- | :--- |
| **Candidatura Profissional** | Navega por vagas locais, filtra por bairro/remuneração, anexa currículo e envia carta de apresentação. | Publica vagas de emprego com regime (CLT/PJ), salário e benefícios. Gerencia candidatos em pipeline Kanban. | Fiscaliza vagas falsas ou anúncios discriminatórios (idade, gênero, etnia), banindo fraudadores. |
| **Entrevistas & Contratação** | Recebe convite para entrevista com data e link de sala de videoconferência (Meet/Jitsi) integrada. | Avalia candidatos de 1 a 5 estrelas, agenda entrevistas online pelo sistema e formaliza contratação. | Registra trilha de processos seletivos para auditoria de compliance trabalhista e privacidade de currículos. |

---

## 11. 🏷️ DOMÍNIO: CLASSIFICADOS P2P & DESAPEGOS

| Dimensão | 👤 Consumidor (User) | 🏪 Lojista / Operador (Merchant/Anunciante) | 👑 Admin Master Global (Master) |
| :--- | :--- | :--- | :--- |
| **Desapego Comunitário** | Anuncia produtos usados com fotos, preço e localização; conversa com compradores via WhatsApp direto. | Atualiza status do anúncio (*Ativo*, *Pausado*, *Vendido*), responde contrapropostas e edita dados. | Modera anúncios impróprios, produtos proibidos por lei ou tentativas de golpe na comunidade. |

---

## 12. 📰 DOMÍNIO: FEED SOCIAL, ZINES, NOTÍCIAS & TELEMETRIA

| Dimensão | 👤 Consumidor (User) | 🏪 Lojista / Operador (Merchant/Jornal) | 👑 Admin Master Global (Master) |
| :--- | :--- | :--- | :--- |
| **Consumo Cultural & Stories** | Assiste stories autênticos das últimas 24h (zero mocks), lê matérias com scroll dinâmico e interage. | Publica matérias jornalísticas, flyers de lançamentos culturais e vincula patrocinadores às matérias. | Modera publicações por fake news ou difamação; audita métricas de telemetria (CTR, scroll depth, impressões). |

---

## 🛡️ MATRIZ DE GOVERNANÇA GLOBAL MASTER (O PAPEL CENTRAL DO MASTER)

| Pilar de Governança | Capacidade Operacional Master | Ferramenta / Contrato Vinculante |
| :--- | :--- | :--- |
| **1. Trust & Safety** | Moderação de denúncias com 4 ações: Remover Conteúdo, Advertir Autor, Banir Usuário, Dispensar. | [`admin-master.denuncias.tsx`](file:///c:/Users/Excelência Tour SMO/Documents/jah/src/routes/admin-master.denuncias.tsx) / `resolveModerationReport` |
| **2. Sanções Granulares** | Punições parciais por tipo de ação (`mute_comments`, `block_posts`, `block_classifieds`, `block_commerce`). | [`admin-master.usuarios.tsx`](file:///c:/Users/Excelência Tour SMO/Documents/jah/src/routes/admin-master.usuarios.tsx) / `applyUserSanction` |
| **3. KYC & Verificação Facial** | Comparação visual de selfie com documento oficial e concessão de selo verificado. | [`admin-master.kyc.tsx`](file:///c:/Users/Excelência Tour SMO/Documents/jah/src/routes/admin-master.kyc.tsx) / `reviewKycVerification` |
| **4. Dossiê Judicial 360º** | Snapshot probatório completo de tudo que o usuário fez com certificação criptográfica SHA-256. | `getUser360Dossier` em [`master.functions.ts`](file:///c:/Users/Excelência Tour SMO/Documents/jah/src/services/master.functions.ts) |
| **5. Intervenção em Empresas** | Bloqueio imediato de checkout, ocultação de catálogo e congelamento de repasses de lojas infratoras. | `toggleStoreStatus` com registro em `forensic_audit_events` |
| **6. Vault de Consentimento LGPD** | Log forense de todos os aceites de termos com IP, User-Agent, Session ID e versão das políticas. | Tabela `legal_terms_acceptances` e verificação no perfil |
