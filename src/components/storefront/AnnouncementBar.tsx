import { Truck, Zap, BadgeCheck, Headphones } from "lucide-react";

const ITEMS = [
  { icon: <Truck className="h-3.5 w-3.5 shrink-0" />, text: "شحن مجاني فوق ٣٠٠ ج.م" },
  { icon: <Zap className="h-3.5 w-3.5 shrink-0" />, text: "توصيل سريع خلال ٤٥ دقيقة" },
  { icon: <BadgeCheck className="h-3.5 w-3.5 shrink-0" />, text: "الدفع عند الاستلام ✓" },
  { icon: <Headphones className="h-3.5 w-3.5 shrink-0" />, text: "دعم العملاء ٢٤/٧" },
];

export function AnnouncementBar() {
  return (
    <div className="relative overflow-hidden bg-primary py-1.5 text-primary-foreground" dir="rtl">
      {/* تأثير التدرج على الحواف */}
      <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-12 bg-gradient-to-r from-primary to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-12 bg-gradient-to-l from-primary to-transparent" />

      {/* النص المتحرك */}
      <div className="flex animate-[marquee_25s_linear_infinite] whitespace-nowrap">
        {[...ITEMS, ...ITEMS].map((item, i) => (
          <span key={i} className="flex items-center gap-1.5 px-8 text-xs font-bold">
            {item.icon}
            {item.text}
            <span className="mx-2 text-primary-foreground/40">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
