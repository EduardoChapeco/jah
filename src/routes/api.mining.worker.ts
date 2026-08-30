import { createFileRoute } from "@tanstack/react-router";
import { processCrawlQueueBatch, enqueueRssItemsBatch } from "@/services/mining.functions";

export const Route = createFileRoute("/api/mining/worker")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get("authorization");
          const workerSecret = process.env.MINING_WORKER_SECRET || process.env.CRON_SECRET;

          // Se MINING_WORKER_SECRET estiver configurado, exige validação Bearer
          if (workerSecret && authHeader !== `Bearer ${workerSecret}`) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const url = new URL(request.url);
          const mode = url.searchParams.get("mode") || "all";
          const limit = parseInt(url.searchParams.get("limit") || "10", 10);

          const results: Record<string, any> = {};

          if (mode === "rss" || mode === "all") {
            const rssRes = await enqueueRssItemsBatch({ data: { limit: Math.min(limit, 50) } });
            results.rss = rssRes;
          }

          if (mode === "queue" || mode === "all") {
            const queueRes = await processCrawlQueueBatch({ data: { limit: Math.min(limit, 10) } });
            results.queue = queueRes;
          }

          return new Response(JSON.stringify({ success: true, timestamp: new Date().toISOString(), ...results }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (e: any) {
          console.error("[mining-worker-api] Erro:", e);
          return new Response(JSON.stringify({ error: e.message || "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
