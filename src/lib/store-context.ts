import { useQuery } from "@tanstack/react-query";
import { getUserSession } from "@/services/auth.functions";
import { getStoreSettings } from "@/services/store.functions";

export function useWorkspaceStore() {
 const { data: store } = useQuery({
 queryKey: ["workspace-current-store"],
 queryFn: () => getStoreSettings().catch(() => null),
 staleTime: 1000 * 60 * 5,
 });

 const { data: session } = useQuery({
 queryKey: ["user-session"],
 queryFn: () => getUserSession().catch(() => null),
 staleTime: 1000 * 60 * 5,
 });

 return {
 currentStore: store,
 session,
 };
}
