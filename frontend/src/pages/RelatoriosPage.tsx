import { useState } from "react";
import { api } from "../api/client";
import {
  Page,
  Card,
  Field,
  Period,
  periodQuery,
  Table,
  Message,
  State,
  useData,
} from "../components/Workspace";
import type { Row } from "../components/Workspace";
export default function RelatoriosPage() {
  const [type, setType] = useState("inventario"),
    [format, setFormat] = useState("csv"),
    [inicio, setInicio] = useState(""),
    [fim, setFim] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const query = periodQuery(inicio, fim);
  query.set("tipo", type);
  const {
    data,
    error: loadError,
    loading,
  } = useData(
    () => api.get<Row[]>(`/secretaria/relatorios/previa?${query}`),
    [type, inicio, fim],
  );
  const history = useData(() =>
    api.get<Row[]>("/secretaria/relatorios/historico"),
  );
  async function download() {
    setBusy(true);
    setError("");
    try {
      query.set("formato", format);
      await api.download(
        `/secretaria/relatorios/exportar?${query}`,
        `oto-${type}.${format}`,
      );
      history.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title="Relatórios e exportações"
      description="Prévia e exportação dos dados do banco em CSV, XLSX ou PDF."
    >
      <Message error={error} />
      <Card title="Escolha o recorte">
        <div className="actions">
          <Field label="Conjunto">
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setInicio("");
                setFim("");
              }}
            >
              {[
                "inventario",
                "ocupacao",
                "diaria",
                "demanda",
                "indicadores",
                "formularios",
                "controle",
                "issqn",
                "caged",
                "veiculos",
                "fretamento",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Formato">
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              {["csv", "xlsx", "pdf"].map((t) => (
                <option key={t}>{t.toUpperCase()}</option>
              ))}
            </select>
          </Field>
          {[
            "ocupacao",
            "diaria",
            "issqn",
            "caged",
            "veiculos",
            "fretamento",
          ].includes(type) && (
            <Period {...{ inicio, fim, setInicio, setFim }} />
          )}
          <button
            className="button"
            disabled={busy || loading || !data?.length || !!loadError}
            onClick={download}
          >
            {busy ? "Gerando arquivo…" : "Exportar"}
          </button>
        </div>
        <p className="muted">
          Prévia: primeiras 50 linhas. Exportação: até 10.000 linhas. Filtros
          por datas disponíveis para ocupação, diária e bases externas. Os dados
          mantêm o conteúdo do banco; verifique origem e metodologia antes de
          compartilhar.
        </p>
      </Card>
      <State loading={loading} error={loadError} />
      <Card title="Prévia">
        <Table
          rows={data ?? []}
          columns={Object.keys(data?.[0] ?? {}).map((key) => ({
            key,
            label: key,
          }))}
        />
      </Card>
      <Card title="Histórico de exportações">
        <State loading={history.loading} error={history.error} />
        <Table
          rows={history.data ?? []}
          columns={[
            { key: "titulo", label: "Relatório" },
            { key: "formato", label: "Formato" },
            { key: "status", label: "Status" },
            { key: "data_exportacao", label: "Gerado em" },
          ]}
        />
      </Card>
    </Page>
  );
}
