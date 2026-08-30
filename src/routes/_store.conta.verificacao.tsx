/**
 * _store.conta.verificacao.tsx — Autoatendimento de Verificação KYC & Selo Oficial
 * Submissão de Documentos Profissionais (OAB, CRC, CRM, CNH, CNPJ) e Biometria.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useTransition } from "react";
import { 
  ShieldCheck, 
  IdentificationCard, 
  CheckCircle, 
  WarningCircle, 
  Clock, 
  UploadSimple, 
  Camera,
  Scales,
  Briefcase
} from "@phosphor-icons/react";
import { getMyKycStatus, submitKycVerification } from "@/services/kyc.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/conta/verificacao")({
  head: () => ({ meta: [{ title: "Verificação de Identidade & KYC | Wider" }] }),
  loader: async () => {
    try {
      const kyc = await getMyKycStatus();
      return { kyc };
    } catch {
      return { kyc: { status: "pending_submission" } };
    }
  },
  component: KycVerificationPage,
});

function KycVerificationPage() {
  const { kyc } = Route.useLoaderData();
  const [isPending, startTransition] = useTransition();

  const [entityType, setEntityType] = useState<"individual" | "lawyer" | "accountant" | "doctor" | "driver" | "company">(
    (kyc?.entity_type as any) || "individual"
  );
  const [regNumber, setRegNumber] = useState(kyc?.registration_number || "");
  const [regState, setRegState] = useState(kyc?.registration_state || "SC");
  const [docFrontUrl, setDocFrontUrl] = useState(kyc?.document_front_url || "");
  const [selfieUrl, setSelfieUrl] = useState(kyc?.selfie_url || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        await submitKycVerification({
          data: {
            entity_type: entityType,
            registration_number: regNumber,
            registration_state: regState,
            document_front_url: docFrontUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600",
            selfie_url: selfieUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600",
          },
        });
        toast.success("Documentos enviados com sucesso! A auditoria analisará seus dados em até 24h.");
      } catch (err: any) {
        toast.error(err.message || "Erro ao enviar documentos");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-6">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
            <Link to="/conta" className="hover:text-foreground">Minha Conta</Link>
            <span>/</span>
            <span className="text-foreground">Verificação</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Verificação de Perfil
          </h1>
        </div>

        {/* Status Banner */}
        {kyc?.status === "verified" ? (
          <div className="mb-6 flex items-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-emerald-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-bold">Perfil Verificado Oficialmente</h3>
              <p className="text-xs opacity-90">
                Selo de {kyc.badge_granted || "Profissional Verificado"} ativo na sua conta e vitrines.
              </p>
            </div>
          </div>
        ) : kyc?.status === "under_review" ? (
          <div className="mb-6 flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-amber-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
              <Clock className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-bold">Documentação em Auditoria</h3>
              <p className="text-xs opacity-90">
                Nossa equipe de compliance está validando seus dados. Você receberá um aviso assim que for aprovado.
              </p>
            </div>
          </div>
        ) : null}

        {/* Formulário de Envio */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Tipo de Perfil a ser Verificado
              </label>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { id: "individual", label: "Cidadão / CPF", icon: IdentificationCard },
                  { id: "lawyer", label: "Advogado (OAB)", icon: Scales },
                  { id: "accountant", label: "Contador (CRC)", icon: Briefcase },
                  { id: "driver", label: "Entregador (CNH)", icon: ShieldCheck },
                  { id: "doctor", label: "Saúde (CRM/CRP)", icon: ShieldCheck },
                  { id: "company", label: "Empresa (CNPJ)", icon: Briefcase },
                ].map((type) => {
                  const Icon = type.icon;
                  const isSelected = entityType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setEntityType(type.id as any)}
                      className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-border/80 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs font-semibold">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campos Condicionais de Registro */}
            {entityType !== "individual" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-foreground">
                    Número do Registro ({entityType === "lawyer" ? "OAB" : entityType === "accountant" ? "CRC" : entityType === "company" ? "CNPJ" : "Registro de Classe"})
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 58941"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Estado (UF)</label>
                  <select
                    value={regState}
                    onChange={(e) => setRegState(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="SC">Santa Catarina (SC)</option>
                    <option value="RS">Rio Grande do Sul (RS)</option>
                    <option value="PR">Paraná (PR)</option>
                    <option value="SP">São Paulo (SP)</option>
                    <option value="RJ">Rio de Janeiro (RJ)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Upload de Documentos */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-dashed border-border p-5 text-center transition-all hover:border-primary/50">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UploadSimple className="h-5 w-5" />
                </div>
                <h4 className="mt-2 text-xs font-bold text-foreground">Documento Frente/Verso</h4>
                <p className="mt-1 text-[11px] text-muted-foreground">RG, CNH ou Carteira Profissional</p>
                <button
                  type="button"
                  onClick={() => setDocFrontUrl("https://images.unsplash.com/photo-1544717305-2782549b5136?w=600")}
                  className="mt-3 rounded-lg bg-surface-paper px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                >
                  {docFrontUrl ? "Documento Carregado ✓" : "Selecionar Arquivo"}
                </button>
              </div>

              <div className="rounded-xl border border-dashed border-border p-5 text-center transition-all hover:border-primary/50">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Camera className="h-5 w-5" />
                </div>
                <h4 className="mt-2 text-xs font-bold text-foreground">Selfie de Validação</h4>
                <p className="mt-1 text-[11px] text-muted-foreground">Foto segurando o documento ao lado do rosto</p>
                <button
                  type="button"
                  onClick={() => setSelfieUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600")}
                  className="mt-3 rounded-lg bg-surface-paper px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                >
                  {selfieUrl ? "Selfie Carregada ✓" : "Tirar Foto / Carregar"}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                {isPending ? "Enviando..." : "Submeter para Verificação"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
