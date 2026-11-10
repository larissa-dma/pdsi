import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';

type Etapa = 1 | 2 | 3;

const ETAPAS = [
  { n: 1 as Etapa, label: 'Dados de ocupação' },
  { n: 2 as Etapa, label: 'Preferências e contato' },
  { n: 3 as Etapa, label: 'Revisão' },
];

export default function PreencherFormularioPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [etapa, setEtapa] = useState<Etapa>(1);

  const [campos, setCampos] = useState({
    taxa_jan: '', taxa_fev: '', taxa_mar: '', taxa_abr: '',
    taxa_mai: '', taxa_jun: '', taxa_jul: '', taxa_ago: '',
    taxa_set: '', taxa_out: '', taxa_nov: '', taxa_dez: '',
    boletim: 'email',
    email_boletim: '',
  });

  function set(field: string, value: string) {
    setCampos(prev => ({ ...prev, [field]: value }));
  }

  const meses = [
    ['jan','Jan'], ['fev','Fev'], ['mar','Mar'], ['abr','Abr'],
    ['mai','Mai'], ['jun','Jun'], ['jul','Jul'], ['ago','Ago'],
    ['set','Set'], ['out','Out'], ['nov','Nov'], ['dez','Dez'],
  ];

  const btnStyle = (primary: boolean): React.CSSProperties => ({
    background: primary ? 'var(--navy-500)' : '#fff',
    color: primary ? '#fff' : 'var(--navy-700)',
    border: primary ? 'none' : '1.5px solid var(--border)',
    borderRadius: '8px',
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: primary ? 700 : 600,
    ...(isMobile ? { flex: 1 } : {}),
  });

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Formulário #{id}</div>
        <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: 700, color: 'var(--navy-800)' }}>
          Pesquisa de Ocupação Hoteleira
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '24px', alignItems: 'flex-start' }}>
        {/* Formulário principal */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Stepper */}
          <div style={{
            background: '#fff', border: '1px solid var(--border)', borderRadius: '12px',
            padding: '16px 20px', marginBottom: '20px',
            display: 'flex', gap: '0',
          }}>
            {ETAPAS.map((e, i) => {
              const done = etapa > e.n;
              const ativo = etapa === e.n;
              return (
                <div key={e.n} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '26px', height: '26px', borderRadius: '50%',
                      background: done ? 'var(--status-sent-fg)' : ativo ? 'var(--navy-700)' : 'var(--border)',
                      color: (done || ativo) ? '#fff' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 700, flexShrink: 0,
                    }}>
                      {done ? '✓' : e.n}
                    </div>
                    {(!isMobile || ativo) && (
                      <span style={{ fontSize: '12px', fontWeight: ativo ? 600 : 400, color: ativo ? 'var(--navy-800)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {e.label}
                      </span>
                    )}
                  </div>
                  {i < ETAPAS.length - 1 && (
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)', margin: '0 8px' }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Etapa 1 */}
          {etapa === 1 && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: 'var(--navy-800)' }}>
                Taxa de ocupação por mês (%)
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {meses.map(([key, label]) => (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-mid)' }}>{label}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number" min="0" max="100"
                        value={campos[`taxa_${key}` as keyof typeof campos]}
                        onChange={e => set(`taxa_${key}`, e.target.value)}
                        placeholder="0"
                        style={{ width: '100%', padding: '8px 28px 8px 10px', border: '1.5px solid var(--border)', borderRadius: '7px', fontSize: '14px', outline: 'none' }}
                        onFocus={e => { e.currentTarget.style.borderColor = 'var(--cyan-700)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                      />
                      <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--text-muted)' }}>%</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setEtapa(2)} style={btnStyle(true)}>Próximo →</button>
              </div>
            </div>
          )}

          {/* Etapa 2 */}
          {etapa === 2 && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: 'var(--navy-800)' }}>
                Preferências e contato
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--navy-800)', marginBottom: '10px' }}>
                    Como prefere receber o boletim?
                  </div>
                  {[
                    { value: 'email', label: 'Por e-mail' },
                    { value: 'nao', label: 'Não quero receber' },
                  ].map(opt => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                      <input type="radio" name="boletim" value={opt.value} checked={campos.boletim === opt.value} onChange={() => set('boletim', opt.value)} />
                      <span style={{ fontSize: '13px', color: 'var(--navy-800)' }}>{opt.label}</span>
                    </label>
                  ))}
                </div>
                {campos.boletim === 'email' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--navy-800)' }}>E-mail para boletim</label>
                    <input
                      type="email" value={campos.email_boletim}
                      onChange={e => set('email_boletim', e.target.value)}
                      placeholder="contato@seuhotel.com.br"
                      style={{ padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none', maxWidth: isMobile ? '100%' : '360px' }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'var(--cyan-700)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                    />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setEtapa(1)} style={btnStyle(false)}>← Voltar</button>
                <button onClick={() => setEtapa(3)} style={btnStyle(true)}>Revisar →</button>
              </div>
            </div>
          )}

          {/* Etapa 3 */}
          {etapa === 3 && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: 'var(--navy-800)' }}>
                Revise suas respostas
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {meses.map(([key, label]) => (
                  <div key={key} style={{ background: 'var(--bg-stripe)', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>{label}</div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--navy-800)' }}>
                      {campos[`taxa_${key}` as keyof typeof campos] || '—'}
                      {campos[`taxa_${key}` as keyof typeof campos] ? '%' : ''}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--bg-stripe)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: 'var(--text-mid)' }}>
                  Boletim: <strong>{campos.boletim === 'email' ? `Por e-mail: ${campos.email_boletim || '(não informado)'}` : 'Não receber'}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setEtapa(2)} style={btnStyle(false)}>← Corrigir</button>
                <button onClick={() => navigate(`/formularios/${id}/confirmacao`)} style={btnStyle(true)}>Enviar pesquisa</button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar contextual */}
        <div style={{ width: isMobile ? '100%' : '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--navy-800)', borderRadius: '12px', padding: '20px', color: '#fff' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '10px', letterSpacing: '0.06em' }}>SOBRE A PESQUISA</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
              Esta pesquisa coleta dados de ocupação hoteleira para o Observatório de Turismo de Olímpia. Os dados são usados para gerar relatórios e indicadores setoriais.
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.06em' }}>PRIVACIDADE</div>
            <div style={{ fontSize: '12px', color: 'var(--text-mid)', lineHeight: 1.6 }}>
              Seus dados são confidenciais e usados apenas de forma agregada, sem identificação individual.
            </div>
          </div>
          <div style={{ background: '#E8F8F0', border: '1px solid #A8DDB8', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#1A6B3C', marginBottom: '6px' }}>Dúvidas?</div>
            <div style={{ fontSize: '12px', color: '#2D7A4F', lineHeight: 1.6 }}>
              Entre em contato via WhatsApp da Secretaria de Turismo.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
