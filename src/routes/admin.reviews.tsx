import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminSupabase as supabase } from "@/integrations/supabase/admin-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Loader2, Star, MessageSquare } from "lucide-react";

type Review = {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
  product?: { name: string };
};

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({ meta: [{ title: "التقييمات — لوحة التحكم" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select("*, product:products(name)")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("حذف هذا التقييم؟")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("تم الحذف"); load(); }
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-2xl font-bold"><MessageSquare className="h-6 w-6 text-accent" /> تقييمات العملاء</h2>

      {loading ? (
        <div className="grid place-items-center p-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">لا توجد تقييمات بعد</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{r.author_name || "عميل"}</span>
                    <span className="text-xs text-muted-foreground">• {r.product?.name ?? "—"}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`} />
                    ))}
                    <span className="ms-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("ar-EG")}</span>
                  </div>
                  {r.comment && <p className="mt-2 text-sm leading-relaxed">{r.comment}</p>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
