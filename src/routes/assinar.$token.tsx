import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  FileSignature,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Hash,
  AlertCircle,
  Loader2,
  ArrowRight,
  FileText,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

import { getEnvelopeByToken, signContractEnvelope } from "@/services/contracts.functions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { SignatureCanvasPad } from "@/components/contracts/signature-canvas-pad";
import { formatDate } from "@/lib/datetime";

export const Route = createFileRoute("/assinar/$token")({
  head: () => ({ meta: [{ title: "Assinatura Eletrônica de Documento — Wider" }] }),
  loader: async ({ params }) => {
    try {
      const envelope = await getEnvelopeByToken({ data: params.token });
      if (!envelope) {
        return { envelope: null, error: "Link de assinatura inválido ou expirado." };
      }
      return { envelope, error: null };
    } catch {
      return { envelope: null, error: "Link de assinatura inválido ou expirado." };
    }
  },
  component: SignContractPage,
});

function SignContractPage() {
  const navigate = useNavigate();
  const { envelope, error } = Route.useLoaderData();
  const [consent, setConsent] = useState(false);
  const [signatureImage, setSignatureImage] = useState("");
  const [isSignedLocal, setIsSignedLocal] = useState(envelope?.status === "signed");

  const signMutation = useMutation({
    mutationFn: signContractEnvelope,
    onSuccess: (data) => {
      toast.success("Documento assinado eletronicamente com sucesso!");
      setIsSignedLocal(true);
      const code = (envelope?.contract_version as any)?.contract?.verification_code;
      if (code) {
        navigate({ to: "/verify/document/$code", params: { code } });
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao assinar documento.");
    },
  });

  if (error || !envelope) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full border border-destructive/30 bg-destructive/5 rounded-2xl p-6 text-center space-y-4 ">
          <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="size-6" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Sessão Inválida</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {error || "O token de assinatura informado não foi encontrado ou expirou."}
          </p>
          <Button asChild variant="outline" size="sm" className="rounded-xl mt-2">
            <Link to="/">Voltar ao Início</Link>
          </Button>
        </div>
      </div>
    );
  }

  const version = envelope.contract_version as any;
  const contract = version?.contract;

  const handleSign = () => {
    if (!consent) {
      toast.error("Você deve marcar o consentimento para assinar o documento.");
      return;
    }

    signMutation.mutate({
      data: {
        signingToken: envelope.signing_token,
        consent: true,
        signatureImageBase64: signatureImage || undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Browser",
      },
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 md:px-6 flex justify-center">
      <div className="max-w-4xl w-full space-y-6">
        {/* Header da Sessão de Assinatura */}
        <div className=" bg-card rounded-2xl p-6  flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-semibold gap-1">
                <FileSignature className="size-3 text-primary" />
                <span>Assinatura Digital</span>
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                Versão {version?.version_number}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              {contract?.title || version?.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              Signatário: <strong className="text-foreground">{envelope.signer_name}</strong> (
              {envelope.signer_email})
            </p>
          </div>

          <div className="text-left md:text-right">
            <Badge
              variant={isSignedLocal ? "default" : "secondary"}
              className="text-xs font-bold uppercase tracking-wider"
            >
              {isSignedLocal ? "Documento Assinado" : "Aguardando Sua Assinatura"}
            </Badge>
          </div>
        </div>

        {/* Fingerprint Criptográfico */}
        {version?.hash_sha256 && (
          <div className=" rounded-xl p-3.5 bg-muted/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Hash className="size-4 text-primary shrink-0" />
              <span className="font-mono text-muted-foreground text-[11px] truncate">
                Hash SHA-256: {version.hash_sha256}
              </span>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono shrink-0">
              Imutável
            </Badge>
          </div>
        )}

        {/* Visualizador do Conteúdo do Contrato */}
        <div className=" bg-card rounded-2xl p-6 md:p-8  space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground  pb-2">
            Termos e Cláusulas Contratuais
          </h2>

          <div className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto pr-2 scrollbar-none  rounded-xl p-4 bg-muted/10 font-sans">
            {version?.content_markdown}
          </div>
        </div>

        {/* Área de Ação e Consentimento */}
        {!isSignedLocal ? (
          <div className="border border-primary/30 bg-card rounded-2xl p-6 space-y-5">
            {/* Canvas Interativo de Assinatura */}
            <SignatureCanvasPad onSave={setSignatureImage} />

            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="consent-check"
                checked={consent}
                onCheckedChange={(c) => setConsent(!!c)}
                className="mt-0.5"
              />
              <label
                htmlFor="consent-check"
                className="text-xs text-foreground leading-relaxed cursor-pointer"
              >
                Eu, <strong className="text-foreground">{envelope.signer_name}</strong>, declaro que
                li, compreendi e concordo integralmente com todas as cláusulas e condições deste
                contrato, manifestando minha vontade mediante assinatura eletrônica com validade
                jurídica.
              </label>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 ">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3.5 text-primary" />
                <span>Assinatura Segura & Protegida</span>
              </div>

              <Button
                onClick={handleSign}
                disabled={!consent || signMutation.isPending}
                className="w-full sm:w-auto rounded-xl text-xs font-bold gap-2 h-11 px-6 "
              >
                {signMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Registrando Assinatura...</span>
                  </>
                ) : (
                  <>
                    <FileSignature className="size-4" />
                    <span>Assinar Eletronicamente</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle2 className="size-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h2 className="text-base font-bold text-foreground">
              Assinatura Concluída com Sucesso!
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Sua assinatura eletrônica foi registrada com sucesso e está protegida com segurança.
            </p>
            {contract?.verification_code && (
              <Button asChild size="sm" className="rounded-xl text-xs font-bold gap-1.5 mt-2">
                <Link to="/verify/document/$code" params={{ code: contract.verification_code }}>
                  <span>Ver Registro Público de Autenticidade</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
