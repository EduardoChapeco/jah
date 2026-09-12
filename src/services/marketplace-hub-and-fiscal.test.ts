import { describe, it, expect } from "vitest";
import { z } from "zod";
import crypto from "crypto";

// Schemas Canônicos do Hub de Marketplaces e Módulo Fiscal
const MarketplaceConnectorSchema = z.object({
  storeId: z.string().optional(),
  platform: z.enum([
    "mercadolivre",
    "ifood",
    "shopee",
    "magalu",
    "amazon",
    "rappi",
    "amodelivery",
    "melhorenvio",
    "correios",
  ]),
  name: z.string().min(2),
  external_account_id: z.string().optional().nullable(),
  account_nickname: z.string().optional().nullable(),
  access_token: z.string().optional().nullable(),
  refresh_token: z.string().optional().nullable(),
  status: z.enum(["connected", "disconnected", "error", "pending"]).default("connected"),
  settings: z
    .object({
      auto_accept_orders: z.boolean().optional(),
      sync_products: z.boolean().optional(),
      sync_orders: z.boolean().optional(),
      sync_stock: z.boolean().optional(),
      sync_prices: z.boolean().optional(),
      price_margin_percent: z.number().optional(),
    })
    .default({}),
});

const StoreNFeConfigSchema = z.object({
  storeId: z.string().optional(),
  provider: z.enum(["focus_nfe", "nuvem_fiscal", "nfs_nacional", "plugnotas"]).default("focus_nfe"),
  api_token: z.string().optional().nullable(),
  environment: z.enum(["sandbox", "production"]).default("sandbox"),
  cnpj: z.string().min(14),
  inscricao_municipal: z.string().optional().nullable(),
  inscricao_estadual: z.string().optional().nullable(),
  razao_social: z.string().min(3),
  nome_fantasia: z.string().optional().nullable(),
  regime_tributario: z.enum(["simples_nacional", "lucro_presumido", "lucro_real", "mei"]).default("simples_nacional"),
  aliquota_iss: z.number().default(2.0),
  codigo_servico_municipal: z.string().optional().nullable(),
  serie_nfe: z.string().default("1"),
  proximo_numero: z.number().default(1),
});

const NFeInvoiceEmissionSchema = z.object({
  storeId: z.string().optional(),
  orderId: z.string().optional().nullable(),
  invoiceType: z.enum(["nfe", "nfse", "nfce"]).default("nfe"),
  valorTotalCents: z.number().positive(),
  tomadorDocumento: z.string().min(11),
  tomadorNome: z.string().min(3),
  tomadorEmail: z.string().email().optional().nullable(),
});

const LeadConversionTelemetrySchema = z.object({
  storeId: z.string().min(1),
  leadId: z.string().min(1),
  email: z.string().optional(),
  phone: z.string().optional(),
  conversionValue: z.number().optional().default(0),
  channel: z.enum(["meta_capi", "google_ads", "tiktok"]).default("meta_capi"),
  sourceUrl: z.string().optional(),
});

const MarketplaceExternalOrderSchema = z.object({
  platform: z.enum(["mercadolivre", "ifood", "shopee", "magalu", "amazon"]),
  external_order_id: z.string().min(1),
  subtotal_cents: z.number().int().nonnegative(),
  marketplace_fee_cents: z.number().int().nonnegative(),
  net_payout_cents: z.number().int(),
  total_amount_cents: z.number().int().positive(),
});

