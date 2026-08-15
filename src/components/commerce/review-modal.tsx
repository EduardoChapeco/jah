import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { createReview } from "@/services/cms.functions";

export function ReviewModal({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Por favor, selecione uma nota.");
      return;
    }
    setLoading(true);
    try {
      const res = await createReview({ data: { productId, rating, comment } });
      toast.success("Avaliação enviada com sucesso!");
      setOpen(false);
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 text-xs h-7 border border-border font-bold uppercase tracking-wide"
        >
          Avaliar Produto
        </Button>
      </DialogTrigger>
      <DialogContent className="border border-border bg-background rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-semibold text-2xl font-black text-foreground">
            Avaliar {productName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex gap-2 justify-center bg-secondary border border-border py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                strokeWidth={star <= rating ? 2 : 1.5}
                className={`w-10 h-10 cursor-pointer transition-transform hover:scale-110 ${star <= rating ? "fill-poster-red text-primary" : "text-foreground/30 hover:text-foreground/50"}`}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
          <Textarea
            placeholder="O que você achou do produto? (Opcional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="border border-border bg-background rounded-xl focus-visible:ring-poster-red focus-visible:ring-offset-0 placeholder:text-foreground/50 resize-none font-medium h-32"
          />
          <Button
            className="w-full border border-border hover:shadow-none hover:translate-y-1 hover:translate-x-1 transition-all bg-primary text-primary-foreground font-black uppercase text-lg h-12 rounded-xl cursor-pointer"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
