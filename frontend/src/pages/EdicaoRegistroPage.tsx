import Complements from "../components/Complements";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import {
  Page,
  Card,
  Field,
  State,
  Message,
  useData,
} from "../components/Workspace";
import type { Row } from "../components/Workspace";
const blank = {
  nome: "",
  descricao: "",
  razaoSocial: "",
  endereco: "",
  bairro: "",
  tipoCadastro: "estabelecimento",
  latitude: "",
  longitude: "",
  situacaoConferencia: "pendente",
};
export default function EdicaoRegistroPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fresh = !id;
  const { data, error, loading, reload } = useData(
    () =>
      fresh
        ? Promise.resolve(null)
        : api.get<Row>(`/secretaria/inventario/registros/${id}`),
    [id],
  );
  const segments = useData(() =>
    api.get<Row[]>("/secretaria/inventario/segmentos"),
  );
  const [form, setForm] = useState(blank),
    [selected, setSelected] = useState(""),
    [busy, setBusy] = useState(false),
    [failure, setFailure] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    if (data)
      setForm({
        nome: data.nome ?? "",
        descricao: data.descricao ?? "",
        razaoSocial: data.razao_social ?? "",
        endereco: data.endereco ?? "",
        bairro: data.bairro ?? "",
        tipoCadastro: data.tipo_cadastro,
        latitude: data.latitude === null ? "" : String(data.latitude),
        longitude: data.longitude === null ? "" : String(data.longitude),
        situacaoConferencia: data.situacao_conferencia,
      });
    else if (fresh) setForm(blank);
  }, [data, fresh]);
  function set(key: string, value: string) {
    setForm((v) => ({ ...v, [key]: value }));
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFailure("");
    setMessage("");
    try {
      const payload = {
        ...form,
        latitude: form.latitude === "" ? null : Number(form.latitude),
        longitude: form.longitude === "" ? null : Number(form.longitude),
      };
      const result = fresh
        ? await api.post<Row>("/secretaria/inventario/registros", payload)
        : await api.put<Row>(`/secretaria/inventario/registros/${id}`, payload);
      setMessage("Cadastro salvo no banco.");
      if (fresh)
        navigate(`/secretaria/inventario/${result.id}/editar`, {
          replace: true,
        });
      else reload();
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function link() {
    if (!selected || fresh) return;
    setBusy(true);
    setFailure("");
    try {
      await api.put(
        `/secretaria/inventario/registros/${id}/segmentos/${selected}`,
      );
      setSelected("");
      reload();
      setMessage("Segmento vinculado.");
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title={fresh ? "Novo registro" : "Ficha do inventário"}
      description={
        fresh
          ? "Cadastre a identificação e depois vincule os segmentos."
          : `Registro #${id}`
      }
    >
      <State loading={!fresh && loading} error={error} />
      <Message error={failure} success={message} />
      <div className="split">
        <div className="stack">
          <Card title="Identificação e localização">
            <form className="stack" onSubmit={save}>
              <Field label="Nome">
                <input
                  required
                  maxLength={200}
                  value={form.nome}
                  onChange={(e) => set("nome", e.target.value)}
                />
              </Field>
              <div className="field-grid">
                <Field label="Razão social">
                  <input
                    value={form.razaoSocial}
                    onChange={(e) => set("razaoSocial", e.target.value)}
                  />
                </Field>
                <Field label="Tipo de cadastro">
                  <select
                    value={form.tipoCadastro}
                    onChange={(e) => set("tipoCadastro", e.target.value)}
                  >
                    {[
                      "estabelecimento",
                      "profissional",
                      "equipamento_publico",
                      "indefinido",
                    ].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Descrição">
                <textarea
                  value={form.descricao}
                  onChange={(e) => set("descricao", e.target.value)}
                />
              </Field>
              <div className="field-grid">
                <Field label="Endereço">
                  <input
                    maxLength={255}
                    value={form.endereco}
                    onChange={(e) => set("endereco", e.target.value)}
                  />
                </Field>
                <Field label="Bairro">
                  <input
                    maxLength={120}
                    value={form.bairro}
                    onChange={(e) => set("bairro", e.target.value)}
                  />
                </Field>
                <Field label="Latitude">
                  <input
                    type="number"
                    min={-90}
                    max={90}
                    step="any"
                    value={form.latitude}
                    onChange={(e) => set("latitude", e.target.value)}
                  />
                </Field>
                <Field label="Longitude">
                  <input
                    type="number"
                    min={-180}
                    max={180}
                    step="any"
                    value={form.longitude}
                    onChange={(e) => set("longitude", e.target.value)}
                  />
                </Field>
                <Field label="Situação da conferência">
                  <select
                    value={form.situacaoConferencia}
                    onChange={(e) => set("situacaoConferencia", e.target.value)}
                  >
                    {["pendente", "parcial", "conferido", "rejeitado"].map(
                      (t) => (
                        <option key={t}>{t}</option>
                      ),
                    )}
                  </select>
                </Field>
              </div>
              <div className="actions">
                <Link className="button secondary" to="/secretaria/inventario">
                  Voltar à lista
                </Link>
                <button className="button" disabled={busy}>
                  {busy ? "Salvando…" : "Salvar cadastro"}
                </button>
              </div>
            </form>
          </Card>
          {data && <Complements id={id!} />}
          {data && (
            <Card title="Campos do inventário por segmento">
              {data.segmentos?.length ? (
                data.segmentos.map((segment: Row) => (
                  <details key={segment.id}>
                    <summary>{segment.nome}</summary>
                    <TypedAnswers registroId={id!} segment={segment} />
                  </details>
                ))
              ) : (
                <p className="muted">
                  Vincule um segmento para preencher os campos específicos.
                </p>
              )}
            </Card>
          )}
        </div>
        <div className="stack">
          <Card title="Segmentos vinculados">
            {data?.segmentos?.map((s: Row) => (
              <p key={s.id} className="badge">
                {s.nome}
              </p>
            ))}
            <Field label="Adicionar segmento">
              <select
                value={selected}
                disabled={fresh}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">Selecione</option>
                {segments.data
                  ?.filter(
                    (s) => !data?.segmentos?.some((v: Row) => v.id === s.id),
                  )
                  .map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.nome}
                    </option>
                  ))}
              </select>
            </Field>
            <button
              className="button secondary"
              style={{ marginTop: 12 }}
              disabled={fresh || busy || !selected}
              onClick={link}
            >
              Vincular
            </button>
            <p className="muted">
              Um cadastro pode pertencer a mais de um segmento. Salve o cadastro
              antes de vincular.
            </p>
          </Card>
          <Card title="Rastreabilidade">
            <p className="muted">
              Última revisão:{" "}
              {data?.data_ultima_revisao
                ? new Date(data.data_ultima_revisao).toLocaleString("pt-BR")
                : "Não informada"}
            </p>
            <p className="muted">
              Os campos preservam a estrutura do catálogo. Ausência não é zero
              nem Não.
            </p>
          </Card>
        </div>
      </div>
    </Page>
  );
}
const slots: Record<string, string> = {
  texto: "valorTexto",
  selecao: "valorTexto",
  inteiro: "valorInteiro",
  decimal: "valorDecimal",
  percentual: "valorDecimal",
  booleano: "valorBooleano",
  data: "valorData",
  lista_texto: "valorLista",
};
const inputKey: Record<string, string> = {
  valorTexto: "valor_texto",
  valorInteiro: "valor_inteiro",
  valorDecimal: "valor_decimal",
  valorBooleano: "valor_booleano",
  valorData: "valor_data",
  valorLista: "valor_lista",
};
function TypedAnswers({
  registroId,
  segment,
}: {
  registroId: string;
  segment: Row;
}) {
  const { data, error, loading, reload } = useData(
    () =>
      Promise.all([
        api.get<Row[]>(
          `/secretaria/inventario/campos?segmentoId=${segment.id}`,
        ),
        api.get<Row[]>(
          `/secretaria/inventario/registros/${registroId}/respostas`,
        ),
      ]),
    [registroId, segment.id],
  );
  const [search, setSearch] = useState("");
  return (
    <div className="stack" style={{ marginTop: 16 }}>
      <input
        className="work-input"
        placeholder="Filtrar perguntas do catálogo"
        aria-label="Filtrar perguntas do catálogo"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <State {...{ loading, error }} />
      {data?.[0]
        .filter((q) =>
          q.campo_original.toLowerCase().includes(search.toLowerCase()),
        )
        .map((q) => (
          <TypedValue
            key={q.id}
            question={q}
            saved={data[1].find(
              (a) => a.campo_id === q.id && a.vinculo_id === segment.vinculo_id,
            )}
            vinculo={segment.vinculo_id}
            reload={reload}
          />
        ))}
    </div>
  );
}
function TypedValue({
  question: q,
  saved,
  vinculo,
  reload,
}: {
  question: Row;
  saved?: Row;
  vinculo: number;
  reload: () => void;
}) {
  const slot = slots[q.tipo_logico];
  const [value, setValue] = useState(""),
    [extra, setExtra] = useState(""),
    [boolean, setBoolean] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [ok, setOk] = useState("");
  useEffect(() => {
    if (slot) {
      const v = saved?.[inputKey[slot]];
      setValue(
        Array.isArray(v)
          ? v.join("\n")
          : v === null || v === undefined
            ? ""
            : String(v),
      );
    } else if (q.tipo_logico === "coordenadas") {
      setValue(saved?.latitude == null ? "" : String(saved.latitude));
      setExtra(saved?.longitude == null ? "" : String(saved.longitude));
    } else if (q.tipo_logico === "data_ou_ano") {
      setValue(
        saved?.valor_data ??
          (saved?.valor_ano == null ? "" : String(saved.valor_ano)),
      );
    } else {
      setValue(saved?.valor_texto ?? saved?.texto_original ?? "");
      setBoolean(
        saved?.valor_booleano == null ? "" : String(saved.valor_booleano),
      );
    }
  }, [saved, slot, q.tipo_logico]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOk("");
    try {
      const body: Row = {};
      if (slot) {
        body[slot] =
          value === ""
            ? null
            : q.tipo_logico === "booleano"
              ? value === "true"
              : ["inteiro", "decimal", "percentual"].includes(q.tipo_logico)
                ? Number(value)
                : q.tipo_logico === "lista_texto"
                  ? value.split("\n").filter((v) => v.trim())
                  : value;
      } else if (q.tipo_logico === "coordenadas") {
        body.latitude = value === "" ? null : Number(value);
        body.longitude = extra === "" ? null : Number(extra);
      } else if (q.tipo_logico === "data_ou_ano") {
        body[/^\d{4}$/.test(value) ? "valorAno" : "valorData"] = /^\d{4}$/.test(
          value,
        )
          ? Number(value)
          : value;
      } else if (q.tipo_logico === "sem_definicao") {
        body.textoOriginal = value;
      } else {
        body.valorTexto = value || null;
        body.valorBooleano = boolean === "" ? null : boolean === "true";
      }
      await api.put(
        `/secretaria/inventario/vinculos/${vinculo}/respostas/${q.id}`,
        body,
      );
      setOk("Valor salvo.");
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="stack work-card" onSubmit={save}>
      <div>
        <strong>{q.campo_original}</strong>
        <p className="muted">
          {q.grupo_original} · {q.tipo_logico}
        </p>
        <p className="muted">{q.regra_tratamento}</p>
      </div>
      <Field label="Valor">
        {q.tipo_logico === "booleano" ? (
          <select value={value} onChange={(e) => setValue(e.target.value)}>
            <option value="">Não informado</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        ) : q.tipo_logico === "lista_texto" ? (
          <textarea
            value={value}
            placeholder="Um item por linha"
            onChange={(e) => setValue(e.target.value)}
          />
        ) : (
          <input
            type={
              q.tipo_logico === "data"
                ? "date"
                : ["inteiro", "decimal", "percentual", "coordenadas"].includes(
                      q.tipo_logico,
                    )
                  ? "number"
                  : "text"
            }
            step={q.tipo_logico === "inteiro" ? "1" : "any"}
            min={
              q.tipo_logico === "coordenadas"
                ? -90
                : ["inteiro", "percentual"].includes(q.tipo_logico)
                  ? 0
                  : undefined
            }
            max={
              q.tipo_logico === "percentual"
                ? 100
                : q.tipo_logico === "coordenadas"
                  ? 90
                  : undefined
            }
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
      </Field>
      {q.tipo_logico === "coordenadas" && (
        <Field label="Longitude">
          <input
            type="number"
            step="any"
            min={-180}
            max={180}
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
          />
        </Field>
      )}
      {["booleano_detalhe", "texto_indicacao"].includes(q.tipo_logico) && (
        <Field label="Indicação">
          <select value={boolean} onChange={(e) => setBoolean(e.target.value)}>
            <option value="">Não informado</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </Field>
      )}
      <Message error={error} success={ok} />
      <div className="actions">
        <button className="button secondary" disabled={busy}>
          {busy ? "Salvando…" : "Salvar valor"}
        </button>
      </div>
    </form>
  );
}
