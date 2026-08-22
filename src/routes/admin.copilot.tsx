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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Undo2,
  Wrench,
  Plus,
  FolderTree,
  Eye,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  Building2,
  Cpu,
  Sliders,
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
import {
  AI_TOOL_SUITE,
  AI_TOOL_GROUP_LABELS,
  executeAiTool,
  routeCommandToTool,
  createRollbackPoint,
  getLastRollbackPoint,
  rollbackLastAction,
  type AiToolGroup,
  type RollbackPoint,
} from "@/services/geminiToolsEngine";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/settings-context";
import { BRAND_NAME_AR } from "@/lib/brand";

export const Route = createFileRoute("/admin/copilot")({
  head: () => ({
    meta: [
      { title: "المساعد الذكي — إدارة المتجر" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminCoPilotPage,
});

const STARTER_PROMPTS = [
  {
    title: "تعديل صفحة السلة",
    desc: "إضافة خيار التوصيل السريع وحفظ الموقع الافتراضي",
    targetFile: "/src/routes/cart.tsx",
    prompt:
      "عدل كود صفحة السلة /src/routes/cart.tsx لإضافة خيار التوصيل الفوري السريع وتفعيل حفظ الموقع الافتراضي للمستخدم عبر الخريطة",
    icon: ShoppingBag,
  },
  {
    title: "تطوير بوابة المندوب",
    desc: "تفعيل التوجيه ثنائي المراحل والتنبيه الصوتي",
    targetFile: "/src/routes/driver.tsx",
    prompt:
      "عدل ملف /src/routes/driver.tsx لتعزيز التوجيه ثنائي المراحل (المتجر ثم العميل) وإضافة تنبيه صوتي عند وصول الطلب",
    icon: Zap,
  },
  {
    title: "تحديث نسق ألوان المتجر",
    desc: "تطبيق النمط الزمردي الهادئ وحواف البطاقات المنظمة",
    prompt:
      "قم بضبط نسق المتجر على اللون الأخضر الزمردي الهادئ، واجعل حواف البطاقات ناعمة مع إضافة قسم إعلانات مصغرة",
    icon: Layout,
  },
  {
    title: "أبحاث أسعار السوق",
    desc: "مقارنة أسعار السلع الأساسية وتقديم توصيات تسعير",
    prompt:
      "ابحث عن أحدث أسعار الألبان والزيوت والسلع الأساسية في السوق وقدم توصية تسعيرية للمتجر",
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
    "chat" | "files-studio" | "store-engine" | "advisory"
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
  const [toolsSheetOpen, setToolsSheetOpen] = useState(false);

  // 10-Tool Executable Engine state
  const queryClient = useQueryClient();
  const [activeToolName, setActiveToolName] = useState<string | null>(null);
  const [lastRollback, setLastRollback] = useState<RollbackPoint | null>(null);

  useEffect(() => {
    const sync = () => setLastRollback(getLastRollbackPoint());
    sync();
    window.addEventListener("ai_rollback_stack_changed", sync);
    return () => window.removeEventListener("ai_rollback_stack_changed", sync);
  }, []);

  const toolContext = {
    layout: layoutConfig,
    updateLayout: (next: typeof layoutConfig) => updateConfig(next),
    refresh: () => {
      void queryClient.invalidateQueries({ queryKey: ["store-products"] });
      void queryClient.invalidateQueries({ queryKey: ["store-categories"] });
      void queryClient.invalidateQueries({ queryKey: ["hero-banners"] });
    },
  };

  const pushAssistantMessage = (content: string) => {
    setChatHistory((prev) => [
      ...prev,
      {
        id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: "assistant",
        modelUsed: selectedModel,
        roleUsed: selectedRole,
        content,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleUndoLastAction = async () => {
    const res = await rollbackLastAction(toolContext);
    setLastRollback(getLastRollbackPoint());
    if (res.ok) toast.success(res.messageAr);
    else toast.info(res.messageAr);
    pushAssistantMessage(`تم التراجع عن الإجراء الأخير: ${res.messageAr}`);
  };

  // Multi-Turn Chat History
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      role: "assistant",
      modelUsed: "gemini-2.5-flash",
      roleUsed: "store_architect",
      content: `مرحباً بك في المساعد الذكي لإدارة ${storeName}.\n\nيمكنك تنفيذ المهام التالية مباشرة:\n• تعديل أي ملف برمجي في المتجر أو استعراض الفروقات (Diffs).\n• التحكم في ألوان وتخطيط المتجر وتفعيل العروض.\n• أبحاث أسعار السوق اللحظية عبر محرك البحث.\n• متابعة مؤشرات المبيعات وتحليل المخزون.`,
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
      const routed = !targetFile ? routeCommandToTool(prompt) : null;
      if (routed) {
        const meta = AI_TOOL_SUITE.find((t) => t.name === routed.tool);
        setActiveToolName(routed.tool);
        if (meta?.mutatesState) {
          createRollbackPoint(routed.tool, meta.labelAr, layoutConfig);
        }
        const result = await executeAiTool(routed.tool, routed.args, toolContext);
        setActiveToolName(null);
        setLastRollback(getLastRollbackPoint());
        pushAssistantMessage(
          `**${meta?.labelAr || routed.tool}** — \`${routed.tool}()\`\n\n${result.messageAr}${
            result.data && "imageUrl" in result.data
              ? `\n\n![generated](${String(result.data.imageUrl)})`
              : ""
          }${result.ok && meta?.mutatesState ? "\n\nتم تطبيق التعديل مباشرة على المتجر." : ""}`,
        );
        if (result.ok) toast.success(result.messageAr);
        else toast.error(result.messageAr);
        setIsProcessing(false);
        return;
      }

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
          content: `**${codeResult.summary}**\n\n${codeResult.explanation}`,
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
        toast.success(`تم توليد تعديل الكود لملف ${filePath}`);
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
          content: `**${result.actionSummary}**\n\n${result.explanation}`,
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
        content: "حدث خطأ أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.",
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
        content: `تم بدء جلسة محادثة جديدة مع **${aiAssistantName}**.\n\nكيف يمكنني مساعدتك الآن؟`,
        timestamp: "الآن",
      },
    ]);
    setAttachedFile(null);
    setChatInput("");
    toast.info("تم بدء محادثة جديدة");
  };

  return (
    <div
      className="relative h-[calc(100dvh-3.5rem)] flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950 font-sans"
      dir="rtl"
    >
      {/* ─── 1. TOP HEADER & NAVIGATION ─── */}
      <div className="flex-none border-b border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 z-20">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Identity & Status */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-900 text-white dark:bg-emerald-600 shadow-xs shrink-0">
              <Sparkles className="h-4 w-4" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {aiAssistantName}
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Gemini 3.1 Pro
                </span>
              </div>
            </div>
          </div>

          {/* Mode Switcher & Actions */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end w-full sm:w-auto">
            <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200/60 dark:border-zinc-700">
              {[
                { id: "chat", label: "المحادثة", icon: MessageSquare },
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
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* AI Tools Sheet Trigger (Clean Dropdown/Drawer) */}
            <Sheet open={toolsSheetOpen} onOpenChange={setToolsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 rounded-lg text-xs font-medium border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer gap-1"
                >
                  <Wrench className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.5} />
                  <span>الأدوات</span>
                  <span className="text-[10px] text-zinc-400 font-mono">({AI_TOOL_SUITE.length})</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 sm:w-96 p-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col" dir="rtl">
                <SheetHeader className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                  <SheetTitle className="text-sm font-bold flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-emerald-600" strokeWidth={1.5} />
                    <span>أدوات الذكاء الاصطناعي التنفيذية</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {(Object.keys(AI_TOOL_GROUP_LABELS) as AiToolGroup[]).map((group) => {
                    const tools = AI_TOOL_SUITE.filter((t) => t.group === group);
                    if (!tools.length) return null;
                    return (
                      <div key={group} className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-zinc-400">
                          {AI_TOOL_GROUP_LABELS[group]}
                        </div>
                        <div className="space-y-1.5">
                          {tools.map((tool) => (
                            <div
                              key={tool.name}
                              className="rounded-lg border border-zinc-200/70 dark:border-zinc-800 p-2.5 bg-zinc-50/50 dark:bg-zinc-800/30"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                  {tool.labelAr}
                                </span>
                                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                                  {tool.name}()
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                                {tool.descriptionAr}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant="outline"
              size="sm"
              onClick={handleStartNewChat}
              className="h-7 px-2 rounded-lg text-xs font-medium border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer gap-1"
              title="جلسة جديدة"
            >
              <Plus className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.5} />
              <span>جديد</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN CHAT / WORKSPACE VIEW ─── */}
      <div className="flex-1 min-h-0 relative">
        {activeMode === "chat" && (
          <div className="h-full flex flex-col">
            {/* Scrollable messages container with safe padding bottom */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-36">
              <div className="max-w-3xl mx-auto space-y-4">
                {chatHistory.map((msg) => {
                  const isUser = msg.role === "user";

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-3 ${
                        isUser ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                          isUser
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                            : "bg-emerald-600 text-white"
                        }`}
                      >
                        {isUser ? (
                          <Bot className="h-3.5 w-3.5" strokeWidth={1.5} />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
                        )}
                      </div>

                      {/* Bubble */}
                      <div className={`space-y-1 max-w-[85%] ${isUser ? "text-right" : "text-right"}`}>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium px-1">
                          <span>{isUser ? "المسؤول" : aiAssistantName}</span>
                          <span>•</span>
                          <span>{msg.timestamp}</span>
                        </div>

                        <div
                          className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                            isUser
                              ? "bg-emerald-600 text-white rounded-tr-xs shadow-xs font-medium"
                              : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-800 rounded-tl-xs shadow-xs"
                          }`}
                        >
                          {/* Attached File */}
                          {msg.attachedFile && (
                            <div className="mb-2.5 inline-flex items-center gap-1.5 bg-black/10 dark:bg-white/10 px-2.5 py-1 rounded-md text-xs font-mono">
                              <Paperclip className="h-3 w-3" strokeWidth={1.5} />
                              <span>{msg.attachedFile.path}</span>
                            </div>
                          )}

                          <div className="whitespace-pre-line leading-relaxed">
                            {msg.content}
                          </div>

                          {/* Code Diff Viewer */}
                          {msg.codeModification && (
                            <div className="mt-3">
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

                          {/* Grounding Sources */}
                          {msg.groundingSources && msg.groundingSources.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5">
                              <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <Globe className="h-3 w-3" strokeWidth={1.5} />
                                <span>مصادر البحث ({msg.groundingSources.length}):</span>
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {msg.groundingSources.map((src, sIdx) => (
                                  <a
                                    key={sIdx}
                                    href={src.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-800"
                                  >
                                    <span>{src.title || "مصدر خارجي"}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Executed Actions */}
                          {msg.executedActions && msg.executedActions.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-1.5">
                              {msg.executedActions.map((act, actIdx) => (
                                <span
                                  key={actIdx}
                                  className="inline-flex items-center gap-1 text-[10px] font-medium bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700"
                                >
                                  <span className="text-emerald-600">{act.field}:</span>
                                  <span>{act.label}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Processing Indicator */}
                {isProcessing && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 shadow-xs">
                    <Sparkles className="h-4 w-4 animate-spin text-emerald-600" strokeWidth={1.5} />
                    <span>جاري معالجة الطلب والتفاعل مع النظام...</span>
                  </div>
                )}

                {/* Starter Prompts */}
                {chatHistory.length <= 1 && (
                  <div className="pt-2 space-y-2">
                    <span className="text-[11px] font-medium text-zinc-400 block px-1">
                      إجراءات سريعة مقترحة:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                            className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors text-right cursor-pointer shadow-xs group flex items-start justify-between gap-2"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                <Icon className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.5} />
                                <span className="truncate">{starter.title}</span>
                              </span>
                              <p className="text-[11px] text-zinc-500 truncate">
                                {starter.desc}
                              </p>
                            </div>
                            <ChevronLeft className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" strokeWidth={1.5} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            </div>

            {/* ─── 3. FIXED FLOATING INPUT BAR ─── */}
            <div className="absolute bottom-3 inset-x-0 z-30 px-4 pointer-events-none">
              <div className="max-w-3xl mx-auto w-full pointer-events-auto">
                {/* Attached File Chip */}
                {attachedFile && (
                  <div className="mb-1.5 inline-flex items-center gap-1.5 bg-zinc-900 text-white dark:bg-zinc-800 px-3 py-1 rounded-lg text-xs font-mono shadow-xs">
                    <FileCode className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span>{attachedFile.path}</span>
                    <button
                      type="button"
                      onClick={() => setAttachedFile(null)}
                      className="hover:text-rose-400 cursor-pointer ml-1"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                )}

                <div className="rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-2 transition-all focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="space-y-1.5"
                  >
                    <Textarea
                      ref={textareaRef}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={`اسأل ${aiAssistantName} أو اطلب تعديل ملف في المشروع...`}
                      disabled={isProcessing}
                      rows={1}
                      className="w-full text-xs sm:text-sm font-normal bg-transparent border-none focus-visible:ring-0 resize-none placeholder:text-zinc-400 p-1.5 min-h-[42px]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800">
                      {/* Helpers */}
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsPickerOpen(true)}
                          className="h-7 px-2 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer gap-1"
                        >
                          <Paperclip className="h-3.5 w-3.5" strokeWidth={1.5} />
                          <span className="hidden sm:inline">إرفاق ملف</span>
                        </Button>

                        <button
                          type="button"
                          onClick={() => setEnableGoogleSearch(!enableGoogleSearch)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${
                            enableGoogleSearch
                              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700"
                              : "bg-transparent text-zinc-400 border-transparent hover:text-zinc-600"
                          }`}
                        >
                          <Globe className="h-3 w-3" strokeWidth={1.5} />
                          <span>بحث جوجل</span>
                        </button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setCopywriterModalOpen(true)}
                          className="h-7 px-2 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 hidden md:flex cursor-pointer gap-1"
                        >
                          <Package className="h-3.5 w-3.5" strokeWidth={1.5} />
                          <span>صانع العروض</span>
                        </Button>
                      </div>

                      {/* Right: Undo + Submit */}
                      <div className="flex items-center gap-1.5">
                        {lastRollback && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleUndoLastAction}
                            disabled={isProcessing}
                            className="h-7 px-2 rounded-lg text-xs font-medium text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 cursor-pointer gap-1"
                          >
                            <Undo2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                            <span className="hidden sm:inline">تراجع</span>
                          </Button>
                        )}
                        <Button
                          type="submit"
                          disabled={isProcessing || (!chatInput.trim() && !attachedFile)}
                          className="h-7 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <Send className="h-3 w-3" strokeWidth={1.5} />
                          <span>إرسال</span>
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── OTHER MODES ─── */}
        {activeMode === "files-studio" && (
          <div className="h-full overflow-y-auto p-4">
            <GeminiProjectFilesStudio />
          </div>
        )}

        {activeMode === "store-engine" && (
          <div className="h-full overflow-y-auto p-4 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 space-y-3">
                <Card className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Layout className="h-4 w-4 text-emerald-600" strokeWidth={1.5} />
                      <div>
                        <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          محرك الواجهة
                        </h2>
                        <p className="text-[11px] text-zinc-500">
                          التحكم في نسق الألوان والمظهر
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resetConfig()}
                      className="h-7 rounded-lg text-xs gap-1 text-zinc-500"
                    >
                      <RotateCcw className="h-3 w-3" strokeWidth={1.5} />
                      <span>استعادة</span>
                    </Button>
                  </div>

                  <div className="space-y-2 pt-3">
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">نسق الألوان:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "emerald", label: "زمردي كلاسيكي", bg: "bg-emerald-600" },
                        { id: "dark_green", label: "أخضر داكن", bg: "bg-emerald-900" },
                        { id: "amber_warm", label: "ذهبي دافئ", bg: "bg-amber-600" },
                        { id: "blue_modern", label: "أزرق عصري", bg: "bg-blue-600" },
                        { id: "violet_luxury", label: "بنفسجي", bg: "bg-purple-600" },
                        { id: "slate_minimal", label: "رمادي هادئ", bg: "bg-zinc-600" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setThemePalette(p.id as any);
                            toast.success(`تم تغيير نسق الألوان`);
                          }}
                          className={`p-2 rounded-lg border text-right transition-colors cursor-pointer flex items-center justify-between text-xs ${
                            layoutConfig.theme?.palette === p.id
                              ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 font-semibold text-emerald-700 dark:text-emerald-300"
                              : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50"
                          }`}
                        >
                          <span>{p.label}</span>
                          <span className={`h-3 w-3 rounded-full ${p.bg}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
              <div className="lg:col-span-7 h-[600px]">
                <ShopLivePreview layout={layoutConfig} />
              </div>
            </div>
          </div>
        )}

        {activeMode === "advisory" && (
          <div className="h-full overflow-y-auto p-4 max-w-5xl mx-auto">
            <ExecutiveSummaryWidget kpis={kpis} />
          </div>
        )}
      </div>

      {/* ─── MODALS ─── */}
      <GeminiFileAttachmentPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectFile={(file) => {
          setAttachedFile(file);
          toast.success(`تم إرفاق ملف ${file.name}`);
        }}
        selectedFilePath={attachedFile?.path}
      />

      <SmartProductCopywriterModal
        open={copywriterModalOpen}
        onOpenChange={setCopywriterModalOpen}
        onApplyCopywriting={(result) => {
          toast.success(`تم توليد الوصف الإعلاني للمنتج: ${result.name ?? ""}`);
        }}
      />
    </div>
  );
}
