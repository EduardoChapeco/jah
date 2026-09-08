import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/assinatura/$token")({
 loader: async ({ params }) => {
   try {
 throw redirect({
 to: "/assinar/$token",
 params: { token: params.token },
 });
   } catch (err) {
     console.error("[loader:assinatura.$token] Unhandled error:", err);
     return null;
   }
 },
 component: () => null,
});
