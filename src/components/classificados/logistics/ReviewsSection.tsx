import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { INITIAL_REVIEWS, Review } from "./logistics-data";

export function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [filter, setFilter] = useState("all");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const filtered = useMemo(() => {
    if (filter === "all") return reviews;
    const stars = Number(filter);
    if (filter === "3") return reviews.filter((r) => r.rating <= 3);
    return reviews.filter((r) => r.rating === stars);
  }, [reviews, filter]);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const handleReply = (id: string) => {
    if (!replyText.trim()) return;
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, reply: replyText } : r)));
    setReplyingId(null);
    setReplyText("");
    toast.success("Resposta salva!");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">Avaliações</h3>
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="font-bold">{avgRating}</span>
            <span className="text-muted-foreground">({reviews.length} avaliações)</span>
          </div>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="5">5 estrelas</SelectItem>
            <SelectItem value="4">4 estrelas</SelectItem>
            <SelectItem value="3">3 ou menos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.map((r) => (
        <Card key={r.id}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{r.customer}</span>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{r.date}</span>
            </div>
            <p className="text-sm">{r.comment}</p>
            <p className="text-xs text-muted-foreground">Profissional: {r.professional}</p>

            {r.reply ? (
              <div className="bg-muted/50 rounded-md p-3 text-sm">
                <span className="font-medium text-xs text-muted-foreground">Sua resposta:</span>
                <p className="mt-1">{r.reply}</p>
              </div>
            ) : replyingId === r.id ? (
              <div className="space-y-2">
                <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Escreva sua resposta..." rows={2} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleReply(r.id)}>Enviar</Button>
                  <Button size="sm" variant="outline" onClick={() => { setReplyingId(null); setReplyText(""); }}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setReplyingId(r.id)}>Responder</Button>
            )}
          </CardContent>
        </Card>
      ))}

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Nenhuma avaliação encontrada.</p>
      )}
    </div>
  );
}
