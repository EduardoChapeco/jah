import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Package, CalendarDays, Megaphone, ShoppingCart, Info } from "lucide-react";

import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/commerce/price-display";
import { OfferDTO, adaptProductToOffer, adaptEventToOffer } from "@/types/offer";

// Temporary mocks/BFF imports (replace with actual BFF calls later)
import { listPublishedProducts } from "@/services/catalog.functions";
// Assuming there is a getPublicEvents, for now we will just use products and mock events
// import { getPublicEvents } from "@/services/events.functions";

export const Route = createFileRoute("/feed")({
  head: () => ({ meta: [{ title: "Comunidade JAH" }] }),
  loader: async () => {
    // In a real scenario, a BFF would do this cross-table fetch and return OfferDTO[]
    try {
      const productsRes = await listPublishedProducts();
      const products = productsRes || [];
      
      const offers: OfferDTO[] = [
        ...products.map(adaptProductToOffer),
        // Mock event just for visual demonstration of the unified feed
        {
          id: "evt-1",
          type: "event",
          title: "Batalha de Rima do Tatuapé",
          subtitle: "10 de Agosto, 20:00 - Praça Silvio Romero",
          image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop",
          price_cents: 1500,
          is_available: true,
          is_physical: false,
        }
      ];

      // Shuffle for timeline effect
      return offers.sort(() => Math.random() - 0.5);
    } catch (e) {
      console.error(e);
      return [];
    }
  },
  component: CommunityFeed,
});

function CommunityFeed() {
  const offers = Route.useLoaderData();

  const handleAddToCart = (offer: OfferDTO) => {
    toast.success(`"${offer.title}" adicionado ao carrinho!`);
    // Here we'd call the cart context or polymorphic atomic add
  };

  const getVariantForOffer = (type: string, index: number) => {
    if (type === "event") return "ticket";
    // Alternate styles randomly for products to give the underground vibe
    const styles: ("zine" | "lambe" | "journal")[] = ["zine", "lambe", "journal"];
    return styles[index % styles.length];
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 font-sans selection:bg-rose-500 selection:text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b-4 border-stone-950 bg-stone-900/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <h1 className="text-2xl font-black uppercase tracking-tighter italic text-rose-500" style={{ fontFamily: "Impact, sans-serif" }}>
          JAH Community
        </h1>
        <Button size="icon" variant="outline" className="rounded-full border-2 border-stone-800 bg-stone-900 hover:bg-stone-800 text-white">
          <ShoppingCart className="size-5" />
        </Button>
      </header>

      {/* Feed Stream */}
      <main className="max-w-md mx-auto p-4 space-y-8 mt-4">
        {offers.length === 0 && (
          <div className="text-center py-20 text-stone-500">
            Nenhuma novidade na área.
          </div>
        )}

        {offers.map((offer, i) => (
          <Surface 
            key={offer.id} 
            variant={getVariantForOffer(offer.type, i)} 
            className="mb-8 rotate-1 hover:rotate-0 transition-transform duration-300"
          >
            {/* Offer Type Indicator */}
            <div className="flex justify-between items-center mb-3">
              <Badge variant="outline" className="bg-black text-white border-none font-bold uppercase tracking-widest text-[10px]">
                {offer.type === "event" ? <CalendarDays className="size-3 mr-1 inline" /> : null}
                {offer.type === "product" ? <Package className="size-3 mr-1 inline" /> : null}
                {offer.type === "classified" ? <Megaphone className="size-3 mr-1 inline" /> : null}
                {offer.type}
              </Badge>
              {offer.brand && (
                <span className="text-xs font-black uppercase tracking-tight">{offer.brand}</span>
              )}
            </div>

            {/* Media */}
            <div className="aspect-[4/5] bg-stone-800 w-full overflow-hidden border-4 border-black relative mb-4 flex items-center justify-center">
              {offer.image_url ? (
                <img src={offer.image_url} alt={offer.title} className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all" />
              ) : (
                <div className="text-stone-600 font-black uppercase text-xl transform -rotate-12">
                  No Image
                </div>
              )}
              
              {!offer.is_available && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="bg-rose-600 text-white font-black uppercase px-4 py-2 border-2 border-black rotate-12 text-xl">
                    Esgotado
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div>
              <h2 className="text-2xl font-black uppercase leading-none tracking-tighter mb-2 font-display">
                {offer.title}
              </h2>
              {offer.subtitle && (
                <p className="text-sm font-medium mb-4 leading-tight opacity-80">
                  {offer.subtitle}
                </p>
              )}
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-black/20">
                <div className="text-xl">
                  <PriceDisplay amountCents={offer.price_cents} compareAtCents={offer.compare_at_cents ?? undefined} size="lg" />
                </div>
                
                <Button 
                  disabled={!offer.is_available}
                  onClick={() => handleAddToCart(offer)}
                  className="rounded-none border-2 border-black font-black uppercase text-xs h-10 px-6 bg-rose-500 hover:bg-rose-600 text-white shadow-[4px_4px_0_0_#000]"
                >
                  Pegar
                </Button>
              </div>
            </div>
          </Surface>
        ))}
      </main>
    </div>
  );
}
