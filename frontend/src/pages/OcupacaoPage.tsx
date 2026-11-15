import { useState } from "react";
import { api } from "../api/client";
import {
  Page,
  Card,
  Period,
  periodQuery,
  State,
  Table,
  useData,
  Pagination,
  Field,
} from "../components/Workspace";
import type { Row } from "../components/Workspace";
export default function OcupacaoPage() {
  const [inicio, setInicio] = useState(""),
    [fim, setFim] = useState(""),
    [tipo, setTipo] = useState("consolidado"),
    [page, setPage] = useState(0);
  const query = periodQuery(inicio, fim);
  query.set("tipo", tipo);
  query.set("pagina", String(page));
  const { data, error, loading } = useData(
    () => api.get<Row[]>(`/secretaria/analises/ocupacao?${query}`),
    [inicio, fim, tipo, page],
  );
  return (
    <Page
      title="Ocupação hoteleira e fluxo"
      description="Observações importadas, separando consolidado e expectativa."
    >
      <Card>
        <div className="actions">
          <Period
            inicio={inicio}
            fim={fim}
            setInicio={(v) => {
              setInicio(v);
              setPage(0);
            }}
            setFim={(v) => {
              setFim(v);
              setPage(0);
            }}
          />
          <Field label="Modalidade">
            <select
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value);
                setPage(0);
              }}
            >
              <option value="consolidado">Consolidado</option>
              <option value="expectativa">Expectativa</option>
            </select>
          </Field>
        </div>
      </Card>
      <State {...{ loading, error }} />
      <Card title="Detalhamento mensal">
        <Table
          rows={data ?? []}
          columns={[
            { key: "mes_referencia", label: "Mês" },
            { key: "estabelecimento", label: "Estabelecimento" },
            { key: "ocupacao_percentual", label: "Ocupação (%)" },
            { key: "fluxo_pessoas", label: "Fluxo" },
            { key: "fonte", label: "Arquivo de origem" },
          ]}
        />
        <Pagination page={page} setPage={setPage} more={data?.length === 50} />
      </Card>
    </Page>
  );
}
