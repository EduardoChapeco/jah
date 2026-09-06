import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase";
import { getServerIdentity, assertStoreAccess } from "@/lib/server-access";
import type { StorePwaConfig } from "@/types/wms-workflows-reputation";

export const getStorePwaConfig = createServerFn({ method: "GET" })
 .handler(async (): Promise<StorePwaConfig | null> => {
 const supabase = getServerClient();
 const identity = await getServerIdentity();

 const { data, error } = await supabase
 .from("store_pwa_configs")
 .select("*")
 .eq("store_id", identity.store_id)
 .maybeSingle();

 if (error) throw new Error("Erro ao buscar configurações do PWA: " + error.message);
 return (data || null) as StorePwaConfig | null;
 });

export const saveStorePwaConfig = createServerFn({ method: "POST" })
 .validator(
 z.object({
 appName: z.string().min(2).max(100),
 shortName: z.string().min(1).max(30),
 description: z.string().optional(),
 themeColor: z.string().default("#0F172A"),
 backgroundColor: z.string().default("#000000"),
 icon192Url: z.string().url().optional().nullable(),
 icon512Url: z.string().url().optional().nullable(),
 splashImageUrl: z.string().url().optional().nullable(),
 startUrl: z.string().default("/"),
 displayMode: z.enum(["standalone", "fullscreen", "minimal-ui", "browser"]).default("standalone"),
 orientation: z.enum(["portrait", "landscape", "any"]).default("portrait"),
 customDomain: z.string().optional().nullable(),
 isPublished: z.boolean().default(true),
 }),
 )
 .handler(async ({ data }) => {
 const supabase = getServerClient();
 const identity = await getServerIdentity();
 assertStoreAccess(identity, ["owner", "admin", "manager"]);

 const payload = {
 store_id: identity.store_id,
 app_name: data.appName,
 short_name: data.shortName,
 description: data.description,
 theme_color: data.themeColor,
 background_color: data.backgroundColor,
 icon_192_url: data.icon192Url,
 icon_512_url: data.icon512Url,
 splash_image_url: data.splashImageUrl,
 start_url: data.startUrl,
 display_mode: data.displayMode,
 orientation: data.orientation,
 custom_domain: data.customDomain,
 is_published: data.isPublished,
 published_at: data.isPublished ? new Date().toISOString() : null,
 updated_at: new Date().toISOString(),
 };

 const { data: config, error } = await supabase
 .from("store_pwa_configs")
 .upsert(payload, { onConflict: "store_id" })
 .select()
 .single();

 if (error) throw new Error("Erro ao salvar PWA: " + error.message);
 return { status: "success", config: config as StorePwaConfig };
 });

export const getPublicPwaManifest = createServerFn({ method: "GET" })
 .validator(z.object({ storeId: z.string().uuid() }))
 .handler(async ({ data }) => {
 const supabase = getServerClient();

 const { data: pwa, error } = await supabase
 .from("store_pwa_configs")
 .select("*")
 .eq("store_id", data.storeId)
 .eq("is_published", true)
 .maybeSingle();

 if (error || !pwa) {
 return {
 name: "Wider Web App",
 short_name: "Wider",
 start_url: "/",
 display: "standalone",
 background_color: "#000000",
 theme_color: "#0F172A",
 icons: [],
 };
 }

 const icons = [];
 if (pwa.icon_192_url) {
 icons.push({ src: pwa.icon_192_url, sizes: "192x192", type: "image/png" });
 }
 if (pwa.icon_512_url) {
 icons.push({ src: pwa.icon_512_url, sizes: "512x512", type: "image/png" });
 }

 return {
 name: pwa.app_name,
 short_name: pwa.short_name,
 description: pwa.description,
 start_url: pwa.start_url || "/",
 display: pwa.display_mode || "standalone",
 orientation: pwa.orientation || "portrait",
 background_color: pwa.background_color || "#000000",
 theme_color: pwa.theme_color || "#0F172A",
 icons,
 };
 });
