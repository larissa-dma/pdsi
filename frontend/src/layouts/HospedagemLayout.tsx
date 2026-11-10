import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';
import { useResponsive } from '../hooks/useResponsive';

const NAV_LINKS = [
  { to: '/formularios', label: 'Meus Formulários' },
];

export default function HospedagemLayout() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, isTablet } = useResponsive();

  const hPad = isMobile ? '16px' : isTablet ? '32px' : '136px';

  async function handleSair() {
    await sair();
    navigate('/login');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font)' }}>
      {/* Cabeçalho institucional */}
      <header style={{
        background: '#FFFFFF',
        height: isMobile ? '60px' : '72px',
        display: 'flex',
        alignItems: 'center',
        padding: `0 ${hPad}`,
        borderBottom: '1px solid var(--border)',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '7px', flexShrink: 0,
            background: 'var(--navy-800)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '11px',
          }}>OTO</div>
          {!isMobile && (
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--navy-800)', lineHeight: 1.2 }}>
                Observatório de Turismo de Olímpia
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                Sistema de Coleta de Dados
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {!isMobile && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--navy-800)' }}>{usuario?.nome}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hospedagem</div>
            </div>
          )}
          <div style={{
            width: '30px', height: '30px', borderRadius: '50%',
            background: 'var(--cyan-50)', border: '2px solid var(--cyan-700)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '12px', color: 'var(--cyan-700)', flexShrink: 0,
          }}>
            {usuario?.nome?.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={handleSair}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
              padding: '5px 10px', fontSize: '12px', color: 'var(--text-mid)',
            }}
          >
            Sair
          </button>
        </div>
      </header>

      {/* Barra de navegação */}
      <nav style={{
        background: 'var(--navy-700)',
        height: '44px',
        display: 'flex',
        alignItems: 'stretch',
        padding: `0 ${hPad}`,
      }}>
        {NAV_LINKS.map(link => {
          const ativo = location.pathname === link.to || location.pathname.startsWith(link.to + '/');
          return (
            <Link
              key={link.to}
              to={link.to}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '0 16px',
                fontSize: '13px', fontWeight: ativo ? 600 : 400,
                color: ativo ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                borderBottom: ativo ? '3px solid var(--cyan-700)' : '3px solid transparent',
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Conteúdo */}
      <main style={{ flex: 1, padding: `28px ${hPad}` }}>
        <Outlet />
      </main>
    </div>
  );
}
