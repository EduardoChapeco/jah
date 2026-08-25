import { createServerFn } from "@tanstack/react-start";
import { getServerClient, SupabaseUnconfiguredError } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";

export type OnboardingStepStatus =
  "unconfigured" | "partially_configured" | "completed" | "locked" | "technical_error";

export interface OnboardingStep {
  id: string;
  category: "fundamentos" | "catalogo" | "vendas" | "divulgacao";
  label: string;
  description: string;
  status: OnboardingStepStatus;
  targetRoute: string;
  details?: string;
}

export interface OnboardingOverview {
  steps: OnboardingStep[];
  totalSteps: number;
  completedSteps: number;
  partiallyConfiguredSteps: number;
  progressPercentage: number;
  isStoreReadyToSell: boolean;
}

export async function _getOnboardingStatus(): Promise<OnboardingOverview> {
  const identity = await getServerIdentity();
  assertStoreAccess(identity, [
    "owner",
    "admin",
    "manager",
    "seller",
    "finance",
    "stock",
    "content",
    "support",
  ]);

  const db = getServerClient();
  const storeId = identity.store_id;

  // Safe individual queries to catch technical errors per query without failing everything
  const fetchStore = async () => {
    try {
      const { data, error } = await db
        .from("stores")
        .select(
          "id, name, email, phone, cnpj, address, city, state, zip_code, logo_url, policies, seo_title, seo_description, pix_key, settings",
        )
        .eq("id", storeId)
        .single();

      const { data: theme } = await db
        .from("theme_settings")
        .select("logo_url, favicon_url")
        .eq("store_id", storeId)
        .maybeSingle();

      if (error)
        return {
          status: "error" as const,
          error: error instanceof Error ? error.message : String(error),
        };
      return { status: "ok" as const, data: { ...data, theme_settings: theme } };
    } catch (e: unknown) {
      return {
        status: "error" as const,
        error: (e instanceof Error ? e.message : String(e)) || "Erro de banco",
      };
    }
  };

  const fetchCount = async (table: string, filterColumn?: string, filterValue?: unknown) => {
    try {
      let query = db
        .from(table)
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId);
      if (filterColumn && filterValue !== undefined) {
        query = query.eq(filterColumn, filterValue);
      }
      const { count, error } = await query;
      if (error)
        return {
          status: "error" as const,
          error: error instanceof Error ? error.message : String(error),
        };
      return { status: "ok" as const, count: count ?? 0 };
    } catch (e: unknown) {
      const err = e as Error;
      return { status: "error" as const, error: err?.message || "Erro inesperado" };
    }
  };

  const fetchStockVariants = async () => {
    try {
      const { count, error } = await db
        .from("product_variants")
        .select("id, products!inner(store_id)", { count: "exact", head: true })
        .eq("products.store_id", storeId)
        .gt("stock_on_hand", 0);
      if (error)
        return {
          status: "error" as const,
          error: error instanceof Error ? error.message : String(error),
        };
      return { status: "ok" as const, count: count ?? 0 };
    } catch (e: unknown) {
      const err = e as Error;
      return { status: "error" as const, error: err?.message || "Erro inesperado" };
    }
  };

  const [storeRes, shippingRes, categoriesRes, productsRes, stockRes, ordersRes, couponsRes] =
    await Promise.all([
      fetchStore(),
      fetchCount("shipping_rates"),
      fetchCount("categories"),
      fetchCount("products"),
      fetchStockVariants(),
      fetchCount("orders"),
      fetchCount("coupons"),
    ]);

  const steps: OnboardingStep[] = [];

  // 1. Perfil da Loja
  if (storeRes.status === "error") {
    steps.push({
      id: "profile",
      category: "fundamentos",
      label: "Perfil e Dados da Loja",
      description: "Nome, telefone e e-mail de contato comercial da empresa.",
      status: "technical_error",
      targetRoute: "/admin/configuracoes/loja",
      details: storeRes.error,
    });
  } else {
    const s = storeRes.data;
    const hasName = Boolean(s?.name && s.name !== "Nova Loja");
    const hasContact = Boolean(s?.phone || s?.email || s?.address || s?.cnpj);

    let status: OnboardingStepStatus = "unconfigured";
    if (hasName && hasContact) status = "completed";
    else if (hasName || hasContact) status = "partially_configured";

    steps.push({
      id: "profile",
      category: "fundamentos",
      label: "Perfil e Dados da Loja",
      description: "Nome, telefone e e-mail de contato comercial da empresa.",
      status,
      targetRoute: "/admin/configuracoes/loja",
      details: status === "completed" ? "Perfil completo" : "Pendente complemento de dados",
    });
  }

  // 2. Logo da Loja
  if (storeRes.status === "error") {
    steps.push({
      id: "logo",
      category: "fundamentos",
      label: "Logotipo da Loja",
      description: "Identidade visual da marca para o cabeçalho e recibos.",
      status: "technical_error",
      targetRoute: "/admin/configuracoes/loja",
    });
  } else {
    const s = storeRes.data;
    const hasLogo = Boolean(
      s?.logo_url ||
      s?.settings?.logoUrl ||
      s?.settings?.logo_url ||
      s?.settings?.faviconUrl ||
      s?.theme_settings?.logo_url ||
      s?.theme_settings?.favicon_url,
    );
    steps.push({
      id: "logo",
      category: "fundamentos",
      label: "Logotipo da Loja",
      description: "Identidade visual da marca para o cabeçalho e recibos.",
      status: hasLogo ? "completed" : "unconfigured",
      targetRoute: "/admin/configuracoes/loja",
      details: hasLogo ? "Logotipo ou ícone cadastrados" : "Envie a imagem da sua marca",
    });
  }

  // 3. Endereço
  if (storeRes.status === "error") {
    steps.push({
      id: "address",
      category: "fundamentos",
      label: "Endereço Físico ou Sede",
      description: "Endereço de saída dos fretes e atendimento.",
      status: "technical_error",
      targetRoute: "/admin/configuracoes/loja",
    });
  } else {
    const s = storeRes.data;
    const hasStreet = Boolean(s?.address);
    const hasCityState = Boolean(s?.city && s?.state);

    let status: OnboardingStepStatus = "unconfigured";
    if (hasStreet && hasCityState) status = "completed";
    else if (hasStreet || hasCityState) status = "partially_configured";

    steps.push({
      id: "address",
      category: "fundamentos",
      label: "Endereço Físico ou Sede",
      description: "Endereço de saída dos fretes e atendimento.",
      status,
      targetRoute: "/admin/configuracoes/loja",
      details: status === "completed" ? "Endereço completo" : "Informe o endereço da loja",
    });
  }

  // 4. Pagamentos
  if (storeRes.status === "error") {
    steps.push({
      id: "payment",
      category: "fundamentos",
      label: "Formas de Pagamento",
      description: "Configuração de chave Pix manual e métodos de cobrança.",
      status: "technical_error",
      targetRoute: "/admin/configuracoes/pagamentos",
    });
  } else {
    const isPixEnabled = Boolean(storeRes.data?.pix_key);
    steps.push({
      id: "payment",
      category: "fundamentos",
      label: "Formas de Pagamento",
      description: "Configuração de chave Pix manual e métodos de cobrança.",
      status: isPixEnabled ? "completed" : "unconfigured",
      targetRoute: "/admin/configuracoes/pagamentos",
      details: isPixEnabled ? "Pix ativado" : "Ative o Pix para receber pagamentos",
    });
  }

  // 5. Frete e Envio
  if (shippingRes.status === "error") {
    steps.push({
      id: "shipping",
      category: "fundamentos",
      label: "Tabelas de Frete e Entrega",
      description: "Opções de envio por região ou retirada presencial.",
      status: "technical_error",
      targetRoute: "/admin/fretes/tabelas",
    });
  } else {
    const count = shippingRes.count;
    steps.push({
      id: "shipping",
      category: "fundamentos",
      label: "Tabelas de Frete e Entrega",
      description: "Opções de envio por região ou retirada presencial.",
      status: count > 0 ? "completed" : "unconfigured",
      targetRoute: "/admin/fretes/tabelas",
      details: count > 0 ? `${count} tabela(s) ativa(s)` : "Cadastre uma taxa de entrega",
    });
  }

  // 6. Categorias
  if (categoriesRes.status === "error") {
    steps.push({
      id: "categories",
      category: "catalogo",
      label: "Categorias de Produtos",
      description: "Organização do catálogo por seções e departamentos.",
      status: "technical_error",
      targetRoute: "/admin/catalogo/categorias",
    });
  } else {
    const count = categoriesRes.count;
    steps.push({
      id: "categories",
      category: "catalogo",
      label: "Categorias de Produtos",
      description: "Organização do catálogo por seções e departamentos.",
      status: count > 0 ? "completed" : "unconfigured",
      targetRoute: "/admin/catalogo/categorias",
      details: count > 0 ? `${count} categoria(s) cadastrada(s)` : "Crie a primeira categoria",
    });
  }

  // 7. Primeiro Produto
  if (productsRes.status === "error") {
    steps.push({
      id: "first_product",
      category: "catalogo",
      label: "Cadastro do Primeiro Produto",
      description: "Inclusão de produto com título, preço e fotos na vitrine.",
      status: "technical_error",
      targetRoute: "/admin/catalogo/produtos/novo",
    });
  } else {
    const count = productsRes.count;
    steps.push({
      id: "first_product",
      category: "catalogo",
      label: "Cadastro do Primeiro Produto",
      description: "Inclusão de produto com título, preço e fotos na vitrine.",
      status: count > 0 ? "completed" : "unconfigured",
      targetRoute: "/admin/catalogo/produtos/novo",
      details: count > 0 ? `${count} produto(s) no catálogo` : "Adicione seu primeiro produto",
    });
  }

  // 8. Estoque
  if (stockRes.status === "error") {
    steps.push({
      id: "stock",
      category: "catalogo",
      label: "Estoque Inicial por Variação",
      description: "Disponibilização de saldo para venda por tamanho/cor.",
      status: "technical_error",
      targetRoute: "/admin/estoque",
    });
  } else {
    const count = stockRes.count;
    const hasProducts = productsRes.status === "ok" && productsRes.count > 0;
    let status: OnboardingStepStatus = "unconfigured";
    if (count > 0) status = "completed";
    else if (!hasProducts) status = "locked";

    steps.push({
      id: "stock",
      category: "catalogo",
      label: "Estoque Inicial por Variação",
      description: "Disponibilização de saldo para venda por tamanho/cor.",
      status,
      targetRoute: "/admin/estoque",
      details:
        status === "locked"
          ? "Cadastre um produto antes"
          : status === "completed"
            ? `${count} variação(ões) com saldo`
            : "Adicione estoque",
    });
  }

  // 9. Políticas
  if (storeRes.status === "error") {
    steps.push({
      id: "policies",
      category: "fundamentos",
      label: "Políticas da Loja",
      description: "Termos de trocas, devoluções e privacidade.",
      status: "technical_error",
      targetRoute: "/admin/configuracoes/politicas",
    });
  } else {
    const p = storeRes.data?.policies as any;
    const hasReturns = Boolean(p?.returns || p?.terms);

    steps.push({
      id: "policies",
      category: "fundamentos",
      label: "Políticas da Loja",
      description: "Termos de trocas, devoluções e privacidade.",
      status: hasReturns ? "completed" : "unconfigured",
      targetRoute: "/admin/configuracoes/politicas",
      details: hasReturns ? "Políticas configuradas" : "Defina as regras de troca",
    });
  }

  // 10. SEO
  if (storeRes.status === "error") {
    steps.push({
      id: "seo",
      category: "divulgacao",
      label: "SEO e Indexação no Google",
      description: "Título e descrição para compartilhamento social e buscadores.",
      status: "technical_error",
      targetRoute: "/admin/configuracoes/seo",
    });
  } else {
    const s = storeRes.data;
    const hasTitle = Boolean(s?.seo_title);
    const hasDesc = Boolean(s?.seo_description);

    let status: OnboardingStepStatus = "unconfigured";
    if (hasTitle && hasDesc) status = "completed";
    else if (hasTitle || hasDesc) status = "partially_configured";

    steps.push({
      id: "seo",
      category: "divulgacao",
      label: "SEO e Indexação no Google",
      description: "Título e descrição para compartilhamento social e buscadores.",
      status,
      targetRoute: "/admin/configuracoes/seo",
      details: status === "completed" ? "Metadados configurados" : "Configure as tags SEO",
    });
  }

  // 11. Primeiro Pedido
  if (ordersRes.status === "error") {
    steps.push({
      id: "first_order",
      category: "vendas",
      label: "Primeiro Pedido Realizado",
      description: "Primeira venda efetuada no e-commerce ou no PDV.",
      status: "technical_error",
      targetRoute: "/admin/pedidos",
    });
  } else {
    const count = ordersRes.count;
    const isReadyToSell =
      productsRes.status === "ok" &&
      productsRes.count > 0 &&
      storeRes.status === "ok" &&
      Boolean(storeRes.data?.pix_key);

    let status: OnboardingStepStatus = "unconfigured";
    if (count > 0) status = "completed";
    else if (!isReadyToSell) status = "locked";

    steps.push({
      id: "first_order",
      category: "vendas",
      label: "Primeiro Pedido Realizado",
      description: "Primeira venda efetuada no e-commerce ou no PDV.",
      status,
      targetRoute: "/admin/pedidos",
      details:
        status === "locked"
          ? "Configure produto e pagamento antes"
          : status === "completed"
            ? `${count} pedido(s) recebido(s)`
            : "Aguardando primeira venda",
    });
  }

  // 12. Primeira Campanha / Cupom
  if (couponsRes.status === "error") {
    steps.push({
      id: "first_campaign",
      category: "divulgacao",
      label: "Cupom de Desconto Inicial",
      description: "Criação de cupom para atrair as primeiras clientes.",
      status: "technical_error",
      targetRoute: "/admin/marketing/cupons",
    });
  } else {
    const count = couponsRes.count;
    steps.push({
      id: "first_campaign",
      category: "divulgacao",
      label: "Cupom de Desconto Inicial",
      description: "Criação de cupom para atrair as primeiras clientes.",
      status: count > 0 ? "completed" : "unconfigured",
      targetRoute: "/admin/marketing/cupons",
      details: count > 0 ? `${count} cupom(ns) ativo(s)` : "Crie um cupom de boas-vindas",
    });
  }

  const totalSteps = steps.length;
  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const partiallyConfiguredSteps = steps.filter((s) => s.status === "partially_configured").length;
  const progressPercentage = Math.round(
    ((completedSteps + partiallyConfiguredSteps * 0.5) / totalSteps) * 100,
  );

  const hasProduct = steps.find((s) => s.id === "first_product")?.status === "completed";
  const hasPayment = steps.find((s) => s.id === "payment")?.status === "completed";
  const isStoreReadyToSell = Boolean(hasProduct && hasPayment);

  return {
    steps,
    totalSteps,
    completedSteps,
    partiallyConfiguredSteps,
    progressPercentage,
    isStoreReadyToSell,
  };
}

