import { useState } from "react";
import { api } from "../api/client";
import {
  Page,
  Card,
  Table,
  State,
  Field,
  Message,
  useData,
  Pagination,
  today,
} from "../components/Workspace";
import type { Row } from "../components/Workspace";
const types = [
  ["texto", "Texto"],
  ["inteiro", "Inteiro"],
  ["decimal", "Decimal"],
  ["percentual", "Percentual (0–100)"],
  ["booleano", "Sim/Não"],
];
export default function AdminDadosPage() {
  const [page, setPage] = useState(0);
  const { data, error, loading, reload } = useData(
    () => api.get<Row[]>(`/secretaria/formularios?pagina=${page}`),
    [page],
  );
  const [title, setTitle] = useState(""),
    [reference, setReference] = useState(""),
    [deadline, setDeadline] = useState(""),
    [questions, setQuestions] = useState<Row[]>([
      {
        chave: "ocupacao",
        titulo: "Taxa de ocupação (%)",
        tipo: "percentual",
        obrigatoria: true,
      },
    ]);
  const [busy, setBusy] = useState(false),
    [failure, setFailure] = useState(""),
    [message, setMessage] = useState(""),
    [selected, setSelected] = useState<Row | null>(null),
    [answerPage, setAnswerPage] = useState(0),
    [newDeadline, setNewDeadline] = useState("");
  const datasets = useData(() => api.get<Row[]>("/secretaria/pesquisas"));
  const responses = useData(
    () =>
      selected
        ? api.get<Row[]>(
            `/secretaria/formularios/${selected.id}/respostas?pagina=${answerPage}`,
          )
        : Promise.resolve([]),
    [selected?.id, answerPage],
  );
  function question(i: number, key: string, value: unknown) {
    setQuestions((v) =>
      v.map((q, n) => (n === i ? { ...q, [key]: value } : q)),
    );
  }
  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFailure("");
    setMessage("");
    try {
      await api.post("/secretaria/formularios", {
        titulo: title,
        referencia: reference,
        prazo: deadline,
        perguntas: questions,
      });
      setTitle("");
      setReference("");
      setMessage("Formulário criado e disponível às hospedagens vinculadas.");
      reload();
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function extend(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setFailure("");
    setMessage("");
    try {
      await api.put(`/secretaria/formularios/${selected.id}/prazo`, {
        prazo: newDeadline,
      });
      setMessage("Prazo atualizado.");
      reload();
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title="Pesquisas e formulários"
      description="Crie pesquisas, acompanhe a coleta e consulte respostas salvas."
    >
      <Message error={failure} success={message} />
      <Card title="Nova pesquisa">
        <form className="stack" onSubmit={create}>
          <div className="field-grid">
            <Field label="Título">
              <input
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
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
            <Field label="Prazo">
              <input
                required
                type="date"
                min={today()}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </Field>
          </div>
          {questions.map((q, i) => (
            <div key={i} className="work-card stack">
              <div className="field-grid">
                <Field label="Chave técnica (única)">
                  <input
                    required
                    pattern="[a-z][a-z0-9_]{0,49}"
                    value={q.chave}
                    onChange={(e) => question(i, "chave", e.target.value)}
                  />
                </Field>
                <Field label="Pergunta">
                  <input
                    required
                    maxLength={300}
                    value={q.titulo}
                    onChange={(e) => question(i, "titulo", e.target.value)}
                  />
                </Field>
                <Field label="Tipo">
                  <select
                    value={q.tipo}
                    onChange={(e) => question(i, "tipo", e.target.value)}
                  >
                    {types.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="actions">
                <label>
                  <input
                    type="checkbox"
                    checked={q.obrigatoria}
                    onChange={(e) =>
                      question(i, "obrigatoria", e.target.checked)
                    }
                  />{" "}
                  Obrigatória no envio
                </label>
                <button
                  className="button secondary"
                  type="button"
                  disabled={questions.length === 1}
                  onClick={() =>
                    setQuestions((v) => v.filter((_, n) => n !== i))
                  }
                >
                  Remover pergunta
                </button>
              </div>
            </div>
          ))}
          <div className="actions">
            <button
              className="button secondary"
              type="button"
              disabled={questions.length >= 100}
              onClick={() =>
                setQuestions((v) => [
                  ...v,
                  {
                    chave: `pergunta_${v.length + 1}`,
                    titulo: "",
                    tipo: "texto",
                    obrigatoria: false,
                  },
                ])
              }
            >
              Adicionar pergunta
            </button>
            <button className="button" disabled={busy}>
              {busy ? "Salvando…" : "Publicar formulário"}
            </button>
          </div>
        </form>
      </Card>
      <Card title="Conjuntos importados">
        <State loading={datasets.loading} error={datasets.error} />
        <Table
          rows={datasets.data ?? []}
          columns={[
            { key: "nome", label: "Conjunto" },
            { key: "codigo", label: "Código" },
            { key: "lotes", label: "Cargas" },
          ]}
        />
      </Card>
      <State {...{ loading, error }} />
      <Card title="Acompanhamento da coleta">
        <Table
          rows={data ?? []}
          columns={[
            { key: "titulo", label: "Pesquisa" },
            { key: "referencia", label: "Referência" },
            { key: "prazo", label: "Prazo" },
            { key: "enviadas", label: "Enviadas" },
            { key: "publico", label: "Hospedagens com acesso" },
            {
              key: "action",
              label: "Ações",
              render: (r) => (
                <button
                  className="button secondary"
                  onClick={() => {
                    setSelected(r);
                    setAnswerPage(0);
                    setNewDeadline(r.prazo);
                  }}
                >
                  Ver respostas / prazo
                </button>
              ),
            },
          ]}
        />
        <Pagination page={page} setPage={setPage} more={data?.length === 50} />
      </Card>
      {selected && (
        <Card title={`Respostas — ${selected.titulo}`}>
          <form className="actions" onSubmit={extend}>
            <Field label="Prorrogar prazo">
              <input
                type="date"
                min={today()}
                required
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
            </Field>
            <button className="button secondary" disabled={busy}>
              Atualizar prazo
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={async () => {
                try {
                  await api.download(
                    "/secretaria/relatorios/exportar?tipo=formularios&formato=csv",
                    "oto-formularios.csv",
                  );
                } catch (e) {
                  setFailure((e as Error).message);
                }
              }}
            >
              Exportar todos os formulários (CSV)
            </button>
          </form>
          <State loading={responses.loading} error={responses.error} />
          <Table
            rows={responses.data ?? []}
            columns={[
              { key: "estabelecimento", label: "Hospedagem" },
              { key: "status", label: "Status" },
              { key: "respostas", label: "Respostas" },
              { key: "enviado_em", label: "Envio" },
            ]}
          />
          <Pagination
            page={answerPage}
            setPage={setAnswerPage}
            more={responses.data?.length === 50}
          />
        </Card>
      )}
    </Page>
  );
}
