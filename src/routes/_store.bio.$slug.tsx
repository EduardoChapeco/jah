import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  User2,
  ExternalLink,
  MessageCircle,
  QrCode,
  Copy,
  Check,
  Link as LinkIcon,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getLinkInBio } from "@/services/cms.functions";

export const Route = createFileRoute("/_store/bio/$slug")({
  loader: async () => {
    const res = await getLinkInBio().catch(() => null);
    if (!res || res.status === "unconfigured") throw notFound();
    return res;
  },
  head: ({ loaderData }) => {
    if (!loaderData || !loaderData.title) return { meta: [{ title: "Biolink não encontrado" }] };
    return {
      meta: [
        { title: `${loaderData.title} | Link da Bio` },
        { name: "description", content: loaderData.description || "" },
      ],
    };
  },
  component: BiolinkPage,
});

const THEME_STYLES: Record<string, { bg: string; card: string; text: string }> = {
  clean: {
    bg: "bg-zinc-50 dark:bg-zinc-950",
    card: "bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:border-zinc-400 dark:hover:border-zinc-600 text-zinc-900 dark:text-zinc-100",
    text: "text-zinc-900 dark:text-zinc-100",
  },
  dark: {
    bg: "bg-black",
    card: "bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 text-white",
    text: "text-white",
  },
  glass: {
    bg: "bg-linear-to-br from-indigo-950 via-slate-900 to-black",
    card: "bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 text-white",
    text: "text-white",
  },
  sunset: {
    bg: "bg-linear-to-b from-orange-500 via-rose-600 to-purple-900",
    card: "bg-white/15 backdrop-blur-md border border-white/30 hover:bg-white/25 text-white",
    text: "text-white",
  },
  emerald: {
    bg: "bg-linear-to-b from-emerald-950 via-teal-900 to-black",
    card: "bg-emerald-900/40 backdrop-blur-md border border-emerald-700/50 hover:bg-emerald-800/40 text-emerald-100",
    text: "text-white",
  },
  zine: {
    bg: "bg-[#f4efe6]",
    card: "bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black",
    text: "text-black",
  },
};

