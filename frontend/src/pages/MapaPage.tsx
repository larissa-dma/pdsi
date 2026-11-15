import InventoryMap from "../components/InventoryMap";
import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import {
  Page,
  Card,
  State,
  Table,
  useData,
  Field,
} from "../components/Workspace";
import {
  coordinates,
  segments,
  primarySegment,
  groupedLocations,
  locationKey,
  distanceFromReference,
  MAP_COLORS,
} from "../components/mapData";
import type { MapOverview } from "../components/InventoryMap";
import type { Row } from "../components/Workspace";
export default function MapaPage() {
  const { data, error, loading } = useData(() =>
    api.get<Row[]>("/secretaria/analises/mapa"),
  );
  const [search, setSearch] = useState(""),
    [segment, setSegment] = useState(""),
    [location, setLocation] = useState("all"),
    [selected, setSelected] = useState<Row | null>(null),
    [overview, setOverview] = useState<MapOverview>({
      mode: "region",
      revision: 0,
    });
  const categories = useMemo(
    () => Array.from(new Set((data ?? []).flatMap(segments))).sort(),
    [data],
  );
  const colors = useMemo(
    () =>
      Object.fromEntries(
        [...categories, "Multissegmento", "Sem segmento"].map((label, i) => [
          label,
          MAP_COLORS[i % MAP_COLORS.length],
        ]),
      ),
    [categories],
  );
  const rows = useMemo(
    () =>
      (data ?? []).filter(
        (row) =>
          `${row.nome} ${row.segmentos} ${row.bairro ?? ""}`
            .toLocaleLowerCase("pt-BR")
            .includes(search.toLocaleLowerCase("pt-BR")) &&
          (!segment || segments(row).includes(segment)) &&
          (location === "all" ||
            (location === "located" ? !!coordinates(row) : !coordinates(row))),
      ),
    [data, search, segment, location],
  );
  const located = useMemo(() => rows.filter((row) => coordinates(row)), [rows]);
  const groups = useMemo(() => groupedLocations(located), [located]);
  const sameLocation = useMemo(
    () =>
      Object.fromEntries(
        groups.map((group) => [locationKey(group[0]), group.length]),
      ),
    [groups],
  );
  const choose = useCallback((row: Row) => setSelected({ ...row }), []);
  function resetView(mode: "region" | "all" = "region") {
    setSelected(null);
    setOverview((v) => ({ mode, revision: v.revision + 1 }));
  }
  function resetFilters() {
    setSearch("");
    setSegment("");
    setLocation("all");
    resetView();
  }
  const selectedCoordinates = selected ? coordinates(selected) : null;
  const distance = selected ? distanceFromReference(selected) : null;
  return (
    <Page
      title="Mapa do inventário"
      description="Explore os cadastros por localização e segmento. Selecione um ponto ou um item da lista."
    >
      <State {...{ loading, error }} />
      <Card>
        <div className="field-grid">
          <Field label="Buscar cadastro">
            <input
              placeholder="Nome, segmento ou bairro"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetView();
              }}
            />
          </Field>
          <Field label="Segmento">
            <select
              aria-label="Segmento"
              value={segment}
              onChange={(e) => {
                setSegment(e.target.value);
                resetView();
              }}
            >
              <option value="">Todos os segmentos</option>
              {categories.map((label) => (
                <option key={label}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Localização">
            <select
              aria-label="Localização"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                resetView();
              }}
            >
              <option value="all">Todos os cadastros</option>
              <option value="located">Com coordenadas</option>
              <option value="missing">Sem coordenadas válidas</option>
            </select>
          </Field>
        </div>
        <div className="map-summary">
          <span>
            <strong>{rows.length}</strong> cadastros encontrados
          </span>
          <span>
            <i className="map-dot" style={{ background: "var(--cyan-700)" }} />
            <strong>{located.length}</strong> com coordenadas
          </span>
          <span>
            <strong>{rows.length - located.length}</strong> sem localização
          </span>
          {(search || segment || location !== "all") && (
            <button className="map-text-button" onClick={resetFilters}>
              Limpar filtros
            </button>
          )}
        </div>
      </Card>
      <div className="map-workspace">
        <Card title="Distribuição dos cadastros">
          <div className="map-toolbar">
            <span className="muted">
              {selected
                ? "Cadastro selecionado"
                : overview.mode === "all"
                  ? "Todos os pontos do filtro"
                  : "Visão de referência: Olímpia"}
            </span>
            <div className="actions">
              <button className="button secondary" onClick={() => resetView()}>
                Voltar para Olímpia
              </button>
              <button
                className="button secondary"
                disabled={!located.length}
                onClick={() => resetView("all")}
              >
                Enquadrar todos
              </button>
            </div>
          </div>
          <InventoryMap
            points={located}
            selected={selected}
            onSelect={choose}
            overview={overview}
            colors={colors}
          />
          <div className="map-legend" aria-label="Legenda de segmentos">
            {Array.from(new Set(located.map(primarySegment))).map((label) => (
              <span key={label}>
                <i className="map-dot" style={{ background: colors[label] }} />
                {label}
              </span>
            ))}
            {groups.some((group) => group.length > 1) && (
              <span>
                <b className="map-count-sample">2+</b> Cadastros no mesmo ponto
              </span>
            )}
          </div>
          <p className="muted">
            Arraste para navegar e use +/− para ampliar. Marcadores numerados
            agrupam cadastros com as mesmas coordenadas. A base OpenStreetMap
            depende de internet. Os dados fictícios não representam localizações
            oficiais.
          </p>
        </Card>
        <aside className="map-sidebar">
          <Card title={`Cadastros localizados · ${located.length}`}>
            <div className="map-location-list">
              {located.map((row) => (
                <button
                  key={row.id}
                  className={`map-location-item ${selected?.id === row.id ? "active" : ""}`}
                  aria-pressed={selected?.id === row.id}
                  onClick={() => choose(row)}
                >
                  <i
                    className="map-dot"
                    style={{ background: colors[primarySegment(row)] }}
                  />
                  <span>
                    <strong>{row.nome}</strong>
                    <small>{row.segmentos || "Sem segmento"}</small>
                    {sameLocation[locationKey(row)] > 1 && (
                      <small>
                        {sameLocation[locationKey(row)]} cadastros nesta
                        coordenada
                      </small>
                    )}
                  </span>
                  <span aria-hidden="true">›</span>
                </button>
              ))}
              {!located.length && (
                <p className="empty">
                  Nenhum cadastro localizado neste filtro. Os demais aparecem na
                  tabela abaixo.
                </p>
              )}
            </div>
          </Card>
          <Card
            title={selected ? "Cadastro selecionado" : "Detalhes do cadastro"}
          >
            {selected ? (
              <div className="stack">
                <div>
                  <strong className="map-selected-name">{selected.nome}</strong>
                  <p className="muted">
                    {selected.segmentos || "Sem segmento"}
                  </p>
                </div>
                {selectedCoordinates && (
                  <div className="map-coordinates">
                    <span>
                      Latitude
                      <strong>{selectedCoordinates[0].toFixed(6)}</strong>
                    </span>
                    <span>
                      Longitude
                      <strong>{selectedCoordinates[1].toFixed(6)}</strong>
                    </span>
                  </div>
                )}
                {distance !== null && distance > 80 && (
                  <div className="map-coordinate-warning" role="note">
                    Este ponto está a aproximadamente{" "}
                    {Math.round(distance).toLocaleString("pt-BR")} km da
                    referência de Olímpia. Confira as coordenadas na ficha; elas
                    não foram corrigidas automaticamente.
                  </div>
                )}
                <div className="actions">
                  <Link
                    className="button"
                    to={`/secretaria/inventario/${selected.id}/editar`}
                  >
                    Abrir ficha
                  </Link>
                  {selectedCoordinates && (
                    <a
                      className="button secondary"
                      target="_blank"
                      rel="noreferrer"
                      href={`https://www.openstreetmap.org/?mlat=${selectedCoordinates[0]}&mlon=${selectedCoordinates[1]}#map=15/${selectedCoordinates[0]}/${selectedCoordinates[1]}`}
                    >
                      Abrir no OpenStreetMap
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="muted">
                Clique em um marcador ou em um nome da lista para consultar a
                localização e abrir a ficha.
              </p>
            )}
          </Card>
        </aside>
      </div>
      <Card title="Todos os cadastros do filtro">
        <Table
          rows={rows}
          columns={[
            { key: "nome", label: "Nome" },
            { key: "segmentos", label: "Segmentos" },
            {
              key: "localizacao",
              label: "Localização",
              render: (row) =>
                coordinates(row) ? (
                  <button
                    className="map-text-button"
                    onClick={() => {
                      choose(row);
                      document.querySelector(".map-workspace")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                  >
                    Ver no mapa
                  </button>
                ) : (
                  <span className="muted">Não informada ou inválida</span>
                ),
            },
            { key: "situacao_conferencia", label: "Conferência" },
            {
              key: "action",
              label: "Ficha",
              render: (row) => (
                <Link
                  className="button secondary"
                  to={`/secretaria/inventario/${row.id}/editar`}
                >
                  Abrir ficha
                </Link>
              ),
            },
          ]}
        />
      </Card>
    </Page>
  );
}
