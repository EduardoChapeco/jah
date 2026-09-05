import { z } from "zod";
import {
  AgentRegistryDTO,
  AgentRegistrySchema,
  SquadTemplateDTO,
  StoreSquadDTO,
  StoreSquadRunDTO,
} from "../types/squads-and-onboarding";

// ── CONEXÃO RESILIENTE COM SUPABASE / POSTGRES ──────────────────────────────
async function getDb() {
  const postgres = (await import("postgres")).default;
  return postgres({
    host: process.env.SUPABASE_DB_HOST || "aws-0-sa-east-1.pooler.supabase.com",
    port: Number(process.env.SUPABASE_DB_PORT) || 6543,
    database: process.env.SUPABASE_DB_NAME || "postgres",
    username: process.env.SUPABASE_DB_USER || "postgres.jfuebqmltksyznovhlwa",
    password: process.env.SUPABASE_DB_PASSWORD || "EEaR6399!@#2026",
    ssl: "require",
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

function parseJsonField<T>(value: any, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value as T;
  if (typeof value === "string") {
    try {
      let parsed = JSON.parse(value);
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
      return (parsed || fallback) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export interface SquadWithDetails {
  id: string;
  store_id: string;
  squad_template_id: string;
  custom_name: string;
  status: "active" | "paused" | "configuring";
  operational_goal: string | null;
  cadence: string;
  approval_mode: "auto" | "human_in_the_loop";
  template: {
    slug: string;
    name: string;
    description: string;
    department: string;
    icon_name: string;
    badge_label: string;
  };
  agents: Array<{
    agent_id: string;
    name: string;
    role_label: string;
    seniority: string;
    career_summary: string;
    task_order: number;
    default_model: string;
    curriculum: {
      academic_background: string[];
      certifications: string[];
      years_experience: number;
      specialties: string[];
    };
    deliverables: string[];
  }>;
  latest_run?: {
    id: string;
    status: string;
    trigger_source: string;
    started_at: string;
    completed_at: string | null;
    output_artifacts: Record<string, any>;
  } | null;
}

// ── 1. LISTAR SQUADS DA LOJA (COM AUTO-INSTANCIAÇÃO DE TEMPLATES) ───────────
export async function listStoreSquads(storeId: string): Promise<SquadWithDetails[]> {
  const sql = await getDb();
  try {
    // 1. Obter templates canônicos
    const templates = await sql`
      SELECT * FROM squad_templates WHERE is_active = true ORDER BY name;
    `;

    // 2. Verificar se a loja já possui squads criados
    let storeSquads = await sql`
      SELECT * FROM store_squads WHERE store_id = ${storeId};
    `;

    // Se a loja não tem squads criados ainda, instancia automaticamente os 4 squads
    if (storeSquads.length === 0 && templates.length > 0) {
      for (const t of templates) {
        await sql`
          INSERT INTO store_squads (
            store_id,
            squad_template_id,
            custom_name,
            status,
            operational_goal,
            cadence,
            approval_mode,
            onboarding_answers,
            runtime_settings
          ) VALUES (
            ${storeId},
            ${t.id},
            ${t.name},
            'active',
            ${`Garantir excelência contínua nas rotinas de ${t.name} com supervisão humana.`},
            'daily',
            'human_in_the_loop',
            '{}',
            '{}'
          )
          ON CONFLICT DO NOTHING;
        `;
      }
      storeSquads = await sql`
        SELECT * FROM store_squads WHERE store_id = ${storeId};
      `;
    }

    // 3. Montar estrutura completa com agentes e últimas corridas
    const result: SquadWithDetails[] = [];

    for (const ss of storeSquads) {
      const template = templates.find((t: any) => t.id === ss.squad_template_id);
      if (!template) continue;

      // Buscar agentes vinculados a este squad template
      const agentRows = await sql`
        SELECT 
          sta.agent_id,
          sta.role_label,
          sta.task_order,
          ar.name,
          ar.seniority,
          ar.career_summary,
          ar.curriculum,
          ar.deliverables,
          ar.default_model
        FROM squad_template_agents sta
        JOIN agent_registry ar ON ar.id = sta.agent_id
        WHERE sta.squad_template_id = ${ss.squad_template_id}
        ORDER BY sta.task_order ASC;
      `;

      // Buscar última corrida
      const [latestRun] = await sql`
        SELECT * FROM store_squad_runs
        WHERE store_squad_id = ${ss.id}
        ORDER BY started_at DESC
        LIMIT 1;
      `;

      result.push({
        id: ss.id,
        store_id: ss.store_id,
        squad_template_id: ss.squad_template_id,
        custom_name: ss.custom_name,
        status: ss.status,
        operational_goal: ss.operational_goal,
        cadence: ss.cadence,
        approval_mode: ss.approval_mode,
        template: {
          slug: template.slug,
          name: template.name,
          description: template.description,
          department: template.department,
          icon_name: template.icon_name,
          badge_label: template.badge_label,
        },
        agents: agentRows.map((a: any) => ({
          agent_id: a.agent_id,
          name: a.name,
          role_label: a.role_label,
          seniority: a.seniority,
          career_summary: a.career_summary,
          task_order: a.task_order,
          default_model: a.default_model,
          curriculum: parseJsonField(a.curriculum, {
            academic_background: [],
            certifications: [],
            years_experience: 10,
            specialties: [],
          }),
          deliverables: a.deliverables || [],
        })),
        latest_run: latestRun
          ? {
              id: latestRun.id,
              status: latestRun.status,
              trigger_source: latestRun.trigger_source,
              started_at: latestRun.started_at?.toISOString?.() || latestRun.started_at,
              completed_at: latestRun.completed_at?.toISOString?.() || latestRun.completed_at,
              output_artifacts: parseJsonField(latestRun.output_artifacts, {}),
            }
          : null,
      });
    }

    return result;
  } finally {
    await sql.end();
  }
}

// ── 2. DISPARAR RUN DE SQUAD (HUMAN-IN-THE-LOOP) ───────────────────────────
export async function triggerSquadRun(
  storeId: string,
  storeSquadId: string,
  options?: { triggerSource?: "manual" | "scheduler"; inputPayload?: Record<string, any> }
): Promise<StoreSquadRunDTO> {
  const sql = await getDb();
  try {
    const input = options?.inputPayload || { goal: "Auditoria e diagnóstico proativo de rotina" };
    const source = options?.triggerSource || "manual";

    // Simulação determinística de artefato gerado pelo primeiro agente da fila
    const sampleArtifacts = {
      executive_summary: "Diagnóstico executado com sucesso. Todos os parâmetros de compliance e métricas estão dentro do esperado.",
      pending_approval_items: [
        {
          id: "item_01",
          title: "Aprovação de Campanha Promocional Semanal",
          description: "Peça de criativo e copy gerada para veiculação no WhatsApp.",
          confidence_score: 94,
        },
      ],
    };

    const [runRow] = await sql`
      INSERT INTO store_squad_runs (
        store_squad_id,
        store_id,
        trigger_source,
        status,
        input_payload,
        output_artifacts,
        total_tokens_consumed,
        cost_estimate_cents,
        started_at
      ) VALUES (
        ${storeSquadId},
        ${storeId},
        ${source},
        'needs_approval',
        ${sql.json(input)},
        ${sql.json(sampleArtifacts)},
        1420,
        3,
        NOW()
      )
      RETURNING *;
    `;

    return {
      id: runRow.id,
      store_squad_id: runRow.store_squad_id,
      store_id: runRow.store_id,
      trigger_source: runRow.trigger_source,
      status: runRow.status,
      current_agent_id: runRow.current_agent_id,
      input_payload: parseJsonField(runRow.input_payload, input),
      output_artifacts: parseJsonField(runRow.output_artifacts, sampleArtifacts),
      error_log: runRow.error_log,
      total_tokens_consumed: runRow.total_tokens_consumed,
      cost_estimate_cents: runRow.cost_estimate_cents,
      started_at: runRow.started_at?.toISOString?.() || runRow.started_at,
      completed_at: runRow.completed_at?.toISOString?.() || runRow.completed_at,
    };
  } finally {
    await sql.end();
  }
}

// ── 3. APROVAR ENTREGA DE SQUAD (HUMAN-IN-THE-LOOP EM 1 CLIQUE) ────────────
export async function approveSquadRun(
  storeId: string,
  runId: string
): Promise<StoreSquadRunDTO> {
  const sql = await getDb();
  try {
    const [updated] = await sql`
      UPDATE store_squad_runs
      SET 
        status = 'completed',
        completed_at = NOW()
      WHERE id = ${runId} AND store_id = ${storeId}
      RETURNING *;
    `;

    if (!updated) {
      throw new Error(`Corrida ${runId} não encontrada para a loja.`);
    }

    return {
      id: updated.id,
      store_squad_id: updated.store_squad_id,
      store_id: updated.store_id,
      trigger_source: updated.trigger_source,
      status: updated.status,
      current_agent_id: updated.current_agent_id,
      input_payload: parseJsonField(updated.input_payload, {}),
      output_artifacts: parseJsonField(updated.output_artifacts, {}),
      error_log: updated.error_log,
      total_tokens_consumed: updated.total_tokens_consumed,
      cost_estimate_cents: updated.cost_estimate_cents,
      started_at: updated.started_at?.toISOString?.() || updated.started_at,
      completed_at: updated.completed_at?.toISOString?.() || updated.completed_at,
    };
  } finally {
    await sql.end();
  }
}
