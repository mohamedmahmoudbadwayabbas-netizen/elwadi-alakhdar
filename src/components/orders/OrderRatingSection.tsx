import React, { useState } from "react";
import { Star, MessageSquare, Check, Sparkles, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { submitOrderRating, type OrderView } from "@/services/orderDataService";

interface OrderRatingSectionProps {
  order: OrderView;
  userId?: string | null;
  onRatingUpdated?: (rating: number) => void;
}

const RATING_LABELS: Record<number, { text: string; emoji: string }> = {
  1: { text: "سيء جداً", emoji: "😞" },
  2: { text: "يحتاج تحسين", emoji: "😐" },
  3: { text: "جيد", emoji: "🙂" },
  4: { text: "رائع", emoji: "😊" },
  5: { text: "ممتاز وفوق التوقعات", emoji: "🌟" },
};

const QUICK_TAGS = [
  "جودة ممتازة 🥬",
  "توصيل فائق السرعة ⚡",
  "تغليف محكم ونظيف 📦",
  "مندوب محترم ومتعاون 🤝",
  "أسعار ممتازة 🏷️",
  "المنتجات طازجة جداً ✨",
];

export const OrderRatingSection: React.FC<OrderRatingSectionProps> = ({
  order,
  userId,
  onRatingUpdated,
}) => {
  const qc = useQueryClient();
  const existingRating = order.rating ? Number(order.rating) : null;
  const existingFeedback = order.rating_feedback || null;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(existingRating || 5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>(existingFeedback || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeStarValue = hoveredRating ?? selectedRating;

  const handleToggleTag = (tag: string) => {
    if (feedback.includes(tag)) {
      setFeedback((prev) =>
        prev
          .replace(tag, "")
          .replace(/\s{2,}/g, " ")
          .trim(),
      );
    } else {
      setFeedback((prev) => (prev ? `${prev} - ${tag}` : tag));
    }
  };

  const handleSaveRating = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!selectedRating || selectedRating < 1 || selectedRating > 5) {
      toast.error("يرجى اختيار عدد النجوم (من 1 إلى 5)");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitOrderRating({
        orderId: order.id,
        userId: userId || order.user_id,
        rating: selectedRating,
        feedback: feedback.trim() || null,
        currentNotes: order.notes,
        currentShippingAddress: order.shipping_address,
      });

      toast.success("شكراً لتقييمك! تم حفظ تقييم الطلب بنجاح ⭐");
      setIsFormOpen(false);
      onRatingUpdated?.(selectedRating);

      // Invalidate queries to refresh order list
      if (userId) {
        qc.invalidateQueries({ queryKey: ["past-orders", userId] });
        qc.invalidateQueries({ queryKey: ["my-orders", userId] });
      } else {
        qc.invalidateQueries({ queryKey: ["past-orders"] });
        qc.invalidateQueries({ queryKey: ["my-orders"] });
      }
    } catch (err: any) {
      toast.error(err?.message || "تعذر حفظ التقييم، يرجى المحاولة مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  // State 1: Order is already rated and form is closed
  if (existingRating && !isFormOpen) {
    const sentiment = RATING_LABELS[existingRating] || { text: "تقييمك", emoji: "⭐" };
    return (
      <div
        id={`order-rating-card-${order.id}`}
        className="mt-3 rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50/70 via-amber-50/40 to-transparent p-3 text-xs dark:border-amber-900/40 dark:from-amber-950/20 dark:via-amber-950/10"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5" dir="ltr">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= existingRating
                      ? "fill-amber-400 text-amber-500"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="font-bold text-foreground">
              {existingRating} / 5
            </span>
            <Badge
              variant="outline"
              className="gap-1 border-amber-300/80 bg-amber-100/70 text-[10px] font-bold text-amber-900 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
            >
              <span>{sentiment.emoji}</span>
              <span>{sentiment.text}</span>
            </Badge>
          </div>

          <Button
            id={`btn-edit-rating-${order.id}`}
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRating(existingRating);
              setFeedback(existingFeedback || "");
              setIsFormOpen(true);
            }}
            className="h-6 gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="h-3 w-3" />
            <span>تعديل التقييم</span>
          </Button>
        </div>

        {existingFeedback && (
          <div className="mt-2 flex items-start gap-1.5 rounded-xl bg-background/80 p-2 text-[11px] text-foreground/90 border border-border/40">
            <MessageSquare className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="line-clamp-2 italic leading-relaxed">"{existingFeedback}"</p>
          </div>
        )}
      </div>
    );
  }

  // State 2: Order is not rated yet, collapsed teaser button
  if (!isFormOpen) {
    return (
      <div
        id={`order-rating-prompt-${order.id}`}
        className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed border-amber-300/80 bg-amber-50/40 p-2.5 dark:border-amber-800/40 dark:bg-amber-950/10"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 text-amber-400" dir="ltr">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="h-3.5 w-3.5 fill-amber-400/40 text-amber-400/70" />
            ))}
          </div>
          <span className="text-[11px] font-medium text-foreground">
            كيف كانت تجربتك مع هذا الطلب؟
          </span>
        </div>

        <Button
          id={`btn-open-rate-${order.id}`}
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsFormOpen(true);
          }}
          className="h-7 gap-1 rounded-xl border-amber-300/80 bg-background text-[11px] font-bold text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/40"
        >
          <Sparkles className="h-3 w-3" />
          <span>قيّم الطلب الآن</span>
        </Button>
      </div>
    );
  }

  // State 3: Interactive rating form expanded
  const activeLabel = RATING_LABELS[activeStarValue] || { text: "", emoji: "" };

  return (
    <div
      id={`order-rating-form-${order.id}`}
      onClick={(e) => e.stopPropagation()}
      className="mt-3 rounded-2xl border border-amber-300/80 bg-gradient-to-b from-amber-50/50 to-background p-3.5 text-xs dark:border-amber-800/60 dark:from-amber-950/20"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-bold text-foreground flex items-center gap-1.5 text-xs">
          <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
          تقييم الطلب (من 1 إلى 5 نجوم)
        </span>
        <Badge
          variant="secondary"
          className="gap-1 text-[11px] font-bold px-2 py-0.5 text-amber-800 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40"
        >
          <span>{activeLabel.emoji}</span>
          <span>{activeLabel.text}</span>
        </Badge>
      </div>

      {/* Interactive Stars Selection */}
      <div className="flex items-center justify-center gap-2 py-2" dir="ltr">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeStarValue;
          return (
            <button
              key={star}
              id={`star-btn-${order.id}-${star}`}
              type="button"
              onClick={() => setSelectedRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(null)}
              className="group p-1.5 transition-transform hover:scale-125 focus:outline-none"
              title={`تقييم ${star} نجوم`}
            >
              <Star
                className={`h-7 w-7 transition-colors ${
                  isFilled
                    ? "fill-amber-400 text-amber-500 filter drop-shadow-sm"
                    : "text-muted-foreground/30 group-hover:text-amber-400/60"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Quick feedback tags */}
      <div className="mt-2.5">
        <div className="text-[10px] font-bold text-muted-foreground mb-1.5">
          ملاحظات سريعة (اضغط للإضافة):
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_TAGS.map((tag) => {
            const isSelected = feedback.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleToggleTag(tag)}
                className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-all ${
                  isSelected
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                    : "bg-background border-border/70 text-foreground/80 hover:bg-secondary/60"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional feedback textarea */}
      <div className="mt-2.5">
        <textarea
          id={`rating-feedback-${order.id}`}
          rows={2}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="أخبرنا برأيك في جودة المنتجات أو سرعة التوصيل (اختياري)..."
          className="w-full rounded-xl border border-border/80 bg-background p-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
      </div>

      {/* Form Action buttons */}
      <div className="mt-2.5 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isSubmitting}
          onClick={() => setIsFormOpen(false)}
          className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
        >
          إلغاء
        </Button>
        <Button
          id={`btn-submit-rating-${order.id}`}
          type="button"
          size="sm"
          disabled={isSubmitting}
          onClick={handleSaveRating}
          className="h-7 gap-1.5 rounded-xl bg-amber-500 px-3 text-[11px] font-bold text-white hover:bg-amber-600 shadow-sm"
        >
          {isSubmitting ? (
            <span>جاري الحفظ...</span>
          ) : (
            <>
              <Check className="h-3 w-3" />
              <span>إرسال التقييم</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
