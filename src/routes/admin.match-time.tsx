import { createFileRoute } from "@tanstack/react-router";
import { getMatchTimeReport } from "@/services/match-time.functions";
import { PageHeader } from "@/components/commerce/page-header";
import { Surface } from "@/components/ui/surface";
import { EmptyState } from "@/components/state/states";
import { Heart, Flame, HeartCrack, Sparkles, Users, Award, Tag } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/match-time")({
  head: () => ({ meta: [{ title: "Match Time Reports" }] }),
  loader: async () => {
    const res = await getMatchTimeReport();
    return res;
  },
  component: AdminMatchTimePage,
});

function AdminMatchTimePage() {
  const { topProducts, topCategories, activeCustomers, totalSwipes } = Route.useLoaderData() as {
    topProducts: Array<{
      product: { title: string; slug: string };
      likes: number;
      dislikes: number;
    }>;
    topCategories: Array<{ id: string; name: string; likes: number; dislikes: number }>;
    activeCustomers: Array<{ id: string; name: string; likes: number; dislikes: number }>;
    totalSwipes: number;
  };

  const totalLikes = topProducts.reduce((sum, item) => sum + item.likes, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Relatórios e Descoberta"
        title="Match Time & Afinidade"
        description="Analise as preferências de produtos e categorias que os clientes mais curtem em tempo real."
      />

      {totalSwipes === 0 ? (
        <EmptyState
          title="Nenhum dado de descoberta ainda"
          description="Os clientes precisam iniciar sessões e avaliar produtos no swipe para que as métricas apareçam aqui. Compartilhe o link /match-time com eles."
        />
      ) : (
        <div className="space-y-8">
          {/* Métricas consolidadas */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Surface variant="zine" padding="none">
              <div className="flex flex-row items-center justify-between p-6 pb-2 space-y-0">
                <h3 className="text-sm font-medium leading-none tracking-tight">
                  Total de Avaliações
                </h3>
                <Flame className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="p-6 pt-0">
                <div className="text-2xl font-bold">{totalSwipes}</div>
                <p className="text-xs text-muted-foreground mt-1">Swipes computados no total</p>
              </div>
            </Surface>

            <Surface variant="zine" padding="none">
              <div className="flex flex-row items-center justify-between p-6 pb-2 space-y-0">
                <h3 className="text-sm font-medium leading-none tracking-tight">
                  Total de Curtidas
                </h3>
                <Heart className="h-4 w-4 text-primary fill-primary" />
              </div>
              <div className="p-6 pt-0">
                <div className="text-2xl font-bold text-primary">{totalLikes}</div>
                <p className="text-xs text-muted-foreground mt-1">Likes ou Superlikes</p>
              </div>
            </Surface>

            <Surface variant="zine" padding="none">
              <div className="flex flex-row items-center justify-between p-6 pb-2 space-y-0">
                <h3 className="text-sm font-medium leading-none tracking-tight">
                  Categoria Favorita
                </h3>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="p-6 pt-0">
                <div className="text-xl font-bold truncate">
                  {topCategories[0]?.name || "Nenhuma"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Com {topCategories[0]?.likes || 0} curtidas recebidas
                </p>
              </div>
            </Surface>

            <Surface variant="zine" padding="none">
              <div className="flex flex-row items-center justify-between p-6 pb-2 space-y-0">
                <h3 className="text-sm font-medium leading-none tracking-tight">Clientes Ativos</h3>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="p-6 pt-0">
                <div className="text-2xl font-bold">{activeCustomers.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Participaram da descoberta</p>
              </div>
            </Surface>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Categoria Afinidades */}
            <Surface variant="default" padding="none">
              <div className="p-6 flex flex-col space-y-1.5 border-b border-border/20 bg-muted/10">
                <h3 className="text-base flex items-center gap-2 font-semibold">
                  <Award className="size-5 text-warning" /> Categorias Populares
                </h3>
                <p className="text-sm text-muted-foreground">
                  Mapeamento das categorias mais curtidas pelos clientes.
                </p>
              </div>
              <div className="p-6">
                {topCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhuma categoria registrada.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {topCategories.map((cat, idx) => {
                      const total = cat.likes + cat.dislikes;
                      const percentage = total > 0 ? Math.round((cat.likes / total) * 100) : 0;
                      return (
                        <div key={cat.id} className="space-y-1">
                          <div className="flex justify-between text-sm font-medium">
                            <span className="truncate">
                              #{idx + 1} {cat.name}
                            </span>
                            <span className="text-muted-foreground">
                              {cat.likes} Likes ({percentage}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Surface>

            {/* Engajamento de Clientes */}
            <Surface variant="default" padding="none">
              <div className="p-6 flex flex-col space-y-1.5 border-b border-border/20 bg-muted/10">
                <h3 className="text-base flex items-center gap-2 font-semibold">
                  <Users className="size-5 text-primary" /> Clientes Mais Engajados
                </h3>
                <p className="text-sm text-muted-foreground">
                  Preferências individuais dos clientes que mais usaram o Match Time.
                </p>
              </div>
              <div className="p-6">
                {activeCustomers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Nenhum cliente registrado.
                  </p>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome do Cliente</TableHead>
                          <TableHead className="text-center">Likes</TableHead>
                          <TableHead className="text-center">Dislikes</TableHead>
                          <TableHead className="text-right">Afinidade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeCustomers.map((cust) => {
                          const total = cust.likes + cust.dislikes;
                          const ratio = total > 0 ? Math.round((cust.likes / total) * 100) : 0;
                          return (
                            <TableRow key={cust.id}>
                              <TableCell
                                className="font-medium max-w-[150px] truncate"
                                title={cust.name}
                              >
                                {cust.name}
                              </TableCell>
                              <TableCell className="text-center text-primary font-semibold">
                                {cust.likes}
                              </TableCell>
                              <TableCell className="text-center text-muted-foreground">
                                {cust.dislikes}
                              </TableCell>
                              <TableCell className="text-right font-bold text-success">
                                {ratio}%
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </Surface>
          </div>

          {/* Ranking de Produtos */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="size-5 text-primary fill-primary" /> Ranking dos Produtos Mais
              Desejados
            </h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {topProducts.map((item: any, index: number) => (
                <Surface
                  variant="default"
                  padding="none"
                  key={item.product.slug}
                  className="overflow-hidden bg-card border hover:shadow-md transition-shadow"
                >
                  <div className="bg-muted aspect-video relative flex items-center justify-center border-b">
                    <Flame className="w-10 h-10 text-primary opacity-15" />
                    <div className="absolute top-3 left-3 bg-background/90 backdrop-blur rounded-full px-3 py-1 text-xs font-bold text-foreground shadow-sm">
                      #{index + 1}
                    </div>
                  </div>
                  <div className="p-6 pb-2">
                    <h3
                      className="text-base font-semibold leading-tight truncate"
                      title={item.product.title}
                    >
                      {item.product.title}
                    </h3>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                      {item.product.slug}
                    </p>
                  </div>
                  <div className="p-6 pt-2 flex items-center justify-between text-xs font-semibold border-t">
                    <div className="flex items-center gap-1 text-primary">
                      <Heart className="w-3.5 h-3.5 fill-primary" />
                      <span>{item.likes} Likes</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <HeartCrack className="w-3.5 h-3.5" />
                      <span>{item.dislikes} Pulos</span>
                    </div>
                  </div>
                </Surface>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
