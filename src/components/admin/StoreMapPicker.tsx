import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

type Props = {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
};

declare global {
  interface Window {
    google?: any;
    __initStoreMap?: () => void;
  }
}

const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const CHANNEL = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

let scriptPromise: Promise<void> | null = null;
function loadMapsScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  if (!BROWSER_KEY) return Promise.reject(new Error("missing browser key"));
  scriptPromise = new Promise((resolve, reject) => {
    window.__initStoreMap = () => resolve();
    const s = document.createElement("script");
    const channel = CHANNEL ? `&channel=${encodeURIComponent(CHANNEL)}` : "";
    s.src = `https://maps.googleapis.com/maps/api/js?key=${BROWSER_KEY}&loading=async&callback=__initStoreMap${channel}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function StoreMapPicker({ lat, lng, onChange }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMapsScript()
      .then(() => {
        if (cancelled || !ref.current) return;
        const center = { lat: lat ?? 30.0444, lng: lng ?? 31.2357 }; // Cairo default
        const map = new window.google.maps.Map(ref.current, {
          center,
          zoom: lat && lng ? 15 : 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        const marker = new window.google.maps.Marker({
          map, position: center, draggable: true,
        });
        marker.addListener("dragend", () => {
          const p = marker.getPosition();
          onChange(p.lat(), p.lng());
        });
        map.addListener("click", (e: any) => {
          marker.setPosition(e.latLng);
          onChange(e.latLng.lat(), e.latLng.lng());
        });
        mapRef.current = map;
        markerRef.current = marker;
        setReady(true);
      })
      .catch((e) => setErr(e.message));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external lat/lng changes (e.g., manual input edits)
  useEffect(() => {
    if (!ready || !markerRef.current || !mapRef.current) return;
    if (lat == null || lng == null) return;
    const pos = { lat, lng };
    markerRef.current.setPosition(pos);
    mapRef.current.panTo(pos);
  }, [lat, lng, ready]);

  if (!BROWSER_KEY) {
    return <div className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">لم يتم ربط Google Maps بعد.</div>;
  }
  if (err) return <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">{err}</div>;

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-xl border border-border">
      <div ref={ref} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/40">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
