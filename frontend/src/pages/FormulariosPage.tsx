import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { hospedagem } from '../api/endpoints';
import type { Formulario } from '../api/endpoints';
import { useResponsive } from '../hooks/useResponsive';

type Filtro = 'todos' | 'pendente' | 'rascunho' | 'enviado';

// API: 'pendente' = disponível (sem resposta), 'rascunho' = em andamento, 'enviado' = enviado
const STATUS_LABEL: Record<string, string> = {
  pendente: 'Disponível',
  rascunho: 'Pendente',
  enviado: 'Enviado',
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    pendente: { bg: 'var(--status-available-bg)', color: 'var(--status-available-fg)' },
    rascunho: { bg: 'var(--status-pending-bg)',   color: 'var(--status-pending-fg)' },
    enviado:  { bg: 'var(--status-sent-bg)',       color: 'var(--status-sent-fg)' },
  };
  const s = styles[status] ?? { bg: '#f0f0f0', color: '#555' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: '20px', padding: '3px 10px',
      fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export default function FormulariosPage() {
  const { isMobile } = useResponsive();
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todos');

  useEffect(() => {
    hospedagem.formularios()
      .then(setFormularios)
      .catch(() => setErro('Não foi possível carregar os formulários.'));
  }, []);

  const filtrados = filtro === 'todos'
    ? formularios
    : formularios.filter(f => f.status === filtro);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? '18px' : '22px', fontWeight: 700, color: 'var(--navy-800)' }}>
          Meus Formulários
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          Pesquisas de coleta de dados do estabelecimento
        </p>
      </div>

      {/* Card do estabelecimento */}
      <div style={{
        background: '#fff', border: '1px solid var(--border)', borderRadius: '12px',
        padding: '16px 20px', marginBottom: '24px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
          background: 'var(--cyan-50)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px',
        }}>🏨</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)' }}>Meu Estabelecimento</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Meio de hospedagem</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {([
          { value: 'todos', label: 'Todos' },
          { value: 'pendente', label: 'Disponíveis' },
          { value: 'rascunho', label: 'Pendentes' },
          { value: 'enviado', label: 'Enviados' },
        ] as { value: Filtro; label: string }[]).map(f => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            style={{
              padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 500,
              border: filtro === f.value ? 'none' : '1px solid var(--border)',
              background: filtro === f.value ? 'var(--navy-700)' : '#fff',
              color: filtro === f.value ? '#fff' : 'var(--text-mid)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Erro */}
      {erro && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px 16px', color: '#B91C1C', fontSize: '13px', marginBottom: '16px' }}>
          {erro}
        </div>
      )}

      {/* Tabela desktop / cards mobile */}
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtrados.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              Nenhum formulário encontrado.
            </div>
          ) : filtrados.map(f => (
            <div key={f.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)' }}>{f.titulo}</span>
                <StatusBadge status={f.status ?? 'pendente'} />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Ref: {f.referencia} · Prazo: {f.prazo}
              </div>
              {f.status !== 'enviado' && (
                <Link
                  to={`/formularios/${f.id}/preencher`}
                  style={{
                    display: 'block', textAlign: 'center',
                    background: 'var(--navy-700)', color: '#fff',
                    borderRadius: '8px', padding: '10px',
                    fontSize: '13px', fontWeight: 500,
                  }}
                >
                  {f.status === 'rascunho' ? 'Continuar' : 'Preencher'} →
                </Link>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: '#F5F9FC', borderBottom: '1px solid var(--border)' }}>
                  {['Formulário', 'Referência', 'Prazo', 'Situação', 'Ação'].map(col => (
                    <th key={col} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.03em' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                      Nenhum formulário encontrado.
                    </td>
                  </tr>
                ) : filtrados.map((f, i) => (
                  <tr key={f.id} style={{ borderBottom: i < filtrados.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 500, color: 'var(--navy-800)' }}>{f.titulo}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-mid)' }}>{f.referencia}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-mid)' }}>{f.prazo}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge status={f.status ?? 'pendente'} />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {f.status === 'enviado' ? (
                        <span style={{ fontSize: '12px', color: 'var(--status-sent-fg)' }}>Enviado</span>
                      ) : (
                        <Link
                          to={`/formularios/${f.id}/preencher`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            background: 'var(--navy-700)', color: '#fff',
                            borderRadius: '6px', padding: '6px 14px',
                            fontSize: '12px', fontWeight: 500,
                          }}
                        >
                          {f.status === 'rascunho' ? 'Continuar' : 'Preencher'} →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
