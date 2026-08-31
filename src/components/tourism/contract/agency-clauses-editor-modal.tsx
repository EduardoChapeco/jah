import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileUp,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  getAgencyContractTemplate,
  saveAgencyContractTemplate,
  resetAgencyContractTemplate,
  CANONICAL_TOURISM_CLAUSES,
  type ContractClauseDTO,
} from "@/services/travel-contract.functions";

interface AgencyClausesEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function AgencyClausesEditorModal({
  open,
  onOpenChange,
  onSaved,
}: AgencyClausesEditorModalProps) {
  const [clauses, setClauses] = useState<ContractClauseDTO[]>([]);
  const [isCustom, setIsCustom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rawTextImport, setRawTextImport] = useState("");
  const [activeTab, setActiveTab] = useState<"editor" | "import">("editor");

  const loadTemplate = async () => {
    setIsLoading(true);
    try {
      const res = await getAgencyContractTemplate();
      setClauses(res.clauses || CANONICAL_TOURISM_CLAUSES);
      setIsCustom(res.isCustom);
    } catch {
      toast.error("Erro ao carregar minuta da agência.");
      setClauses(CANONICAL_TOURISM_CLAUSES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadTemplate();
    }
  }, [open]);

  // Atualizar título ou texto de uma cláusula
  const handleUpdateClause = (index: number, field: "section" | "clause_text", value: string) => {
    setClauses((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
      };
      return next;
    });
  };

  // Adicionar nova cláusula
  const handleAddClause = () => {
    setClauses((prev) => [
      ...prev,
      {
        number: prev.length + 1,
        section: `CLÁUSULA ${prev.length + 1}ª - NOVA DISPOSIÇÃO`,
        clause_text: "Descreva os termos específicos desta cláusula...",
        is_mandatory: true,
      },
    ]);
  };

  // Excluir cláusula
  const handleRemoveClause = (index: number) => {
    if (clauses.length <= 1) {
      toast.error("O contrato deve manter pelo menos uma cláusula.");
      return;
    }
    setClauses((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.map((item, idx) => ({ ...item, number: idx + 1 }));
    });
  };

  // Mover cláusula para cima ou baixo
  const handleMoveClause = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= clauses.length) return;

    setClauses((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next.map((item, idx) => ({ ...item, number: idx + 1 }));
    });
  };

  // Parser Inteligente de Texto Colado (Minuta Própria da Agência)
  const handleParseRawText = () => {
    const text = rawTextImport.trim();
    if (!text) {
      toast.error("Cole o texto do seu contrato para importar.");
      return;
    }

    // Procura por divisões de cláusulas: "CLÁUSULA", "CLAUSULA", "Artigo", "1.", "2." etc.
    const clauseRegex = /(?:(?:CL[AÁ]USULA\s+[0-9ªºa-z]+|ARTIGO\s+[0-9]+|[0-9]+\.)\s*[-–—:]*\s*([^\n\r]+)|([A-ZÇÃÕÉÊÁÀÍÓÚ\s]{4,}:))\s*[\n\r]+([\s\S]*?)(?=(?:CL[AÁ]USULA\s+[0-9ªºa-z]+|ARTIGO\s+[0-9]+|[0-9]+\.|\n\n[A-ZÇÃÕÉÊÁÀÍÓÚ\s]{4,}:|$))/gi;

    const parsed: ContractClauseDTO[] = [];
    let match;
    let count = 1;

    while ((match = clauseRegex.exec(text)) !== null) {
      const sectionTitle = (match[1] || match[2] || `CLÁUSULA ${count}ª`).trim();
      const clauseBody = (match[3] || "").trim();

      if (clauseBody.length > 5) {
        parsed.push({
          number: count,
          section: sectionTitle.toUpperCase(),
          clause_text: clauseBody,
          is_mandatory: true,
        });
        count++;
      }
    }

    // Fallback: se não encontrou o padrão por regex, divide por parágrafos duplos
    if (parsed.length === 0) {
      const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 10);
      paragraphs.forEach((p, idx) => {
        const lines = p.trim().split("\n");
        const title = lines.length > 1 ? lines[0].trim() : `CLÁUSULA ${idx + 1}ª`;
        const body = lines.length > 1 ? lines.slice(1).join("\n").trim() : lines[0].trim();

        parsed.push({
          number: idx + 1,
          section: title.toUpperCase(),
          clause_text: body,
          is_mandatory: true,
        });
      });
    }

    if (parsed.length > 0) {
      setClauses(parsed);
      setActiveTab("editor");
      toast.success(`${parsed.length} cláusulas identificadas e importadas com sucesso! Revise e clique em Salvar.`);
    } else {
      toast.error("Não foi possível identificar cláusulas no texto colado.");
    }
  };

  // Salvar Minuta no Banco de Dados da Loja
  const handleSaveTemplate = async () => {
    setIsSaving(true);
    try {
      const res = await saveAgencyContractTemplate({
        data: {
          clauses,
        },
      });

      if (res?.success) {
        toast.success(`Minuta padrão salva com sucesso! (${res.count} cláusulas ativas)`);
        setIsCustom(true);
        onSaved?.();
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar minuta padrão.");
    } finally {
      setIsSaving(false);
    }
  };

  // Restaurar Cláusulas Canônicas
  const handleResetToCanonical = async () => {
    if (!confirm("Deseja realmente restaurar as cláusulas para o modelo base Embratur/CDC? Suas cláusulas personalizadas serão removidas.")) {
      return;
    }
    setIsSaving(true);
    try {
      await resetAgencyContractTemplate();
      setClauses(CANONICAL_TOURISM_CLAUSES);
      setIsCustom(false);
      toast.success("Minuta restaurada para o padrão oficial!");
      onSaved?.();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao restaurar minuta.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/60 bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              <DialogTitle className="text-lg font-bold text-foreground">
                Minuta & Cláusulas Padrão da Agência
              </DialogTitle>
            </div>
            <Badge
              variant={isCustom ? "default" : "outline"}
              className="text-[10px] font-mono uppercase font-bold"
            >
              {isCustom ? "Minuta Personalizada Ativa" : "Padrão Embratur / CDC"}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Defina as regras jurídicas, intermediação turística, no-show e cancelamentos que serão aplicados automaticamente em todos os novos contratos e propostas aprovadas.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-3 border-b border-border/40 bg-muted/20 flex items-center justify-between">
            <TabsList className="bg-muted/60 p-1 rounded-xl h-9">
              <TabsTrigger value="editor" className="text-xs font-bold rounded-lg gap-1.5">
                <FileText className="size-3.5" />
                <span>Editor de Cláusulas ({clauses.length})</span>
              </TabsTrigger>
              <TabsTrigger value="import" className="text-xs font-bold rounded-lg gap-1.5">
                <FileUp className="size-3.5" />
                <span>Colar Minuta Própria</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetToCanonical}
                disabled={isSaving || isLoading}
                className="text-xs text-muted-foreground hover:text-destructive h-8 rounded-lg cursor-pointer"
              >
                <RotateCcw className="size-3.5 mr-1" />
                Restaurar Padrão
              </Button>
            </div>
          </div>

          {/* ABA 1: EDITOR VISUAL DE CLÁUSULAS */}
          <TabsContent value="editor" className="flex-1 overflow-y-auto p-6 space-y-4 m-0">
            {isLoading ? (
              <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
                <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                <p>Carregando minuta contratual...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clauses.map((clause, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3 transition-all hover:border-border"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold font-mono">
                          {clause.number}
                        </span>
                        <Input
                          value={clause.section}
                          onChange={(e) => handleUpdateClause(idx, "section", e.target.value)}
                          placeholder="TÍTULO DA CLÁUSULA (EX: DO OBJETO DO CONTRATO)"
                          className="h-8 text-xs font-bold font-mono uppercase bg-background rounded-lg flex-1"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={idx === 0}
                          onClick={() => handleMoveClause(idx, "up")}
                          className="size-7 rounded-lg"
                          title="Mover para cima"
                        >
                          <ChevronUp className="size-4 text-muted-foreground" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={idx === clauses.length - 1}
                          onClick={() => handleMoveClause(idx, "down")}
                          className="size-7 rounded-lg"
                          title="Mover para baixo"
                        >
                          <ChevronDown className="size-4 text-muted-foreground" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveClause(idx)}
                          className="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                          title="Excluir cláusula"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>

                    <Textarea
                      value={clause.clause_text}
                      onChange={(e) => handleUpdateClause(idx, "clause_text", e.target.value)}
                      placeholder="Texto completo da cláusula contratual..."
                      rows={3}
                      className="text-xs leading-relaxed rounded-xl bg-background border-border/60 resize-y"
                    />
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddClause}
                  className="w-full h-11 border-dashed border-2 rounded-2xl text-xs font-bold gap-2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Plus className="size-4" />
                  <span>Adicionar Nova Cláusula</span>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ABA 2: IMPORTADOR / COLAR MINUTA PRÓPRIA */}
          <TabsContent value="import" className="flex-1 overflow-y-auto p-6 space-y-4 m-0">
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h3 className="text-xs font-bold text-foreground">Importador Inteligente de Minuta Jurídica</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Copie o texto completo do contrato da sua agência no Word/PDF e cole abaixo. O sistema identificará automaticamente as cláusulas e parágrafos.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">Texto Completo do Contrato da Agência</Label>
              <Textarea
                value={rawTextImport}
                onChange={(e) => setRawTextImport(e.target.value)}
                placeholder={`Cole seu contrato aqui...\n\nExemplo:\nCLÁUSULA 1ª - DO OBJETO\nO presente contrato tem por objeto a intermediação turística...\n\nCLÁUSULA 2ª - DO CANCELAMENTO\nAs regras de cancelamento da operadora e cias aéreas...`}
                rows={12}
                className="text-xs font-mono leading-relaxed rounded-2xl bg-card border-border p-4"
              />
            </div>

            <Button
              type="button"
              onClick={handleParseRawText}
              disabled={!rawTextImport.trim()}
              className="w-full h-11 rounded-xl text-xs font-bold bg-primary text-primary-foreground gap-2 cursor-pointer"
            >
              <FileUp className="size-4" />
              <span>Processar Texto & Gerar Cláusulas</span>
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter className="p-4 border-t border-border/60 bg-card flex flex-row items-center justify-between sm:justify-between">
          <div className="text-[11px] text-muted-foreground hidden sm:block">
            {clauses.length} {clauses.length === 1 ? "cláusula configurada" : "cláusulas configuradas"}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-bold h-10"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSaving || clauses.length === 0}
              onClick={handleSaveTemplate}
              className="rounded-xl text-xs font-bold h-10 bg-primary text-primary-foreground gap-2 cursor-pointer"
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              <span>{isSaving ? "Salvando..." : "Salvar como Minuta Padrão da Agência"}</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
