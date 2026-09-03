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

  const getTemplateStarter = (cat: string, docTitle: string) => {
    switch (cat) {
      case "vehicle_sale":
        return `# CONTRATO DE COMPRA E VENDA DE VEÍCULO AUTOMOTOR\n\n**PROMITENTE VENDEDOR:** [Nome do Vendedor], CPF/CNPJ [Número], residente em [Endereço].\n\n**PROMITENTE COMPRADOR:** [Nome do Comprador], CPF/CNPJ [Número], residente em [Endereço].\n\n### CLÁUSULA 1ª — DO OBJETO\nO presente instrumento tem por objeto a alienação do veículo:\n- **Marca / Modelo:** [Ex: Toyota Corolla 2.0 XEi]\n- **Ano / Modelo:** [Ex: 2022/2023]\n- **Placa / Renavam:** [Placa] / [Renavam]\n- **Cor / Chassi:** [Cor] / [Chassi]\n\n### CLÁUSULA 2ª — DO PREÇO E CONDIÇÕES DE PAGAMENTO\nO preço certo e ajustado é de R$ [Valor], a ser quitado nas seguintes condições: [À vista via PIX / Financiamento Bancário].\n\n### CLÁUSULA 3ª — DAS MULTAS E INFRAÇÕES\nTodas as infrações de trânsito até a presente data são de responsabilidade do VENDEDOR, passando as posteriores à posse para o COMPRADOR.`;
      case "vehicle_consignation":
        return `# TERMO DE AUTORIZAÇÃO DE VENDA EM CONSIGNAÇÃO\n\n**PROPRIETÁRIO (CONSIGNANTE):** [Nome], CPF [Número].\n**ESTABELECIMENTO (CONSIGNATÁRIO):** [Nome da Loja], CNPJ [Número].\n\n### CLÁUSULA 1ª — DO VEÍCULO CONSIGNADO\nO Vendedor entrega o veículo [Marca/Modelo], Placa [Placa], Ano [Ano] para exposição e comercialização pelo valor líquido acordado de R$ [Valor].`;
      case "real_estate_rental":
        return `# CONTRATO DE LOCAÇÃO RESIDENCIAL / COMERCIAL\n\n**LOCADOR:** [Nome do Locador], CPF [Número].\n**LOCATÁRIO:** [Nome do Locatário], CPF [Número].\n\n### CLÁUSULA 1ª — DO IMÓVEL\nO imóvel objeto desta locação situa-se à [Endereço Completo do Imóvel], matriculado sob nº [Número] do CRI local.\n\n### CLÁUSULA 2ª — DO VALOR DO ALUGUEL E ENCARGOS\nO aluguel mensal inicial é fixado em R$ [Valor], com vencimento no dia [Dia] de cada mês subsequente, além de condomínio e IPTU.\n\n### CLÁUSULA 3ª — DA VISTORIA E DEVOLUÇÃO\nO Locatário declara receber o imóvel em perfeitas condições conforme Laudo de Vistoria Inicial anexo.`;
      case "real_estate_sale":
        return `# INSTRUMENTO PARTICULAR DE PROMESSA DE COMPRA E VENDA DE IMÓVEL\n\n**PROMITENTES VENDEDORES:** [Nome dos Vendedores].\n**PROMITENTES COMPRADORES:** [Nome dos Compradores].\n\n### CLÁUSULA 1ª — DO IMÓVEL\nImóvel situado à [Endereço], Matrícula nº [Matrícula] do Registro de Imóveis.\n\n### CLÁUSULA 2ª — DO PREÇO TOTAL E SINAL (ARRAS)\nO preço total é de R$ [Valor], sendo R$ [Valor do Sinal] a título de sinal e princípio de pagamento.`;
      case "legal_retainer":
        return `# CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS E HONORÁRIOS\n\n**CONTRATADO:** [Nome do Advogado / Sociedade de Advogados], OAB/[UF] nº [Número].\n**CONTRATANTE:** [Nome do Cliente], CPF/CNPJ [Número].\n\n### CLÁUSULA 1ª — DO OBJETO\nPrestação de serviços jurídicos profissionais consistentes em: [Defesa/Propositura da ação judicial ou assessoria extrajudicial].\n\n### CLÁUSULA 2ª — DOS HONORÁRIOS ADVOCATÍCIOS\nPelos serviços ajustados, o CONTRATANTE pagará honorários de R$ [Valor Fixo / Pró-labore] acrescidos de [Percentual]% sobre o proveito econômico obtido (ad exitum).`;
      case "tourism_package":
        return `# CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE INTERMEDIAÇÃO TURÍSTICA\n\n**AGÊNCIA:** [Nome da Agência de Turismo], Cadastur nº [Número].\n**CONTRATANTE / VIAJANTE:** [Nome do Passageiro Principal], CPF [Número].\n\n### CLÁUSULA 1ª — DOS SERVIÇOS TURÍSTICOS ADQUIRIDOS\nO pacote contratado compreende [Passagens Aéreas / Hospedagem / Traslados / Passeios] para o destino [Destino] no período de [Data Início] a [Data Fim].\n\n### CLÁUSULA 2ª — DAS CONDIÇÕES DE CANCELAMENTO\nAs regras de cancelamento, no-show e reembolso seguem estritamente as deliberações normativas da EMBRATUR e condições tarifárias das companhias aéreas e hotéis parceiros.`;
      case "medical_aesthetic_consent":
        return `# TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE)\n\n**PROFISSIONAL / CLÍNICA:** [Nome do Responsável Técnico], Registro nº [CRM/CRO/CRBM].\n**PACIENTE / CLIENTE:** [Nome do Paciente], CPF [Número].\n\n### CLÁUSULA 1ª — DO PROCEDIMENTO\nDeclaro que fui amplamente informado(a) sobre a indicação, metodologia, contraindicações e cuidados pós-procedimento de: [Nome do Procedimento / Tratamento].\n\n### CLÁUSULA 2ª — DO CONSENTIMENTO\nAutorizo livremente a execução do plano terapêutico acordado e comprometo-me a seguir as orientações de recuperação.`;
      case "service_agreement":
        return `# CONTRATO DE PRESTAÇÃO DE SERVIÇOS PROFISSIONAIS\n\n**CONTRATANTE:** [Nome], CNPJ/CPF [Número].\n**CONTRATADO:** [Nome], CNPJ/CPF [Número].\n\n### CLÁUSULA 1ª — DO ESCOPO DOS SERVIÇOS\nConstitui objeto deste contrato a prestação dos serviços especializados de: [Descrição Detalhada do Escopo].\n\n### CLÁUSULA 2ª — DO PRAZO E DA ENTREGA\nO prazo estimado para conclusão do serviço é de [Prazo/Dias], com entregas parciais conforme cronograma.`;
      default:
        return `# ${docTitle}\n\n### CLÁUSULA 1ª — DAS PARTES E OBJETO\nO presente instrumento estabelece o acordo formal entre as partes para [Descrever Objeto do Acordo].\n\n### CLÁUSULA 2ª — DAS OBRIGAÇÕES E PRAZOS\nAs partes comprometem-se a cumprir os termos estipulados conforme legislação civil vigente.`;
    }
  };

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
          contentMarkdown: getTemplateStarter(category, title),
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

      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-3xl border border-border/80">
        <div className="space-y-3">
          <Label htmlFor="title" className="text-xs font-bold">Título do Documento</Label>
          <Input 
            id="title" 
            placeholder="Ex: Contrato de Compra e Venda de Veículo" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base py-5 rounded-xl"
            autoFocus
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="category" className="text-xs font-bold">Categoria & Nicho de Negócio</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category" className="py-5 rounded-xl">
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="general_deal">🤝 Acordo Comercial Geral</SelectItem>
              <SelectItem value="vehicle_sale">🚗 Compra e Venda de Veículo</SelectItem>
              <SelectItem value="vehicle_consignation">📋 Consignação de Veículo em Garagem</SelectItem>
              <SelectItem value="real_estate_rental">🏠 Locação de Imóvel (Residencial / Comercial)</SelectItem>
              <SelectItem value="real_estate_sale">🏢 Compra e Venda de Imóvel</SelectItem>
              <SelectItem value="service_agreement">🛠️ Prestação de Serviços Gerais / Técnicos</SelectItem>
              <SelectItem value="legal_retainer">⚖️ Honorários Advocatícios & Procuração</SelectItem>
              <SelectItem value="tourism_package">✈️ Intermediação de Viagens & Turismo</SelectItem>
              <SelectItem value="medical_aesthetic_consent">🩺 Termo de Consentimento (Saúde & Estética)</SelectItem>
              <SelectItem value="employment">👔 Acordo de Trabalho / Prestador PJ</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            O editor carregará automaticamente a minuta canônica e as cláusulas padrões do setor selecionado.
          </p>
        </div>

        <div className="pt-4 flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="rounded-xl px-8 h-11 font-bold">
            {isSubmitting ? "Criando..." : "Ir para o Editor de Contrato"}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
}
