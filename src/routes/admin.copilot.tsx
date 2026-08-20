import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  RotateCcw,
  Code,
  Layout,
  ShoppingBag,
  TrendingUp,
  MessageSquare,
  Package,
  Zap,
  CheckCircle2,
  Paperclip,
  FileCode,
  Globe,
  Search,
  Bot,
  Trash2,
  Wand2,
  X,
  ChevronRight,
  Plus,
  FolderTree,
  Eye,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  Building2,
  Cpu,
  CornerDownLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useLayoutConfig } from "@/lib/layout-config-context";
import {
  parseAdminCommandToLayoutUpdate,
  runAdminCoPilotChat,
  ChatMessage,
  ExecutiveKpiInput,
  GeminiModelChoice,
  GeminiRoleChoice,
} from "@/services/gemini36Service";
import { modifyProjectFileWithGemini } from "@/services/geminiCodeService";
import {
  ProjectFileMeta,
  PROJECT_FILES_REGISTRY,
} from "@/services/projectFilesService";
import { GeminiFileAttachmentPicker } from "@/components/admin/GeminiFileAttachmentPicker";
import { GeminiCodeDiffViewer } from "@/components/admin/GeminiCodeDiffViewer";
import { GeminiProjectFilesStudio } from "@/components/admin/GeminiProjectFilesStudio";
import { ExecutiveSummaryWidget } from "@/components/admin/ExecutiveSummaryWidget";
import { AbandonedCartAgent } from "@/components/admin/AbandonedCartAgent";
import { SmartProductCopywriterModal } from "@/components/admin/SmartProductCopywriterModal";
import { ShopLivePreview } from "@/components/admin/ShopLivePreview";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/settings-context";
import { BRAND_NAME_AR } from "@/lib/brand";

