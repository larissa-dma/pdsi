import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { secretaria } from '../api/endpoints';
import type { RegistroInventario } from '../api/endpoints';
import { useResponsive } from '../hooks/useResponsive';

const CONFERENCIA_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  parcial: 'Parcial',
  conferido: 'Conferido',
  rejeitado: 'Rejeitado',
};

const CONFERENCIA_STYLE: Record<string, { bg: string; color: string }> = {
  pendente:  { bg: 'var(--status-pending-bg)',   color: 'var(--status-pending-fg)' },
  parcial:   { bg: 'var(--status-available-bg)', color: 'var(--status-available-fg)' },
  conferido: { bg: 'var(--status-sent-bg)',       color: 'var(--status-sent-fg)' },
  rejeitado: { bg: '#FEF2F2',                     color: '#B91C1C' },
};

export default function InventarioPage() {
  const { isMobile } = useResponsive();
  const [registros, setRegistros] = useState<RegistroInventario[]>([]);
  const [busca, setBusca] = useState('');
  const [buscaAtiva, setBuscaAtiva] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    secretaria.registros(buscaAtiva)
      .then(setRegistros)
      .catch(() => setErro('Não foi possível carregar os registros.'))
      .finally(() => setCarregando(false));
  }, [buscaAtiva]);

  function handleBusca(e: React.FormEvent) {
    e.preventDefault();
    setBuscaAtiva(busca);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: 'var(--navy-800)' }}>
            Consulta do Inventário Turístico
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Base cadastral de estabelecimentos e atrativos</p>
        </div>
        <Link
          to="/secretaria/inventario/novo"
          style={{
            background: 'var(--navy-500)', color: '#fff',
            borderRadius: '8px', padding: '10px 18px',
            fontSize: '13px', fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            whiteSpace: 'nowrap',
          }}
        >
          + Novo registro
        </Link>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'Total de registros', valor: registros.length },
          { label: 'Conferidos', valor: registros.filter(r => r.situacao_conferencia === 'conferido').length },
          { label: 'Pendentes', valor: registros.filter(r => r.situacao_conferencia === 'pendente').length },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 18px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{k.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--navy-800)' }}>{k.valor}</div>
          </div>
        ))}
      </div>

      {/* Busca */}
      <form onSubmit={handleBusca} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome…"
          style={{
            flex: '1 1 240px', padding: '9px 14px',
            border: '1.5px solid var(--border)', borderRadius: '8px',
            fontSize: '13px', outline: 'none',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--cyan-700)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        />
        <button
          type="submit"
          style={{ background: 'var(--navy-500)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: 600 }}
        >
          Buscar
        </button>
        {buscaAtiva && (
          <button
            type="button"
            onClick={() => { setBusca(''); setBuscaAtiva(''); }}
            style={{ background: '#fff', color: 'var(--text-mid)', border: '1px solid var(--border)', borderRadius: '8px', padding: '9px 16px', fontSize: '13px' }}
          >
            Limpar
          </button>
        )}
      </form>

      {/* Erro */}
      {erro && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px 16px', color: '#B91C1C', fontSize: '13px' }}>{erro}</div>}

      {/* Tabela */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {carregando ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Carregando…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '500px' : '600px' }}>
              <thead>
                <tr style={{ background: '#F5F9FC', borderBottom: '1px solid var(--border)' }}>
                  {['Nome', 'Endereço', 'Situação', 'Ações'].map(col => (
                    <th key={col} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registros.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                      {buscaAtiva ? 'Nenhum resultado para a busca.' : 'Nenhum registro cadastrado.'}
                    </td>
                  </tr>
                ) : registros.map((r, i) => {
                  const cs = CONFERENCIA_STYLE[r.situacao_conferencia] ?? CONFERENCIA_STYLE.pendente;
                  return (
                    <tr key={r.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: 'var(--navy-800)' }}>{r.nome}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-mid)' }}>
                        {r.endereco ? `${r.endereco}${r.bairro ? `, ${r.bairro}` : ''}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: cs.bg, color: cs.color, borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: 500 }}>
                          {CONFERENCIA_LABEL[r.situacao_conferencia] ?? r.situacao_conferencia}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Link
                          to={`/secretaria/inventario/${r.id}/editar`}
                          style={{ color: 'var(--navy-500)', fontSize: '12px', fontWeight: 500, border: '1px solid var(--border)', borderRadius: '6px', padding: '5px 12px', display: 'inline-block' }}
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
