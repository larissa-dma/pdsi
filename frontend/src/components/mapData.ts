import type { Row } from "./Workspace";

// Visual reference only: this is not the official municipal boundary.
export const OLIMPIA_REFERENCE: [number, number] = [-20.75, -48.9];
export const MAP_COLORS = [
  "#1A4FA8",
  "#0799B8",
  "#B26917",
  "#7C3AED",
  "#177B58",
  "#C24760",
  "#5267A8",
  "#8A572A",
  "#047D90",
  "#64748B",
];
export function coordinates(row: Row): [number, number] | null {
  if (
    row.latitude == null ||
    row.longitude == null ||
    String(row.latitude).trim() === "" ||
    String(row.longitude).trim() === ""
  )
    return null;
  const latitude = Number(row.latitude),
    longitude = Number(row.longitude);
  return Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
    ? [latitude, longitude]
    : null;
}
export function segments(row: Row): string[] {
  return String(row.segmentos ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
export function primarySegment(row: Row): string {
  const labels = segments(row);
  return labels.length > 1 ? "Multissegmento" : (labels[0] ?? "Sem segmento");
}
export function locationKey(row: Row): string {
  return (
    coordinates(row)
      ?.map((v) => v.toFixed(6))
      .join(",") ?? ""
  );
}
export function groupedLocations(points: Row[]): Row[][] {
  const groups = new Map<string, Row[]>();
  for (const point of points) {
    const key = locationKey(point);
    if (key) groups.set(key, [...(groups.get(key) ?? []), point]);
  }
  return Array.from(groups.values());
}
export function distanceFromReference(row: Row): number | null {
  const point = coordinates(row);
  if (!point) return null;
  const radians = (v: number) => (v * Math.PI) / 180;
  const deltaLat = radians(point[0] - OLIMPIA_REFERENCE[0]),
    deltaLon = radians(point[1] - OLIMPIA_REFERENCE[1]);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(OLIMPIA_REFERENCE[0])) *
      Math.cos(radians(point[0])) *
      Math.sin(deltaLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}