export const Route = createFileRoute("/admin/copilot")({
  head: () => ({
    meta: [
      { title: "Gemini AI Studio — المساعد الذكي وإدارة السلسلة" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminCoPilotPage,
});

const STARTER_PROMPTS = [
  {
    title: "تعديل صفحة السلة cart.tsx 🛒",
    desc: "أضف خيار التوصيل السريع وربط ويدجت الخرائط لحفظ الموقع الافتراضي",
    targetFile: "/src/routes/cart.tsx",
    prompt:
      "عدل كود صفحة السلة /src/routes/cart.tsx لإضافة خيار التوصيل الفوري السريع وتفعيل حفظ الموقع الافتراضي للمستخدم عبر الخريطة",
    icon: ShoppingBag,
  },
  {
    title: "تطوير بوابة المندوب driver.tsx 🛵",
    desc: "تفعيل التوجيه ثنائي المراحل، التنبيه الصوتي وإظهار مسار الوصول ETA",
    targetFile: "/src/routes/driver.tsx",
    prompt:
      "عدل ملف /src/routes/driver.tsx لتعزيز التوجيه ثنائي المراحل (المتجر ثم العميل) وإضافة تنبيه صوتي عند وصول الطلب",
    icon: Zap,
  },
  {
    title: "تغيير تصميم وثيم المتجر بالكامل 🎨",
    desc: "ثيم أخضر داكن فاخر + حواف دائرية + إعلانات ألبان بخصم 30%",
    prompt:
      "غيّر لون المتجر للأخضر الداكن الفاخر، واجعل حواف الكروت دائرية بالكامل، وأضف قسم إعلانات مصغرة للألبان والأجبان بخصم 30%",
    icon: Layout,
  },
  {
    title: "أبحاث أسعار السوق في مصر (Google Search) 🌐",
    desc: "جلب أحدث أسعار الألبان والزيوت في سلاسل الهايبرماركت ومقارنتها",
    prompt:
      "ابحث في جوجل عن أحدث أسعار الألبان والجبن الطازج والزيوت بالسوق المصري وسلاسل الهايبرماركت الكبرى وقدم توصية تسعيرية لمتجري",
    icon: Search,
  },
];

function AdminCoPilotPage() {
  const settings = useSettings();
  const storeName = settings.site_name || BRAND_NAME_AR;
  const aiAssistantName = `${storeName} AI`;
  const { config: layoutConfig, updateConfig, resetConfig, setThemePalette } = useLayoutConfig();

  // Active workspace mode
  const [activeMode, setActiveMode] = useState<
    "chat" | "files-studio" | "store-engine" | "advisory" | "abandoned-carts"
  >("chat");

  // Prompt input and attached file
  const [chatInput, setChatInput] = useState("");
  const [attachedFile, setAttachedFile] = useState<ProjectFileMeta | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Gemini Model & Role Configuration
  const [selectedModel, setSelectedModel] = useState<GeminiModelChoice>("gemini-3.5-flash");
  const [selectedRole, setSelectedRole] = useState<GeminiRoleChoice>("store_architect");
  const [enableGoogleSearch, setEnableGoogleSearch] = useState(true);

  // Modals & Tools
  const [copywriterModalOpen, setCopywriterModalOpen] = useState(false);

  // Multi-Turn Chat History
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      modelUsed: "gemini-2.5-flash",
      roleUsed: "store_architect",
      content: `مرحباً بك! أنا **${aiAssistantName}**، مساعدك الذكي المدمج المعتمد على **Gemini 3.1 Pro** والمربوط بقاعدة بيانات **Supabase** وسلسلة الفروع الثلاثة 🏬✨

يمكنك التفاعل معي مباشرة من خلال:
1. 💻 **البرمجة وتعديل أي ملف في الكود**: اكتب طلبك أو ارفق أي ملف 📎 وسأقوم ببناء التعديل وعرض الفروقات البرمجية فوراً.
2. 🎨 **تعديل واجهة وثيم الفروع بالأوامر الصوتية والنصية**: تغيير الألوان، البانرات، وخصومات الفروع.
3. 🌐 **أبحاث أسعار السوق (Google Search Grounding)**: فحص الأسعار التنافسية في مصر لحظياً.
4. 📈 **إدارة المخزون والطلبات**: الاستعلام والتعديل على جداول الفروع الثلاثة.`,
      timestamp: "الآن",
    },
  ]);

  // Store real-time KPI data
  const [kpis, setKpis] = useState<ExecutiveKpiInput>({
    totalRevenue: 60450,
    totalOrders: 155,
    averageOrderValue: 390.0,
    lowStockCount: 11,
    outOfStockCount: 2,
    topSellingCategory: "الألبان والجبن الطازج",
    abandonedCartsCount: 4,
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isProcessing]);

  // Fetch actual numbers from supabase
  useEffect(() => {
    (async () => {
      try {
        const { data: orders } = await supabase.from("orders").select("total_price, status");
        if (orders && orders.length > 0) {
          const rev = orders.reduce((acc, o) => acc + (Number(o.total_price) || 0), 0);
          setKpis((prev) => ({
            ...prev,
            totalRevenue: rev || prev.totalRevenue,
            totalOrders: orders.length,
            averageOrderValue: rev / orders.length,
          }));
        }

        const { data: products } = await supabase
          .from("products")
          .select("stock_quantity, low_stock_threshold");
        if (products) {
          const low = products.filter(
            (p) => p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 10),
          ).length;
          const out = products.filter((p) => p.stock_quantity <= 0).length;
          setKpis((prev) => ({
            ...prev,
            lowStockCount: low,
            outOfStockCount: out,
          }));
        }
      } catch (e) {
        console.warn("KPIs sync error");
      }
    })();
  }, []);

  // Main Submit Handler
  const handleSendMessage = async (textToSend?: string, fileToTarget?: ProjectFileMeta | null) => {
    const prompt = (textToSend || chatInput).trim();
    const targetFile = fileToTarget !== undefined ? fileToTarget : attachedFile;
    if (!prompt) return;

    const lower = prompt.toLowerCase();

    // Check if user is asking to modify a specific file (or has attached a file)
    const isFileCodeRequest =
      targetFile !== null ||
      lower.includes(".tsx") ||
      lower.includes(".ts") ||
      lower.includes(".css") ||
      lower.includes("عدل ملف") ||
      lower.includes("تعديل كود") ||
      lower.includes("برمج") ||
      lower.includes("صفحة السلة") ||
      lower.includes("صفحة المندوب") ||
      lower.includes("الهيدر");

    // Add user message to history
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt,
      attachedFile: targetFile ? { path: targetFile.path, name: targetFile.name } : undefined,
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setChatInput("");
    setAttachedFile(null);
    setIsProcessing(true);

    try {
      if (isFileCodeRequest) {
        let filePath = targetFile?.path;
        if (!filePath) {
          if (lower.includes("cart") || lower.includes("سلة") || lower.includes("السلة")) {
            filePath = "/src/routes/cart.tsx";
          } else if (
            lower.includes("driver") ||
            lower.includes("مندوب") ||
            lower.includes("المندوب")
          ) {
            filePath = "/src/routes/driver.tsx";
          } else if (
            lower.includes("header") ||
            lower.includes("هيدر") ||
            lower.includes("الهيدر")
          ) {
            filePath = "/src/components/storefront/Header.tsx";
          } else if (lower.includes("index") || lower.includes("الرئيسية")) {
            filePath = "/src/routes/index.tsx";
          } else {
            filePath = "/src/routes/cart.tsx";
          }
        }

        const codeResult = await modifyProjectFileWithGemini(
          prompt,
          filePath,
          selectedModel as any,
        );

        const aiMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          modelUsed: selectedModel,
          roleUsed: "store_architect",
          content: `💻 **${codeResult.summary}**\n\n${codeResult.explanation}\n\nيمكنك مراجعة وتطبيق التعديل مباشرة أدناه:`,
          codeModification: {
            filePath: codeResult.filePath,
            originalCode: codeResult.originalCode,
            modifiedCode: codeResult.modifiedCode,
            summary: codeResult.summary,
            explanation: codeResult.explanation,
            diffSummary: codeResult.diffSummary,
          },
          timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        };

        setChatHistory((prev) => [...prev, aiMsg]);
        toast.success(`تم توليد تعديل الكود لملف ${filePath}! ✨`);
      } else if (
        lower.includes("لون") ||
        lower.includes("ثيم") ||
        lower.includes("بانر") ||
        lower.includes("حواف") ||
        lower.includes("فلاش سيل") ||
        lower.includes("إعلانات") ||
        lower.includes("أخضر") ||
        lower.includes("بنفسجي") ||
        lower.includes("تخطيط")
      ) {
        const result = await parseAdminCommandToLayoutUpdate(prompt, layoutConfig);
        updateConfig(result.updatedLayout);

        const aiMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          modelUsed: selectedModel,
          roleUsed: "store_architect",
          content: `✨ **${result.actionSummary}**\n\n${result.explanation}\n\n✅ تم تطبيق كافة التعديلات فوراً على واجهة المتجر والفروع.`,
          executedActions: result.executedActions,
          timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
          suggestedAction: {
            label: "معاينة التعديل في المتجر الحي",
            command: prompt,
            type: "apply_layout",
          },
        };

        setChatHistory((prev) => [...prev, aiMsg]);
        toast.success(`تم تطبيق التعديل: ${result.actionSummary}`);
      } else {
        const response = await runAdminCoPilotChat(prompt, chatHistory, {
          model: selectedModel,
          role: selectedRole,
          enableSearchGrounding: enableGoogleSearch || selectedRole === "market_researcher",
          currentLayout: layoutConfig,
          kpis,
        });

        const aiMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          modelUsed: response.modelUsed,
          roleUsed: response.roleUsed,
          content: response.text,
          groundingSources: response.groundingSources,
          suggestedAction: response.action,
          timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        };

        setChatHistory((prev) => [...prev, aiMsg]);
      }
    } catch (e) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "عذراً، حدث خطأ أثناء المعالجة. يرجى المحاولة مرة أخرى.",
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      };
      setChatHistory((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartNewChat = () => {
    setChatHistory([
      {
        id: `msg-${Date.now()}`,
        role: "assistant",
        modelUsed: selectedModel,
        roleUsed: selectedRole,
        content: `تم بدء جلسة محادثة جديدة مع **${aiAssistantName}** ✨\n\nكيف يمكنني مساعدتك الآن في إدارة وتطوير الفروع الثلاثة؟`,
        timestamp: "الآن",
      },
    ]);
    setAttachedFile(null);
    setChatInput("");
    toast.info("تم بدء محادثة جديدة");
  };

  return (
    <div
      className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-between text-right pb-6 font-sans select-text"
      dir="rtl"
    >
      {/* ─── AMBIENT COSMIC GEMINI BACKGROUND ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 right-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      {/* ─── 1. SLEEK TOP GEMINI HEADER ─── */}
      <div className="max-w-5xl mx-auto w-full mb-4">
        <div className="rounded-3xl border border-border/70 bg-card/70 backdrop-blur-2xl p-4 shadow-elegant flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Identity */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="h-11 w-11 rounded-2xl hero-gradient text-white grid place-items-center shadow-md shrink-0">
              <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-black text-base text-foreground tracking-tight">
                  {aiAssistantName}
                </h1>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Gemini 3.1 Pro • Supabase DB
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-semibold">
                المساعد الذكي المركزي لإدارة الأكواد والأسعار والمخزون للفروع الثلاثة
              </p>
            </div>
          </div>

          {/* Quick Tabs & Actions */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end w-full sm:w-auto">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-2xl border border-border/60">
              {[
                { id: "chat", label: "محادثة Gemini", icon: MessageSquare },
                { id: "files-studio", label: "محرر الأكواد", icon: FileCode },
                { id: "store-engine", label: "محرك الواجهة", icon: Layout },
                { id: "advisory", label: "التقارير", icon: TrendingUp },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveMode(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? "hero-gradient text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleStartNewChat}
              className="h-9 rounded-2xl text-xs font-bold gap-1 border-border/80 hover:bg-secondary cursor-pointer"
              title="محادثة جديدة"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden md:inline">جديد</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN CHAT / WORKSPACE VIEW ─── */}
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-between space-y-4">
        {activeMode === "chat" && (
          <div className="flex-1 flex flex-col justify-between space-y-6">
            {/* Messages Stream */}
            <div className="space-y-6 py-2">
              {chatHistory.map((msg) => {
                const isUser = msg.role === "user";

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3.5 ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl ${
                        isUser
                          ? "bg-secondary text-foreground border border-border"
                          : "hero-gradient text-white shadow-sm"
                      }`}
                    >
                      {isUser ? <Bot className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    </div>

                    {/* Message Bubble (Gemini Web Style) */}
                    <div className={`space-y-2 max-w-[85%] ${isUser ? "text-right" : "text-right"}`}>
                      {/* Top info badge */}
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-bold">
                        <span>{isUser ? "المدير العام (Root Admin)" : aiAssistantName}</span>
                        <span>•</span>
                        <span className="text-[10px] opacity-75">{msg.timestamp}</span>
                      </div>

                      <div
                        className={`rounded-3xl p-5 text-sm leading-relaxed backdrop-blur-2xl ${
                          isUser
                            ? "bg-emerald-600/90 text-white rounded-tr-xs shadow-md font-bold"
                            : "bg-card/85 text-foreground border border-border/70 rounded-tl-xs shadow-elegant font-normal"
                        }`}
                      >
                        {/* Attached File Chip if present */}
                        {msg.attachedFile && (
                          <div className="mb-3 inline-flex items-center gap-2 bg-black/20 text-white px-3 py-1 rounded-xl text-xs font-mono border border-white/20">
                            <Paperclip className="h-3.5 w-3.5" />
                            <span>الملف المستهدف: {msg.attachedFile.path}</span>
                          </div>
                        )}

                        <div className="whitespace-pre-line text-sm sm:text-base leading-relaxed">
                          {msg.content}
                        </div>

                        {/* Interactive Code Diff Viewer */}
                        {msg.codeModification && (
                          <div className="mt-4">
                            <GeminiCodeDiffViewer
                              filePath={msg.codeModification.filePath}
                              originalCode={msg.codeModification.originalCode}
                              modifiedCode={msg.codeModification.modifiedCode}
                              summary={msg.codeModification.summary}
                              explanation={msg.codeModification.explanation}
                              diffSummary={msg.codeModification.diffSummary}
                            />
                          </div>
                        )}

                        {/* Google Search Grounding Sources */}
                        {msg.groundingSources && msg.groundingSources.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                              <Globe className="h-3.5 w-3.5" />
                              <span>بيانات حية من Google Search ({msg.groundingSources.length}):</span>
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {msg.groundingSources.map((src, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={src.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                                >
                                  <span>{src.title || "بيانات الأسعار"}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Executed Actions Breakdown */}
                        {msg.executedActions && msg.executedActions.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>الإجراءات المنفذة لحظياً:</span>
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.executedActions.map((act, actIdx) => (
                                <span
                                  key={actIdx}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold bg-secondary/80 text-foreground px-2.5 py-0.5 rounded-lg border border-border/60"
                                >
                                  <span className="text-emerald-600">{act.field}:</span>
                                  <span>{act.label}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Processing Loader */}
              {isProcessing && (
                <div className="flex items-center gap-3 p-4 rounded-3xl bg-card/80 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300 backdrop-blur-xl animate-pulse">
                  <Sparkles className="h-5 w-5 animate-spin text-emerald-500" />
                  <span>
                    {aiAssistantName} يحلل طلبك، يقرأ بيانات Supabase، ويصيغ الكود والتعديلات...
                  </span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Starter Prompts (Shown if single welcome message) */}
            {chatHistory.length <= 1 && (
              <div className="space-y-2.5 py-4">
                <span className="text-xs font-bold text-muted-foreground block px-1">
                  اقتراحات سريعة للبدء:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {STARTER_PROMPTS.map((starter, i) => {
                    const Icon = starter.icon;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (starter.targetFile) {
                            const found = PROJECT_FILES_REGISTRY.find(
                              (f) => f.path === starter.targetFile,
                            );
                            if (found) setAttachedFile(found);
                          }
                          handleSendMessage(
                            starter.prompt,
                            starter.targetFile
                              ? PROJECT_FILES_REGISTRY.find((f) => f.path === starter.targetFile)
                              : null,
                          );
                        }}
                        className="p-4 rounded-3xl border border-border/70 bg-card/60 hover:bg-card/90 hover:border-emerald-500/40 transition-all text-right cursor-pointer backdrop-blur-xl group flex items-start justify-between gap-2"
                      >
                        <div className="space-y-1 min-w-0">
                          <span className="font-bold text-xs text-foreground flex items-center gap-1.5 group-hover:text-emerald-600 transition-colors">
                            <Icon className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="truncate">{starter.title}</span>
                          </span>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {starter.desc}
                          </p>
                        </div>
                        <Sparkles className="h-4 w-4 text-amber-500 shrink-0 opacity-70 group-hover:opacity-100" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── OTHER MODES: FILES STUDIO / STORE ENGINE / ADVISORY ─── */}
        {activeMode === "files-studio" && <GeminiProjectFilesStudio />}
        {activeMode === "store-engine" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-4">
              <Card className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-xl p-5 space-y-4 shadow-elegant">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layout className="h-5 w-5 text-emerald-600" />
                    <div>
                      <h2 className="text-sm font-black font-display text-foreground">
                        محرك واجهة المتجر الحي (Visual Store Engine)
                      </h2>
                      <p className="text-[11px] text-muted-foreground">
                        غيّر الألوان، البانرات، وشبكات الإعلانات بالأوامر المباشرة
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resetConfig()}
                    className="h-8 rounded-xl text-xs gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>استعادة</span>
                  </Button>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-foreground">نسق الألوان (Palette):</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "emerald", label: "زمردي كلاسيكي", bg: "bg-emerald-600" },
                      { id: "dark_green", label: "أخضر داكن فاخر", bg: "bg-emerald-900" },
                      { id: "amber_warm", label: "ذهبي دافئ", bg: "bg-amber-600" },
                      { id: "blue_modern", label: "أزرق عصري", bg: "bg-blue-600" },
                      { id: "violet_luxury", label: "بنفسجي ملكي", bg: "bg-purple-600" },
                      { id: "rose_delight", label: "وردي بهيج", bg: "bg-rose-600" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setThemePalette(p.id as any);
                          toast.success(`تم تغيير ثيم الألوان إلى: ${p.label}`);
                        }}
                        className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                          layoutConfig.theme?.palette === p.id
                            ? "border-emerald-500 bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-300"
                            : "border-border/70 bg-card hover:bg-secondary"
                        }`}
                      >
                        <span className="text-xs">{p.label}</span>
                        <span className={`h-3.5 w-3.5 rounded-full ${p.bg}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
            <div className="lg:col-span-6 h-[650px]">
              <ShopLivePreview layout={layoutConfig} />
            </div>
          </div>
        )}
        {activeMode === "advisory" && <ExecutiveSummaryWidget kpis={kpis} />}
      </div>

      {/* ─── 3. CENTERED FLOATING INPUT BAR (GEMINI OFFICIAL STYLE) ─── */}
      {activeMode === "chat" && (
        <div className="sticky bottom-2 z-20 max-w-3xl mx-auto w-full px-2 pt-2">
          {/* Attached File Chip if present */}
          {attachedFile && (
            <div className="mb-2 inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 px-3.5 py-1 rounded-2xl text-xs font-mono font-bold border border-emerald-500/40 backdrop-blur-xl shadow-sm">
              <FileCode className="h-3.5 w-3.5" />
              <span>الملف المرفق: {attachedFile.path}</span>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="hover:text-rose-600 cursor-pointer ml-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-2xl shadow-2xl p-2.5 transition-all focus-within:border-emerald-500/70 focus-within:ring-4 focus-within:ring-emerald-500/15">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="space-y-2"
            >
              <Textarea
                ref={textareaRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`اسأل ${aiAssistantName} أو اطلب تعديل أي ملف في المشروع (مثال: عدل صفحة السلة cart.tsx لإضافة التوصيل السريع وإشعار صوتي)...`}
                disabled={isProcessing}
                rows={2}
                className="w-full text-xs sm:text-sm font-semibold bg-transparent border-none focus-visible:ring-0 resize-none placeholder:text-muted-foreground/70 p-2 min-h-[52px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />

              {/* Bottom Actions Row inside Floating Bar */}
              <div className="flex items-center justify-between pt-1 border-t border-border/40">
                {/* Left tools: Attach file & Google Search grounding */}
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsPickerOpen(true)}
                    className="h-8 px-2.5 rounded-xl text-xs font-bold gap-1 text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                  >
                    <Paperclip className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">إرفاق ملف</span>
                  </Button>

                  <button
                    type="button"
                    onClick={() => setEnableGoogleSearch(!enableGoogleSearch)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      enableGoogleSearch
                        ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                        : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    <Globe className="h-3 w-3" />
                    <span>بحث جوجل</span>
                  </button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCopywriterModalOpen(true)}
                    className="h-8 px-2.5 rounded-xl text-xs font-bold gap-1 text-muted-foreground hover:text-foreground hidden md:flex cursor-pointer"
                  >
                    <Package className="h-3.5 w-3.5 text-amber-500" />
                    <span>صانع العروض ✍️</span>
                  </Button>
                </div>

                {/* Right: Submit Button */}
                <Button
                  type="submit"
                  disabled={isProcessing || (!chatInput.trim() && !attachedFile)}
                  className="h-9 px-4 rounded-2xl hero-gradient text-white font-bold text-xs gap-1.5 shadow-md shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>إرسال</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODALS ─── */}
      <GeminiFileAttachmentPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectFile={(file) => {
          setAttachedFile(file);
          toast.success(`تم إرفاق ملف ${file.name} — اكتب طلبك لجيميناي!`);
        }}
        selectedFilePath={attachedFile?.path}
      />

      <SmartProductCopywriterModal
        isOpen={copywriterModalOpen}
        onClose={() => setCopywriterModalOpen(false)}
        onApply={(result) => {
          toast.success(`تم توليد الوصف الإعلاني للمنتج بنجاح: ${result.enhancedTitle}`);
        }}
      />
    </div>
  );
}
