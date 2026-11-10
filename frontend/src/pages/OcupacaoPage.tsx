import { useState } from 'react';
import { useResponsive } from '../hooks/useResponsive';

type Modo = 'consolidado' | 'expectativa';

function MiniChart({ cor }: { cor: string }) {
  const pts1 = [55, 62, 58, 71, 68, 74, 80, 85, 78, 82, 88, 91];
  const pts2 = [45, 52, 50, 60, 58, 65, 70, 75, 68, 72, 78, 82];
  const max = 100, h = 80, w = 100;
  function toPath(pts: number[]) {
    return pts.map((v, i) => `${(i / (pts.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  }
  const p1 = toPath(pts1);
  const p2 = toPath(pts2);
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block', height: '90px' }}>
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={cor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${p1} ${w},${h}`} fill="url(#g1)" />
      <polyline points={p1} fill="none" stroke={cor} strokeWidth="1.5" />
      <polyline points={p2} fill="none" stroke={cor} strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />
    </svg>
  );
}

const DETALHES = [
  { estabelecimento: 'Hotel Thermas Olímpia', tipo: 'Hotel', jan: '82%', fev: '76%', mar: '71%' },
  { estabelecimento: 'Pousada das Águas', tipo: 'Pousada', jan: '68%', fev: '65%', mar: '72%' },
  { estabelecimento: 'Resort Thermas', tipo: 'Resort', jan: '91%', fev: '88%', mar: '85%' },
];

const TIPO_BADGE: Record<string, { bg: string; color: string }> = {
  Hotel:   { bg: 'var(--status-available-bg)', color: 'var(--status-available-fg)' },
  Pousada: { bg: 'var(--status-sent-bg)', color: 'var(--status-sent-fg)' },
  Resort:  { bg: '#EDE9FE', color: '#5B21B6' },
};

export default function OcupacaoPage() {
  const { isMobile } = useResponsive();
  const [modo, setModo] = useState<Modo>('consolidado');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: 'var(--navy-800)' }}>
          Pesquisa de Ocupação Hoteleira e Fluxo
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Indicadores consolidados do período atual</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '14px' }}>
        {[
          { label: 'Taxa de ocupação média', valor: '78%', variacao: '↑ 5pp vs. período ant.' },
          { label: 'Estabelecimentos respondentes', valor: '24', variacao: '↑ 3 novos' },
          { label: 'Fluxo estimado de turistas', valor: '14.280', variacao: '↑ 8% vs. mesmo período' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 18px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{k.label}</div>
            <div style={{ fontSize: isMobile ? '22px' : '26px', fontWeight: 700, color: 'var(--navy-800)', marginBottom: '6px' }}>{k.valor}</div>
            <div style={{ fontSize: '12px', color: 'var(--status-sent-fg)' }}>{k.variacao}</div>
          </div>
        ))}
      </div>

      {/* Toggle e gráfico */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: '12px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)' }}>Evolução da ocupação</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Jan–Dez 2025 (%)</div>
          </div>
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
            {(['consolidado', 'expectativa'] as Modo[]).map(m => (
              <button
                key={m}
                onClick={() => setModo(m)}
                style={{
                  padding: '7px 14px', fontSize: '12px', fontWeight: 500, border: 'none',
                  background: modo === m ? 'var(--navy-700)' : '#fff',
                  color: modo === m ? '#fff' : 'var(--text-mid)',
                }}
              >
                {m === 'consolidado' ? 'Consolidado' : 'Expectativa'}
              </button>
            ))}
          </div>
        </div>
        <MiniChart cor="var(--cyan-700)" />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map(m => (
            <span key={m} style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{m}</span>
          ))}
        </div>
      </div>

      {/* Notas */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px' }}>
        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)', marginBottom: '12px' }}>Observações do período</div>
        <textarea
          rows={3}
          placeholder="Registre observações qualitativas sobre o período…"
          style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical', color: 'var(--text-mid)' }}
        />
      </div>

      {/* Tabela de detalhes */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)' }}>
          Detalhamento por estabelecimento
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
            <thead>
              <tr style={{ background: '#F5F9FC' }}>
                {['Estabelecimento', 'Tipo', 'Jan', 'Fev', 'Mar'].map(col => (
                  <th key={col} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DETALHES.map((r, i) => {
                const bs = TIPO_BADGE[r.tipo];
                return (
                  <tr key={r.estabelecimento} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 500, color: 'var(--navy-800)' }}>{r.estabelecimento}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: bs.bg, color: bs.color, borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: 500 }}>{r.tipo}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-mid)' }}>{r.jan}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-mid)' }}>{r.fev}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-mid)' }}>{r.mar}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
