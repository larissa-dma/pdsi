import { useEffect, useState } from 'react';
import { secretaria } from '../api/endpoints';
import type { Painel } from '../api/endpoints';
import { useResponsive } from '../hooks/useResponsive';

function KpiCard({ titulo, valor, unidade, variacao }: { titulo: string; valor: string | number; unidade?: string; variacao?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '10px' }}>{titulo}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '26px', fontWeight: 700, color: 'var(--navy-800)' }}>{valor}</span>
        {unidade && <span style={{ fontSize: '14px', color: 'var(--text-mid)' }}>{unidade}</span>}
      </div>
      {variacao && <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--status-sent-fg)' }}>↑ {variacao}</div>}
    </div>
  );
}

function MiniChart() {
  const pontos = [42, 58, 51, 67, 72, 61, 78, 83, 76, 89, 82, 94];
  const max = Math.max(...pontos);
  const w = 100, h = 56;
  const pts = pontos.map((v, i) => `${(i / (pontos.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block', height: '72px' }}>
      <defs>
        <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--cyan-700)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--cyan-700)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#fill)" />
      <polyline points={pts} fill="none" stroke="var(--cyan-700)" strokeWidth="1.5" />
    </svg>
  );
}

const CATEGORIAS = [
  { label: 'Hospedagem', pct: 48, color: 'var(--navy-500)' },
  { label: 'Atrativo', pct: 22, color: 'var(--cyan-700)' },
  { label: 'Alimentação', pct: 18, color: '#F59E0B' },
  { label: 'Serv. Turístico', pct: 12, color: '#6366F1' },
];

const ESTABELECIMENTOS = [
  { nome: 'Hotel Thermas Olímpia', categoria: 'Hospedagem', situacao: 'Ativo' },
  { nome: 'Pousada das Águas', categoria: 'Hospedagem', situacao: 'Ativo' },
  { nome: 'Parque Aquático', categoria: 'Atrativo', situacao: 'Ativo' },
  { nome: 'Restaurante Olímpia', categoria: 'Alimentação', situacao: 'Inativo' },
];

export default function PainelPage() {
  const { isMobile, isTablet } = useResponsive();
  const [painel, setPainel] = useState<Painel | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    secretaria.painel()
      .then(setPainel)
      .catch(() => setErro('Não foi possível carregar o painel.'));
  }, []);

  const kpiCols = isMobile ? '1fr 1fr' : isTablet ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: 'var(--navy-800)' }}>
          Visão geral dos indicadores
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Panorama atualizado do turismo de Olímpia</p>
      </div>

      {erro && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px 16px', color: '#B91C1C', fontSize: '13px' }}>{erro}</div>}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: kpiCols, gap: '12px' }}>
        <KpiCard titulo="Registros no inventário" valor={painel?.registros_inventario ?? '—'} variacao="8% este mês" />
        <KpiCard titulo="Formulários ativos" valor={painel?.formularios ?? '—'} />
        <KpiCard titulo="Respostas enviadas" valor={painel?.respostas_enviadas ?? '—'} variacao="12% vs. período ant." />
        <KpiCard titulo="Taxa de resposta" valor="78" unidade="%" variacao="3pp" />
        <KpiCard titulo="Importações" valor={painel?.importacoes ?? '—'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile || isTablet ? '1fr' : '1fr 300px', gap: '16px' }}>
        {/* Gráfico */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)' }}>Ocupação média mensal</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Últimos 12 meses — %</div>
          </div>
          <MiniChart />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map(m => (
              <span key={m} style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{m}</span>
            ))}
          </div>
        </div>

        {/* Distribuição */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)', marginBottom: '16px' }}>Por categoria</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {CATEGORIAS.map(cat => (
              <div key={cat.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-mid)' }}>{cat.label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--navy-800)' }}>{cat.pct}%</span>
                </div>
                <div style={{ height: '5px', borderRadius: '3px', background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${cat.pct}%`, background: cat.color, borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)' }}>
          Estabelecimentos recentes
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
            <thead>
              <tr style={{ background: '#F5F9FC' }}>
                {['Nome', 'Categoria', 'Situação'].map(col => (
                  <th key={col} style={{ padding: '10px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ESTABELECIMENTOS.map((e, i) => (
                <tr key={e.nome} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '11px 20px', fontSize: '13px', fontWeight: 500, color: 'var(--navy-800)' }}>{e.nome}</td>
                  <td style={{ padding: '11px 20px', fontSize: '13px', color: 'var(--text-mid)' }}>{e.categoria}</td>
                  <td style={{ padding: '11px 20px' }}>
                    <span style={{
                      background: e.situacao === 'Ativo' ? 'var(--status-sent-bg)' : '#F3F4F6',
                      color: e.situacao === 'Ativo' ? 'var(--status-sent-fg)' : '#6B7280',
                      borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: 500,
                    }}>{e.situacao}</span>
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
