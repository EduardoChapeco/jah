import { createFileRoute, notFound } from "@tanstack/react-router";
import { getLinkInBio } from "@/services/cms.functions";
import { User2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_store/bio/$slug")({
  loader: async () => {
    const res = await getLinkInBio();
    if (!res || res.status === "unconfigured") throw notFound();
    return res;
  },
  head: ({ loaderData }) => {
    if (!loaderData || !loaderData.title) return { meta: [{ title: "Biolink não encontrado" }] };
    return {
      meta: [
        { title: loaderData.title },
        { name: "description", content: loaderData.description || "" },
      ],
    };
  },
  component: BiolinkPage,
});

function BiolinkPage() {
  const bio = Route.useLoaderData();

  if (!bio) return null;

  return (
    <main className="w-full flex flex-col gap-6 min-h-screen bg-background items-center py-12 px-4">
      <div className="flex flex-col items-center gap-4 w-full max-w-md text-center">
        <div className="size-24 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center">
          {bio.avatar_url ? (
            <img src={bio.avatar_url} alt="Avatar" className="size-full object-cover" />
          ) : (
            <User2 className="size-8 text-muted-foreground opacity-50" />
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold font-display">{bio.title}</h1>
          {bio.description && (
            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{bio.description}</p>
          )}
        </div>
      </div>

      <div className="w-full max-w-md flex flex-col gap-3">
        {bio.links && Array.isArray(bio.links) ? (
          bio.links.map((link: any, index: number) => (
            <Button
              key={index}
              asChild
              variant="outline"
              className="w-full h-14 font-bold border-2 hover:bg-muted"
            >
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            </Button>
          ))
        ) : null}
      </div>
    </main>
  );
}
