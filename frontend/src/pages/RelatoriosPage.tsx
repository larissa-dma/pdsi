import { useState } from 'react';
import { useResponsive } from '../hooks/useResponsive';

const MODELOS = [
  'Relatório de Ocupação Hoteleira',
  'Inventário Turístico Completo',
  'Indicadores de Sustentabilidade ODS',
  'Fluxo de Visitantes',
];

const FONTES = [
  { id: 'ocupacao', label: 'Pesquisa de Ocupação' },
  { id: 'inventario', label: 'Inventário Turístico' },
  { id: 'sustentabilidade', label: 'Indicadores ODS' },
  { id: 'fluxo', label: 'Fluxo de Visitantes' },
];

type Formato = 'PDF' | 'XLSX' | 'CSV';

const PREVIEW_TABLE = [
  { indicador: 'Taxa de ocupação média', jan: '78%', fev: '72%', mar: '80%', t1: '76,7%' },
  { indicador: 'Fluxo de turistas', jan: '4.820', fev: '4.102', mar: '5.358', t1: '14.280' },
  { indicador: 'Tempo médio de estadia (d)', jan: '3,1', fev: '3,0', mar: '3,4', t1: '3,2' },
];

export default function RelatoriosPage() {
  const { isMobile } = useResponsive();
  const [modelo, setModelo] = useState(MODELOS[0]);
  const [periodo, setPeriodo] = useState('2025-T1');
  const [fontes, setFontes] = useState<string[]>(['ocupacao', 'inventario']);
  const [formato, setFormato] = useState<Formato>('PDF');

  function toggleFonte(id: string) {
    setFontes(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: 'var(--navy-800)' }}>
          Relatórios Técnicos e Exportações
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          Gere relatórios analíticos para publicação e tomada de decisão
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px', alignItems: 'flex-start' }}>
        {/* Painel de configuração */}
        <div style={{ width: isMobile ? '100%' : '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)', marginBottom: '16px' }}>Configuração</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Modelo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-mid)' }}>Modelo</label>
                <select
                  value={modelo}
                  onChange={e => setModelo(e.target.value)}
                  style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '13px', background: '#fff', outline: 'none' }}
                >
                  {MODELOS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>

              {/* Período */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-mid)' }}>Período</label>
                <select
                  value={periodo}
                  onChange={e => setPeriodo(e.target.value)}
                  style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '13px', background: '#fff', outline: 'none' }}
                >
                  <option value="2025-T1">T1 2025</option>
                  <option value="2025-T2">T2 2025</option>
                  <option value="2025-T3">T3 2025</option>
                  <option value="2025-anual">Anual 2025</option>
                </select>
              </div>

              {/* Fontes */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-mid)', display: 'block', marginBottom: '8px' }}>Fontes de dados</label>
                {FONTES.map(f => (
                  <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '6px' }}>
                    <input
                      type="checkbox"
                      checked={fontes.includes(f.id)}
                      onChange={() => toggleFonte(f.id)}
                      style={{ width: '14px', height: '14px' }}
                    />
                    <span style={{ fontSize: '13px', color: 'var(--navy-800)' }}>{f.label}</span>
                  </label>
                ))}
              </div>

              {/* Formato */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-mid)', display: 'block', marginBottom: '8px' }}>Formato</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['PDF', 'XLSX', 'CSV'] as Formato[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setFormato(f)}
                      style={{
                        flex: 1, padding: '7px', borderRadius: '7px', fontSize: '12px', fontWeight: 600,
                        border: formato === f ? 'none' : '1.5px solid var(--border)',
                        background: formato === f ? 'var(--navy-700)' : '#fff',
                        color: formato === f ? '#fff' : 'var(--text-mid)',
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button style={{
              marginTop: '16px', width: '100%',
              background: 'var(--navy-500)', color: '#fff',
              border: 'none', borderRadius: '8px', padding: '12px',
              fontSize: '14px', fontWeight: 700,
            }}>
              ⬇ Gerar e baixar {formato}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div style={{ flex: 1, background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px' }}>
          {/* Cabeçalho do relatório */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid var(--navy-800)' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '4px' }}>
                OBSERVATÓRIO DE TURISMO DE OLÍMPIA
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy-800)' }}>{modelo}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Período: {periodo.replace('2025-', '').replace('T', 'T')} 2025 — Gerado em {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
            <div style={{
              width: '44px', height: '44px', borderRadius: '8px',
              background: 'var(--navy-800)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '12px', color: '#fff',
            }}>OTO</div>
          </div>

          {/* Sumário executivo */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--navy-800)', marginBottom: '10px' }}>Sumário Executivo</div>
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '400px' }}>
              <thead>
                <tr style={{ background: 'var(--navy-800)', color: '#fff' }}>
                  {['Indicador', 'T1', 'T2', 'T3', 'Acumulado'].map(col => (
                    <th key={col} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PREVIEW_TABLE.map((r, i) => (
                  <tr key={r.indicador} style={{ background: i % 2 === 0 ? '#fff' : '#F5F9FC' }}>
                    <td style={{ padding: '8px 12px', color: 'var(--navy-800)' }}>{r.indicador}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-mid)' }}>{r.jan}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-mid)' }}>{r.fev}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-mid)' }}>{r.mar}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--navy-800)' }}>{r.t1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Rodapé */}
          <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)' }}>
            Relatório gerado automaticamente pelo Sistema OTO — Projeto PDSI USP 2025 · Dados sujeitos a revisão técnica.
          </div>
        </div>
      </div>
    </div>
  );
}
