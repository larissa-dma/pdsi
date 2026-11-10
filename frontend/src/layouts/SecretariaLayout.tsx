import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';
import { useResponsive } from '../hooks/useResponsive';

const NAV_SECTIONS = [
  {
    label: 'MONITORAMENTO',
    items: [
      { to: '/secretaria/painel', label: 'Visão geral' },
      { to: '/secretaria/ocupacao', label: 'Ocupação hoteleira' },
      { to: '/secretaria/pesquisas', label: 'Dados de pesquisas' },
    ],
  },
  {
    label: 'INVENTÁRIO',
    items: [
      { to: '/secretaria/inventario', label: 'Consulta' },
      { to: '/secretaria/mapa', label: 'Mapa demonstrativo' },
      { to: '/secretaria/importacao', label: 'Importação' },
    ],
  },
  {
    label: 'ANÁLISE',
    items: [
      { to: '/secretaria/sustentabilidade', label: 'Sustentabilidade ODS' },
      { to: '/secretaria/relatorios', label: 'Relatórios e exportações' },
    ],
  },
];

export default function SecretariaLayout() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useResponsive();
  const [menuAberto, setMenuAberto] = useState(false);

  async function handleSair() {
    await sair();
    navigate('/login');
  }

  function ativo(to: string) {
    return location.pathname === to || location.pathname.startsWith(to + '/');
  }

  const paginaAtual = NAV_SECTIONS.flatMap(s => s.items).find(i => ativo(i.to))?.label ?? 'Secretaria';

  const Sidebar = () => (
    <aside style={{
      width: '232px', flexShrink: 0,
      background: 'var(--navy-600)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, bottom: 0,
      left: isMobile ? (menuAberto ? 0 : '-232px') : 0,
      zIndex: 100,
      transition: isMobile ? 'left 0.25s ease' : 'none',
      overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '6px',
            background: 'var(--cyan-700)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '11px', color: '#fff',
          }}>OTO</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '12px', color: '#fff', lineHeight: 1.2 }}>OTO</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.2 }}>Secretaria</div>
          </div>
        </div>
        {isMobile && (
          <button onClick={() => setMenuAberto(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        )}
      </div>

      {/* Usuário */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '11px', color: '#fff', flexShrink: 0,
          }}>
            {usuario?.nome?.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {usuario?.nome}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Administrador</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 0' }}>
        {NAV_SECTIONS.map(section => (
          <div key={section.label} style={{ marginBottom: '6px' }}>
            <div style={{ padding: '4px 20px 5px', fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>
              {section.label}
            </div>
            {section.items.map(item => {
              const isAtivo = ativo(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => isMobile && setMenuAberto(false)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: '8px 20px',
                    fontSize: '13px', fontWeight: isAtivo ? 600 : 400,
                    color: isAtivo ? '#fff' : 'rgba(255,255,255,0.65)',
                    background: isAtivo ? 'rgba(7,153,184,0.2)' : 'transparent',
                    borderLeft: isAtivo ? '3px solid var(--cyan-700)' : '3px solid transparent',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sair */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={handleSair}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px',
            padding: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.65)',
          }}
        >
          Sair
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'var(--font)' }}>
      <Sidebar />

      {/* Backdrop mobile */}
      {isMobile && menuAberto && (
        <div
          onClick={() => setMenuAberto(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
        />
      )}

      {/* Conteúdo */}
      <div style={{ marginLeft: isMobile ? 0 : '232px', flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Context bar */}
        <div style={{
          background: 'var(--navy-800)', height: '48px',
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: '10px',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          {isMobile && (
            <button
              onClick={() => setMenuAberto(true)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '20px', cursor: 'pointer', padding: '0 4px 0 0', lineHeight: 1 }}
            >
              ☰
            </button>
          )}
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>OTO</span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>/</span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
            {paginaAtual}
          </span>
        </div>

        <main style={{ flex: 1, padding: '24px', background: '#F5F9FC' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
