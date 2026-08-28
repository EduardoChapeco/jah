import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/commerce/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyField } from "@/components/ui/currency-field";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EmptyState } from "@/components/state/states";
import { listGiftCards, createGiftCard, cancelGiftCard } from "@/services/giftcard.functions";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/datetime";
import { Search, Plus, Gift, CheckCircle, XCircle } from "lucide-react";

export const Route = createFileRoute("/workspace/marketing/gift-cards")({
  head: () => ({ meta: [{ title: "Vale-Presentes" }] }),
  loader: async () => {
    return { giftCards: await listGiftCards() };
  },
  component: GiftCardsDashboardPage,
});

function translateStatus(status: string) {
  if (status === "active") return "Ativo";
  if (status === "exhausted") return "Exaurido";
  if (status === "cancelled") return "Cancelado";
  return status;
}

function getStatusBadge(status: string): "success" | "secondary" | "destructive" {
  if (status === "active") return "success";
  if (status === "exhausted") return "secondary";
  if (status === "cancelled") return "destructive";
  return "secondary";
}

function NewGiftCardDrawer({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [balanceCents, setBalanceCents] = useState<number | undefined>(10000);
  const [email, setEmail] = useState("");

  const handleCreate = async () => {
    const valCents = balanceCents || 0;
    if (valCents < 100) {
      toast.error("O valor mínimo é R$ 1,00");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createGiftCard({
        data: {
          initialBalanceCents: valCents,
          recipientEmail: email || undefined,
        },
      });
      toast.success(`Vale-Presente gerado com sucesso! Código: ${res.code}`, { duration: 8000 });
      onCreated();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar vale-presente");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <SheetContent className="sm:max-w-md flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>Gerar Vale-Presente (Avulso)</SheetTitle>
          <SheetDescription>
            Crie um cartão presente manualmente para campanhas, cortesias ou vendas corporativas.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6 flex-1">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Valor do Cartão (R$)</Label>
              <CurrencyField
                value={balanceCents}
                onChange={setBalanceCents}
                placeholder="0,00"
                className="font-bold text-lg h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">E-mail do Destinatário (Opcional)</Label>
              <Input
                type="email"
                placeholder="cliente@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Se preenchido, o código será enviado automaticamente para este e-mail.
              </p>
            </div>

            <Button
              size="lg"
              className="w-full mt-4 font-bold"
              onClick={handleCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Gerando..." : "Gerar e Ativar Código"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function GiftCardsDashboardPage() {
  const { giftCards } = Route.useLoaderData();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredCards = (giftCards || []).filter((card: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return card.code?.toLowerCase().includes(q) || card.purchaserName?.toLowerCase().includes(q);
  });

  const handleCancel = async (id: string) => {
    if (
      !confirm(
        "Tem certeza que deseja cancelar este Vale-Presente? Esta ação não pode ser desfeita.",
      )
    )
      return;

    setProcessingId(id);
    try {
      await cancelGiftCard({ data: { id } });
      toast.success("Vale-Presente cancelado com sucesso.");
      router.invalidate();
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro ao cancelar.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader title="Vales-Presente & Store Credit" />
        <Button onClick={() => setIsDrawerOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Gerar Novo
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou gerador..."
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredCards.length === 0 ? (
        <EmptyState title="Nenhum Vale-Presente encontrado" />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Gerado Por</TableHead>
                <TableHead>Valor Inicial</TableHead>
                <TableHead>Saldo Atual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCards.map((card: any) => (
                <TableRow key={card.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(card.createdAt)}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-mono text-xs font-bold tracking-widest bg-muted/50"
                    >
                      {card.code}
                    </Badge>
                  </TableCell>
                  <TableCell>{card.purchaserName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatMoney(card.initialBalance)}
                  </TableCell>
                  <TableCell className="font-bold text-foreground">
                    {formatMoney(card.currentBalance)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(card.status)}>
                      {translateStatus(card.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {card.status === "active" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleCancel(card.id)}
                        disabled={processingId === card.id}
                      >
                        <XCircle className="size-4 mr-1" /> Cancelar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <NewGiftCardDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onCreated={() => {
          router.invalidate();
        }}
      />
    </div>
  );
}
