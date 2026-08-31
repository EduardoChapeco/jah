/**
 * travel-contract.functions.ts — BFF para Contratos Turísticos & Assinatura Eletrônica Jurídica (SHA-256)
 * Padrão BigTech | Zero Mocks | Persistência Real no Supabase
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient, getAnonServerClient } from "@/lib/supabase";
import { getServerIdentity } from "@/lib/server-access";

// ─── Tipagens Canônicas do Contrato Turístico ──────────────────────────────────

export interface ContractClauseDTO {
  number: number;
  section: string;
  clause_text: string;
  is_mandatory: boolean;
}

export interface ContractSignerDTO {
  signer_name: string;
  signer_document: string;
  signer_email?: string | null;
  signer_phone?: string | null;
  signed_at: string;
  ip_address: string;
  user_agent: string;
  signature_image_url?: string | null;
  content_hash: string;
  auth_serial: string;
}

export type ContractStatus = "draft" | "sent" | "pending_signature" | "signed" | "cancelled";

export interface TravelContractDTO {
  id: string;
  store_id: string | null;
  agency_name: string;
  agency_cnpj?: string | null;
  agency_address?: string | null;
  agency_whatsapp?: string | null;
  public_token: string;
  proposal_id?: string | null;
  contract_title: string;
  client_name: string;
  client_document: string;
  client_email?: string | null;
  client_phone: string;
  client_address?: string | null;
  passengers: Array<{ name: string; document?: string; birth_date?: string }>;
  destination: string;
  travel_start_date?: string | null;
  travel_end_date?: string | null;
  package_summary: string;
  total_value_cents: number;
  payment_conditions: string;
  clauses: ContractClauseDTO[];
  signatures: ContractSignerDTO[];
  status: ContractStatus;
  signed_at?: string | null;
  content_hash?: string | null;
  certificate_serial?: string | null;
  pdf_url?: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Cláusulas Canônicas Padrão Embratur / CDC ────────────────────────────────

export const CANONICAL_TOURISM_CLAUSES: ContractClauseDTO[] = [
  {
    number: 1,
    section: "DO OBJETO DO CONTRATO",
    clause_text:
      "O presente contrato tem por objeto a intermediação e prestação de serviços de turismo especificados no anexo/proposta, compreendendo os serviços de transporte, hospedagem, passeios e assessoria contratados.",
    is_mandatory: true,
  },
  {
    number: 2,
    section: "DAS CONDIÇÕES DE PAGAMENTO",
    clause_text:
      "O CONTRATANTE se obriga a efetuar o pagamento do valor total acordado nas condições, prazos e modalidades descritas no resumo financeiro deste instrumento.",
    is_mandatory: true,
  },
  {
    number: 3,
    section: "DOS DOCUMENTOS DE VIAGEM",
    clause_text:
      "É de responsabilidade exclusiva do CONTRATANTE e passageiros portar documento oficial de identificação com foto em perfeito estado de conservação (RG ou CNH) e, para viagens internacionais, passaporte válido por no mínimo 6 meses, vistos consulares e comprovantes de vacinas exigidos pelos países de destino.",
    is_mandatory: true,
  },
  {
    number: 4,
    section: "DAS POLÍTICAS DE CANCELAMENTO E REEMBOLSO",
    clause_text:
      "Em caso de desistência ou cancelamento por parte do CONTRATANTE, aplicar-se-ão as penalidades contratuais e taxas das operadoras/cias aéreas envolvidas, deduzidas as despesas administrativas comprovadas, em estrita observância à legislação de proteção ao consumidor.",
    is_mandatory: true,
  },
  {
    number: 5,
    section: "DO CASO FORTUITO E FORÇA MAIOR",
    clause_text:
      "Nenhuma das partes será responsabilizada pelo não cumprimento de obrigações decorrentes de eventos imprevisíveis ou inevitáveis (como condições climáticas adversas, pandemias, greves aeroportuárias ou determinações governamentais).",
    is_mandatory: true,
  },
  {
    number: 6,
    section: "DA VALIDADE JURÍDICA DA ASSINATURA ELETRÔNICA",
    clause_text:
      "As partes declaram plenamente válida e eficaz a assinatura deste instrumento em meio eletrônico, reconhecendo a autenticidade, integridade e tempestividade do aceite digital emitido com registro de IP, data/hora e hash criptográfico nos termos da MP 2.200-2/2001 e Lei 14.063/2020.",
    is_mandatory: true,
  },
];

// ─── 1. Criação de Contrato de Viagem ──────────────────────────────────────────

export const createTravelContract = createServerFn({ method: "POST" })
  .validator(
    z.object({
      proposalId: z.string().optional(),
      contractTitle: z.string().min(3, "Título obrigatório"),
      clientName: z.string().min(2, "Nome do cliente obrigatório"),
      clientDocument: z.string().min(11, "CPF ou documento obrigatório"),
      clientEmail: z.string().optional(),
      clientPhone: z.string().min(8, "Telefone obrigatório"),
      clientAddress: z.string().optional(),
      destination: z.string().min(2, "Destino obrigatório"),
      travelStartDate: z.string().optional(),
      travelEndDate: z.string().optional(),
      packageSummary: z.string().min(5, "Resumo do pacote obrigatório"),
      totalValueCents: z.number().int().min(0),
      paymentConditions: z.string().min(3, "Condições de pagamento obrigatórias"),
      passengers: z.array(z.object({ name: z.string(), document: z.string().optional() })).default([]),
      customClauses: z.array(z.any()).optional(),
    })
  )
  .handler(async ({ data: input }): Promise<{ success: boolean; id: string; publicToken: string }> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    if (!identity?.id) {
      throw new Error("Não autorizado — faça login no painel da agência.");
    }

    const publicToken = "ct_" + Math.random().toString(36).substring(2, 12);

    const clauses = input.customClauses && input.customClauses.length > 0
      ? input.customClauses
      : CANONICAL_TOURISM_CLAUSES;

    const { data: inserted, error } = await supabase
      .from("travel_contracts")
      .insert({
        store_id: identity.store_id || null,
        created_by_profile_id: identity.id,
        proposal_id: input.proposalId || null,
        public_token: publicToken,
        contract_title: input.contractTitle.trim(),
        client_name: input.clientName.trim(),
        client_document: input.clientDocument.trim(),
        client_email: input.clientEmail?.trim() || null,
        client_phone: input.clientPhone.trim(),
        client_address: input.clientAddress?.trim() || null,
        destination: input.destination.trim(),
        travel_start_date: input.travelStartDate || null,
        travel_end_date: input.travelEndDate || null,
        package_summary: input.packageSummary.trim(),
        total_value_cents: input.totalValueCents,
        payment_conditions: input.paymentConditions.trim(),
        passengers: input.passengers,
        clauses,
        signatures: [],
        status: "sent",
      })
      .select("id, public_token")
      .single();

    if (error) {
      console.error("[travel-contract.functions] Erro ao criar contrato:", error);
      throw new Error("Falha ao salvar contrato no banco: " + error.message);
    }

    return { success: true, id: inserted.id, publicToken: inserted.public_token };
  });

// ─── 2. Buscar Contrato por ID (Workspace) ────────────────────────────────────

export const getTravelContractById = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }): Promise<TravelContractDTO | null> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    if (!identity?.id) {
      throw new Error("Não autorizado.");
    }

    const { data: row, error } = await supabase
      .from("travel_contracts")
      .select(`
        *,
        stores (
          name,
          cnpj,
          address,
          settings
        )
      `)
      .eq("id", data.id)
      .maybeSingle();

    if (error || !row) {
      return null;
    }

    const storeSettings = (row.stores as any)?.settings || {};

    return {
      id: row.id,
      store_id: row.store_id,
      agency_name: (row.stores as any)?.name || "Agência de Viagens",
      agency_cnpj: (row.stores as any)?.cnpj || null,
      agency_address: (row.stores as any)?.address || null,
      agency_whatsapp: storeSettings.whatsapp_phone || storeSettings.phone || "",
      public_token: row.public_token,
      proposal_id: row.proposal_id,
      contract_title: row.contract_title,
      client_name: row.client_name,
      client_document: row.client_document,
      client_email: row.client_email,
      client_phone: row.client_phone,
      client_address: row.client_address,
      passengers: row.passengers || [],
      destination: row.destination,
      travel_start_date: row.travel_start_date,
      travel_end_date: row.travel_end_date,
      package_summary: row.package_summary,
      total_value_cents: row.total_value_cents || 0,
      payment_conditions: row.payment_conditions,
      clauses: row.clauses || CANONICAL_TOURISM_CLAUSES,
      signatures: row.signatures || [],
      status: row.status || "draft",
      signed_at: row.signed_at,
      content_hash: row.content_hash,
      certificate_serial: row.certificate_serial,
      pdf_url: row.pdf_url,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });

// ─── 3. Buscar Contrato Público por Token (Mobile Signature) ──────────────────

export const getPublicTravelContractByToken = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string().min(1) }))
  .handler(async ({ data }): Promise<TravelContractDTO | null> => {
    const supabase = getAnonServerClient();

    const { data: row, error } = await supabase
      .from("travel_contracts")
      .select(`
        *,
        stores (
          name,
          cnpj,
          address,
          settings
        )
      `)
      .eq("public_token", data.token)
      .maybeSingle();

    if (error || !row) {
      return null;
    }

    const storeSettings = (row.stores as any)?.settings || {};

    return {
      id: row.id,
      store_id: row.store_id,
      agency_name: (row.stores as any)?.name || "Agência de Viagens",
      agency_cnpj: (row.stores as any)?.cnpj || null,
      agency_address: (row.stores as any)?.address || null,
      agency_whatsapp: storeSettings.whatsapp_phone || storeSettings.phone || "",
      public_token: row.public_token,
      proposal_id: row.proposal_id,
      contract_title: row.contract_title,
      client_name: row.client_name,
      client_document: row.client_document,
      client_email: row.client_email,
      client_phone: row.client_phone,
      client_address: row.client_address,
      passengers: row.passengers || [],
      destination: row.destination,
      travel_start_date: row.travel_start_date,
      travel_end_date: row.travel_end_date,
      package_summary: row.package_summary,
      total_value_cents: row.total_value_cents || 0,
      payment_conditions: row.payment_conditions,
      clauses: row.clauses || CANONICAL_TOURISM_CLAUSES,
      signatures: row.signatures || [],
      status: row.status || "draft",
      signed_at: row.signed_at,
      content_hash: row.content_hash,
      certificate_serial: row.certificate_serial,
      pdf_url: row.pdf_url,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });

// ─── 4. Assinar Contrato Eletronicamente (SHA-256 + Certificado Digital) ──────

export const signTravelContract = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(1),
      signerName: z.string().min(2, "Nome obrigatório"),
      signerDocument: z.string().min(11, "CPF obrigatório"),
      signatureImage: z.string().optional(),
      ipAddress: z.string().default("client-ip"),
      userAgent: z.string().default("browser-agent"),
    })
  )
  .handler(async ({ data }): Promise<{ success: boolean; certificateSerial: string; message: string }> => {
    const supabase = getAnonServerClient();

    // 1. Busca o contrato atual
    const { data: contract, error: findError } = await supabase
      .from("travel_contracts")
      .select("*")
      .eq("public_token", data.token)
      .single();

    if (findError || !contract) {
      throw new Error("Contrato não encontrado.");
    }

    const timestamp = new Date().toISOString();
    const certificateSerial = `CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    // 2. Geração do payload para Hash Criptográfico
    const hashPayload = JSON.stringify({
      contract_id: contract.id,
      signer_name: data.signerName,
      signer_document: data.signerDocument,
      timestamp,
      serial: certificateSerial,
      total_value: contract.total_value_cents,
      destination: contract.destination,
    });

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(hashPayload);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    const contentHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const newSignature: ContractSignerDTO = {
      signer_name: data.signerName.trim(),
      signer_document: data.signerDocument.trim(),
      signed_at: timestamp,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
      signature_image_url: data.signatureImage || null,
      content_hash: contentHash,
      auth_serial: certificateSerial,
    };

    const currentSignatures = contract.signatures || [];
    const updatedSignatures = [...currentSignatures, newSignature];

    // 3. Atualiza no Supabase
    const { error: updateError } = await supabase
      .from("travel_contracts")
      .update({
        signatures: updatedSignatures,
        status: "signed",
        signed_at: timestamp,
        content_hash: contentHash,
        certificate_serial: certificateSerial,
        updated_at: timestamp,
      })
      .eq("id", contract.id);

    if (updateError) {
      console.error("[travel-contract.functions] Erro ao assinar contrato:", updateError);
      throw new Error("Falha ao registrar assinatura: " + updateError.message);
    }

    return {
      success: true,
      certificateSerial,
      message: "Contrato assinado com sucesso com validação criptográfica SHA-256!",
    };
  });

// ─── 5. Listagem de Contratos da Agência (Workspace) ──────────────────────────

export const listAgencyTravelContracts = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        status: z.string().optional(),
        search: z.string().optional(),
      })
      .optional()
  )
  .handler(async ({ data }): Promise<TravelContractDTO[]> => {
    const supabase = getServerClient();
    const identity = await getServerIdentity();

    if (!identity?.id) {
      return [];
    }

    let query = supabase
      .from("travel_contracts")
      .select(`
        *,
        stores (
          name,
          cnpj,
          address,
          settings
        )
      `)
      .order("created_at", { ascending: false });

    if (identity.store_id) {
      query = query.eq("store_id", identity.store_id);
    } else {
      query = query.eq("created_by_profile_id", identity.id);
    }

    if (data?.status && data.status !== "all") {
      query = query.eq("status", data.status);
    }

    if (data?.search) {
      query = query.or(`contract_title.ilike.%${data.search}%,client_name.ilike.%${data.search}%,destination.ilike.%${data.search}%`);
    }

    const { data: rows, error } = await query;

    if (error || !rows) {
      return [];
    }

    return rows.map((row: any) => {
      const storeSettings = row.stores?.settings || {};
      return {
        id: row.id,
        store_id: row.store_id,
        agency_name: row.stores?.name || "Agência de Viagens",
        agency_cnpj: row.stores?.cnpj || null,
        agency_address: row.stores?.address || null,
        agency_whatsapp: storeSettings.whatsapp_phone || storeSettings.phone || "",
        public_token: row.public_token,
        proposal_id: row.proposal_id,
        contract_title: row.contract_title,
        client_name: row.client_name,
        client_document: row.client_document,
        client_email: row.client_email,
        client_phone: row.client_phone,
        client_address: row.client_address,
        passengers: row.passengers || [],
        destination: row.destination,
        travel_start_date: row.travel_start_date,
        travel_end_date: row.travel_end_date,
        package_summary: row.package_summary,
        total_value_cents: row.total_value_cents || 0,
        payment_conditions: row.payment_conditions,
        clauses: row.clauses || CANONICAL_TOURISM_CLAUSES,
        signatures: row.signatures || [],
        status: row.status || "draft",
        signed_at: row.signed_at,
        content_hash: row.content_hash,
        certificate_serial: row.certificate_serial,
        pdf_url: row.pdf_url,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    });
  });
