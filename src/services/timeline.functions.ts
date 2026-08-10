import { createServerFn } from "@tanstack/react-start";
import { getServerClient } from "@/lib/supabase";
import { z } from "zod";

export type FeedItemType = "event" | "classified" | "product";

export interface TimelineItem {
  type: FeedItemType;
  id: string;
  title: string;
  content?: string;
  date: string;
  image?: string;
  price_cents?: number;
  author?: {
    id: string;
    name: string;
  };
}

export async function getTimelineFeedHandler({
  storeId,
  limit = 20,
}: {
  storeId?: string;
  limit?: number;
}) {
  const supabase = getServerClient();

  // 1. Fetch Events
  let eventsQuery = supabase
    .from("events")
    .select("id, store_id, title, description, event_date, cover_image, status")
    .eq("status", "published")
    .order("event_date", { ascending: true })
    .limit(limit);

  if (storeId) {
    eventsQuery = eventsQuery.eq("store_id", storeId);
  }
  const { data: eventsData, error: eventsError } = await eventsQuery;

  if (eventsError) {
    console.error("Error fetching events:", eventsError);
  }

  // 2. Fetch Classifieds
  let classifiedsQuery = supabase
    .from("classifieds")
    .select("id, store_id, title, content, created_at, price_cents, status")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (storeId) {
    classifiedsQuery = classifiedsQuery.eq("store_id", storeId);
  }

  const { data: classifiedsData, error: classifiedsError } = await classifiedsQuery;

  if (classifiedsError) {
    console.error("Error fetching classifieds:", classifiedsError);
  }

  // 3. Fetch Products (as feed items)
  let productsQuery = supabase
    .from("products")
    .select("id, store_id, title, description, created_at, status, product_media(url, is_primary)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (storeId) {
    productsQuery = productsQuery.eq("store_id", storeId);
  }

  const { data: productsData, error: productsError } = await productsQuery;

  if (productsError) {
    console.error("Error fetching products:", productsError);
  }

  // Combine and map
  const timeline: TimelineItem[] = [];

  if (eventsData) {
    eventsData.forEach((evt) => {
      timeline.push({
        type: "event",
        id: evt.id,
        title: evt.title,
        content: evt.description,
        date: evt.event_date,
        image: evt.cover_image,
      });
    });
  }

  if (classifiedsData) {
    classifiedsData.forEach((cls) => {
      timeline.push({
        type: "classified",
        id: cls.id,
        title: cls.title,
        content: cls.content,
        date: cls.created_at,
        price_cents: cls.price_cents,
      });
    });
  }

  if (productsData) {
    productsData.forEach((prod) => {
      const primaryMedia = (prod.product_media as any[])?.find(m => m.is_primary) || (prod.product_media as any[])?.[0];
      timeline.push({
        type: "product",
        id: prod.id,
        title: prod.title,
        content: prod.description,
        date: prod.created_at,
        image: primaryMedia?.url,
      });
    });
  }

  // Sort by date descending (newest first for feed)
  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return timeline.slice(0, limit);
}

export const getTimelineFeed = createServerFn({ method: "GET" })
  .validator(
    z
      .object({
        storeId: z.string().uuid().optional(),
        limit: z.number().max(50).optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    return getTimelineFeedHandler(data || {});
  });
