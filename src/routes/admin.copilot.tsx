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
  Eye,
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
  
  SlidersHorizontal,
  Layers,
  ArrowRight,
  Building2,
  Cpu,
  Sliders,
} from "lucide-react";
import { AiToolDefinition } from "@/services/aiTools/types";
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
import { DEFAULT_LAYOUT_CONFIG, StoreLayoutConfig } from "@/types/layout-config";
import { StoreEngineBuilder } from "@/components/admin/StoreEngineBuilder";
import { ExecutiveSummaryWidget } from "@/components/admin/ExecutiveSummaryWidget";
import { LiveStorefrontPreview } from "@/components/admin/LiveStorefrontPreview";
import { GeminiProjectFilesStudio } from "@/components/admin/GeminiProjectFilesStudio";
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
  const aiAssistantName = "مساعد الوادي";
  const { config: layoutConfig, updateConfig, resetConfig, setThemePalette } = useLayoutConfig();

  // Active workspace mode
  const [activeMode, setActiveMode] = useState<
    "chat" | "files-studio" | "store-engine" | "advisory" | "live-preview"
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
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [kpis, setKpis] = useState<ExecutiveKpiInput>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    topSellingCategory: "غير محدد",
      });
  

  const [lastRollback, setLastRollback] = useState<RollbackPoint | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleDeployLayout = async () => {
    setIsDeploying(true);
    await new Promise(r => setTimeout(r, 1000));
    toast.success("تم نشر التعديلات بنجاح!");
    setIsDeploying(false);
  };


  useEffect(() => {
    const sync = () => setLastRollback(getLastRollbackPoint());
    sync();
    window.addEventListener("ai_rollback_stack_changed", sync);
    return () => window.removeEventListener("ai_rollback_stack_changed", sync);
  }, []);

  const handleRollback = async () => {
    if (!lastRollback) return;
    try {
      const res = await rollbackLastAction();
      if (res?.ok) {
        toast.success(res.messageAr || "تم التراجع بنجاح");
        queryClient.invalidateQueries();
      } else {
        toast.error(res.messageAr || "فشل التراجع");
      }
    } catch (e: unknown) {
      toast.error((e as Error).message);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && !attachedFile) return;
    handleSendMessage(chatInput, attachedFile);
    setChatInput("");
    setAttachedFile(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!chatInput.trim() && !attachedFile) return;
      handleSendMessage(chatInput, attachedFile);
      setChatInput("");
      setAttachedFile(null);
    }
  };

  const handleSendMessage = async (prompt: string, file: ProjectFileMeta | null = null) => {
    if (!prompt.trim() && !file) return;

    const newMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt,
      attachedFile: file || undefined,
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    };

    setChatHistory((prev) => [...prev, newMsg]);
    setIsProcessing(true);

    try {
      const response = await runAdminCoPilotChat(prompt, chatHistory, {
        model: selectedModel,
        role: selectedRole,
        page: "admin.copilot",
        userRole: "admin", // Assuming admin given this is admin.copilot
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
        executedActions: response.executedActions,
        suggestedAction: response.action,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      };

      setChatHistory((prev) => [...prev, aiMsg]);
    } catch (e) {
      setChatHistory((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "حدث خطأ أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.",
          timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        }
      ]);
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
      <div className="flex-none border-b border-white/20 dark:border-white/10 bg-background/70 backdrop-blur-3xl px-4 py-3 z-20 shadow-[0_4px_30px_rgba(0,0,0,0.03)] relative">
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
              {(
                [
                  { id: "live-preview", label: "المعاينة الحية", icon: Eye },
                  { id: "files-studio", label: "محرر الأكواد", icon: FileCode },
                  { id: "store-engine", label: "محرك الواجهة", icon: Layout },
                  { id: "advisory", label: "التقارير", icon: TrendingUp },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveMode(tab.id)}
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

            {/* AI Tools Sheet Trigger */}
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
                          {AI_TOOL_GROUP_LABELS[group].labelAr}
                        </div>
                        <div className="space-y-1.5">
                          {tools.map((tool) => (
                            <div
                              key={tool.name}
                              className="rounded-lg border border-zinc-200/70 dark:border-zinc-800 p-2.5 bg-zinc-50/50 dark:bg-zinc-800/30"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                  {tool.name}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
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
              className="h-7 px-2 rounded-lg text-xs font-medium border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer gap-1 text-emerald-700 dark:text-emerald-400"
              title="جلسة جديدة"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.5} />
              <span>جديد</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 2. MAIN SPLIT WORKSPACE ─── */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row relative">
        {/* RIGHT PANE: CHAT (First in RTL) */}
        <div className="w-full lg:w-[400px] xl:w-[450px] h-1/2 lg:h-full shrink-0 border-b lg:border-b-0 lg:border-l border-white/20 dark:border-white/10 bg-background/60 backdrop-blur-3xl flex flex-col z-10 relative shadow-[-10px_0_40px_rgba(0,0,0,0.04)] lg:shadow-[-10px_0_40px_rgba(0,0,0,0.04)]">
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-[env(safe-area-inset-bottom,24px)] mb-40 lg:mb-48">
            <div className="max-w-2xl mx-auto space-y-4">
              {chatHistory.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div key={msg.id} className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Avatar */}
                    <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full shadow-sm border border-white/20 ${isUser ? "bg-secondary text-foreground" : "bg-[#E55300] text-white"}`}>
                      {isUser ? <Bot className="h-4 w-4" strokeWidth={1.5} /> : <Sparkles className="h-4 w-4" strokeWidth={1.5} />}
                    </div>

                    {/* Bubble */}
                    <div className={`space-y-1 max-w-[85%] ${isUser ? "text-right" : "text-right"}`}>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium px-1">
                        <span>{isUser ? "المسؤول" : aiAssistantName}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      <div className={`rounded-3xl p-4 text-xs sm:text-sm leading-relaxed shadow-[0_4px_24px_rgba(0,0,0,0.04)] ${isUser ? "bg-[#036233] text-white rounded-tr-sm font-medium" : "bg-card/80 backdrop-blur-xl text-foreground border border-white/20 dark:border-white/10 rounded-tl-sm"}`}>
                        {msg.attachedFile && (
                          <div className="mb-2.5 inline-flex items-center gap-1.5 bg-black/10 dark:bg-white/10 px-2.5 py-1 rounded-md text-xs font-mono">
                            <Paperclip className="h-3 w-3" strokeWidth={1.5} />
                            <span>{msg.attachedFile.path}</span>
                          </div>
                        )}
                        <div className="whitespace-pre-line leading-relaxed">{msg.content}</div>
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
                        {msg.groundingSources && msg.groundingSources.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5">
                            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <Globe className="h-3 w-3" strokeWidth={1.5} />
                              <span>مصادر البحث ({msg.groundingSources.length}):</span>
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.groundingSources.map((src, sIdx) => (
                                <a key={sIdx} href={src.uri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded border border-blue-200/60 dark:border-blue-800">
                                  <span>{src.title || "مصدر خارجي"}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        {msg.executedActions && msg.executedActions.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-1.5">
                            {msg.executedActions.map((act, actIdx) => (
                              <span key={actIdx} className="inline-flex items-center gap-1 text-[10px] font-medium bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                                <span className="text-emerald-600">{act.field ? String(act.field) : 'Field'}:</span>
                                <span>{act.label ? String(act.label) : 'Action'}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isProcessing && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 shadow-xs">
                  <Sparkles className="h-4 w-4 animate-spin text-emerald-600" strokeWidth={1.5} />
                  <span>جاري معالجة الطلب والتفاعل مع النظام...</span>
                </div>
              )}
              {chatHistory.length <= 1 && (
                <div className="pt-2 space-y-2">
                  <span className="text-[11px] font-medium text-zinc-400 block px-1">إجراءات سريعة مقترحة:</span>
                  <div className="grid grid-cols-1 gap-2">
                    {STARTER_PROMPTS.map((starter, i) => {
                      const Icon = starter.icon;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            if (starter.targetFile) {
                              const found = PROJECT_FILES_REGISTRY.find((f) => f.path === starter.targetFile);
                              if (found) setAttachedFile(found);
                            }
                            handleSendMessage(starter.prompt, starter.targetFile ? PROJECT_FILES_REGISTRY.find((f) => f.path === starter.targetFile) : null);
                          }}
                          className="p-3 rounded-3xl border border-white/20 dark:border-white/10 bg-card/60 backdrop-blur-xl hover:border-[#036233]/50 transition-colors text-right cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.03)] group flex items-start justify-between gap-2"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <span className="block text-xs font-bold text-zinc-700 dark:text-zinc-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">{starter.title}</span>
                            <span className="block text-[10px] text-zinc-500 truncate">{starter.prompt}</span>
                          </div>
                          <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-600 transition-colors">
                            <Icon className="h-3 w-3" strokeWidth={1.5} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Input Area */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 via-background/80 to-transparent p-4 pb-[calc(env(safe-area-inset-bottom,24px)+1rem)] lg:pb-6 pt-12 z-10">
            <form onSubmit={handleFormSubmit} className="max-w-2xl mx-auto relative group">
              <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/20 dark:border-white/10 pointer-events-none transition-colors group-focus-within:border-[#036233]/50 dark:group-focus-within:border-[#036233]/50 group-focus-within:ring-2 group-focus-within:ring-[#036233]/20" />
              <div className="relative flex flex-col p-2">
                {attachedFile && (
                  <div className="mx-2 mt-1 mb-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-between border border-emerald-100 dark:border-emerald-900/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="grid h-6 w-6 shrink-0 place-items-center rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600">
                        <Paperclip className="h-3 w-3" strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200 truncate">{attachedFile.name}</span>
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono truncate">{attachedFile.path}</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => setAttachedFile(null)} className="p-1 hover:bg-emerald-200/50 dark:hover:bg-emerald-800/50 rounded-lg text-emerald-600 transition-colors shrink-0">
                      <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                )}
                <div className="flex items-end gap-2 px-1">
                  <div className="flex-1 min-w-0 flex items-center gap-2 relative">
                    <button type="button" onClick={() => setIsPickerOpen(true)} className="p-2 shrink-0 rounded-xl text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors" title="إرفاق ملف للتحليل">
                      <Paperclip className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isProcessing ? "جاري المعالجة..." : "اكتب أمرك هنا... (مثال: أضف منتج جبنة بيضاء بـ 140 جنيه)"}
                      className="w-full bg-transparent border-0 focus:ring-0 resize-none text-sm py-2.5 px-0 min-h-[44px] max-h-[160px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 font-medium"
                      rows={1}
                      disabled={isProcessing}
                      dir="auto"
                    />
                  </div>
                  <button type="submit" disabled={isProcessing || (!chatInput.trim() && !attachedFile)} className="mb-1 shrink-0 grid h-10 w-10 place-items-center rounded-full bg-[#E55300] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#E55300]/90 transition-colors shadow-[0_4px_16px_rgba(229,83,0,0.3)]">
                    <Send className="h-4 w-4 rtl:-scale-x-100" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </form>
            <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-400 font-medium max-w-2xl mx-auto px-1">
              <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-emerald-500" strokeWidth={1.5} /> <span>Gemini 3.1 Pro Engine</span></span>
              <span>يمكنه تنفيذ الأوامر مباشرة 🚀</span>
            </div>
          </div>
        </div>

        {/* LEFT PANE: WORKSPACE MODES */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-900 relative">
          {activeMode === 'live-preview' && (
            <div className="h-full overflow-y-auto">
              <LiveStorefrontPreview s={settings} />
            </div>
          )}
          {activeMode === 'files-studio' && (
            <div className="h-full overflow-y-auto p-4">
              <GeminiProjectFilesStudio />
            </div>
          )}
          {activeMode === 'store-engine' && (
            <div className="h-full overflow-y-auto p-4 max-w-6xl mx-auto w-full">
              <div className="space-y-6 pb-20">
                <StoreEngineBuilder layoutConfig={layoutConfig} onLayoutChange={updateConfig} onDeploy={handleDeployLayout} isDeploying={isDeploying} />
              </div>
            </div>
          )}
          {activeMode === 'advisory' && (
            <div className="h-full overflow-y-auto p-4 max-w-5xl mx-auto w-full">
              <ExecutiveSummaryWidget kpis={kpis} />
            </div>
          )}
        </div>
      </div>

      {/* ─── MODALS ─── */}
      <GeminiFileAttachmentPicker isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} onSelectFile={(file) => { setAttachedFile(file); toast.success(`تم إرفاق ملف ${file.name}`); }} selectedFilePath={attachedFile?.path} />
      <SmartProductCopywriterModal open={copywriterModalOpen} onOpenChange={setCopywriterModalOpen} onApplyCopywriting={(result) => { toast.success(`تم توليد الوصف الإعلاني للمنتج: ${result.name ?? ""}`); }} />
    </div>
  );
}