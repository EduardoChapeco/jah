---
name: dynamic-surge-pricing
description: "Motor de Inteligência de Preços Dinâmicos, Demanda Urbana, Multiplicadores de Clima (Chuva) e Gestão Autônoma de Tarifas para Entregadores (MotoLink) e Lojas."
---

# Dynamic Surge Pricing & MotoLink Demand Intelligence

> **Missão:** Capacitar motoristas/motoboys e estabelecimentos com ferramentas inteligentes de precificação dinâmica, permitindo ajuste automático de tarifas por clima, horário de pico e volume de pedidos, monetizado através da queima de micro-tokens de infraestrutura.

---

## ⚡ 1. Sinais de Precificação Dinâmica (Surge Pricing Signals)

A tarifa de entrega ou cotação dinâmica é calculada por:

$$\text{Tarifa Final} = \max(\text{Tarifa Base}, \text{Tarifa Mínima}) \times M_{\text{clima}} \times M_{\text{pico}} \times M_{\text{distância}} + \text{Adicional Noturno}$$

### Sinais Monitorados:
1. **Fator Clima ($M_{\text{clima}}$):**
   - Dias de chuva intensa ou tempestade aplicam multiplicador configurável (ex: $+30\%$ a $+50\%$).
2. **Fator Pico / Demanda Urbana ($M_{\text{pico}}$):**
   - Horários de pico gastronômico (11:30–14:00 e 19:00–22:30) ou quando o volume de pedidos ativos supera o número de entregadores online.
3. **Autonomia do Entregador (MotoLink Driver Control):**
   - O motoboy pode ativar seu próprio multiplicador de conveniência ou definir sua tarifa mínima por corrida (ex: mínimo R$ 10,00).
4. **Governança do Lojista:**
   - A loja pode escolher subsidiar parte do surge pricing ou repassar ao consumidor com transparência.

---

## 🪙 2. Monetização via Micro-Tokens

O processamento contínuo de telemetria de demanda e cotação preditiva consome **10 a 50 micro-tokens de infraestrutura** por cotação, garantindo sustentabilidade econômica para a plataforma.