function BiolinkPage() {
  const bio = Route.useLoaderData();
  const [copiedPixId, setCopiedPixId] = useState<string | null>(null);

  if (!bio) return null;

  const themeKey = (bio.theme as string) || "clean";
  const theme = THEME_STYLES[themeKey] || THEME_STYLES.clean;
  const socials = (bio.socials as Record<string, string>) || {};
  const links = Array.isArray(bio.links) ? bio.links : [];

  const handleCopyPix = (pixKey: string, blockId: string) => {
    if (!pixKey) return;
    navigator.clipboard.writeText(pixKey);
    setCopiedPixId(blockId);
    toast.success("Chave PIX copiada para a área de transferência!");
    setTimeout(() => setCopiedPixId(null), 3000);
  };

  return (
    <main
      className={`w-full min-h-screen ${theme.bg} ${theme.text} flex flex-col items-center justify-between py-12 px-4 transition-colors duration-300`}
    >
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        {/* ── 1. Top Avatar & Bio ── */}
        <div className="flex flex-col items-center gap-3 w-full text-center">
          <div className="size-24 rounded-full bg-muted/40 border-2 border-white/20 overflow-hidden flex items-center justify-center">
            {bio.avatar_url ? (
              <img src={bio.avatar_url} alt={bio.title} className="size-full object-cover" />
            ) : (
              <User2 className="size-10 opacity-50" />
            )}
          </div>

          <div className="space-y-1 max-w-sm">
            <h1 className="text-xl font-black tracking-tight">{bio.title}</h1>
            {bio.description && (
              <p className="text-xs opacity-80 leading-relaxed whitespace-pre-wrap">
                {bio.description}
              </p>
            )}
          </div>
        </div>

        {/* ── 2. Ícones Sociais ── */}
        {Object.values(socials).some(Boolean) && (
          <div className="flex items-center justify-center gap-3 py-1 flex-wrap">
            {socials.instagram && (
              <a
                href={
                  socials.instagram.startsWith("http")
                    ? socials.instagram
                    : `https://instagram.com/${socials.instagram.replace("@", "")}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="size-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110"
              >
                <Instagram className="size-4" />
              </a>
            )}
            {socials.whatsapp && (
              <a
                href={`https://wa.me/${socials.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="size-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110"
              >
                <MessageCircle className="size-4 text-emerald-400" />
              </a>
            )}
            {socials.youtube && (
              <a
                href={socials.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="size-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110"
              >
                <Youtube className="size-4 text-destructive" />
              </a>
            )}
            {socials.linkedin && (
              <a
                href={socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="size-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110"
              >
                <Linkedin className="size-4 text-info" />
              </a>
            )}
            {socials.twitter && (
              <a
                href={
                  socials.twitter.startsWith("http")
                    ? socials.twitter
                    : `https://x.com/${socials.twitter.replace("@", "")}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="size-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110"
              >
                <Twitter className="size-4 text-sky-400" />
              </a>
            )}
            {socials.email && (
              <a
                href={`mailto:${socials.email}`}
                className="size-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110"
              >
                <Mail className="size-4 text-amber-400" />
              </a>
            )}
          </div>
        )}

        {/* ── 3. Lista de Blocos & Links Ricos ── */}
        <div className="w-full flex flex-col gap-3">
          {links.map((block: any, index: number) => {
            if (block.type === "header") {
              return (
                <div key={block.id || index} className="pt-4 pb-1 text-center">
                  <span className="text-xs font-bold uppercase tracking-widest opacity-70">
                    {block.label}
                  </span>
                </div>
              );
            }

            if (block.type === "pix") {
              const isCopied = copiedPixId === (block.id || String(index));
              return (
                <div
                  key={block.id || index}
                  className={`w-full p-4 rounded-2xl flex flex-col gap-2 transition-all ${theme.card}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm flex items-center gap-2">
                      <QrCode className="size-4 text-primary" />
                      <span>{block.label}</span>
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      PIX
                    </Badge>
                  </div>
                  {block.pixReceiver && (
                    <span className="text-xs opacity-75">{block.pixReceiver}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopyPix(block.pixKey, block.id || String(index))}
                    className="mt-1 flex items-center justify-between p-2.5 rounded-xl bg-black/20 hover:bg-black/30 transition-colors font-mono text-xs cursor-pointer"
                  >
                    <span className="truncate pr-2">{block.pixKey}</span>
                    {isCopied ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
                        <Check className="size-3.5" />
                        <span>Copiado</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 opacity-70 shrink-0">
                        <Copy className="size-3.5" />
                        <span>Copiar</span>
                      </span>
                    )}
                  </button>
                </div>
              );
            }

            const isWhatsapp = block.type === "whatsapp";
            let targetUrl = block.url || "#";
            if (isWhatsapp && !targetUrl.startsWith("http")) {
              const cleanNumber = targetUrl.replace(/\D/g, "");
              const message = block.subtitle ? encodeURIComponent(block.subtitle) : "";
              targetUrl = `https://wa.me/${cleanNumber}${message ? `?text=${message}` : ""}`;
            }

            return (
              <a
                key={block.id || index}
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full p-4 rounded-2xl flex items-center justify-between gap-3 text-sm font-semibold transition-all hover:scale-[1.015] active:scale-[0.99] ${
                  theme.card
                } ${block.isHighlighted ? "ring-2 ring-amber-400" : ""}`}
              >
                <div className="flex-1 text-left truncate space-y-0.5">
                  <div className="flex items-center gap-2">
                    {isWhatsapp ? (
                      <MessageCircle className="size-4 text-emerald-400 shrink-0" />
                    ) : (
                      <LinkIcon className="size-4 opacity-60 shrink-0" />
                    )}
                    <span className="font-bold truncate">{block.label}</span>
                  </div>
                  {block.subtitle && !isWhatsapp && (
                    <p className="text-xs opacity-75 truncate">{block.subtitle}</p>
                  )}
                </div>

                {block.badge && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500 text-white shrink-0">
                    {block.badge}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      </div>

      {/* ── 4. Rodapé Powered by Wider ── */}
      <footer className="pt-12 pb-4 text-center">
        <a
          href="/"
          className="text-xs opacity-40 hover:opacity-100 transition-opacity font-bold uppercase tracking-widest"
        >
          Wider Community
        </a>
      </footer>
    </main>
  );
}
