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
import type { Row } from "../components/Workspace";
export default function MapaPage() {
  const { data, error, loading } = useData(() =>
    api.get<Row[]>("/secretaria/analises/mapa"),
  );
  const [search, setSearch] = useState(""),
    [selected, setSelected] = useState<Row | null>(null);
  const rows = useMemo(
    () =>
      (data ?? []).filter((r) =>
        `${r.nome} ${r.segmentos}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [data, search],
  );
  const located = useMemo(
    () => rows.filter((r) => r.latitude !== null && r.longitude !== null),
    [rows],
  );
  const choose = useCallback((point: Row) => setSelected(point), []);
  const point = selected ?? located[0];
  const lat = point ? Number(point.latitude) : null,
    lon = point ? Number(point.longitude) : null;
  const url =
    lat !== null && lon !== null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.03}%2C${lat - 0.02}%2C${lon + 0.03}%2C${lat + 0.02}&layer=mapnik&marker=${lat}%2C${lon}`
      : null;
  return (
    <Page
      title="Mapa do inventário"
      description="Selecione um cadastro com coordenadas para visualizar sua localização."
    >
      <State {...{ loading, error }} />
      <Card>
        <Field label="Buscar nome ou segmento">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelected(null);
            }}
          />
        </Field>
        <p className="muted">
          {located.length} de {rows.length} registros possuem coordenadas.
          Cadastros sem localização permanecem na lista.
        </p>
      </Card>
      <div className="split">
        <Card title={point?.nome ?? "Localização"}>
          {url ? (
            <>
              <InventoryMap
                points={located}
                selected={selected}
                onSelect={choose}
              />
              <p className="muted">
                Base cartográfica © OpenStreetMap contributors. A base depende
                de conexão com a internet; os cadastros vêm do banco conectado.
                Coordenadas fictícias de teste não são localizações oficiais.
              </p>
              <a
                className="button secondary"
                target="_blank"
                rel="noreferrer"
                href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`}
              >
                Abrir mapa em outra aba
              </a>
            </>
          ) : (
            <State empty />
          )}
        </Card>
        <Card title="Cadastros localizados">
          <div className="stack">
            {located.map((r) => (
              <button
                className={`button ${point?.id === r.id ? "" : "secondary"}`}
                key={r.id}
                onClick={() => setSelected(r)}
              >
                {r.nome}
              </button>
            ))}
            {!located.length && <State empty />}
          </div>
        </Card>
      </div>
      <Card title="Todos os registros">
        <Table
          rows={rows}
          columns={[
            { key: "nome", label: "Nome" },
            { key: "segmentos", label: "Segmentos" },
            { key: "latitude", label: "Latitude" },
            { key: "longitude", label: "Longitude" },
            {
              key: "action",
              label: "Ficha",
              render: (r) => (
                <Link
                  className="button secondary"
                  to={`/secretaria/inventario/${r.id}/editar`}
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
