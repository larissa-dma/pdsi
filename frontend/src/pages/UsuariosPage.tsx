import { useState } from "react";
import { api } from "../api/client";
import {
  Page,
  Card,
  Field,
  Message,
  State,
  Table,
  Pagination,
  useData,
} from "../components/Workspace";
import type { Row } from "../components/Workspace";
export default function UsuariosPage() {
  const [page, setPage] = useState(0);
  const { data, error, loading, reload } = useData(
    () => api.get<Row[]>(`/secretaria/usuarios?pagina=${page}`),
    [page],
  );
  const [name, setName] = useState(""),
    [identifier, setIdentifier] = useState(""),
    [password, setPassword] = useState(""),
    [role, setRole] = useState("HOSPEDAGEM"),
    [establishment, setEstablishment] = useState(""),
    [search, setSearch] = useState(""),
    [recordPage, setRecordPage] = useState(0);
  const records = useData(
    () =>
      api.get<Row[]>(
        `/secretaria/inventario/registros?busca=${encodeURIComponent(search)}&pagina=${recordPage}`,
      ),
    [search, recordPage],
  );
  const [busy, setBusy] = useState(false),
    [failure, setFailure] = useState(""),
    [message, setMessage] = useState(""),
    [reset, setReset] = useState<Row | null>(null),
    [newPassword, setNewPassword] = useState("");
  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setFailure("");
    setMessage("");
    try {
      await action();
      setMessage(success);
      reload();
      return true;
    } catch (e) {
      setFailure((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (
      await run(
        () =>
          api.post("/secretaria/usuarios", {
            nome: name,
            identificador: identifier,
            senha: password,
            perfil: role,
            estabelecimentoId:
              role === "HOSPEDAGEM" ? Number(establishment) : null,
          }),
        "Usuário criado.",
      )
    ) {
      setPassword("");
      setName("");
      setIdentifier("");
    }
  }
  return (
    <Page
      title="Usuários e acessos"
      description="Cadastre os responsáveis e gerencie o acesso de Secretaria e Hospedagem."
    >
      <Message error={failure} success={message} />
      <Card title="Novo usuário">
        <form className="stack" onSubmit={create}>
          <div className="field-grid">
            <Field label="Nome">
              <input
                required
                maxLength={150}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Identificador de login">
              <input
                required
                maxLength={200}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </Field>
            <Field label="Senha inicial (12 caracteres ou mais)">
              <input
                type="password"
                required
                minLength={12}
                maxLength={72}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label="Perfil">
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="HOSPEDAGEM">Hospedagem</option>
                <option value="SECRETARIA">Secretaria</option>
              </select>
            </Field>
          </div>
          {role === "HOSPEDAGEM" && (
            <>
              <Field label="Buscar estabelecimento">
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setRecordPage(0);
                  }}
                />
              </Field>
              <Field label="Estabelecimento vinculado">
                <select
                  required
                  value={establishment}
                  onChange={(e) => setEstablishment(e.target.value)}
                >
                  <option value="">Selecione um registro de hospedagem</option>
                  {records.data?.map((r) => (
                    <option key={r.id} value={r.id}>
                      #{r.id} — {r.nome}
                    </option>
                  ))}
                </select>
              </Field>
              <Pagination
                page={recordPage}
                setPage={setRecordPage}
                more={records.data?.length === 50}
              />
              <p className="muted">
                O registro precisa estar vinculado ao segmento hospedagem. A API
                verifica esse vínculo.
              </p>
            </>
          )}
          <button className="button" disabled={busy}>
            Criar usuário
          </button>
        </form>
      </Card>
      <State {...{ loading, error }} />
      <Card title="Contas cadastradas">
        <Table
          rows={data ?? []}
          columns={[
            { key: "nome", label: "Nome" },
            { key: "identificador", label: "Login" },
            { key: "perfil", label: "Perfil" },
            { key: "estabelecimento_nome", label: "Hospedagem" },
            { key: "ativo", label: "Ativo" },
            {
              key: "action",
              label: "Ações",
              render: (r) => (
                <div className="actions">
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => {
                      setReset(r);
                      setNewPassword("");
                    }}
                  >
                    Redefinir senha
                  </button>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() =>
                      run(
                        () =>
                          api.put(`/secretaria/usuarios/${r.id}/estado`, {
                            ativo: !r.ativo,
                          }),
                        "Acesso atualizado.",
                      )
                    }
                  >
                    {r.ativo ? "Desativar" : "Ativar"}
                  </button>
                </div>
              ),
            },
          ]}
        />
        <Pagination page={page} setPage={setPage} more={data?.length === 50} />
      </Card>
      {reset && (
        <Card title={`Redefinir senha — ${reset.identificador}`}>
          <form
            className="actions"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await run(
                  () =>
                    api.put(`/secretaria/usuarios/${reset.id}/senha`, {
                      novaSenha: newPassword,
                    }),
                  "Senha redefinida.",
                )
              ) {
                setNewPassword("");
                setReset(null);
              }
            }}
          >
            <Field label="Nova senha">
              <input
                type="password"
                required
                minLength={12}
                maxLength={72}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </Field>
            <button className="button" disabled={busy}>
              Salvar nova senha
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => setReset(null)}
            >
              Cancelar
            </button>
          </form>
        </Card>
      )}
    </Page>
  );
}
