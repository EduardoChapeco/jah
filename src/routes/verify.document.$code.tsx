import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  UserCheck,
  Hash,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Lock,
} from "lucide-react";

import { verifyDocumentPublic } from "@/services/contracts.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/datetime";

export const Route = createFileRoute("/verify/document/$code")({
  head: ({ loaderData }: { loaderData?: { result: any; error: string | null } }) => ({
    meta: [
      {
        title: loaderData?.result?.title
          ? `Verificação: ${loaderData.result.title} — Wider`
          : "Verificação de Documento — Wider",
      },
    ],
  }),
  loader: async ({ params }): Promise<{ result: any; error: string | null }> => {
    try {
      const result = await verifyDocumentPublic({ data: params.code });
      return { result, error: null };
    } catch (err: any) {
      return { result: null, error: err?.message || "Documento não encontrado." };
    }
  },
  component: DocumentVerificationPage,
});

const CATEGORY_LABELS: Record<string, string> = {
  real_estate_rental: "Contrato de Locação Imobiliária",
  vehicle_sale: "Contrato de Compra e Venda de Veículo",
  service_agreement: "Prestação de Serviços",
  employment: "Contrato de Trabalho / Parceria",
  general_deal: "Acordo / Transação Geral",
};

function DocumentVerificationPage() {
  const { result, error } = Route.useLoaderData();

  if (error || !result) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full border border-destructive/30 bg-destructive/5 rounded-2xl p-6 text-center space-y-4 ">
          <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertTriangle className="size-6" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Documento Não Reconhecido</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            O código ou hash informado não corresponde a nenhum documento selado ou emitido na
            infraestrutura canônica da Wider.
          </p>
          <Button asChild variant="outline" size="sm" className="rounded-xl mt-2">
            <Link to="/">
              <ArrowLeft className="size-4 mr-2" />
              Voltar ao Início
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const isCompleted =
    result.status === "completed" || result.status === "signing" || result.status === "sealed";
  const sealed = result.sealedVersion;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 md:p-8">
      <div className="max-w-xl w-full  bg-card rounded-2xl  overflow-hidden space-y-6 p-6 md:p-8">
        {/* Header de Autenticidade */}
        <div className="text-center space-y-2">
          <div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
            <ShieldCheck className="size-8" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Documento Autêntico e Verificado
          </h1>
          <p className="text-xs text-muted-foreground">
            Registro Imutável emitido na plataforma comunitária Wider
          </p>
        </div>

        {/* Informações do Documento */}
        <div className=" rounded-xl p-4 bg-muted/30 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary" className="text-xs font-semibold">
              {CATEGORY_LABELS[result.category] || result.category}
            </Badge>
            <span className="text-[11px] font-mono text-muted-foreground">
              Código: {result.verificationCode}
            </span>
          </div>

          <h2 className="text-base font-bold text-foreground leading-snug">{result.title}</h2>

          <div className="grid grid-cols-2 gap-3 text-xs pt-2 ">
            <div>
              <span className="text-muted-foreground block text-[10px]">Data de Emissão</span>
              <span className="font-semibold">{formatDate(result.createdAt)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Status do Registro</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-[11px]">
                {result.status === "completed" ? "Finalizado" : "Selado / Em Assinatura"}
              </span>
            </div>
          </div>
        </div>

        {/* Hash Criptográfico SHA-256 */}
        {sealed?.hash_sha256 && (
          <div className=" rounded-xl p-3.5 bg-background space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Hash className="size-3.5 text-primary" />
              <span>Identificador de Autenticidade</span>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground break-all bg-muted/40 p-2 rounded-lg">
              {sealed.hash_sha256}
            </p>
          </div>
        )}

        {/* Signatários Registrados */}
        {sealed?.envelopes && sealed.envelopes.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <UserCheck className="size-3.5 text-primary" />
              Signatários e Evidências
            </h3>
            <div className="space-y-2">
              {sealed.envelopes.map((env: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl  bg-muted/20 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-foreground">{env.signer_name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">
                      {env.signer_role === "party" ? "Parte Contratante" : env.signer_role} • Nível:{" "}
                      {env.auth_level}
                    </p>
                  </div>
                  <Badge
                    variant={env.status === "signed" ? "default" : "outline"}
                    className="text-[10px] uppercase font-mono"
                  >
                    {env.status === "signed" ? "Assinado" : "Pendente"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rodapé Seguro */}
        <div className="pt-2 flex items-center justify-between  text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Lock className="size-3 text-primary" />
            Integridade Criptográfica
          </span>
          <Link to="/" className="text-primary hover:underline font-medium">
            Wider Community Platform
          </Link>
        </div>
      </div>
    </div>
  );
}
