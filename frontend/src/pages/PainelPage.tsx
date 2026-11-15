import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import {
  Page,
  Card,
  State,
  Table,
  useData,
  Period,
  periodQuery,
} from "../components/Workspace";
import type { Row } from "../components/Workspace";
export default function PainelPage() {
  const [inicio, setInicio] = useState(""),
    [fim, setFim] = useState(""),
    [tipo, setTipo] = useState("consolidado");
  const params = periodQuery(inicio, fim);
  params.set("tipo", tipo);
  const { data, error, loading } = useData(
    () =>
      Promise.all([
        api.get<Row>("/secretaria/painel"),
        api.get<Row>(`/secretaria/analises/resumo?${params}`),
      ]),
    [inicio, fim, tipo],
  );
  const counts = data?.[0],
    analysis = data?.[1],
    series: Row[] = analysis?.serie ?? [];
  const flows = series.filter((s) => s.fluxo !== null);
  const max = Math.max(1, ...flows.map((s) => Number(s.fluxo)));
  const occupancy = series
    .filter((s) => s.ocupacao !== null)
    .map((s) => Number(s.ocupacao));
  const rates = (analysis?.diarias ?? [])
    .filter((s: Row) => s.diaria !== null)
    .map((s: Row) => Number(s.diaria));
  const mean = (values: number[]) =>
    values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const fmt = (value: number | null, unit: string) =>
    value === null
      ? "—"
      : value.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + unit;

  const pts = flows
    .map(
      (s, i) =>
        `${20 + i * (650 / Math.max(1, flows.length - 1))},${160 - (Number(s.fluxo) / max) * 140}`,
    )
    .join(" ");
  return (
    <Page
      title="Visão geral"
      description="Informações do banco conectado, com rastreabilidade das fontes."
      actions={
        <Link className="button secondary" to="/secretaria/importacao">
          Consultar importações
        </Link>
      }
    >
      <div className="actions">
        <Period {...{ inicio, fim, setInicio, setFim }} />
        <FieldMode value={tipo} change={setTipo} />
      </div>
      <State {...{ loading, error }} />
      {counts && (
        <div className="metric-grid">
          {[
            ["Cadastros do inventário", "registros_inventario"],
            ["Formulários", "formularios"],
            ["Respostas enviadas", "respostas_enviadas"],
            ["Importações", "importacoes"],
          ].map(([label, key]) => (
            <Card key={key}>
              <div className="metric">
                <span>{label}</span>
                <strong>{Number(counts[key]).toLocaleString("pt-BR")}</strong>
                <span className="muted">
                  Total cadastrado, independente do período analítico
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
      <div className="metric-grid">
        {[
          [
            "Fluxo no período",
            fmt(
              flows.length
                ? flows.reduce((sum, row) => sum + Number(row.fluxo), 0)
                : null,
              " pessoas",
            ),
            "Soma dos fluxos mensais disponíveis",
          ],
          [
            "Ocupação hoteleira",
            fmt(mean(occupancy), "%"),
            "Média simples das médias mensais disponíveis",
          ],
          [
            "Diária média",
            mean(rates) === null
              ? "—"
              : mean(rates)!.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }),
            "Média simples das médias mensais de diária",
          ],
        ].map(([title, value, method]) => (
          <Card key={title}>
            <div className="metric">
              <span>{title}</span>
              <strong>{value}</strong>
              <p className="muted">{method}</p>
            </div>
          </Card>
        ))}
      </div>
      <div className="split">
        <Card title="Evolução do fluxo turístico">
          {flows.length ? (
            <>
              <svg
                className="chart"
                viewBox="0 0 700 190"
                role="img"
                aria-label="Fluxo por mês"
              >
                <line
                  x1="20"
                  y1="165"
                  x2="680"
                  y2="165"
                  stroke="var(--border)"
                />
                <polyline
                  fill="none"
                  stroke="var(--cyan-700)"
                  strokeWidth="3"
                  points={pts}
                />
                {flows.map((s, i) => (
                  <circle
                    key={i}
                    cx={20 + (i * 650) / Math.max(1, flows.length - 1)}
                    cy={160 - (Number(s.fluxo) / max) * 140}
                    r="4"
                    fill="var(--navy-500)"
                  >
                    <title>
                      {String(s.mes_referencia).slice(0, 7)}: {s.fluxo}
                    </title>
                  </circle>
                ))}
              </svg>
              <p className="muted">
                {String(flows[0].mes_referencia).slice(0, 7)} a{" "}
                {String(flows.at(-1)?.mes_referencia).slice(0, 7)} · máximo{" "}
                {max.toLocaleString("pt-BR")} pessoas
              </p>
            </>
          ) : (
            <State empty />
          )}
        </Card>
        <Card title="Origem da demanda">
          <Table
            rows={analysis?.origens ?? []}
            columns={[
              { key: "uf", label: "UF" },
              { key: "quantidade", label: "Registros" },
            ]}
          />
        </Card>
      </div>
      <Card title="Resultados mensais">
        <Table
          rows={series}
          columns={[
            { key: "mes_referencia", label: "Mês" },
            { key: "ocupacao", label: "Ocupação média (%)" },
            { key: "fluxo", label: "Fluxo (pessoas)" },
            { key: "observacoes", label: "Observações" },
          ]}
        />
        <p className="muted">{analysis?.metodologia}</p>
      </Card>
      <Card title="Diária média mensal">
        <Table
          rows={analysis?.diarias ?? []}
          columns={[
            { key: "mes_referencia", label: "Mês" },
            { key: "diaria", label: "Diária média (BRL)" },
            { key: "observacoes", label: "Observações" },
          ]}
        />
      </Card>
      <Card title="ISSQN, empregos e transporte">
        <Table
          rows={analysis?.externas ?? []}
          columns={[
            { key: "tipo", label: "Base" },
            { key: "mes_referencia", label: "Mês" },
            { key: "medida", label: "Medida" },
            { key: "valor", label: "Valor" },
            { key: "unidade", label: "Unidade" },
            { key: "recorte", label: "Recorte" },
            { key: "fonte", label: "Arquivo de origem" },
          ]}
        />
        <p className="muted">
          Observações carregadas pela equipe. ISSQN é arrecadação tributária e
          não equivale à renda turística. CAGED pode informar medidas distintas
          (estoque, admissões, desligamentos ou saldo); o significado deve
          constar na medida e no recorte. Até 50 observações neste painel.
        </p>
      </Card>
      <Card title="Fontes e disponibilidade">
        <Table
          rows={analysis?.fontes ?? []}
          columns={[
            { key: "nome", label: "Fonte" },
            { key: "lotes", label: "Cargas" },
            { key: "linhas_validas", label: "Linhas válidas" },
            { key: "ultima_carga", label: "Última carga" },
          ]}
        />
      </Card>
    </Page>
  );
}
function FieldMode({
  value,
  change,
}: {
  value: string;
  change: (s: string) => void;
}) {
  return (
    <label className="work-field">
      Modalidade
      <select value={value} onChange={(e) => change(e.target.value)}>
        <option value="consolidado">Consolidado</option>
        <option value="expectativa">Expectativa</option>
      </select>
    </label>
  );
}