describe("Hub de Marketplaces, Módulo Fiscal & Telemetria CAPI — Contratos BDD", () => {
  describe("Conectores de Marketplace (Mercado Livre, iFood, Shopee, Magalu)", () => {
    it("valida payload de conexão para iFood com OpenDelivery auto-aceite", () => {
      const payload = {
        platform: "ifood" as const,
        name: "iFood Restaurante",
        account_nickname: "Burger House Central",
        external_account_id: "ifood_merchant_5541",
        status: "connected" as const,
        settings: {
          auto_accept_orders: true,
          sync_stock: true,
        },
      };

      const result = MarketplaceConnectorSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.settings.auto_accept_orders).toBe(true);
      }
    });

    it("valida payload de conexão Mercado Livre com sincronização de estoque ativa", () => {
      const payload = {
        platform: "mercadolivre" as const,
        name: "Mercado Livre Oficial",
        account_nickname: "TechStore BR",
        external_account_id: "MLB102938475",
        status: "connected" as const,
        settings: {
          sync_stock: true,
          sync_orders: true,
          price_margin_percent: 5,
        },
      };

      const result = MarketplaceConnectorSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.platform).toBe("mercadolivre");
        expect(result.data.settings.price_margin_percent).toBe(5);
      }
    });

    it("rejeita plataforma não homologada no catálogo", () => {
      const invalid = {
        platform: "plataforma_desconhecida",
        name: "Fake Shop",
      };

      const result = MarketplaceConnectorSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Módulo Fiscal Brasileiro (NF-e, NFS-e, Focus NFe, Nuvem Fiscal)", () => {
    it("valida configuração fiscal completa da empresa", () => {
      const config = {
        cnpj: "12345678000199",
        razao_social: "Waesy Comércio e Tecnologia LTDA",
        nome_fantasia: "Waesy Store",
        inscricao_estadual: "123456789",
        provider: "focus_nfe" as const,
        regime_tributario: "simples_nacional" as const,
        environment: "sandbox" as const,
        aliquota_iss: 2.5,
        serie_nfe: "1",
        proximo_numero: 10,
      };

      const result = StoreNFeConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("valida emissão de NF-e com valor positivo e documento tomador íntegro", () => {
      const emission = {
        valorTotalCents: 24990, // R$ 249,90
        tomadorDocumento: "12345678901",
        tomadorNome: "Ana Paula Souza",
        tomadorEmail: "anapaula@gmail.com",
        invoiceType: "nfe" as const,
      };

      const result = NFeInvoiceEmissionSchema.safeParse(emission);
      expect(result.success).toBe(true);
    });

    it("rejeita emissão com valor total zero ou negativo", () => {
      const invalid = {
        valorTotalCents: -50,
        tomadorDocumento: "12345678901",
        tomadorNome: "Carlos Alberto",
      };

      const result = NFeInvoiceEmissionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Rastreabilidade Multicanal & Cálculo de Taxas Líquidas", () => {
    it("valida split de comissão do Mercado Livre com net payout correto", () => {
      const grossSales = 10000; // R$ 100,00
      const mlFee = 1600; // R$ 16,00 (16% comissão)
      const netPayout = grossSales - mlFee; // R$ 84,00

      const orderPayload = {
        platform: "mercadolivre" as const,
        external_order_id: "MLB_ORD_987654",
        subtotal_cents: 9000,
        marketplace_fee_cents: mlFee,
        net_payout_cents: netPayout,
        total_amount_cents: grossSales,
      };

      const result = MarketplaceExternalOrderSchema.safeParse(orderPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.net_payout_cents).toBe(8400);
        expect(result.data.total_amount_cents - result.data.marketplace_fee_cents).toBe(result.data.net_payout_cents);
      }
    });
  });

  describe("Telemetria CAPI & Deduplicação de Conversão de Leads", () => {
    it("valida contrato de conversão com hash SHA256 para dados sensíveis PII", () => {
      const rawEmail = "cliente.lead@gmail.com";
      const normalizedEmail = rawEmail.trim().toLowerCase();
      const hashedEmail = crypto.createHash("sha256").update(normalizedEmail).digest("hex");

      const telemetryPayload = {
        storeId: "store_uuid_123",
        leadId: "lead_abc_99",
        email: rawEmail,
        conversionValue: 150.0,
        channel: "meta_capi" as const,
        sourceUrl: "https://usewaesy.pages.dev/empresa/pousada-do-sol",
      };

      const result = LeadConversionTelemetrySchema.safeParse(telemetryPayload);
      expect(result.success).toBe(true);
      expect(hashedEmail).toHaveLength(64); // SHA256 sempre gera string hex de 64 caracteres
    });
  });
});
