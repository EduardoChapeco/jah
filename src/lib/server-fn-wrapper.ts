export type SafeResult<T> =
  | { status: "success"; data: T }
  | { status: "error"; message: string };

/**
 * Envolve o handler de uma Server Function para interceptar exceções e retornar JSON.
 * Ideal para evitar Internal Server Errors (HTTP 500) em caso de falhas de lógica de negócio.
 */
export function safeHandler<TArgs, TReturn>(
  handler: (ctx: { data: TArgs }) => Promise<TReturn>
): (ctx: { data: TArgs }) => Promise<SafeResult<TReturn>> {
  return async (ctx) => {
    try {
      const data = await handler(ctx);
      return { status: "success", data };
    } catch (e) {
      console.error("[safeHandler] Erro interceptado na função:", e);
      return {
        status: "error",
        message: e instanceof Error ? e.message : String(e),
      };
    }
  };
}
