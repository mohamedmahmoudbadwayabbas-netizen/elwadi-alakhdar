import { useEffect, useState } from "react";
import { Truck, Tag, Percent } from "lucide-react";

const slides = [
  {
    title: "توصيل مجاني",
    subtitle: "لكل أوردر فوق 300 جنيه",
    desc: "اطلب احتياجاتك واستلمها في أقل من ساعة",
    icon: Truck,
    bg: "hero-gradient",
  },
  {
    title: "خصومات الأسبوع",
    subtitle: "حتى 30% على العطارة",
    desc: "بهارات وأعشاب طازجة بأسعار مميزة",
    icon: Percent,
    bg: "sale-gradient",
  },
  {
    title: "لحوم ودواجن طازجة",
    subtitle: "يومياً من المزرعة",
    desc: "جودة مضمونة وأسعار الجملة",
    icon: Tag,
    bg: "hero-gradient",
  },
];

export function HeroCarousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="px-3 pt-4 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl shadow-lift">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(${i * 100}%)` }}
        >
          {slides.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className={`${s.bg} relative grid min-w-full grid-cols-[1fr_auto] items-center gap-4 p-5 sm:p-8`}>
                <div className="min-w-0 text-primary-foreground">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider opacity-80">{s.title}</div>
                  <h2 className="text-2xl font-black leading-tight sm:text-4xl">{s.subtitle}</h2>
                  <p className="mt-1.5 text-sm opacity-90 sm:text-base">{s.desc}</p>
                </div>
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur sm:h-28 sm:w-28">
                  <Icon className="h-10 w-10 text-primary-foreground sm:h-14 sm:w-14" />
                </div>
              </div>
            );
          })}
        </div>
        <div className="absolute bottom-3 start-1/2 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
              aria-label={`عرض ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
