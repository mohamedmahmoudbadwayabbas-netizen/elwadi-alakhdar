import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, LoaderCircle, Plus, Search, ShoppingBasket, Sparkles, WandSparkles } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { searchProductsFuzzy } from "@/lib/fuzzy-search";
import { useStoreProducts } from "@/lib/store-data-hooks";
import type { Product } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StickyCartBar } from "@/components/storefront/StickyCartBar";
import { runAdminCoPilotChat, type ChatMessage } from "@/services/gemini36Service";
import { DEFAULT_GEMINI_MODEL } from "@/lib/gemini-config";

export const Route = createFileRoute("/assistant")({ component: ShoppingAssistantPage });

const suggestions = ["فطار سريع", "احتياجات البيت", "سناكس للأطفال", "مستلزمات التنظيف"];

function ShoppingAssistantPage() {
  const { data: products = [], isLoading, isFetching, isError, refetch } = useStoreProducts();
  const { items, addItem, totalPrice } = useCart();
  const [request, setRequest] = useState("");
  const [submittedRequest, setSubmittedRequest] = useState("");
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [assistantError, setAssistantError] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const matches = useMemo(() => {
    const inStockProducts = products.filter((product) => Number(product.stock_quantity) > 0);
    if (!submittedRequest.trim()) {
      const featured = inStockProducts.filter((product) => product.is_featured);
      return (featured.length ? featured : inStockProducts).slice(0, 6);
    }
    const words = submittedRequest.trim().split(/[،,\s]+/).filter((word) => word.length > 1);
    const unique = new Map<string, Product>();
    for (const word of words) {
      for (const product of searchProductsFuzzy(inStockProducts, word, 0.45).slice(0, 8)) unique.set(product.id, product);
    }
    return [...unique.values()].slice(0, 12);
  }, [products, submittedRequest]);

  const add = (product: Product) => {
    addItem(product);
    setAddedIds((ids) => ids.includes(product.id) ? ids : [...ids, product.id]);
  };

  const askAssistant = async (prompt = request) => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || isThinking) return;
    setRequest(cleanPrompt);
    setSubmittedRequest(cleanPrompt);
    setAssistantError("");
    setIsThinking(true);
    const userMessage: ChatMessage = {
      id: `customer-${Date.now()}`,
      role: "user",
      content: cleanPrompt,
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    };
    try {
      const catalogRead = await refetch();
      if (catalogRead.error || catalogRead.isError) {
        throw new Error("تعذر تأكيد قراءة الكتالوج من Supabase.");
      }
      const response = await runAdminCoPilotChat(cleanPrompt, chatHistory, {
        model: DEFAULT_GEMINI_MODEL,
        role: "copywriter",
        page: "assistant",
        userRole: "customer",
      });
      const reply: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.text,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      };
      setChatHistory((messages) => [...messages, userMessage, reply]);
    } catch {
      setAssistantError("تعذر الوصول إلى مساعد التسوق الآن. جرّب البحث في المنتجات المتاحة أدناه.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="elwadi-assistant" dir="rtl">
      <header className="elwadi-assistant__header">
        <Link to="/" className="elwadi-assistant__back"><ArrowRight size={17} /> المتجر</Link>
        <div className="elwadi-assistant__brand"><span><Sparkles size={17} /></span><b>مساعد الوادي الأخضر</b></div>
        <Link to="/cart" className="elwadi-assistant__cart"><ShoppingBasket size={17} /> السلة <b>{items.length}</b></Link>
      </header>

      <main className="elwadi-assistant__layout">
        <section className="elwadi-assistant__work">
          <div className="elwadi-assistant__intro">
            <span className="elwadi-assistant__eyebrow"><WandSparkles size={15} /> تسوّق على طريقتك</span>
            <h1>قائمة بيتك، <em>مرتّبة بسهولة.</em></h1>
            <p>اكتب المنتجات التي تحتاجها، وسنبحث عنها في كتالوج المتجر لتضيف ما يناسبك إلى السلة.</p>
          </div>

          <div className="elwadi-assistant__composer">
            <label htmlFor="shopping-request">ما الذي تحتاجه اليوم؟</label>
            <div className="elwadi-assistant__input-row">
              <Input id="shopping-request" value={request} onChange={(event) => setRequest(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void askAssistant(); } }} placeholder="مثال: فطار لأربع أشخاص بميزانية 250 جنيه..." />
              <Button type="button" disabled={isThinking || !request.trim()} onClick={() => void askAssistant()}>{isThinking ? <LoaderCircle size={17} className="animate-spin" /> : <Sparkles size={17} />} اسأل مساعد التسوق</Button>
            </div>
            <div className="elwadi-assistant__suggestions">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => { setRequest(suggestion); void askAssistant(suggestion); }}>{suggestion}</button>)}</div>
          </div>

          {isThinking && <div className="elwadi-assistant__loading"><LoaderCircle className="animate-spin" /> أبحث في منتجات المتجر وأرتّب اقتراحًا مناسبًا…</div>}
          {assistantError && <div className="elwadi-assistant__empty" role="status">{assistantError}</div>}
          {chatHistory.length > 0 && <div className="elwadi-assistant__conversation" aria-live="polite">{chatHistory.map((message) => <article className={`elwadi-assistant__reply is-${message.role}`} key={message.id}><div>{message.role === "assistant" ? <Sparkles size={17} /> : null}<b>{message.role === "assistant" ? "مساعد التسوق" : "أنت"}</b></div><p>{message.content}</p></article>)}</div>}

          <div className="elwadi-assistant__results-head">
            <div><h2>{submittedRequest ? "نتائج من كتالوج المتجر" : "اختيارات من المتجر"}</h2><p>{isError ? "تعذر التحقق من قائمة المنتجات" : `${matches.length} منتجات متاحة للإضافة`}</p></div>
            <span className="elwadi-assistant__live"><i /> {isError ? "غير متصل" : "قراءة مباشرة من المتجر"}</span>
          </div>
          {isLoading || isFetching ? <div className="elwadi-assistant__loading"><LoaderCircle className="animate-spin" /> جارٍ التحقق من المنتجات من قاعدة المتجر</div> : isError ? (
            <div className="elwadi-assistant__empty" role="status"><b>تعذر الاتصال بقاعدة المتجر</b><span>لم أتمكن من التحقق من المنتجات والأسعار، لذلك لن أعرض بيانات قديمة أو تجريبية.</span></div>
          ) : matches.length ? (
            <div className="elwadi-assistant__products">{matches.map((product) => {
              const alreadyAdded = addedIds.includes(product.id);
              return <article className="elwadi-assistant__product" key={product.id}>
                <div className="elwadi-assistant__product-image">{product.image_url ? <img src={product.image_url} alt="" /> : <ShoppingBasket size={22} />}</div>
                <div className="elwadi-assistant__product-copy"><h3>{product.name_ar || product.name}</h3><p>{product.description_ar || product.description || "متوفر من منتجات المتجر"}</p><strong dir="ltr">{product.price_per_unit.toFixed(2)} <small>ج.م / {product.unit_label || "قطعة"}</small></strong></div>
                <button className={alreadyAdded ? "is-added" : ""} onClick={() => add(product)} aria-label={alreadyAdded ? "أُضيف إلى السلة" : "أضف إلى السلة"}>{alreadyAdded ? <Check size={18} /> : <Plus size={18} />}</button>
              </article>;
            })}</div>
          ) : <div className="elwadi-assistant__empty"><Search size={24} /><b>لم نعثر على مطابقة في المنتجات المتاحة</b><span>جرّب اسمًا أقصر أو تصفّح المتجر مباشرة.</span><Link to="/">تصفّح كل الأقسام</Link></div>}
        </section>

        <aside className="elwadi-assistant__summary">
          <div className="elwadi-assistant__summary-title"><div><span>ملخص قائمتك</span><b>{items.length} أصناف</b></div><ShoppingBasket size={20} /></div>
          {items.length ? <ul>{items.slice(0, 6).map(({ product, quantity }) => <li key={product.id}><span>{product.name_ar || product.name}<small>الكمية: {quantity}</small></span><b dir="ltr">{(product.price_per_unit * quantity).toFixed(2)} ج.م</b></li>)}</ul> : <div className="elwadi-assistant__summary-empty">ابدأ بإضافة منتجات من القائمة، وستظهر هنا للمراجعة.</div>}
          <div className="elwadi-assistant__total"><span>المجموع الحالي</span><b dir="ltr">{totalPrice.toFixed(2)} <small>ج.م</small></b></div>
          <Link to="/cart" className="elwadi-assistant__checkout">مراجعة السلة وإتمام الطلب <ArrowRight size={16} /></Link>
          <p className="elwadi-assistant__note">المنتجات والأسعار مأخوذة من كتالوج المتجر. راجع التوفر والإجمالي في السلة قبل تأكيد الطلب.</p>
        </aside>
      </main>
      <StickyCartBar />
    </div>
  );
}
