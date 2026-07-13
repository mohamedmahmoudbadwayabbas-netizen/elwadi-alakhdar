import { useSettings } from "@/lib/settings-context";

export function AnnouncementBar() {
  const s = useSettings();
  if (!s.announcement_enabled || !s.announcement_text) return null;
  return (
    <div
      className="w-full overflow-hidden text-center text-[11px] font-bold text-white sm:text-xs"
      style={{ backgroundColor: s.announcement_bg_color || "#036233" }}
      dir="rtl"
    >
      <div className="mx-auto max-w-6xl px-3 py-2 leading-relaxed">
        {s.announcement_text}
      </div>
    </div>
  );
}
