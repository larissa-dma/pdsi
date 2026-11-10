import { useState } from 'react';
import { useResponsive } from '../hooks/useResponsive';

const INDICADORES = [
  { titulo: 'Consumo de água', valor: '82 L/hóspede/dia', variacao: '↓ 12% vs. meta', cor: 'var(--navy-500)', bg: '#EBF4FA' },
  { titulo: 'Energia renovável', valor: '34%', variacao: '↑ 8pp este ano', cor: 'var(--status-sent-fg)', bg: 'var(--status-sent-bg)' },
  { titulo: 'Resíduos recicláveis', valor: '61%', variacao: '↑ 5pp vs. meta ODS', cor: 'var(--status-pending-fg)', bg: 'var(--status-pending-bg)' },
];

const ODS_DADOS = [
  { ods: 'ODS 6', titulo: 'Água potável e saneamento', meta: '80 L/hósp/dia', atual: '82 L/hósp/dia', status: 'alerta' },
  { ods: 'ODS 7', titulo: 'Energia acessível e limpa', meta: '40%', atual: '34%', status: 'alerta' },
  { ods: 'ODS 8', titulo: 'Trabalho e crescimento econômico', meta: '+5%', atual: '+8%', status: 'ok' },
  { ods: 'ODS 12', titulo: 'Consumo e produção responsáveis', meta: '60%', atual: '61%', status: 'ok' },
  { ods: 'ODS 17', titulo: 'Parcerias e meios de implementação', meta: '10', atual: '7', status: 'alerta' },
];

const TRIMESTRES = ['T1 2025', 'T2 2025', 'T3 2025'];
const DADOS_BARRA = [[60, 72, 61], [28, 31, 34], [55, 58, 61]];

function BarChart() {
  const labels = ['Água (meta=80→100%)', 'Energia (meta=40%)', 'Reciclagem (meta=60%)'];
  const cores = ['var(--navy-500)', 'var(--status-sent-fg)', 'var(--status-pending-fg)'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {labels.map((label, li) => (
        <div key={label}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{label}</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '48px' }}>
            {DADOS_BARRA[li].map((v, ti) => (
              <div key={ti} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                <span style={{ fontSize: '10px', color: 'var(--navy-800)', fontWeight: 600 }}>{v}%</span>
                <div style={{ width: '100%', height: `${(v / 100) * 36}px`, background: cores[li], borderRadius: '3px 3px 0 0', opacity: ti === 2 ? 1 : 0.6 }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {TRIMESTRES.map(t => (
              <div key={t} style={{ flex: 1, textAlign: 'center', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{t}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SustentabilidadePage() {
  const { isMobile } = useResponsive();
  const [form, setForm] = useState({
    consumo_agua: '', energia_renovavel: '', residuos: '', emissoes: '',
    trimestre: 'T4 2025', observacoes: '',
  });

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: 'var(--navy-800)' }}>
          Sustentabilidade e Indicadores ODS
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          Monitoramento dos Objetivos de Desenvolvimento Sustentável
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '14px' }}>
        {INDICADORES.map(ind => (
          <div key={ind.titulo} style={{ background: '#fff', border: `1px solid ${ind.bg}`, borderRadius: '12px', padding: '18px 20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{ind.titulo}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: ind.cor, marginBottom: '6px' }}>{ind.valor}</div>
            <div style={{ fontSize: '12px', color: ind.cor, opacity: 0.8 }}>{ind.variacao}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: '20px' }}>
        {/* Gráfico de barras */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)', marginBottom: '20px' }}>
            Evolução trimestral dos indicadores
          </div>
          <BarChart />
        </div>

        {/* Formulário de cadastro */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)', marginBottom: '16px' }}>
            Registrar novos dados
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '12px' }}>
            {[
              { key: 'consumo_agua', label: 'Água (L/hósp/dia)' },
              { key: 'energia_renovavel', label: 'Energia renovável (%)' },
              { key: 'residuos', label: 'Reciclagem (%)' },
              { key: 'emissoes', label: 'Emissões CO₂' },
            ].map(f => (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-mid)' }}>{f.label}</label>
                <input
                  type="number"
                  value={form[f.key as keyof typeof form]}
                  onChange={e => set(f.key, e.target.value)}
                  style={{ padding: '7px 10px', border: '1.5px solid var(--border)', borderRadius: '7px', fontSize: '13px', outline: 'none' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'var(--cyan-700)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                />
              </div>
            ))}
          </div>
          <select
            value={form.trimestre}
            onChange={e => set('trimestre', e.target.value)}
            style={{ width: '100%', padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: '7px', fontSize: '13px', background: '#fff', marginBottom: '12px', outline: 'none' }}
          >
            <option>T4 2025</option>
            <option>T1 2026</option>
          </select>
          <button style={{ width: '100%', background: 'var(--navy-500)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600 }}>
            Salvar indicadores
          </button>
        </div>
      </div>

      {/* Tabela ODS */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)' }}>
          Metas ODS monitoradas
        </div>
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
          <thead>
            <tr style={{ background: '#F5F9FC' }}>
              {['ODS', 'Objetivo', 'Meta', 'Atual', 'Status'].map(col => (
                <th key={col} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ODS_DADOS.map((r, i) => (
              <tr key={r.ods} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: 'var(--navy-500)', color: '#fff', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 700 }}>{r.ods}</span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--navy-800)' }}>{r.titulo}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-mid)' }}>{r.meta}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: r.status === 'ok' ? 'var(--status-sent-fg)' : 'var(--status-pending-fg)' }}>{r.atual}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    background: r.status === 'ok' ? 'var(--status-sent-bg)' : 'var(--status-pending-bg)',
                    color: r.status === 'ok' ? 'var(--status-sent-fg)' : 'var(--status-pending-fg)',
                    borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: 500,
                  }}>
                    {r.status === 'ok' ? 'Atingido' : 'Em andamento'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
