import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../api/AuthContext";
import { Page, Card, Field, Message } from "../components/Workspace";
export default function ContaPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("A confirmação da senha não confere.");
      return;
    }
    setBusy(true);
    try {
      await api.put("/me/senha", { senhaAtual: current, novaSenha: password });
      window.dispatchEvent(new Event("oto:unauthorized"));
      navigate("/login", { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      actions={
        <Link className="button secondary" to="/">
          Voltar ao ambiente
        </Link>
      }
      title="Minha conta"
      description={`${usuario?.nome} · ${usuario?.perfil}`}
    >
      <Card title="Alterar senha">
        <form className="stack" onSubmit={save}>
          <Field label="Senha atual">
            <input
              type="password"
              required
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </Field>
          <Field label="Nova senha">
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
          <Field label="Confirme a nova senha">
            <input
              type="password"
              required
              minLength={12}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
          <Message error={error} />
          <p className="muted">
            Após salvar, entre novamente com a nova senha.
          </p>
          <button className="button" disabled={busy}>
            {busy ? "Salvando…" : "Alterar senha"}
          </button>
        </form>
      </Card>
    </Page>
  );
}