export const getOnboardingStatus = createServerFn({ method: "GET" }).handler(async () => {
  const data = await _getOnboardingStatus();
  return data;
});

import { z } from "zod";
import { getSSRClient } from "@/lib/supabase-ssr.server";

function generateSlug(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

const ProvisionBusinessSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  type: z.string().optional(),
  document: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  workingHours: z.record(z.any()).optional(),
  deliveryZones: z.array(z.any()).optional(),
  complianceDocuments: z.array(z.any()).optional(),
});

export const provisionBusiness = createServerFn({ method: "POST" })
  .validator(ProvisionBusinessSchema)
  .handler(async ({ data }) => {
    const ssrClient = await getSSRClient();
    const {
      data: { user },
    } = await ssrClient.auth.getUser();
    if (!user) throw new Error("Não autorizado");

    const db = getServerClient(); // Bypass RLS para provisionamento

    // 0. Garantir existência de profile no banco
    await db.from("profiles").upsert({
      id: user.id,
      full_name: user.user_metadata?.full_name || data.name,
      role: "owner",
    });

    // 1. Criar Organização
    const orgSlug = generateSlug(data.name) + "-" + Math.floor(1000 + Math.random() * 9000);
    const { data: org, error: orgError } = await db
      .from("organizations")
      .insert({ name: data.name, slug: orgSlug })
      .select("id")
      .single();
    if (orgError) throw new Error("Erro ao criar organização: " + orgError.message);

    // 2. Montar objeto settings estruturado e persistido com type, logoUrl e configurações
    const settings: Record<string, any> = {
      type: data.type || "ecommerce",
      logoUrl: data.logoUrl || null,
      bannerUrl: data.bannerUrl || null,
      working_hours: data.workingHours || null,
      delivery_zones: data.deliveryZones || [],
      compliance_documents: data.complianceDocuments || [],
    };

    // 3. Criar Loja com colunas canônicas seguras
    const storePayload: Record<string, any> = {
      organization_id: org.id,
      name: data.name,
      slug: orgSlug,
      cnpj: data.document || null,
      city: data.city || "Chapecó",
      state: data.state || "SC",
      address: data.address || null,
      phone: data.phone || null,
      email: data.email || null,
      settings,
    };

    const { data: store, error: storeError } = await db
      .from("stores")
      .insert(storePayload)
      .select("id")
      .single();
    if (storeError) throw new Error("Erro ao criar loja: " + storeError.message);

    // 4. Vincular Usuário como Owner
    const { error: memberError } = await db.from("workspace_members").upsert({
      profile_id: user.id,
      store_id: store.id,
      role: "owner",
    });
    if (memberError) throw new Error("Erro ao vincular membro: " + memberError.message);

    // 5. Vincular theme_settings se logo ou banner presentes
    if (data.logoUrl || data.bannerUrl) {
      try {
        await db.from("theme_settings").upsert({
          store_id: store.id,
          logo_url: data.logoUrl || null,
          banner_url: data.bannerUrl || null,
        });
      } catch {
        // Ignora caso theme_settings não exista estruturalmente
      }
    }

    return { status: "success" as const, storeId: store.id };
  });
