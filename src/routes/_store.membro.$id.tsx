import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { User, MessageSquare, Tag, MapPin, Calendar, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/datetime";
import { getPublicMemberProfile } from "@/services/social.functions";

export const Route = createFileRoute("/_store/membro/$id")({
  head: ({ loaderData }: { loaderData?: { data: any } }) => ({
    meta: [
      {
        title: loaderData?.data?.profile?.full_name
          ? `${loaderData.data.profile.full_name} | Membro JAH`
          : "Perfil do Membro | JAH",
      },
      {
        name: "description",
        content: loaderData?.data?.profile?.bio || "Perfil comunitário de membro na JAH.",
      },
    ],
  }),
  loader: async ({ params }): Promise<{ data: any }> => {
    const data = await getPublicMemberProfile({ data: { profileId: params.id } }).catch(() => null);
    return { data };
  },
  component: MemberPublicProfilePage,
});

function MemberPublicProfilePage() {
  const { data } = Route.useLoaderData();

  if (!data || !data.profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
          <User className="size-8" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Membro não encontrado</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Este perfil pode ter sido removido ou não está acessível publicamente.
        </p>
        <Button asChild className="mt-6 rounded-xl" variant="outline">
          <Link to="/">
            <ArrowLeft className="size-4 mr-2" />
            Voltar para o Feed
          </Link>
        </Button>
      </div>
    );
  }

  const { profile, posts, classifieds } = data;
  const initial = profile.full_name?.charAt(0)?.toUpperCase() || "M";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 space-y-6">
      {/* Header do Perfil */}
      <div className="squircle-soft border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <Avatar className="size-24 sm:size-28 squircle-media border-2 border-border shrink-0">
            <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name} />
            <AvatarFallback className="bg-primary/10 text-primary font-black text-2xl squircle-media">
              {initial}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
                  {profile.full_name || "Membro da Comunidade"}
                </h1>
                <p className="text-xs text-muted-foreground font-medium flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                  <Calendar className="size-3.5" />
                  Membro desde {formatDate(profile.created_at).split(" ")[0]}
                </p>
              </div>

              <Badge
                variant="secondary"
                className="text-xs uppercase font-bold self-center sm:self-start"
              >
                Membro Verificado
              </Badge>
            </div>

            {profile.bio && (
              <p className="text-sm text-foreground/80 leading-relaxed pt-1">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Abas de Conteúdo (Publicações e Classificados) */}
      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 h-11 p-1 bg-muted rounded-xl">
          <TabsTrigger value="posts" className="rounded-lg text-xs font-bold gap-2">
            <MessageSquare className="size-4" />
            Publicações ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="classifieds" className="rounded-lg text-xs font-bold gap-2">
            <Tag className="size-4" />
            Classificados ({classifieds.length})
          </TabsTrigger>
        </TabsList>

        {/* Lista de Publicações */}
        <TabsContent value="posts" className="space-y-4">
          {posts.length === 0 ? (
            <div className="border border-dashed border-border p-8 text-center bg-card rounded-2xl">
              <p className="text-sm text-muted-foreground">
                Nenhuma publicação compartilhada ainda.
              </p>
            </div>
          ) : (
            posts.map((post: any) => (
              <div
                key={post.id}
                className="border border-border bg-card rounded-2xl p-5 shadow-sm space-y-3"
              >
                {post.content_text && (
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {post.content_text}
                  </p>
                )}

                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="rounded-xl overflow-hidden border border-border bg-black max-h-96">
                    {post.media_urls[0].toLowerCase().endsWith(".mp4") ? (
                      <video
                        src={post.media_urls[0]}
                        controls
                        playsInline
                        className="size-full object-contain"
                      />
                    ) : (
                      <img
                        src={post.media_urls[0]}
                        alt="Mídia"
                        className="size-full object-cover"
                      />
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                  <span>{formatDate(post.created_at)}</span>
                  {post.location_name && (
                    <span className="flex items-center gap-1 text-primary">
                      <MapPin className="size-3" />
                      {post.location_name}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Lista de Classificados */}
        <TabsContent value="classifieds" className="space-y-4">
          {classifieds.length === 0 ? (
            <div className="border border-dashed border-border p-8 text-center bg-card rounded-2xl">
              <p className="text-sm text-muted-foreground">Nenhum classificado ativo anunciado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {classifieds.map((cl: any) => (
                <Link
                  key={cl.id}
                  to={`/classificados/${cl.id}` as any}
                  className="border border-border bg-card rounded-2xl overflow-hidden hover:border-primary/50 transition-all group flex flex-col shadow-sm"
                >
                  <div className="aspect-[4/3] bg-muted overflow-hidden">
                    {cl.images?.[0] ? (
                      <img
                        src={cl.images[0]}
                        alt={cl.title}
                        className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center text-muted-foreground">
                        <Tag className="size-10 opacity-30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        {cl.category}
                      </span>
                      <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {cl.title}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                      <span className="font-bold text-primary text-sm">
                        {cl.price_cents !== null && cl.price_cents !== undefined
                          ? formatMoney(cl.price_cents)
                          : "A Combinar"}
                      </span>
                      {cl.location_name && (
                        <span className="text-muted-foreground truncate max-w-[120px]">
                          {cl.location_name}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
