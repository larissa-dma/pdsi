import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Row } from "./Workspace";
export default function InventoryMap({
  points,
  selected,
  onSelect,
}: {
  points: Row[];
  selected: Row | null;
  onSelect: (point: Row) => void;
}) {
  const element = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    group = useRef<L.FeatureGroup | null>(null);
  const [tilesError, setTilesError] = useState(false);
  useEffect(() => {
    if (!element.current) return;
    const instance = L.map(element.current).setView([-20.75, -48.9], 12);
    map.current = instance;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    })
      .on("tileerror", () => setTilesError(true))
      .addTo(instance);
    group.current = L.featureGroup().addTo(instance);
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(element.current);
    return () => {
      observer.disconnect();
      instance.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current || !group.current) return;
    group.current.clearLayers();
    for (const point of points) {
      const tooltip = document.createElement("span");
      tooltip.textContent = point.nome;
      L.circleMarker([Number(point.latitude), Number(point.longitude)], {
        radius: 7,
        color: "#0D2B5E",
        weight: 2,
        fillColor: "#0BAEC7",
        fillOpacity: 0.85,
      })
        .bindTooltip(tooltip)
        .on("click", () => onSelect(point))
        .addTo(group.current);
    }
    if (points.length)
      map.current.fitBounds(group.current.getBounds(), {
        padding: [25, 25],
        maxZoom: 14,
      });
  }, [points, onSelect]);
  useEffect(() => {
    if (selected && map.current)
      map.current.setView(
        [Number(selected.latitude), Number(selected.longitude)],
        15,
      );
  }, [selected]);
  return (
    <>
      <div
        ref={element}
        className="map-frame"
        role="region"
        aria-label="Mapa dos registros do inventário"
        style={{ position: "relative", zIndex: 0 }}
      />
      {tilesError && (
        <p className="muted">
          A base cartográfica não pôde ser carregada. Confira sua conexão; a
          tabela e as coordenadas continuam disponíveis.
        </p>
      )}
    </>
  );
}
