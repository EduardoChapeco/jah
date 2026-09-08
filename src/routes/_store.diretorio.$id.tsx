/**
 * _store.diretorio.$id.tsx — Perfil Comercial da Empresa no Guia & Diretório Local
 * Unificado no Padrão Canônico Apple HIG (Idêntico ao Perfil de Membro com Abas Ricas de Loja, Sobre, Posts, Vagas e Avaliações).
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { getPublicDirectoryById } from "@/services/directory.functions";
import { getStorePublicCatalog } from "@/services/catalog.functions";
import { listPublicJobs } from "@/services/jobs.functions";
import { listHotpages } from "@/services/hotpage.functions";
import { listActiveBanners } from "@/services/banner.functions";
import { getMuralFeed } from "@/services/social.functions";
import { listStorePublicReviews } from "@/services/cms.functions";
import { listStorePublicSponsors } from "@/services/news.functions";
import { CanonicalStoreProfileView } from "@/components/commerce/canonical-store-profile-view";

export const Route = createFileRoute("/_store/diretorio/$id")({
  head: ({ loaderData }: any) => ({
    meta: [
      {
        title: loaderData?.listing
          ? `${loaderData.listing.business_name || loaderData.listing.name} — Perfil Institucional | Wider`
          : "Perfil Institucional | Wider OS",
      },
      {
        name: "description",
        content: loaderData?.listing
          ? `${(loaderData.listing.description || "").slice(0, 160)}...`
          : "Conheça horários, especialidades, endereço e solicite atendimento.",
      },
    ],
  }),
  loader: async ({ params }) => {
    try {
      const listing = await getPublicDirectoryById({ data: { listingId: params.id } }).catch(
        () => null
      );

      if (!listing) {
        return {
          listing: null,
          catalog: [],
          categories: [],
          jobs: [],
          hotpages: [],
          banners: [],
          posts: [],
          reviews: [],
          sponsors: [],
        };
      }

      const targetStore = listing.store_id || listing.id;

      const [
        catalogRes,
        jobsRes,
        hotpagesRes,
        bannersRes,
        postsRes,
        reviewsRes,
        sponsorsRes,
      ] = await Promise.all([
        getStorePublicCatalog({ data: targetStore ? { storeId: targetStore } : undefined }).catch(
          () => null
        ),
        listPublicJobs({ data: {} }).catch(() => null),
        listHotpages({ data: { module: "home" } }).catch(() => []),
        listActiveBanners({ data: { placement: "store" } }).catch(() => []),
        targetStore
          ? getMuralFeed({ data: { store_id: targetStore, limit: 12 } }).catch(() => null)
          : Promise.resolve(null),
        targetStore
          ? listStorePublicReviews({ data: { storeId: targetStore } }).catch(() => [])
          : Promise.resolve([]),
        targetStore
          ? listStorePublicSponsors({ data: { storeId: targetStore } }).catch(() => [])
          : Promise.resolve([]),
      ]);

      const rawJobs = Array.isArray(jobsRes) ? jobsRes : (jobsRes as any)?.jobs || [];
      const storeJobs = rawJobs.filter((j: any) => {
        if (!targetStore) return false;
        return (
          j.store_id === targetStore ||
          j.company_name?.toLowerCase() === (listing.business_name || listing.name)?.toLowerCase()
        );
      });

      const storePosts = (postsRes as any)?.items || [];

      return {
        listing,
        catalog: catalogRes?.products || [],
        categories: catalogRes?.categories || [],
        jobs: storeJobs,
        hotpages: Array.isArray(hotpagesRes) ? hotpagesRes : [],
        banners: Array.isArray(bannersRes) ? bannersRes : [],
        posts: storePosts,
        reviews: Array.isArray(reviewsRes) ? reviewsRes : [],
        sponsors: Array.isArray(sponsorsRes) ? sponsorsRes : [],
      };
    } catch (err) {
      console.error("[loader:_store.diretorio.$id] Unhandled error:", err);
      return {
        listing: null,
        catalog: [],
        categories: [],
        jobs: [],
        hotpages: [],
        banners: [],
        posts: [],
        reviews: [],
        sponsors: [],
      };
    }
  },
  component: CanonicalDirectoryDetailPage,
});

function CanonicalDirectoryDetailPage() {
  const data = Route.useLoaderData();
  const listing = data?.listing ?? null;
  const catalog = data?.catalog ?? [];
  const categories = data?.categories ?? [];
  const jobs = data?.jobs ?? [];
  const hotpages = data?.hotpages ?? [];
  const banners = data?.banners ?? [];
  const posts = data?.posts ?? [];
  const reviews = data?.reviews ?? [];
  const sponsors = data?.sponsors ?? [];

  if (!listing) {
    return (
      <div className="w-full max-w-3xl mx-auto py-24 text-center space-y-4">
        <Compass size={48} className="text-muted-foreground/40 mx-auto" />
        <h1 className="text-xl font-bold text-foreground">
          Cadastro Não Encontrado
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Este cadastro pode ter sido alterado ou desativado temporariamente.
        </p>
        <Button asChild className="rounded-xl font-bold">
          <Link to="/diretorio">
            <ArrowLeft size={16} weight="bold" className="mr-2" />
            Voltar para o Guia Local
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <CanonicalStoreProfileView
      store={listing}
      catalog={catalog}
      categories={categories}
      banners={banners}
      hotpages={hotpages}
      jobs={jobs}
      posts={posts}
      reviews={reviews}
      sponsors={sponsors}
      source="directory"
      backUrl="/diretorio"
      backLabel="Guia & Diretório"
    />
  );
}
