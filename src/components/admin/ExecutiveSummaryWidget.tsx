import React, { useState, useEffect } from "react";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingBag,
  Zap,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Package,
  Layers,
  ChevronLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  generateExecutiveSummary,
  ExecutiveKpiInput,
  ExecutiveSummaryResult,
} from "@/services/gemini36Service";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface ExecutiveSummaryWidgetProps {
  kpis: ExecutiveKpiInput;
  onExecuteCommand?: (command: string) => void;
}

export function ExecutiveSummaryWidget({ kpis, onExecuteCommand }: ExecutiveSummaryWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ExecutiveSummaryResult | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const result = await generateExecutiveSummary(kpis);
      setSummary(result);
    } catch (e) {
      toast.error("تعذر تحميل التقرير الاستشاري");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [kpis.totalRevenue, kpis.totalOrders, kpis.lowStockCount]);

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-emerald-500/5 shadow-md">
      {/* Decorative top accent line */}
      <div className="absolute inset-x-0 top-0 h-1 hero-gradient" />

      <CardHeader className="p-4 sm:p-6 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
              <Sparkles className="h-5 w-5 animate-pulse text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base sm:text-lg font-black font-display text-foreground">
                  الموجز التنفيذي والاستشاري الذكي (AI Executive Advisory)
                </CardTitle>
                <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 border border-emerald-500/20">
                  Gemini 3.6 Flash
                </span>
              </div>
              <CardDescription className="text-xs font-medium text-muted-foreground mt-0.5">
                تحليل فوري لمؤشرات أداء المبيعات والمخزون مع نصائح تجارية موجهة لزيادة الأرباح
              </CardDescription>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={fetchSummary}
            className="h-8 rounded-xl text-xs font-bold gap-1.5 border-border hover:bg-secondary self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`}
            />
            <span>تحديث التحليل</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-3 space-y-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-6 animate-pulse">
            <div className="h-24 rounded-2xl bg-secondary/60 col-span-full" />
            <div className="h-32 rounded-2xl bg-secondary/60 md:col-span-2" />
            <div className="h-32 rounded-2xl bg-secondary/60" />
          </div>
        ) : summary ? (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Executive Headline Banner */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-sm font-black text-emerald-950 dark:text-emerald-200 font-display">
                    {summary.headline}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs text-muted-foreground font-bold">
                    مؤشر كفاءة المتجر:
                  </span>
                  <span className="rounded-xl bg-card px-2.5 py-1 text-xs font-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
                    %{summary.overallHealthScore} ممتاز
                  </span>
                </div>
              </div>

              {/* Insights List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {summary.insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl border border-border/70 bg-card/60 text-xs font-bold text-foreground leading-relaxed flex items-start gap-2 shadow-2xs"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>

              {/* Actionable Strategic Tips Section */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span>
                      توصيات الذكاء الاصطناعي التشغيلية ذات الأولوية القصوى (2 Actionable Tips):
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {summary.actionableTips.map((tip, idx) => {
                    const isUrgent = tip.impact === "Urgent";
                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between ${
                          isUrgent
                            ? "border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50"
                            : "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                                isUrgent
                                  ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              }`}
                            >
                              {tip.impact === "Urgent" ? "عاجل جداً 🚨" : "تأثير مرتفع ⚡"}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-extrabold">
                              {tip.category === "Inventory"
                                ? "إدارة المخزون 📦"
                                : tip.category === "Marketing"
                                  ? "التسويق والمبيعات 🛍️"
                                  : "التسعير والعمليات 💰"}
                            </span>
                          </div>

                          <h4 className="text-sm font-black text-foreground font-display">
                            {tip.title}
                          </h4>
                          <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                            {tip.description}
                          </p>
                        </div>

                        {tip.quickActionLabel && (
                          <div className="pt-3 mt-2 border-t border-border/40 flex items-center justify-between">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (tip.quickActionCommand && onExecuteCommand) {
                                  onExecuteCommand(tip.quickActionCommand);
                                } else {
                                  toast.info(`تم تفعيل التوصية: ${tip.title}`);
                                }
                              }}
                              className={`h-7 px-2.5 rounded-xl text-[11px] font-black gap-1 cursor-pointer ${
                                isUrgent
                                  ? "text-rose-600 hover:bg-rose-500/10"
                                  : "text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                              }`}
                            >
                              <span>{tip.quickActionLabel}</span>
                              <ChevronLeft className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : null}
      </CardContent>
    </Card>
  );
}
