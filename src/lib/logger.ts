import { getServerClient } from "./supabase";

/**
 * Registra um erro silencioso no banco de dados para auditoria.
 * Dispara de forma assíncrona para não bloquear a resposta da Server Function.
 */
export interface LogSystemErrorParams {
  route: string;
  error: unknown;
  operation?: string;
  payload?: any;
  userId?: string;
  pageUrl?: string;
  schemaName?: string;
  tableName?: string;
  columnName?: string;
  contractName?: string;
  severity?: "error" | "warn" | "critical";
}

/**
 * Registra um erro no banco de dados para auditoria detalhada de engenharia.
 * Dispara de forma assíncrona para não bloquear a resposta da Server Function.
 */
export function logSystemError(params: LogSystemErrorParams) {
  const errorMessage = params.error instanceof Error ? params.error.message : String(params.error);
  const stackTrace = params.error instanceof Error ? params.error.stack : undefined;
  
  // Extrai tabela ou coluna de erros típicos do Postgres se não fornecidos
  let derivedTable = params.tableName;
  let derivedColumn = params.columnName;
  let derivedSchema = params.schemaName || "public";

  if (params.error && typeof params.error === "object") {
    const pErr = params.error as any;
    if (pErr.table) derivedTable = pErr.table;
    if (pErr.column) derivedColumn = pErr.column;
    if (pErr.schema) derivedSchema = pErr.schema;
  }

  console.error(`[System Error - ${params.route}${params.contractName ? ` (${params.contractName})` : ""}]`, errorMessage);

  try {
    const db = getServerClient();
    db.from("system_error_logs").insert({
      route: params.route,
      contract_name: params.contractName || params.route,
      page_url: params.pageUrl,
      schema_name: derivedSchema,
      table_name: derivedTable,
      column_name: derivedColumn,
      error_message: errorMessage,
      stack_trace: stackTrace,
      payload: params.payload,
      user_id: params.userId,
      severity: params.severity || "error",
    }).then(({ error }) => {
      if (error) {
        console.error("[System Error Logger] Falha ao gravar log no Supabase:", error);
      }
    });
  } catch (e) {
    console.error("[System Error Logger] Erro crítico ao tentar gravar log:", e);
  }
}
