import { useState } from "react";
import { api } from "../api/client";
import { Card, Field, Table, State, Message, useData } from "./Workspace";
import type { Row } from "./Workspace";
export default function Complements({ id }: { id: string }) {
  const { data, error, loading, reload } = useData(
    () => api.get<Row>(`/secretaria/inventario/registros/${id}/complementos`),
    [id],
  );
  const [type, setType] = useState("email"),
    [value, setValue] = useState(""),
    [responsible, setResponsible] = useState(""),
    [isPublic, setIsPublic] = useState(false),
    [cnae, setCnae] = useState(""),
    [activity, setActivity] = useState(""),
    [requirement, setRequirement] = useState(""),
    [registered, setRegistered] = useState(""),
    [number, setNumber] = useState(""),
    [expiry, setExpiry] = useState(""),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [failure, setFailure] = useState(""),
    [message, setMessage] = useState("");
  async function save(kind: string, body: Row) {
    setBusy(true);
    setFailure("");
    setMessage("");
    try {
      await api.post(`/secretaria/inventario/registros/${id}/${kind}`, body);
      setMessage("Informação registrada.");
      reload();
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(kind: string, key: number) {
    if (!window.confirm("Remover esta informação complementar?")) return;
    setFailure("");
    setMessage("");
    try {
      await api.delete(`/secretaria/inventario/registros/${id}/${kind}/${key}`);
      reload();
    } catch (e) {
      setFailure((e as Error).message);
    }
  }
  return (
    <Card title="Contatos, atividades e CADASTUR">
      <State {...{ loading, error }} />
      <Message error={failure} success={message} />
      <details>
        <summary>Contatos e canais</summary>
        <Table
          rows={data?.canais ?? []}
          columns={[
            { key: "tipo", label: "Tipo" },
            { key: "valor", label: "Contato" },
            { key: "publico", label: "Publicação autorizada" },
            {
              key: "action",
              label: "Ação",
              render: (r) => (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => remove("canais", r.id)}
                >
                  Remover
                </button>
              ),
            },
          ]}
        />
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            save("canais", {
              tipo: type,
              valor: value,
              responsavel: responsible,
              publico: isPublic,
            });
          }}
        >
          <div className="field-grid">
            <Field label="Tipo de canal">
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {["email", "telefone", "site", "rede_social", "outro"].map(
                  (t) => (
                    <option key={t}>{t}</option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Contato">
              <input
                required
                maxLength={2000}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </Field>
            <Field label="Responsável">
              <input
                maxLength={200}
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
              />
            </Field>
          </div>
          <label>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />{" "}
            Publicação autorizada (permanece interno por padrão)
          </label>
          <button className="button secondary" disabled={busy}>
            Adicionar canal
          </button>
        </form>
      </details>
      <details>
        <summary>Atividades / CNAE</summary>
        <Table
          rows={data?.atividades ?? []}
          columns={[
            { key: "cnae", label: "CNAE" },
            { key: "descricao", label: "Descrição" },
            {
              key: "action",
              label: "Ação",
              render: (r) => (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => remove("atividades", r.id)}
                >
                  Remover
                </button>
              ),
            },
          ]}
        />
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            save("atividades", { cnae, descricao: activity });
          }}
        >
          <Field label="Código CNAE (texto)">
            <input
              required
              maxLength={30}
              value={cnae}
              onChange={(e) => setCnae(e.target.value)}
            />
          </Field>
          <Field label="Descrição da atividade">
            <input
              maxLength={2000}
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
            />
          </Field>
          <button className="button secondary" disabled={busy}>
            Adicionar atividade
          </button>
        </form>
      </details>
      <details>
        <summary>CADASTUR</summary>
        <Table
          rows={data?.cadastur ?? []}
          columns={[
            { key: "obrigatoriedade", label: "Obrigatoriedade" },
            { key: "registrado", label: "Registrado" },
            { key: "numero", label: "Número" },
            { key: "vencimento", label: "Vencimento" },
            {
              key: "action",
              label: "Ação",
              render: (r) => (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => remove("cadastur", r.id)}
                >
                  Remover
                </button>
              ),
            },
          ]}
        />
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            save("cadastur", {
              obrigatoriedade: requirement ? Number(requirement) : null,
              registrado: registered === "" ? null : registered === "true",
              numero: number || null,
              vencimento: expiry || null,
              observacao: note,
            });
          }}
        >
          <div className="field-grid">
            <Field label="Obrigatoriedade">
              <select
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
              >
                <option value="">Não informado</option>
                <option value="1">1 — Obrigatório</option>
                <option value="2">2 — Opcional</option>
                <option value="3">3 — Não consta</option>
              </select>
            </Field>
            <Field label="Registrado no CADASTUR">
              <select
                value={registered}
                onChange={(e) => setRegistered(e.target.value)}
              >
                <option value="">Não informado</option>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </Field>
            <Field label="Número CADASTUR">
              <input
                maxLength={200}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </Field>
            <Field label="Vencimento">
              <input
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Observação">
            <input
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <button className="button secondary" disabled={busy}>
            Registrar informação CADASTUR
          </button>
        </form>
      </details>
    </Card>
  );
}
