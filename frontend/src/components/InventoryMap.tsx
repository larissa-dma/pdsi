import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  coordinates,
  groupedLocations,
  OLIMPIA_REFERENCE,
  primarySegment,
} from "./mapData";
import type { Row } from "./Workspace";
export interface MapOverview {
  mode: "region" | "all";
  revision: number;
}
export default function InventoryMap({
  points,
  selected,
  onSelect,
  overview,
  colors,
}: {
  points: Row[];
  selected: Row | null;
  onSelect: (point: Row) => void;
  overview: MapOverview;
  colors: Record<string, string>;
}) {
  const element = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    group = useRef<L.FeatureGroup | null>(null),
    markers = useRef<Map<number, L.Marker>>(new Map());
  const [tilesError, setTilesError] = useState(false);
  useEffect(() => {
    if (!element.current) return;
    const instance = L.map(element.current, {
      scrollWheelZoom: false,
      zoomAnimation: false,
    }).setView(OLIMPIA_REFERENCE, 12);
    map.current = instance;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    })
      .on("tileerror", () => setTilesError(true))
      .on("tileload", () => setTilesError(false))
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
    if (!group.current) return;
    group.current.clearLayers();
    markers.current.clear();
    for (const pointsAtLocation of groupedLocations(points)) {
      const point = pointsAtLocation[0],
        position = coordinates(point)!;
      const category =
        pointsAtLocation.length > 1 ? "Multissegmento" : primarySegment(point);
      const color = colors[category] ?? "#1A4FA8";
      const marker = L.marker(position, {
        keyboard: true,
        title:
          pointsAtLocation.length > 1
            ? `${pointsAtLocation.length} cadastros nesta localização`
            : point.nome,
        icon: L.divIcon({
          className: "inventory-map-marker",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          html: `<span class="map-pin ${pointsAtLocation.length > 1 ? "map-pin-group" : ""}" style="--pin-color:${color}">${pointsAtLocation.length > 1 ? pointsAtLocation.length : '<span class="map-pin-center"></span>'}</span>`,
        }),
      });
      const tooltip = document.createElement("span");
      tooltip.textContent =
        pointsAtLocation.length > 1
          ? `${pointsAtLocation.length} cadastros no mesmo ponto. Clique para escolher.`
          : point.nome;
      marker.bindTooltip(tooltip, { direction: "top", offset: [0, -15] });
      if (pointsAtLocation.length > 1) {
        const popup = document.createElement("div");
        popup.className = "map-popup-list";
        const title = document.createElement("strong");
        title.textContent = `${pointsAtLocation.length} cadastros neste ponto`;
        popup.append(title);
        for (const item of pointsAtLocation) {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = item.nome;
          button.addEventListener("click", () => {
            onSelect(item);
            marker.closePopup();
          });
          popup.append(button);
        }
        marker.bindPopup(popup, {
          maxHeight: 240,
          minWidth: 220,
          maxWidth: 310,
        });
      } else marker.on("click", () => onSelect(point));
      marker.addTo(group.current);
      for (const item of pointsAtLocation) markers.current.set(item.id, marker);
    }
  }, [points, onSelect, colors]);
  useEffect(() => {
    if (!map.current || !group.current) return;
    if (overview.mode === "all" && points.length)
      map.current.fitBounds(group.current.getBounds(), {
        padding: [45, 45],
        maxZoom: 14,
        animate: false,
      });
    else map.current.setView(OLIMPIA_REFERENCE, 12, { animate: false });
  }, [overview, points]);
  useEffect(() => {
    if (selected && map.current) {
      const position = coordinates(selected);
      if (position) {
        map.current.setView(position, 15, { animate: false });
        markers.current.get(selected.id)?.openTooltip();
      }
    }
    markers.current.forEach((marker) =>
      marker.getElement()?.classList.remove("is-selected"),
    );
    if (selected)
      markers.current
        .get(selected.id)
        ?.getElement()
        ?.classList.add("is-selected");
  }, [selected, points, colors]);
  return (
    <>
      <div
        ref={element}
        className="map-frame inventory-map"
        role="region"
        aria-label="Mapa interativo dos registros do inventário"
      />
      {tilesError && (
        <p className="muted" role="status">
          A base cartográfica não pôde ser carregada. Os pontos e a lista
          continuam disponíveis; confira sua conexão.
        </p>
      )}
    </>
  );
}
