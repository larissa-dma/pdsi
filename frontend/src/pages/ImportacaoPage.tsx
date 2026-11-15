import { useState } from "react";
import { api } from "../api/client";
import {
  Page,
  Card,
  Field,
  State,
  Message,
  Table,
  useData,
  Pagination,
} from "../components/Workspace";
import type { Row } from "../components/Workspace";
const schemas: Record<string, string[]> = {
  inventario: [
    "nome",
    "segmento",
    "endereco",
    "bairro",
    "descricao",
    "latitude",
    "longitude",
  ],
  ocupacao: [
    "mes_referencia",
    "estabelecimento_id",
    "ocupacao_percentual",
    "fluxo_pessoas",
    "tipo_dado",
  ],
  diaria: ["mes_referencia", "estabelecimento_id", "valor"],
  demanda: ["referencia", "origem_uf"],
  controle: ["referencia"],
  issqn: ["mes_referencia", "medida", "valor", "unidade", "recorte"],
  caged: ["mes_referencia", "medida", "valor", "unidade", "recorte"],
  veiculos: ["mes_referencia", "medida", "valor", "unidade", "recorte"],
  fretamento: ["mes_referencia", "medida", "valor", "unidade", "recorte"],
};
const samples: Record<string, string> = {
  inventario:
    "nome;segmento;endereco;bairro;descricao;latitude;longitude\nFICTICIO - Exemplo novo;hospedagem;Rua Exemplo;Centro;Cadastro sintético;-20.75;-48.9\n",
  ocupacao:
    "mes_referencia;estabelecimento_id;ocupacao_percentual;fluxo_pessoas;tipo_dado\n2026-11;;65.5;120;consolidado\n",
  diaria: "mes_referencia;estabelecimento_id;valor\n2026-11;;250.50\n",
  demanda: "referencia;origem_uf\n2026-11;SP\n",
  controle: "referencia\n2026-11\n",
};
export default function ImportacaoPage() {
  const [file, setFile] = useState<File | null>(null),
    [type, setType] = useState("inventario"),
    [reference, setReference] = useState(""),
    [stage, setStage] = useState<Row | null>(null),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [validation, setValidation] = useState<Row | null>(null),
    [onlyValid, setOnlyValid] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [page, setPage] = useState(0),
    [previewPage, setPreviewPage] = useState(0),
    [errors, setErrors] = useState<Row[] | null>(null),
    [batchId, setBatchId] = useState<number | null>(null),
    [rawPage, setRawPage] = useState(0);
  const originals = useData(
    () =>
      batchId
        ? api.get<Row[]>(
            `/secretaria/importacoes/${batchId}/linhas?pagina=${rawPage}`,
          )
        : Promise.resolve([]),
    [batchId, rawPage],
  );
  const history = useData(
    () => api.get<Row[]>(`/secretaria/importacoes?pagina=${page}`),
    [page],
  );
  async function prepare(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const form = new FormData();
      form.append("arquivo", file);
      const result = await api.post<Row>(
        "/secretaria/importacoes/preparar",
        form,
      );
      setStage(result);
      setMapping(
        Object.fromEntries(
          schemas[type]
            .filter((k) => result.colunas.includes(k))
            .map((k) => [k, k]),
        ),
      );
      setValidation(null);
      setPreviewPage(0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function validate() {
    if (!stage) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.post<Row>(
        `/secretaria/importacoes/previas/${stage.id}/validar`,
        { tipo: type, referencia: reference, campos: mapping },
      );
      setValidation(result);
      setPreviewPage(0);
      setOnlyValid(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    if (!stage) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.post<Row>(
        `/secretaria/importacoes/previas/${stage.id}/confirmar`,
        { somenteValidas: onlyValid },
      );
      setMessage(
        `Lote #${result.id} gravado: ${result.linhas_validas} linhas válidas e ${result.linhas_pendentes} pendências.`,
      );
      setStage(null);
      setValidation(null);
      setFile(null);
      history.reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function template() {
    const content =
      samples[type] ??
      "mes_referencia;medida;valor;unidade;recorte\n2026-11;Indicador de teste;100;unidades;FICTICIO - recorte de demonstração\n";
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `modelo-${type}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <Page
      title="Importação e qualidade"
      description="Arquivo → mapeamento → prévia validada → confirmação no banco."
    >
      <Message error={error} success={message} />
      <Card title="1. Fonte e arquivo">
        <form onSubmit={prepare} className="stack">
          <div className="field-grid">
            <Field label="Conjunto">
              <select
                disabled={busy || !!stage}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {Object.keys(schemas).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Referência do lote">
              <input
                required
                maxLength={50}
                disabled={busy}
                value={reference}
                onChange={(e) => {
                  setReference(e.target.value);
                  setValidation(null);
                }}
                placeholder="2026-11"
              />
            </Field>
            <Field label="Arquivo CSV UTF-8 ou XLSX (até 10 MB)">
              <input
                type="file"
                accept=".csv,.xlsx"
                required
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setStage(null);
                  setValidation(null);
                }}
              />
            </Field>
          </div>
          <p className="muted">
            Cabeçalho na primeira linha, até 5.000 linhas e 150 colunas. No XLSX
            é lida a primeira aba. Use códigos de segmento (ex.: hospedagem),
            percentuais de 0 a 100 e meses AAAA-MM ou AAAA-MM-01. Fórmulas não
            são aceitas; exporte valores.
          </p>
          <div className="actions">
            <button className="button" disabled={busy || !file}>
              {busy ? "Processando…" : "Ler arquivo"}
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={template}
            >
              Baixar modelo CSV
            </button>
            {stage && (
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setStage(null);
                  setValidation(null);
                }}
              >
                Recomeçar
              </button>
            )}
          </div>
        </form>
      </Card>
      {stage && (
        <Card title={`2. Mapear colunas — ${stage.total} linhas`}>
          <div className="field-grid">
            {schemas[type].map((key) => (
              <Field key={key} label={key}>
                <select
                  value={mapping[key] ?? ""}
                  onChange={(e) => {
                    setMapping((v) => {
                      const copy = { ...v };
                      if (e.target.value) copy[key] = e.target.value;
                      else delete copy[key];
                      return copy;
                    });
                    setValidation(null);
                  }}
                >
                  <option value="">Não informado</option>
                  {stage.colunas.map((c: string) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
            ))}
          </div>
          <details style={{ margin: "16px 0" }}>
            <summary>Amostra do arquivo</summary>
            <Table
              rows={stage.amostra}
              columns={stage.colunas.map((c: string) => ({ key: c, label: c }))}
            />
          </details>
          <button
            className="button"
            disabled={busy || !reference}
            onClick={validate}
          >
            Validar mapeamento
          </button>
        </Card>
      )}
      {validation && (
        <Card title="3. Revisar e confirmar">
          <p>
            {validation.validas} válidas de {validation.total} linhas.{" "}
            {validation.total - validation.validas} pendências.
          </p>
          <Table
            rows={validation.linhas.slice(
              previewPage * 50,
              previewPage * 50 + 50,
            )}
            columns={[
              { key: "linha", label: "Linha" },
              { key: "valida", label: "Válida" },
              { key: "dados", label: "Dados normalizados" },
              { key: "erro", label: "Pendência" },
            ]}
          />
          <Pagination
            page={previewPage}
            setPage={setPreviewPage}
            more={(previewPage + 1) * 50 < validation.total}
          />
          {validation.validas < validation.total && (
            <label>
              <input
                type="checkbox"
                checked={onlyValid}
                onChange={(e) => setOnlyValid(e.target.checked)}
              />{" "}
              Confirmar somente as linhas válidas e registrar as demais como
              pendências
            </label>
          )}
          <div className="actions" style={{ marginTop: 16 }}>
            <button
              className="button"
              disabled={
                busy ||
                validation.validas === 0 ||
                (validation.validas < validation.total && !onlyValid)
              }
              onClick={commit}
            >
              {busy ? "Gravando…" : "Confirmar importação"}
            </button>
          </div>
          <p className="muted">
            Nenhum registro é importado antes desta confirmação. Arquivos já
            importados para o mesmo conjunto são bloqueados pelo hash.
          </p>
        </Card>
      )}
      <State loading={history.loading} error={history.error} />
      <Card title="Histórico de cargas">
        <Table
          rows={history.data ?? []}
          columns={[
            { key: "id", label: "Lote" },
            { key: "nome_arquivo", label: "Arquivo" },
            { key: "referencia", label: "Referência" },
            { key: "status", label: "Situação" },
            { key: "linhas_validas", label: "Válidas" },
            { key: "linhas_pendentes", label: "Pendências" },
            {
              key: "action",
              label: "Detalhes",
              render: (r) => (
                <button
                  className="button secondary"
                  onClick={async () => {
                    try {
                      setErrors(
                        await api.get<Row[]>(
                          `/secretaria/importacoes/${r.id}/erros`,
                        ),
                      );
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Ver erros (até 50)
                </button>
              ),
            },
            {
              key: "originais",
              label: "Origem",
              render: (r) => (
                <button
                  className="button secondary"
                  onClick={() => {
                    setBatchId(r.id);
                    setRawPage(0);
                  }}
                >
                  Ver linhas de origem
                </button>
              ),
            },
          ]}
        />
        <Pagination
          page={page}
          setPage={setPage}
          more={history.data?.length === 50}
        />
      </Card>
      {batchId && (
        <Card title={`Linhas de origem — lote #${batchId}`}>
          <State loading={originals.loading} error={originals.error} />
          <Table
            rows={originals.data ?? []}
            columns={[
              { key: "linha", label: "Linha" },
              { key: "valida", label: "Válida" },
              { key: "dados_originais", label: "Dados de origem" },
            ]}
          />
          <Pagination
            page={rawPage}
            setPage={setRawPage}
            more={originals.data?.length === 50}
          />
        </Card>
      )}
      {errors && (
        <Card title="Erros do lote">
          <Table
            rows={errors}
            columns={[
              { key: "linha", label: "Linha" },
              { key: "tipo", label: "Tipo" },
              { key: "descricao", label: "Descrição" },
            ]}
          />
        </Card>
      )}
    </Page>
  );
}
