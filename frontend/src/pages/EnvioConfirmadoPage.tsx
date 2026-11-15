import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Page, Card, State, useData } from "../components/Workspace";
import type { Row } from "../components/Workspace";
export default function EnvioConfirmadoPage() {
  const { id } = useParams();
  const { data, error, loading } = useData(
    () => api.get<Row>(`/formularios/${id}`),
    [id],
  );
  const sent = data?.minhaResposta?.[0];
  return (
    <Page title="Confirmação da pesquisa">
      <State {...{ loading, error }} />
      {data && (
        <Card
          title={
            sent?.status === "enviado"
              ? "✓ Pesquisa enviada com sucesso"
              : "Envio ainda não confirmado"
          }
        >
          <p>
            {data.titulo} · {data.referencia}
          </p>
          {sent?.status === "enviado" ? (
            <p role="status">
              Suas respostas estão gravadas no banco. Envio registrado em{" "}
              {new Date(sent.enviado_em).toLocaleString("pt-BR")}.
            </p>
          ) : (
            <p>Ainda não existe uma resposta enviada para este formulário.</p>
          )}
          <Link className="button" to="/formularios">
            Meus formulários
          </Link>
        </Card>
      )}
    </Page>
  );
}
