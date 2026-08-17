import { createFileRoute, Link } from "@tanstack/react-router";
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
  Laptop,
  GraduationCap,
  Heartbeat,
  Truck,
  Storefront,
  WhatsappLogo,
  ArrowRight,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  { id: "todos", label: "Todas as Vagas", icon: Sparkle },
  { id: "clt", label: "CLT & Comércio", icon: Storefront },
  { id: "tech", label: "Tecnologia & Dev", icon: Laptop },
  { id: "comercial", label: "Vendas & B2B", icon: Briefcase },
  { id: "estagio", label: "Estágios & Trainee", icon: GraduationCap },
  { id: "saude", label: "Saúde & Clínica", icon: Heartbeat },
  { id: "operacional", label: "Logística & Frota", icon: Truck },
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

      {/* 3. Filtros em Cards Gordinhos & Barra de Busca */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Briefcase size={16} weight="bold" className="text-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
              Categorias de Carreiras
            </h3>
          </div>

          <div className="relative w-full md:w-72">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cargo, empresa, área..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl text-xs bg-card"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-2 pt-1 w-full px-0.5">
          {JOB_CATEGORY_CHIPS.map((chip) => {
            const isActive = selectedCategory === chip.id;
            const Icon = chip.icon;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedCategory(chip.id)}
                className={`min-w-[104px] sm:min-w-[114px] h-[94px] sm:h-[100px] p-3 rounded-2xl flex flex-col items-center justify-between border cursor-pointer select-none shrink-0 transition-all group ${
                  isActive
                    ? "bg-foreground text-background border-foreground shadow-xs font-bold scale-102"
                    : "bg-card text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground hover:border-foreground/30 shadow-2xs"
                }`}
              >
                <div
                  className={`size-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isActive ? "bg-background/20 text-background" : "bg-muted text-foreground"
                  }`}
                >
                  <Icon size={20} weight={isActive ? "fill" : "bold"} />
                </div>
                <span className="text-xs font-bold text-center leading-tight line-clamp-1">
                  {chip.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Grid de Vagas de Trabalho */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs &&
          jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-3xl border border-border bg-card p-6 shadow-2xs hover:border-foreground/30 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-2xl bg-muted border border-border flex items-center justify-center font-bold shrink-0 text-foreground group-hover:scale-105 transition-transform">
                      <Buildings size={22} weight="duotone" />
                    </div>
                    <div>
                      <Link
                        to="/empregos/$id"
                        params={{ id: job.id }}
                        className="text-base font-bold text-foreground leading-tight hover:underline line-clamp-1 block"
                      >
                        {job.title}
                      </Link>
                      <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                        {job.company_name}
                      </p>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-[10px] uppercase font-mono shrink-0 rounded-lg">
                    {job.workplace_type}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1">
                    <MapPin size={13} weight="bold" className="text-foreground" />
                    <span>{job.location}</span>
                  </span>
                  <span>•</span>
                  <span className="font-bold text-foreground">
                    {job.salary_display}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Tags / Benefícios */}
                {job.benefits && job.benefits.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.benefits.slice(0, 3).map((b, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl bg-muted/60 text-[10px] font-semibold text-foreground/80"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Ação / Links */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
                <Badge variant="secondary" className="text-[10px] uppercase font-mono rounded-lg">
                  {job.contract_type}
                </Badge>

                <div className="flex items-center gap-2">
                  {job.contact_whatsapp && (
                    <a
                      href={`https://wa.me/55${job.contact_whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá, vi a vaga de ${job.title} no JAH e gostaria de mais informações.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="size-9 rounded-xl border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center transition-all"
                      title="Conversar no WhatsApp"
                    >
                      <WhatsappLogo size={18} weight="bold" />
                    </a>
                  )}

                  <Button asChild size="sm" className="rounded-xl font-bold text-xs h-9 px-4 gap-1.5 bg-foreground text-background">
                    <Link to="/empregos/$id" params={{ id: job.id }}>
                      <span>Ver Vaga & Candidatar</span>
                      <ArrowRight size={14} weight="bold" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
      </section>
    </div>
  );
}
