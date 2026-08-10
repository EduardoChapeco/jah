export type OfferType = "product" | "event" | "classified";

export interface OfferDTO {
  // Generic IDs
  id: string; // The original ID in its respective table (e.g., products.id)
  type: OfferType;
  
  // Display Information
  title: string;
  brand?: string;
  subtitle?: string; // Short description or secondary text
  image_url?: string;
  
  // Pricing
  price_cents: number;
  compare_at_cents?: number | null;
  
  // Availability
  is_available: boolean;
  stock_quantity?: number | null; // Null means unlimited
  
  // Logistics
  is_physical: boolean;
  
  // Raw Reference
  raw_data?: any; // The original record (e.g. ProductRow or EventRow) just in case
}

// Example adapters
export function adaptProductToOffer(product: any): OfferDTO {
  return {
    id: product.id,
    type: "product",
    title: product.title,
    brand: product.brand,
    subtitle: product.short_description || undefined,
    image_url: product.product_media?.[0]?.url,
    price_cents: product.price_cents || 0,
    compare_at_cents: product.compare_at_cents,
    is_available: product.status === "published",
    stock_quantity: product.total_stock, // Or variants logic
    is_physical: product.is_physical !== false,
    raw_data: product,
  };
}

export function adaptEventToOffer(event: any, ticketTypeId?: string): OfferDTO {
  // If an event has multiple ticket types, the ID could be a composite or refer to the ticket type.
  // Assuming a simple 1:1 or we use event.id as reference_id and ticketTypeId as option_id
  return {
    id: event.id,
    type: "event",
    title: event.title,
    subtitle: event.datetime_start ? new Date(event.datetime_start).toLocaleString() : undefined,
    image_url: event.cover_url,
    price_cents: event.price_cents || 0,
    is_available: event.status === "published" || event.status === "onsale",
    is_physical: false, // Tickets are digital
    raw_data: event,
  };
}
