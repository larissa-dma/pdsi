import { useState } from 'react';
import { useResponsive } from '../hooks/useResponsive';

const PONTOS = [
  { id: 1, nome: 'Hotel Thermas Olímpia', categoria: 'Hospedagem', x: 35, y: 30, cor: '#1A3669' },
  { id: 2, nome: 'Pousada das Águas', categoria: 'Hospedagem', x: 55, y: 45, cor: '#1A3669' },
  { id: 3, nome: 'Parque Aquático', categoria: 'Atrativo', x: 70, y: 25, cor: '#2AACE2' },
  { id: 4, nome: 'Restaurante Olímpia', categoria: 'Alimentação', x: 45, y: 60, cor: '#F59E0B' },
  { id: 5, nome: 'Agência de Turismo', categoria: 'Serv. Turístico', x: 25, y: 55, cor: '#6366F1' },
];

const LEGENDA = [
  { label: 'Hospedagem', cor: '#1A3669' },
  { label: 'Atrativo', cor: '#2AACE2' },
  { label: 'Alimentação', cor: '#F59E0B' },
  { label: 'Serv. Turístico', cor: '#6366F1' },
];

export default function MapaPage() {
  const [selecionado, setSelecionado] = useState<typeof PONTOS[0] | null>(null);
  const { isMobile } = useResponsive();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: 'var(--navy-800)' }}>
          Mapa Demonstrativo do Inventário
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          Distribuição geográfica dos estabelecimentos cadastrados
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px', alignItems: 'flex-start' }}>
        {/* Mapa */}
        <div style={{
          flex: 1, background: '#E8EFF5', borderRadius: '12px',
          border: '1px solid var(--border)', position: 'relative',
          minHeight: isMobile ? '280px' : '480px', overflow: 'hidden',
        }}>
          {/* Grade de ruas simulada */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Quadras */}
            <rect x="10" y="10" width="30" height="20" rx="1" fill="#D8E5EF" stroke="#C4D8E8" strokeWidth="0.3" />
            <rect x="50" y="10" width="20" height="20" rx="1" fill="#D8E5EF" stroke="#C4D8E8" strokeWidth="0.3" />
            <rect x="80" y="10" width="15" height="30" rx="1" fill="#D8E5EF" stroke="#C4D8E8" strokeWidth="0.3" />
            <rect x="10" y="40" width="25" height="30" rx="1" fill="#D8E5EF" stroke="#C4D8E8" strokeWidth="0.3" />
            <rect x="45" y="40" width="30" height="20" rx="1" fill="#D8E5EF" stroke="#C4D8E8" strokeWidth="0.3" />
            <rect x="20" y="75" width="20" height="15" rx="1" fill="#D8E5EF" stroke="#C4D8E8" strokeWidth="0.3" />
            <rect x="55" y="68" width="35" height="22" rx="1" fill="#D8E5EF" stroke="#C4D8E8" strokeWidth="0.3" />
            {/* Ruas */}
            <line x1="0" y1="35" x2="100" y2="35" stroke="#C4D8E8" strokeWidth="0.5" />
            <line x1="0" y1="65" x2="100" y2="65" stroke="#C4D8E8" strokeWidth="0.5" />
            <line x1="42" y1="0" x2="42" y2="100" stroke="#C4D8E8" strokeWidth="0.5" />
            <line x1="78" y1="0" x2="78" y2="100" stroke="#C4D8E8" strokeWidth="0.5" />
          </svg>

          {/* Pinos */}
          {PONTOS.map(ponto => (
            <button
              key={ponto.id}
              onClick={() => setSelecionado(selecionado?.id === ponto.id ? null : ponto)}
              title={ponto.nome}
              style={{
                position: 'absolute',
                left: `${ponto.x}%`, top: `${ponto.y}%`,
                transform: 'translate(-50%, -100%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                filter: selecionado?.id === ponto.id ? 'drop-shadow(0 0 6px rgba(0,0,0,0.3))' : 'none',
                transition: 'filter 0.15s',
              }}
            >
              <svg width="22" height="30" viewBox="0 0 22 30">
                <path d="M11 0C4.9 0 0 4.9 0 11c0 8.3 11 19 11 19s11-10.7 11-19C22 4.9 17.1 0 11 0z" fill={ponto.cor} />
                <circle cx="11" cy="11" r="4" fill="white" fillOpacity="0.9" />
              </svg>
            </button>
          ))}

          {/* Legenda */}
          <div style={{
            position: 'absolute', bottom: '16px', left: '16px',
            background: 'rgba(255,255,255,0.92)', borderRadius: '8px',
            border: '1px solid var(--border)', padding: '10px 14px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.06em' }}>
              LEGENDA
            </div>
            {LEGENDA.map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: l.cor, flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: 'var(--navy-800)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Painel lateral */}
        <div style={{ width: isMobile ? '100%' : '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {selecionado ? (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)', marginBottom: '12px' }}>
                {selecionado.nome}
              </div>
              {[
                { label: 'Categoria', value: selecionado.categoria },
                { label: 'Situação', value: 'Ativo' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{m.label}</span>
                  <span style={{ fontWeight: 500, color: 'var(--navy-800)' }}>{m.value}</span>
                </div>
              ))}
              <button
                onClick={() => setSelecionado(null)}
                style={{ marginTop: '8px', width: '100%', padding: '7px', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '12px', background: '#fff', color: 'var(--text-mid)' }}
              >
                Fechar
              </button>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)', marginBottom: '8px' }}>Localização</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Clique em um pino no mapa para ver os detalhes do estabelecimento.
              </div>
            </div>
          )}

          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.06em' }}>
              RESUMO
            </div>
            {[
              { label: 'Total de pontos', value: PONTOS.length },
              { label: 'Hospedagem', value: 2 },
              { label: 'Atrativos', value: 1 },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                <span style={{ fontWeight: 600, color: 'var(--navy-800)' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
