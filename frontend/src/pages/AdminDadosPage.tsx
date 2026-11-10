import { useResponsive } from '../hooks/useResponsive';

const DATASETS = [
  { titulo: 'Ocupação Hoteleira', periodo: 'Jan–Dez 2025', respostas: 24, total: 31, pct: 77 },
  { titulo: 'Fluxo de Visitantes', periodo: 'T3 2025', respostas: 18, total: 20, pct: 90 },
  { titulo: 'Perfil do Turista', periodo: 'Ago 2025', respostas: 11, total: 25, pct: 44 },
  { titulo: 'Satisfação Geral', periodo: 'Set 2025', respostas: 32, total: 32, pct: 100 },
];

const AGREGADOS = [
  { indicador: 'Taxa de ocupação média', valor: '78%', periodo: 'Jan–Set 2025', fonte: 'Ocupação Hoteleira' },
  { indicador: 'Fluxo total estimado', valor: '142.800', periodo: 'Jan–Set 2025', fonte: 'Fluxo de Visitantes' },
  { indicador: 'Duração média da estadia', valor: '3,2 dias', periodo: 'T2 2025', fonte: 'Perfil do Turista' },
  { indicador: 'NPS setorial', valor: '72', periodo: 'Set 2025', fonte: 'Satisfação Geral' },
];

export default function AdminDadosPage() {
  const { isMobile } = useResponsive();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: 'var(--navy-800)' }}>
          Administração dos Dados de Pesquisas
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          Gestão e consolidação das bases de dados coletadas
        </p>
      </div>

      {/* Grid de datasets */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
        {DATASETS.map(ds => (
          <div key={ds.titulo} style={{
            background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 22px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)' }}>{ds.titulo}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ds.periodo}</div>
              </div>
              <span style={{
                background: ds.pct === 100 ? 'var(--status-sent-bg)' : 'var(--status-available-bg)',
                color: ds.pct === 100 ? 'var(--status-sent-fg)' : 'var(--status-available-fg)',
                borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: 600,
              }}>
                {ds.pct}%
              </span>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                <span>Respostas recebidas</span>
                <span style={{ fontWeight: 600, color: 'var(--navy-800)' }}>{ds.respostas}/{ds.total}</span>
              </div>
              <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${ds.pct}%`, background: ds.pct === 100 ? 'var(--status-sent-fg)' : 'var(--cyan-700)', borderRadius: '3px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ flex: 1, padding: '7px', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '12px', fontWeight: 500, background: '#fff', color: 'var(--text-mid)' }}>
                Ver respostas
              </button>
              <button style={{ flex: 1, padding: '7px', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 500, background: 'var(--navy-500)', color: '#fff' }}>
                Exportar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dados agregados */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)' }}>
          Indicadores agregados
        </div>
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
          <thead>
            <tr style={{ background: '#F5F9FC' }}>
              {['Indicador', 'Valor', 'Período', 'Fonte'].map(col => (
                <th key={col} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AGREGADOS.map((r, i) => (
              <tr key={r.indicador} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: 'var(--navy-800)' }}>{r.indicador}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: 'var(--cyan-700)' }}>{r.valor}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-mid)' }}>{r.periodo}</td>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{r.fonte}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
