import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import {
  Page,
  Card,
  Field,
  State,
  Table,
  useData,
  Pagination,
} from "../components/Workspace";
import type { Row } from "../components/Workspace";
export default function InventarioPage() {
  const [busca, setBusca] = useState(""),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(0),
    [segmento, setSegmento] = useState(""),
    [situacao, setSituacao] = useState("");
  const params = new URLSearchParams({ busca: search, pagina: String(page) });
  if (segmento) params.set("segmentoId", segmento);
  if (situacao) params.set("situacao", situacao);
  const { data, error, loading } = useData(
    () => api.get<Row[]>(`/secretaria/inventario/registros?${params}`),
    [search, page, segmento, situacao],
  );
  const segments = useData(() =>
    api.get<Row[]>("/secretaria/inventario/segmentos"),
  );
  return (
    <Page
      title="Inventário turístico"
      description="Busque, confira e mantenha os cadastros do inventário."
      actions={
        <Link className="button" to="/secretaria/inventario/novo">
          Novo registro
        </Link>
      }
    >
      <Card>
        <form
          className="actions"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(busca);
            setPage(0);
          }}
        >
          <Field label="Nome">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar cadastro"
            />
          </Field>
          <Field label="Segmento">
            <select
              value={segmento}
              onChange={(e) => {
                setSegmento(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Todos</option>
              {segments.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Conferência">
            <select
              value={situacao}
              onChange={(e) => {
                setSituacao(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Todas</option>
              {["pendente", "parcial", "conferido", "rejeitado"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <button className="button">Buscar</button>
        </form>
      </Card>
      <State {...{ loading, error }} />
      <Card>
        <Table
          rows={data ?? []}
          columns={[
            { key: "nome", label: "Nome" },
            { key: "endereco", label: "Endereço" },
            { key: "bairro", label: "Bairro" },
            {
              key: "situacao_conferencia",
              label: "Conferência",
              render: (r) => (
                <span className="badge">{r.situacao_conferencia}</span>
              ),
            },
            {
              key: "action",
              label: "Ações",
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
        <Pagination page={page} setPage={setPage} more={data?.length === 50} />
      </Card>
    </Page>
  );
}
