import React, { useState } from "react";
import {
  X,
  MessageSquare,
  UserCheck,
  Plus,
  Check,
  ShieldAlert,
  Send,
  FileText,
  Zap,
  Pencil,
  Calendar,
  Clock,
  Trash2,
  ExternalLink,
  Copy,
  Users,
  AlertCircle,
  Phone,
  Mail,
  HeartHandshake,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useLeadDetail } from "@/hooks/tourism/use-lead-detail";
import { LeadInterestCard } from "./LeadInterestCard";
import { LeadAccessibilityCard } from "./LeadAccessibilityCard";
import { LeadTimeline } from "./LeadTimeline";
import { OmnichannelChat } from "./OmnichannelChat";
import { AIHunterPanel } from "./AIHunterPanel";
import { LeadForm } from "./LeadForm";
import { useNavigate } from "@tanstack/react-router";

const TAG_COLOR_PRESETS = [
  { name: "Vermelho", value: "#ef4444" },
  { name: "Laranja", value: "#f97316" },
  { name: "Amarelo", value: "#eab308" },
  { name: "Verde", value: "#22c55e" },
  { name: "Azul", value: "#3b82f6" },
  { name: "Roxo", value: "#a855f7" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Cinza", value: "#6b7280" },
];

interface LeadDetailDrawerProps {
  leadId: string | null;
  onClose: () => void;
  stages?: Array<{ id: string; name: string; color: string }>;
}

export function LeadDetailDrawer({ leadId, onClose, stages = [] }: LeadDetailDrawerProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("general");

  const {
    lead,
    activities,
    meetings,
    proposals,
    diffDays,
    lastContactDate,
    editing,
    setEditing,
    // Pax
    paxForm,
    setPaxForm,
    paxFormOpen,
    setPaxFormOpen,
    handleAddPax,
    handleRemovePax,
    // Tags
    newTagName,
    setNewTagName,
    newTagColor,
    setNewTagColor,
    addTag,
    removeTag,
    // Checklist
    checklistInput,
    setChecklistInput,
    toggleChecklistItem,
    addChecklistItem,
    deleteChecklistItem,
    // Meetings
    meetingForm,
    setMeetingForm,
    meetingFormOpen,
    setMeetingFormOpen,
    createMeeting,
    deleteMeeting,
    openGoogleCalendar,
    copyMeetingInvite,
    // Inactivity & Status
    handleUpdateStaleness,
    handleReactivateLead,
    handleLgpdToggle,
    // Magic Link
    handleCopyFormLink,
    handleShareFormWhatsApp,
    // Convert
    confirmConvertOpen,
    setConfirmConvertOpen,
    handleConvert,
    ConfirmDialog,
    leadQ,
  } = useLeadDetail(leadId, onClose);

  if (!leadId) return null;

  const currentStage = stages.find((s) => s.id === lead?.status) || {
    id: lead?.status || "new",
    name: lead?.status === "won" ? "Fechado" : lead?.status === "lost" ? "Perdido" : "Novo Lead",
    color: "#3b82f6",
  };

  const leadName = lead?.full_name || lead?.title || "Oportunidade Comercial";
  const paxList: any[] = Array.isArray(lead?.pax_list) ? lead.pax_list : [];
  const tags: string[] = Array.isArray(lead?.tags) ? lead.tags : [];

  return (
    <Sheet open={!!leadId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        size="wide"
        className="w-full sm:max-w-3xl md:max-w-4xl lg:max-w-[70vw] xl:max-w-[70vw] p-0 gap-0 border-l border-border/80 bg-background flex flex-col h-full shadow-2xl"
      >
        <ConfirmDialog />

        {/* ── 1. Top Header Sticky Bar ── */}
        <div className="border-b border-border/50 p-4 sm:p-5 bg-card/60 backdrop-blur-md flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-base text-primary shrink-0">
                {leadName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                    {leadName}
                  </SheetTitle>
                  {lead?.lgpd_accepted && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 gap-1 shrink-0">
                      <ShieldAlert className="h-3 w-3 inline" /> LGPD OK
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>Estágio:</span>
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: currentStage.color }} />
                    {currentStage.name}
                  </span>
                  {lead?.destination && (
                    <>
                      <span>•</span>
                      <span className="text-primary font-medium">{lead.destination}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(!editing)}
                className="h-8 w-8 p-0 rounded-xl hover:bg-muted"
                title={editing ? "Cancelar edição" : "Editar oportunidade"}
              >
                {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4 text-muted-foreground" />}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-xl hover:bg-muted"
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* ── Action Buttons Row (WhatsApp, Form, Proposta, Converter) ── */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {lead?.phone && (
              <a
                href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 text-xs font-semibold text-emerald-600 transition-colors"
                title="WhatsApp Rápido"
              >
                <Send className="h-3.5 w-3.5" /> WhatsApp
              </a>
            )}

            {lead?.phone && (
              <Button
                type="button"
                size="sm"
                onClick={handleShareFormWhatsApp}
                className="h-8 rounded-xl border border-emerald-600/30 bg-emerald-600/10 hover:bg-emerald-600/20 px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400 gap-1.5"
                title="Enviar Formulário via WhatsApp"
              >
                <MessageSquare className="h-3.5 w-3.5" /> Enviar Form WA
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyFormLink}
              className="h-8 rounded-xl px-3 text-xs font-semibold gap-1.5 border-border/80"
              title="Copiar Link Mágico do Formulário"
            >
              <FileText className="h-3.5 w-3.5 text-primary" /> Link Form
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                navigate({
                  to: "/workspace/turismo/propostas",
                });
                onClose();
              }}
              className="h-8 rounded-xl px-3 text-xs font-semibold gap-1.5 bg-foreground text-background hover:bg-foreground/90 shadow-xs"
            >
              <Zap className="h-3.5 w-3.5" /> Nova Cotação / Studio
            </Button>

            {!lead?.client_id && lead?.status !== "converted" ? (
              <Button
                type="button"
                size="sm"
                onClick={handleConvert}
                className="h-8 rounded-xl px-3 text-xs font-semibold gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs ml-auto"
              >
                <UserCheck className="h-3.5 w-3.5" /> Converter em Cliente
              </Button>
            ) : (
              <Badge variant="outline" className="h-8 bg-emerald-500/10 text-emerald-600 border-emerald-500/30 px-3 text-xs font-semibold gap-1.5 ml-auto">
                <Check className="h-3.5 w-3.5" /> Cliente Convertido
              </Badge>
            )}
          </div>
        </div>

        {/* ── 2. Content Tabs ── */}
        {leadQ.isLoading || !lead ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3 text-center">
            <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-xs text-muted-foreground font-medium">
              Carregando ficha 360° da oportunidade...
            </span>
          </div>
        ) : editing ? (
          <div className="p-6 overflow-y-auto flex-1">
            <LeadForm
              lead={lead}
              stages={stages}
              onCancel={() => setEditing(false)}
              onSaved={() => {
                setEditing(false);
                leadQ.refetch();
              }}
            />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-border/40 px-4 sm:px-6 bg-card/30">
              <TabsList className="bg-transparent h-11 p-0 gap-4 overflow-x-auto flex-nowrap justify-start">
                <TabsTrigger
                  value="general"
                  className="rounded-none border-b-2 border-transparent px-1 pb-3 pt-2 text-xs font-semibold data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
                >
                  Geral
                </TabsTrigger>
                <TabsTrigger
                  value="pax"
                  className="rounded-none border-b-2 border-transparent px-1 pb-3 pt-2 text-xs font-semibold data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent gap-1.5"
                >
                  Acompanhantes
                  {paxList.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
                      {paxList.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="meetings"
                  className="rounded-none border-b-2 border-transparent px-1 pb-3 pt-2 text-xs font-semibold data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent gap-1.5"
                >
                  Agenda & Lembretes
                  {meetings.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted font-bold">
                      {meetings.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="proposals"
                  className="rounded-none border-b-2 border-transparent px-1 pb-3 pt-2 text-xs font-semibold data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent gap-1.5"
                >
                  Cotações
                  {proposals.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
                      {proposals.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="messages"
                  className="rounded-none border-b-2 border-transparent px-1 pb-3 pt-2 text-xs font-semibold data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
                >
                  Mensagens
                </TabsTrigger>
                <TabsTrigger
                  value="hunter"
                  className="rounded-none border-b-2 border-transparent px-1 pb-3 pt-2 text-xs font-semibold data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent gap-1.5"
                >
                  IA Hunter
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  className="rounded-none border-b-2 border-transparent px-1 pb-3 pt-2 text-xs font-semibold data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
                >
                  Histórico
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* ── TAB 1: GERAL ── */}
              <TabsContent value="general" className="mt-0 space-y-5">
                {/* Diagnóstico inteligente de inatividade */}
                {diffDays >= 3 && lead?.staleness_status === "active" && (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>O lead está sem contato há {diffDays} dias! O que aconteceu?</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Evite a perda da oportunidade respondendo a este quiz rápido:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Sumiu / Não responde", v: "disappeared" },
                        { label: "Desistiu", v: "gave_up" },
                        { label: "Sem Crédito / Orçamento", v: "no_credit" },
                        { label: "Viagem Adiada", v: "postponed" },
                      ].map((opt) => (
                        <Button
                          key={opt.v}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStaleness(opt.v as any, opt.label)}
                          className="h-8 rounded-xl text-xs font-medium border-border/80 hover:border-primary/50"
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {lead?.staleness_status && lead.staleness_status !== "active" && (
                  <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        Lead Classificado como Inativo
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5 block">
                        Motivo:{" "}
                        {lead.staleness_status === "disappeared"
                          ? "Sumiu / Não responde"
                          : lead.staleness_status === "gave_up"
                          ? "Desistiu"
                          : lead.staleness_status === "no_credit"
                          ? "Sem crédito / Orçamento"
                          : "Viagem adiada"}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleReactivateLead}
                      className="h-8 text-xs font-semibold rounded-xl"
                    >
                      Re-ativar Lead
                    </Button>
                  </div>
                )}

                {/* Grid 2 colunas: Interesse & Acessibilidade */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/60 shadow-xs">
                    <LeadInterestCard lead={lead} />
                  </div>
                  <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/60 shadow-xs">
                    <LeadAccessibilityCard lead={lead} />
                  </div>
                </div>

                {/* Consentimento LGPD */}
                <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/60 shadow-xs flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">Consentimento LGPD</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      O lead aceitou os termos de privacidade e coleta de dados da agência.
                      {lead?.lgpd_accepted_at && (
                        <span className="block mt-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                          Aceito em: {new Date(lead.lgpd_accepted_at).toLocaleString("pt-BR")}
                        </span>
                      )}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean(lead?.lgpd_accepted)}
                    onChange={(e) => handleLgpdToggle(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary cursor-pointer"
                  />
                </div>

                {/* Tags Coloridas */}
                <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Tags da Oportunidade
                    </h4>
                    <span className="text-xs text-muted-foreground font-mono">{tags.length} tags</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {tags.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Nenhuma tag atribuída.</p>
                    ) : (
                      tags.map((tagStr) => {
                        const [tagName, tagColor = "#3b82f6"] = tagStr.split(":");
                        return (
                          <span
                            key={tagStr}
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border shadow-2xs"
                            style={{
                              backgroundColor: `${tagColor}15`,
                              borderColor: `${tagColor}40`,
                              color: tagColor,
                            }}
                          >
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tagColor }} />
                            {tagName}
                            <button
                              type="button"
                              onClick={() => removeTag(tags, tagStr)}
                              className="ml-1 hover:opacity-75 cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>

                  {/* Formulário para adicionar nova tag */}
                  <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row items-center gap-2">
                    <Input
                      placeholder="Nome da nova tag..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="h-8 text-xs rounded-xl flex-1"
                    />

                    <div className="flex items-center gap-1.5 shrink-0">
                      {TAG_COLOR_PRESETS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setNewTagColor(color.value)}
                          className={`h-5 w-5 rounded-full border border-border transition-transform ${
                            newTagColor === color.value ? "scale-125 ring-2 ring-primary" : "hover:scale-110"
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addTag(tags)}
                      disabled={!newTagName.trim()}
                      className="h-8 px-3 rounded-xl text-xs font-semibold shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                    </Button>
                  </div>
                </div>

                {/* Anotações de cadastro */}
                {lead?.notes && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Anotações do Atendimento
                    </h4>
                    <p className="text-xs text-foreground/85 whitespace-pre-wrap leading-relaxed">
                      {lead.notes}
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* ── TAB 2: ACOMPANHANTES ── */}
              <TabsContent value="pax" className="mt-0 space-y-5">
                {/* Banner do Link Mágico */}
                <div className="p-4 sm:p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <Zap className="h-4 w-4 shrink-0" />
                    <span>Link Mágico de Cadastro do Cliente</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Envie este link para que o cliente revise as preferências de viagem, preencha
                    documentos e cadastre todos os acompanhantes da família ou grupo de forma autônoma.
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyFormLink}
                      className="h-8 rounded-xl text-xs font-semibold gap-1.5 border-primary/30 bg-background"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copiar Link Form
                    </Button>
                    {lead?.phone && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleShareFormWhatsApp}
                        className="h-8 rounded-xl text-xs font-semibold gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <Send className="h-3.5 w-3.5" /> Enviar Form no WhatsApp
                      </Button>
                    )}
                  </div>
                </div>

                {/* Lista de Viajantes Vinculados */}
                <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" /> Viajantes Vinculados / Acompanhantes
                    </h4>
                    <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                      {paxList.length} Passageiro{paxList.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {paxList.length === 0 ? (
                    <div className="py-8 text-center space-y-2">
                      <p className="text-xs text-muted-foreground">Nenhum acompanhante cadastrado ainda.</p>
                      <p className="text-[11px] text-muted-foreground/70">
                        Envie o Link Mágico pelo WhatsApp ou adicione manualmente abaixo.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {paxList.map((pax, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-muted/40 border border-border/50 flex flex-col justify-between space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-bold text-xs text-foreground block">
                                {pax.full_name}
                              </span>
                              <Badge variant="secondary" className="text-[9px] uppercase font-mono px-1.5 py-0.2 mt-0.5">
                                {pax.relationship || "Outro"}
                              </Badge>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePax(idx)}
                              className="text-muted-foreground hover:text-rose-600 transition-colors p-1"
                              title="Remover passageiro"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="text-[11px] text-muted-foreground space-y-0.5 font-mono">
                            {pax.document && <div>CPF: {pax.document}</div>}
                            {pax.birth_date && <div>Nasc: {pax.birth_date}</div>}
                            {pax.phone && <div>Tel: {pax.phone}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPaxFormOpen(true)}
                    className="w-full h-9 rounded-xl text-xs font-semibold gap-1.5 border-dashed border-border/80"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar Acompanhante Manualmente
                  </Button>
                </div>
              </TabsContent>

              {/* ── TAB 3: AGENDA & LEMBRETES ── */}
              <TabsContent value="meetings" className="mt-0 space-y-5">
                <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Compromissos & Reuniões Agendadas
                    </h4>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setMeetingFormOpen(true)}
                      className="h-8 rounded-xl text-xs font-semibold gap-1.5 bg-foreground text-background hover:bg-foreground/90"
                    >
                      <Plus className="h-3.5 w-3.5" /> Agendar Reunião
                    </Button>
                  </div>

                  {meetings.length === 0 ? (
                    <div className="py-8 text-center space-y-1">
                      <p className="text-xs text-muted-foreground">Nenhuma reunião agendada com este lead.</p>
                      <p className="text-[11px] text-muted-foreground/70">
                        Agende uma ligação, call de vídeo ou visita presencial com sincronização no Google Calendar.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {meetings.map((m: any) => {
                        const dateObj = new Date(m.scheduled_at);
                        return (
                          <div
                            key={m.id}
                            className="p-4 rounded-xl bg-muted/40 border border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-foreground">{m.title}</span>
                                <Badge variant="outline" className="text-[10px] capitalize">
                                  {m.meeting_type}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                <Clock className="h-3 w-3 text-primary" />
                                <span>
                                  {dateObj.toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}{" "}
                                  ({m.duration_minutes || 30} min)
                                </span>
                              </div>
                              {m.description && (
                                <p className="text-xs text-foreground/70">{m.description}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => copyMeetingInvite(m, leadName)}
                                className="h-8 text-xs font-medium rounded-xl gap-1"
                              >
                                <Copy className="h-3 w-3" /> Copiar Convite
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openGoogleCalendar(m)}
                                className="h-8 text-xs font-medium rounded-xl gap-1 text-primary border-primary/30"
                              >
                                <ExternalLink className="h-3 w-3" /> Google Agenda
                              </Button>
                              <button
                                type="button"
                                onClick={() => deleteMeeting(m.id)}
                                className="text-muted-foreground hover:text-rose-600 transition-colors p-1"
                                title="Cancelar reunião"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── TAB 4: COTAÇÕES & PROPOSTAS ── */}
              <TabsContent value="proposals" className="mt-0 space-y-5">
                <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/60 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Propostas e Cotações Vinculadas
                    </h4>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        navigate({ to: "/workspace/turismo/propostas" });
                        onClose();
                      }}
                      className="h-8 rounded-xl text-xs font-semibold gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" /> Criar no Studio
                    </Button>
                  </div>

                  {proposals.length === 0 ? (
                    <div className="py-8 text-center space-y-2">
                      <p className="text-xs text-muted-foreground">Nenhuma proposta vinculada a esta oportunidade.</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigate({ to: "/workspace/turismo/propostas" });
                          onClose();
                        }}
                        className="rounded-xl text-xs font-semibold"
                      >
                        Abrir Catálogo de Propostas Studio
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {proposals.map((p: any) => (
                        <div
                          key={p.id}
                          className="p-3.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between gap-3"
                        >
                          <div>
                            <span className="font-bold text-xs text-foreground block">{p.title || "Proposta de Viagem"}</span>
                            <span className="text-[11px] text-muted-foreground">Status: {p.status || "rascunho"}</span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigate({ to: "/workspace/turismo/propostas" });
                              onClose();
                            }}
                            className="h-7 text-xs rounded-lg"
                          >
                            Abrir no Studio
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── TAB 5: MENSAGENS / OMNICHANNEL ── */}
              <TabsContent value="messages" className="mt-0">
                <OmnichannelChat lead={lead} />
              </TabsContent>

              {/* ── TAB 6: IA HUNTER ── */}
              <TabsContent value="hunter" className="mt-0">
                <AIHunterPanel lead={lead} />
              </TabsContent>

              {/* ── TAB 7: HISTÓRICO / TIMELINE ── */}
              <TabsContent value="timeline" className="mt-0">
                <LeadTimeline leadId={lead?.id} activities={activities} />
              </TabsContent>
            </div>
          </Tabs>
        )}

        {/* ── Modal Manual de Acompanhante ── */}
        <Dialog open={paxFormOpen} onOpenChange={setPaxFormOpen}>
          <DialogContent className="max-w-md rounded-2xl p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Vincular Novo Acompanhante</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleAddPax} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nome Completo *</Label>
                <Input
                  required
                  placeholder="Nome do passageiro"
                  value={paxForm.full_name}
                  onChange={(e) => setPaxForm({ ...paxForm, full_name: e.target.value })}
                  className="rounded-xl h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">CPF / Documento</Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={paxForm.document}
                    onChange={(e) => setPaxForm({ ...paxForm, document: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={paxForm.birth_date}
                    onChange={(e) => setPaxForm({ ...paxForm, birth_date: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Grau de Parentesco / Relação</Label>
                <Select
                  value={paxForm.relationship}
                  onValueChange={(val) => setPaxForm({ ...paxForm, relationship: val })}
                >
                  <SelectTrigger className="rounded-xl h-9 text-xs">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="conjuge">Cônjuge / Esposo(a)</SelectItem>
                    <SelectItem value="filho">Filho(a)</SelectItem>
                    <SelectItem value="pai_mae">Pai / Mãe</SelectItem>
                    <SelectItem value="irmao">Irmão / Irmã</SelectItem>
                    <SelectItem value="amigo">Amigo(a)</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">WhatsApp / Telefone</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={paxForm.phone}
                    onChange={(e) => setPaxForm({ ...paxForm, phone: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">E-mail</Label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={paxForm.email}
                    onChange={(e) => setPaxForm({ ...paxForm, email: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setPaxFormOpen(false)} className="rounded-xl h-9 text-xs">
                  Cancelar
                </Button>
                <Button type="submit" className="rounded-xl h-9 text-xs font-semibold">
                  Salvar Passageiro
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Modal de Agendamento de Reunião ── */}
        <Dialog open={meetingFormOpen} onOpenChange={setMeetingFormOpen}>
          <DialogContent className="max-w-md rounded-2xl p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Novo Compromisso / Reunião</DialogTitle>
            </DialogHeader>

            <form onSubmit={createMeeting} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Título do Compromisso *</Label>
                <Input
                  required
                  placeholder="Ex: Apresentação da Proposta Cancún"
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                  className="rounded-xl h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Data e Hora *</Label>
                  <Input
                    required
                    type="datetime-local"
                    value={meetingForm.scheduled_at}
                    onChange={(e) => setMeetingForm({ ...meetingForm, scheduled_at: e.target.value })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Duração (min)</Label>
                  <Input
                    type="number"
                    min={10}
                    step={10}
                    value={meetingForm.duration_minutes}
                    onChange={(e) => setMeetingForm({ ...meetingForm, duration_minutes: Number(e.target.value) })}
                    className="rounded-xl h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Formato</Label>
                <Select
                  value={meetingForm.meeting_type}
                  onValueChange={(val: any) => setMeetingForm({ ...meetingForm, meeting_type: val })}
                >
                  <SelectTrigger className="rounded-xl h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="call">Ligação Telefônica</SelectItem>
                    <SelectItem value="video">Videoconferência (Meet / Zoom)</SelectItem>
                    <SelectItem value="in_person">Presencial na Agência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Pauta / Observações</Label>
                <Input
                  placeholder="Itens a serem alinhados com o cliente..."
                  value={meetingForm.description}
                  onChange={(e) => setMeetingForm({ ...meetingForm, description: e.target.value })}
                  className="rounded-xl h-9 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setMeetingFormOpen(false)} className="rounded-xl h-9 text-xs">
                  Cancelar
                </Button>
                <Button type="submit" className="rounded-xl h-9 text-xs font-semibold">
                  Confirmar Agendamento
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
