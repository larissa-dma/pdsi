import { useState } from "react";
import { api } from "../api/client";
import {
  Page,
  Card,
  State,
  Table,
  useData,
  Field,
  Message,
} from "../components/Workspace";
import type { Row } from "../components/Workspace";
export default function SustentabilidadePage() {
  const { data, error, loading, reload } = useData(() =>
    api.get<Row[]>("/secretaria/analises/sustentabilidade"),
  );
  const [name, setName] = useState(""),
    [unit, setUnit] = useState(""),
    [method, setMethod] = useState(""),
    [ods, setOds] = useState(""),
    [selected, setSelected] = useState(""),
    [reference, setReference] = useState(""),
    [value, setValue] = useState(""),
    [source, setSource] = useState(""),
    [busy, setBusy] = useState(false),
    [failure, setFailure] = useState(""),
    [message, setMessage] = useState("");
  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setFailure("");
    setMessage("");
    try {
      await action();
      setMessage(success);
      reload();
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title="Sustentabilidade e indicadores ODS"
      description="Cadastre indicadores e acompanhe observações com fonte e metodologia."
    >
      <Message error={failure} success={message} />
      <State {...{ loading, error }} />
      <Card title="Indicadores cadastrados">
        <Table
          rows={data ?? []}
          columns={[
            { key: "nome", label: "Indicador" },
            { key: "valor", label: "Último valor cadastrado" },
            { key: "unidade", label: "Unidade" },
            { key: "referencia", label: "Referência" },
            { key: "ods", label: "Vínculo ODS" },
            { key: "metodologia", label: "Metodologia" },
          ]}
        />
        <p className="muted">
          Vínculos ODS são cadastrados pela equipe. Esta tela não atribui
          progresso municipal oficial nem calcula metas sem metodologia.
        </p>
      </Card>
      <div className="split">
        <Card title="Novo indicador">
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              run(
                () =>
                  api.post("/secretaria/indicadores", {
                    nome: name,
                    unidade: unit,
                    metodologia: method,
                    ods: ods
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map(Number),
                  }),
                "Indicador cadastrado.",
              );
            }}
          >
            <Field label="Nome">
              <input
                required
                maxLength={200}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Unidade">
              <input
                required
                maxLength={60}
                placeholder="pessoas, percentual, BRL…"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </Field>
            <Field label="Metodologia">
              <textarea
                required
                maxLength={10000}
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              />
            </Field>
            <Field label="ODS relacionados (números de 1 a 17, separados por vírgula)">
              <input value={ods} onChange={(e) => setOds(e.target.value)} />
            </Field>
            <button className="button" disabled={busy}>
              Cadastrar indicador
            </button>
          </form>
        </Card>
        <Card title="Registrar observação">
          <form
            className="stack"
            onSubmit={(e) => {
              e.preventDefault();
              run(
                () =>
                  api.post(`/secretaria/indicadores/${selected}/observacoes`, {
                    referencia: reference,
                    valor: Number(value),
                    fonte: source,
                  }),
                "Observação registrada.",
              );
            }}
          >
            <Field label="Indicador">
              <select
                required
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">Selecione</option>
                {data?.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Referência">
              <input
                required
                maxLength={50}
                placeholder="2026-11"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </Field>
            <Field label="Valor">
              <input
                required
                type="number"
                step="any"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </Field>
            <Field label="Fonte e origem do valor">
              <input
                required
                maxLength={200}
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </Field>
            <button className="button" disabled={busy}>
              Registrar observação
            </button>
          </form>
        </Card>
      </div>
    </Page>
  );
}
