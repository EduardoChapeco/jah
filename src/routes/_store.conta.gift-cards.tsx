import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Gift, Sparkles, CheckCircle, Copy, AlertCircle, Calendar } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  listCustomerGiftCards,
  claimGiftCard,
  checkGiftCardBalance,
} from "@/services/giftcard.functions";
import { formatMoney } from "@/lib/money";
import { formatDate } from "../lib/datetime";

export const Route = createFileRoute("/_store/conta/gift-cards")({
  head: () => ({ meta: [{ title: "Meus Cartões-Presente" }] }),
  loader: async () => {
    const res = await listCustomerGiftCards();
    return {
      giftCards: res || [],
    };
  },
  component: CustomerGiftCardsPage,
});

const CheckBalanceSchema = z.object({
  code: z.string().min(5, "Código muito curto"),
});

function CustomerGiftCardsPage() {
  const { giftCards } = Route.useLoaderData();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof CheckBalanceSchema>>({
    resolver: zodResolver(CheckBalanceSchema),
    defaultValues: { code: "" },
  });

  const handleClaim = async (data: z.infer<typeof CheckBalanceSchema>) => {
    setIsLoading(true);
    try {
      const res = await claimGiftCard({ data: { code: data.code } });
      if (res) {
        toast.success("Vale-presente resgatado e vinculado à sua conta!");
        form.reset();
        router.invalidate();
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao resgatar cartão");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado para a área de transferência!");
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto font-sans text-foreground">
      <div className="border-b border-border pb-6 mb-8">
        <h1 className="text-4xl font-semibold font-black flex items-center gap-3 uppercase">
          <Gift className="size-10 text-primary" strokeWidth={3} />
          Meus Vales-Presente
        </h1>
        <p className="mt-2 text-foreground/80 font-medium">
          Gerencie seus cartões-presente ou vincule novos códigos à sua conta.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Adicionar / Resgatar Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="border border-border shadow-sm bg-secondary h-fit flex flex-col">
            <div className="p-6 border-b border-border">
              <h3 className="flex items-center gap-2 text-xl font-semibold font-black uppercase">
                <Sparkles className="size-6 text-primary" strokeWidth={2.5} />
                Resgatar
              </h3>
              <p className="text-sm font-medium text-foreground/80 mt-2">
                Ganhou um presente? Digite o código de 12 dígitos para salvá-lo na sua conta.
              </p>
            </div>
            <div className="p-6 bg-background">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleClaim)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-foreground uppercase tracking-wider">
                          Código do Cartão
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: ABCD-1234-WXYZ"
                            className="font-mono uppercase font-bold border border-border h-12 rounded-md focus-visible:ring-0 focus-visible:border-poster-red"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full font-black uppercase tracking-wider text-sm h-12 bg-primary text-primary-foreground border border-border rounded-md cursor-pointer"
                    disabled={isLoading}
                  >
                    {isLoading ? "Resgatando..." : "Resgatar Vale"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>

        {/* Listagem de Cartões Vinculados */}
        <div className="md:col-span-2 space-y-6">
          <h3 className="font-semibold text-2xl font-black flex items-center gap-3 uppercase border-b border-border pb-3">
            Vinculados
            <span className="bg-primary text-primary-foreground text-sm px-3 py-1 font-mono shadow-sm">
              {giftCards.length}
            </span>
          </h3>

          {giftCards.length === 0 ? (
            <div className="border border-dashed border-border p-10 text-center bg-background flex flex-col items-center gap-4">
              <Gift className="size-16 text-foreground/30" strokeWidth={1.5} />
              <div className="space-y-2">
                <p className="font-semibold text-2xl font-black uppercase">Nenhum vale-presente</p>
                <p className="text-sm text-foreground/70 max-w-sm mx-auto font-medium">
                  Os vales vinculados aparecem automaticamente como saldo disponível no Checkout.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-5">
              {giftCards.map((card: any) => {
                const isUsed = card.status === "used" || card.current_balance_cents === 0;
                const isExpired = card.expires_at && new Date(card.expires_at) < new Date();

                return (
                  <div
                    key={card.id}
                    className={`relative p-5 sm:p-6 border border-border shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all ${isUsed || card.status === "cancelled" || isExpired ? "bg-muted/30/50 opacity-80" : "bg-background hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)]"}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-lg bg-secondary border border-border px-2 py-0.5">
                          {card.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(card.code)}
                          className="size-8 border border-border bg-white flex items-center justify-center text-foreground rounded-md cursor-pointer"
                        >
                          <Copy className="size-4" />
                        </button>
                      </div>

                      <div className="flex gap-4 text-sm text-foreground/70 font-medium font-mono">
                        <span>Orig: {formatMoney(card.initial_balance_cents)}</span>
                        {card.expires_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="size-4" />
                            Exp: {formatDate(card.expires_at).split(" ")[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-0 border-border pt-4 sm:pt-0">
                      <div className="text-right">
                        <span className="text-xs text-foreground uppercase font-bold tracking-wider block">
                          Saldo Atual
                        </span>
                        <span
                          className={`text-2xl font-semibold font-black ${isUsed ? "text-foreground/50" : "text-primary"}`}
                        >
                          {formatMoney(card.current_balance_cents)}
                        </span>
                      </div>

                      <div>
                        {card.status === "cancelled" ? (
                          <span className="border border-border bg-primary text-primary-foreground font-black uppercase text-[10px] px-2 py-1 shadow-sm">
                            Cancelado
                          </span>
                        ) : isExpired ? (
                          <span className="border border-border bg-muted/30 text-foreground font-black uppercase text-[10px] px-2 py-1 shadow-sm">
                            Expirado
                          </span>
                        ) : isUsed ? (
                          <span className="border border-border bg-white text-foreground/50 font-black uppercase text-[10px] px-2 py-1 shadow-sm">
                            Utilizado
                          </span>
                        ) : (
                          <span className="border border-border bg-success text-white font-black uppercase text-[10px] px-2 py-1 shadow-sm">
                            Ativo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
