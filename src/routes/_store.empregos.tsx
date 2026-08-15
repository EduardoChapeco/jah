import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  MagnifyingGlass,
  MapPin,
  Clock,
  Phone,
  Buildings,
  CurrencyDollar,
  CheckCircle,
  Sparkle,
  Users,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";
import { listActiveBanners } from "@/services/banner.functions";
import { listActiveHotpages } from "@/services/hotpage.functions";
import { listPublicJobs } from "@/services/jobs.functions";

export const Route = createFileRoute("/_store/empregos")({
  head: () => ({
    meta: [
      { title: "Vagas de Emprego, Carreiras & Estágios — JAH" },
      {
        name: "description",
        content:
          "Encontre oportunidades de trabalho, vagas CLT, estágios, home office e vagas no comércio e indústria de Chapecó e região.",
      },
    ],
  }),
  loader: async () => {
    const [banners, hotpages, jobs] = await Promise.all([
      listActiveBanners({ data: { placement: "home" } }).catch(() => []),
      listActiveHotpages({ data: { module: "home" } }).catch(() => []),
      listPublicJobs().catch(() => []),
    ]);

    return { banners, hotpages, jobs };
  },
  component: JobsMasterPage,
});

const JOBS_HOTPAGES = [
  {
    id: "hp-job-1",
    title: "Vagas CLT",
    slug: "clt",
    cover_image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    badge_label: "Carteira Assinada",
    show_title: true,
    show_overlay: true,
  },
  {
    id: "hp-job-2",
    title: "Estágios & Trainee",
    slug: "estagio",
    cover_image_url: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80",
    badge_label: "Estudantes",
    show_title: true,
    show_overlay: true,
  },
  {
    id: "hp-job-3",
    title: "Home Office & Tech",
    slug: "tech",
    cover_image_url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
    badge_label: "Remoto / TI",
    show_title: true,
    show_overlay: true,
  },
  {
    id: "hp-job-4",
    title: "Vendas & Comercial",
    slug: "comercial",
    cover_image_url: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&q=80",
    badge_label: "Comissões",
    show_title: true,
    show_overlay: true,
  },
  {
    id: "hp-job-5",
    title: "Saúde & Operacional",
    slug: "saude",
    cover_image_url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
    badge_label: "Clínicas & Fábricas",
    show_title: true,
    show_overlay: true,
  },
];

const JOB_CATEGORY_CHIPS = [
  { id: "todos", label: "Todas as Vagas" },
  { id: "clt", label: "CLT & Comércio" },
  { id: "tech", label: "Tecnologia & Dev" },
  { id: "comercial", label: "Vendas & B2B" },
  { id: "estagio", label: "Estágios" },
  { id: "saude", label: "Saúde & Clínica" },
  { id: "operacional", label: "Logística & Produção" },
];

function JobsMasterPage() {
  const { banners, jobs: initialJobs } = Route.useLoaderData();
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [search, setSearch] = useState("");

  const { data: jobs } = useQuery({
    queryKey: ["jobs-list", selectedCategory, search],
    queryFn: () =>
      listPublicJobs({
        data: {
          category: selectedCategory !== "todos" ? selectedCategory : undefined,
          search: search || undefined,
        },
      }),
    initialData: initialJobs,
  });

  return (
    <div className="w-full space-y-8 pb-24">
      {/* 1. Banners Contextuais de Empregos (Clean Media Mode) */}
      <section aria-label="Banners de Empregos">
        <BannerHeroCarousel banners={banners} />
      </section>

      {/* 2. Hotpages Contextuais de Empregos */}
      <section aria-label="Categorias de Vagas">
        <HotpagesRail
          hotpages={JOBS_HOTPAGES as any}
          activeSlug={selectedCategory}
          onSelect={(slug) => setSelectedCategory(slug)}
        />
      </section>

      {/* 3. Filtros em Chips & Barra de Busca */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none pb-1">
          {JOB_CATEGORY_CHIPS.map((chip) => {
            const isActive = selectedCategory === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedCategory(chip.id)}
                className={`h-11 px-5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border cursor-pointer shrink-0 flex items-center justify-center ${
                  isActive
                    ? "bg-foreground text-background border-foreground font-semibold shadow-xs scale-102"
                    : "bg-card text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground hover:border-foreground/20"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cargo, empresa, tecnologia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl text-xs bg-card"
          />
        </div>
      </section>

      {/* 4. Grid de Vagas de Trabalho */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs &&
          jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs hover-elevate transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                      <Building className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground leading-tight">
                        {job.title}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">
                        {job.company_name}
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-[10px] uppercase font-mono shrink-0">
                    {job.workplace_type}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-primary" />
                    <span>{job.location}</span>
                  </span>
                  <span>•</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {job.salary_display}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Tags / Benefícios */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {job.benefits.map((b, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-xl bg-muted/60 text-[10px] font-semibold text-foreground/80"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ação / Candidatura Direta */}
              <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-3">
                <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                  Regime {job.contract_type}
                </Badge>

                <a
                  href={`https://wa.me/55${job.contact_whatsapp}?text=Olá,%20vi%20a%20vaga%20de%20${encodeURIComponent(job.title)}%20no%20JAH%20e%20gostaria%20de%20enviar%20meu%20currículo.`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-xs hover:scale-105 active:scale-95 transition-all"
                >
                  <Send className="size-3.5" />
                  <span>Candidatar-se (WhatsApp)</span>
                </a>
              </div>
            </div>
          ))}
      </section>
    </div>
  );
}
