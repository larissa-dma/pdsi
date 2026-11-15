import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/client";
import {
  Page,
  Card,
  State,
  Field,
  Message,
  useData,
  today,
} from "../components/Workspace";
import type { Row } from "../components/Workspace";
export default function PreencherFormularioPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useData(
    () => api.get<Row>(`/formularios/${id}`),
    [id],
  );
  const [answers, setAnswers] = useState<Row>({}),
    [step, setStep] = useState(1),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [failure, setFailure] = useState("");
  useEffect(() => {
    if (data) setAnswers(data.minhaResposta?.[0]?.respostas ?? {});
  }, [data]);
  const sent = data?.minhaResposta?.[0]?.status === "enviado";
  const closed = !!data && data.prazo < today();
  async function save(submit = false) {
    setBusy(true);
    setFailure("");
    setMessage("");
    try {
      await api.put(`/formularios/${id}/resposta`, { respostas: answers });
      if (submit) {
        await api.post(`/formularios/${id}/enviar`);
        navigate(`/formularios/${id}/confirmacao`);
      } else {
        setMessage("Rascunho salvo no banco.");
        reload();
      }
    } catch (e) {
      setFailure((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page
      title={data?.titulo ?? "Preencher pesquisa"}
      description={
        data ? `${data.referencia} · Prazo: ${data.prazo}` : undefined
      }
    >
      <State {...{ loading, error }} />
      {data && (
        <>
          <div className="step-tabs">
            {["Responder", "Revisar", "Enviar"].map((v, i) => (
              <span key={v} className={step === i + 1 ? "active" : ""}>
                {i + 1}. {v}
              </span>
            ))}
          </div>
          {(sent || closed) && (
            <p className="notice success">
              {sent
                ? "Resposta já enviada. Consulte seus dados abaixo."
                : "O prazo de resposta foi encerrado."}
            </p>
          )}
          <Message error={failure} success={message} />
          <Card
            title={
              step === 1 ? "Perguntas da pesquisa" : "Revisão das respostas"
            }
          >
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                if (step === 1) setStep(2);
                else if (step === 2) setStep(3);
                else save(true);
              }}
            >
              {(data.perguntas ?? []).map((q: Row) => (
                <Field
                  key={q.chave}
                  label={`${q.titulo}${q.obrigatoria ? " *" : ""}`}
                >
                  {step !== 1 ? (
                    <span>
                      {answers[q.chave] === null ||
                      answers[q.chave] === undefined ||
                      answers[q.chave] === ""
                        ? "Não informado"
                        : typeof answers[q.chave] === "boolean"
                          ? answers[q.chave]
                            ? "Sim"
                            : "Não"
                          : String(answers[q.chave])}
                    </span>
                  ) : q.tipo === "booleano" ? (
                    <select
                      disabled={sent || closed || busy}
                      required={q.obrigatoria}
                      value={
                        answers[q.chave] === undefined ||
                        answers[q.chave] === null
                          ? ""
                          : String(answers[q.chave])
                      }
                      onChange={(e) =>
                        setAnswers((v) => ({
                          ...v,
                          [q.chave]:
                            e.target.value === ""
                              ? null
                              : e.target.value === "true",
                        }))
                      }
                    >
                      <option value="">Não informado</option>
                      <option value="true">Sim</option>
                      <option value="false">Não</option>
                    </select>
                  ) : (
                    <input
                      disabled={sent || closed || busy}
                      type={q.tipo === "texto" ? "text" : "number"}
                      required={q.obrigatoria}
                      maxLength={10000}
                      min={q.tipo === "texto" ? undefined : 0}
                      max={q.tipo === "percentual" ? 100 : undefined}
                      step={q.tipo === "inteiro" ? 1 : "any"}
                      value={answers[q.chave] ?? ""}
                      onChange={(e) =>
                        setAnswers((v) => ({
                          ...v,
                          [q.chave]:
                            e.target.value === ""
                              ? null
                              : q.tipo === "texto"
                                ? e.target.value
                                : Number(e.target.value),
                        }))
                      }
                    />
                  )}
                </Field>
              ))}
              <div className="actions">
                <Link className="button secondary" to="/formularios">
                  Voltar à lista
                </Link>
                {step > 1 && (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setStep(step - 1)}
                  >
                    Corrigir
                  </button>
                )}
                {!sent && !closed && (
                  <>
                    <button
                      type="button"
                      className="button secondary"
                      disabled={busy}
                      onClick={() => save()}
                    >
                      Salvar rascunho
                    </button>
                    <button className="button" disabled={busy}>
                      {busy
                        ? "Salvando…"
                        : step === 1
                          ? "Revisar respostas"
                          : step === 2
                            ? "Confirmar revisão"
                            : "Enviar pesquisa"}
                    </button>
                  </>
                )}
              </div>
            </form>
          </Card>
          <p className="muted">
            Zero e Não são respostas válidas. O envio final bloqueia alterações.
            Um rascunho salvo pode ser retomado em outro acesso.
          </p>
        </>
      )}
    </Page>
  );
}
