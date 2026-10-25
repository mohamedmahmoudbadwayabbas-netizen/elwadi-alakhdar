import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Check, LoaderCircle, Plus, Search, ShoppingBasket, Sparkles, WandSparkles } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { searchProductsFuzzy } from "@/lib/fuzzy-search";
import { useStoreProducts } from "@/lib/store-data-hooks";
import type { Product } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StickyCartBar } from "@/components/storefront/StickyCartBar";

export const Route = createFileRoute("/assistant")({ component: ShoppingAssistantPage });

const suggestions = ["فطار سريع", "احتياجات البيت", "سناكس للأطفال", "مستلزمات التنظيف"];

function ShoppingAssistantPage() {
  const { data: products = [], isLoading } = useStoreProducts();
  const { items, addItem, totalPrice } = useCart();
  const [request, setRequest] = useState("");
  const [submittedRequest, setSubmittedRequest] = useState("");
  const [addedIds, setAddedIds] = useState<string[]>([]);

  const matches = useMemo(() => {
    if (!submittedRequest.trim()) {
      const featured = products.filter((product) => product.is_featured);
      return (featured.length ? featured : products).slice(0, 6);
    }
    const words = submittedRequest.trim().split(/[،,\s]+/).filter((word) => word.length > 1);
    const unique = new Map<string, Product>();
    for (const word of words) {
      for (const product of searchProductsFuzzy(products, word, 0.45).slice(0, 8)) unique.set(product.id, product);
    }
    return [...unique.values()].slice(0, 12);
  }, [products, submittedRequest]);

  const add = (product: Product) => {
    addItem(product);
    setAddedIds((ids) => ids.includes(product.id) ? ids : [...ids, product.id]);
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
              <Input id="shopping-request" value={request} onChange={(event) => setRequest(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); setSubmittedRequest(request); } }} placeholder="مثال: لبن، خبز، قهوة، منظف أرضيات..." />
              <Button type="button" onClick={() => setSubmittedRequest(request)}><Search size={17} /> ابحث في المنتجات</Button>
            </div>
            <div className="elwadi-assistant__suggestions">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => { setRequest(suggestion); setSubmittedRequest(suggestion); }}>{suggestion}</button>)}</div>
          </div>

          <div className="elwadi-assistant__results-head">
            <div><h2>{submittedRequest ? "نتائج من كتالوج المتجر" : "اختيارات من المتجر"}</h2><p>{matches.length} منتجات متاحة للإضافة</p></div>
            <span className="elwadi-assistant__live"><i /> بيانات المتجر</span>
          </div>
          {isLoading ? <div className="elwadi-assistant__loading"><LoaderCircle className="animate-spin" /> جارٍ تحميل المنتجات</div> : matches.length ? (
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
