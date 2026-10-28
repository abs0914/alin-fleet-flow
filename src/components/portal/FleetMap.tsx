import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { TrackingLatest } from "@/lib/api/types";

/** Browser-only map of last reported positions. Loaded lazily after hydration. */
export default function FleetMap({ points, labels }: { points: TrackingLatest[]; labels: Record<string, string> }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: import("leaflet").Map | undefined;
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || !el.current) return;
      map = L.map(el.current, { scrollWheelZoom: false }).setView([10.32, 123.93], 11); // Metro Cebu
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      const located = points.filter((p) => p.lat !== null && p.lng !== null);
      const latlngs: [number, number][] = [];
      for (const p of located) {
        const ll: [number, number] = [p.lat as number, p.lng as number];
        latlngs.push(ll);
        L.circleMarker(ll, { radius: 9, color: "#111111", weight: 2, fillColor: "#FFD400", fillOpacity: 1 })
          .addTo(map)
          .bindPopup(`<b>${labels[p.jobId] ?? p.jobId}</b><br/>Last reported position${p.accuracyM ? ` · ±${p.accuracyM} m` : ""}`);
      }
      if (latlngs.length > 1) map.fitBounds(latlngs, { padding: [40, 40], maxZoom: 13 });
      else if (latlngs[0]) map.setView(latlngs[0], 13);
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [points, labels]);
  return <div ref={el} className="h-[420px] w-full overflow-hidden rounded-lg border" role="region" aria-label="Fleet map" />;
}
