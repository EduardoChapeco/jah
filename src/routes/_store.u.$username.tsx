import { createFileRoute } from "@tanstack/react-router";
import { MemberPublicProfileView, type MembroSearchParams } from "./_store.membro.$id";
import { getPublicMemberProfile } from "@/services/social.functions";

export const Route = createFileRoute("/_store/u/$username")({
  validateSearch: (search: Record<string, unknown>): MembroSearchParams => ({
    modo:
      search.modo === "profissional" || search.modo === "comercial"
        ? (search.modo as "profissional" | "comercial")
        : "social",
  }),
  head: ({ loaderData, search }: { loaderData?: { data: any }; search?: MembroSearchParams }) => {
    const modo = search?.modo;
    const fullName = loaderData?.data?.profile?.full_name || "Membro";
    const username = loaderData?.data?.profile?.username ? `@${loaderData.data.profile.username}` : "";
    let title = `${fullName} (${username}) | Wider`;
    if (modo === "profissional") {
      title = `${fullName} — Perfil Profissional | Wider`;
    } else if (modo === "comercial") {
      title = `${fullName} — Catálogo & Desapegos | Wider`;
    }
    return {
      meta: [
        { title },
        {
          name: "description",
          content: loaderData?.data?.profile?.bio || "Perfil no ecossistema comunitário JAH.",
        },
      ],
    };
  },
  loader: async ({ params }): Promise<{ data: any }> => {
    const usernameParam = params.username;
    const data = await getPublicMemberProfile({ data: { profileId: usernameParam } }).catch(() => null);
    return { data };
  },
  component: MemberVanityPage,
});

export default function MemberVanityPage() {
  const { data } = Route.useLoaderData();
  const search = Route.useSearch();
  return <MemberPublicProfileView data={data} activeMode={search.modo || "social"} />;
}
