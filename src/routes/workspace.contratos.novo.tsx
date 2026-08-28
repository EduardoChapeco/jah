import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createContract } from "@/services/contracts.functions";

export const Route = createFileRoute("/workspace/contratos/novo")({
  head: () => ({ meta: [{ title: "Novo Contrato" }] }),
  component: NovoContratoPage,
});

function NovoContratoPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general_deal");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.length < 3) {
      toast.error("O título deve ter pelo menos 3 caracteres.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { contract } = await createContract({
        data: {
          title,
          category: category as any,
          contentMarkdown: "# " + title + "\n\n(Insira o corpo do contrato aqui)",
        },
      });
      toast.success("Rascunho criado! Redirecionando para o editor...");
      navigate({ to: `/workspace/contratos/${contract.id}/editor` });
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar contrato");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      <PageHeader title="Criar Novo Contrato" />

      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-3xl border">
        <div className="space-y-3">
          <Label htmlFor="title">Título do Documento</Label>
          <Input 
            id="title" 
            placeholder="Ex: Contrato de Compra e Venda de Veículo" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg py-6"
            autoFocus
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="category">Categoria</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category" className="py-6">
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general_deal">Acordo Geral (General Deal)</SelectItem>
              <SelectItem value="real_estate_rental">Locação de Imóvel</SelectItem>
              <SelectItem value="vehicle_sale">Compra e Venda de Veículo</SelectItem>
              <SelectItem value="service_agreement">Prestação de Serviços</SelectItem>
              <SelectItem value="employment">Trabalho / Emprego</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="rounded-xl px-8">
            {isSubmitting ? "Criando..." : "Ir para o Editor"}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
}
