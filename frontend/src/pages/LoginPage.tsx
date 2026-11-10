import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';
import { useResponsive } from '../hooks/useResponsive';

export default function LoginPage() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await entrar(identificador, senha);
      navigate('/');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao entrar.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', fontFamily: 'var(--font)' }}>
      {/* Painel esquerdo */}
      <div style={{
        width: isMobile ? '100%' : '47%',
        minHeight: isMobile ? '180px' : 'auto',
        background: 'linear-gradient(145deg, #0D6EC4 0%, #0A4F9B 50%, #0D2B5E 100%)',
        display: 'flex', flexDirection: 'column',
        justifyContent: isMobile ? 'center' : 'space-between',
        padding: isMobile ? '28px 24px' : '48px 56px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Fundo decorativo */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        {/* Logo + título */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: isMobile ? '0' : '48px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '9px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '13px', color: '#fff',
            }}>OTO</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: isMobile ? '15px' : '16px', color: '#fff', lineHeight: 1.2 }}>
                Observatório de Turismo
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.3 }}>
                de Olímpia — USP PDSI
              </div>
            </div>
          </div>

          {!isMobile && (
            <>
              <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', margin: '0 0 12px', lineHeight: 1.3 }}>
                Plataforma de coleta<br />e análise de dados
              </h1>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.6, maxWidth: '340px' }}>
                Sistema integrado para monitoramento do turismo em Olímpia.
              </p>
            </>
          )}
        </div>

        {/* Perfis (só no desktop) */}
        {!isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: '4px' }}>
              PERFIS DE ACESSO
            </div>
            {[
              { perfil: 'Secretaria de Turismo', desc: 'Gestão do inventário, análise de dados e relatórios' },
              { perfil: 'Estabelecimento', desc: 'Preenchimento de formulários de pesquisa' },
            ].map(item => (
              <div key={item.perfil} style={{
                background: 'rgba(255,255,255,0.09)', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '10px 14px',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{item.perfil}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Painel direito */}
      <div style={{
        flex: 1,
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '28px 24px 40px' : '48px 56px',
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: 'var(--navy-800)', margin: '0 0 6px' }}>
              Acesso ao OTO
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-mid)', margin: 0, lineHeight: 1.5 }}>
              Informe suas credenciais para acessar o ambiente
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--navy-800)' }}>Identificador</label>
              <input
                type="text"
                value={identificador}
                onChange={e => setIdentificador(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="username"
                style={{ padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--cyan-700)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--navy-800)' }}>Senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{ padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--cyan-700)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>

            {erro && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#B91C1C' }}>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              style={{
                marginTop: '4px', background: '#F5B800', color: '#1A2B3D',
                border: 'none', borderRadius: '8px',
                padding: '12px', fontSize: '14px', fontWeight: 700,
                opacity: carregando ? 0.7 : 1,
              }}
            >
              {carregando ? 'Entrando…' : 'Acessar ambiente'}
            </button>
          </form>

          <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, textAlign: 'center' }}>
            Em caso de dificuldade, entre em contato com a Secretaria de Turismo de Olímpia.
          </p>
        </div>
      </div>
    </div>
  );
}
