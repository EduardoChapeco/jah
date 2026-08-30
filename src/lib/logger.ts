import { getServerClient } from "./supabase";

/**
 * Registra um erro silencioso no banco de dados para auditoria.
 * Dispara de forma assíncrona para não bloquear a resposta da Server Function.
 */
export function logSystemError(params: {
  route: string;
  error: unknown;
  payload?: any;
  userId?: string;
}) {
  const errorMessage = params.error instanceof Error ? params.error.message : String(params.error);
  const stackTrace = params.error instanceof Error ? params.error.stack : undefined;
  
  console.error(`[System Error - ${params.route}]`, errorMessage);

  // Não usamos await para não atrasar a request do usuário
  try {
    const db = getServerClient();
    db.from("system_error_logs").insert({
      route: params.route,
      error_message: errorMessage,
      stack_trace: stackTrace,
      payload: params.payload,
      user_id: params.userId,
    }).then(({ error }) => {
      if (error) {
        console.error("[System Error Logger] Falha ao gravar log no Supabase:", error);
      }
    });
  } catch (e) {
    console.error("[System Error Logger] Erro crítico ao tentar gravar log:", e);
  }
}
