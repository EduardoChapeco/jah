import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Tag, GitBranch, 
 Play, 
 Plus, 
 Settings2, 
 Zap, 
 Clock, 
 MessageSquare, 
 Mail, 
 CheckCircle2, 
 ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/workspace/automacoes")({
 head: () => ({ meta: [{ title: "Workflows & Automações | Wider OS" }] }),
 component: AutomacoesWorkflowsPage,
});

function AutomacoesWorkflowsPage() {
 const [activeWorkflow, setActiveWorkflow] = useState<string>("wf-1");

 const WORKFLOW_NODES = [
 { id: "1", title: "Gatilho: Pedido Pago", type: "trigger", icon: Zap, color: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
 { id: "2", title: "Condição: Pedido > R$ 150", type: "condition", icon: GitBranch, color: "text-blue-500 bg-blue-500/10 border-blue-500/30" },
 { id: "3", title: "Ação: Enviar Cupom WhatsApp", type: "action", icon: MessageSquare, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
 { id: "4", title: "Ação: Adicionar Tag VIP", type: "action", icon: CheckCircle2, color: "text-purple-500 bg-purple-500/10 border-purple-500/30" },
 ];

 return (
 <div className="flex-1 space-y-6 p-6 max-w-7xl mx-auto">
 <div className="flex items-center justify-between">
 <PageHeader
 title="Automações Visuais em Nós"
 description="Crie réguas de relacionamento, disparo de mensagens e integrações automáticas arrastando blocos."
 />
 <Button className="rounded-2xl min-h-[44px] font-bold">
 <Plus className="h-4 w-4 mr-2" /> Novo Workflow
 </Button>
 </div>

 {/* Canvas Visual de Diagrama em Nós */}
 <div className="bg-card/70 backdrop-blur-xl border border-border p-8 rounded-2xl min-h-[420px] flex flex-col justify-center items-center shadow-sm relative overflow-hidden">
 <div className="flex flex-col sm:flex-row items-center gap-4 z-10">
 {WORKFLOW_NODES.map((node, idx) => {
 const Icon = node.icon;
 return (
 <div key={node.id} className="flex flex-col sm:flex-row items-center gap-4">
 <div className={`p-5 rounded-2xl border shadow-md w-60 text-center space-y-2 ${node.color}`}>
 <div className="flex items-center justify-center">
 <Icon className="h-6 w-6" />
 </div>
 <h4 className="font-bold text-sm text-foreground">{node.title}</h4>
 <Badge variant="outline" className="text-[10px] uppercase font-bold py-0.5 px-2">
 {node.type}
 </Badge>
 </div>

 {idx < WORKFLOW_NODES.length - 1 && (
 <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90 sm:rotate-0" />
 )}
 </div>
 );
 })}
 </div>

 <div className="mt-8 flex gap-3">
 <Button variant="outline" className="rounded-xl min-h-[44px] text-xs font-semibold">
 <Settings2 className="h-4 w-4 mr-1.5" /> Configurar Parâmetros
 </Button>
 <Button className="rounded-xl min-h-[44px] text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white">
 <Play className="h-4 w-4 mr-1.5" /> Testar Execução em Sandbox
 </Button>
 </div>
 </div>
 </div>
 );
}
