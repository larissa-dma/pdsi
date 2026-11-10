import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';

export default function AppLayout() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();

  async function handleSair() {
    await sair();
    navigate('/login');
  }

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#1a4a7a', color: '#fff', padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', height: '56px' }}>
        <span style={{ fontWeight: 700, fontSize: '1.1rem', marginRight: 'auto' }}>
          OTO — Observatório de Turismo de Olímpia
        </span>

        {usuario?.perfil === 'SECRETARIA' && (
          <>
            <Link to="/secretaria/painel" style={{ color: '#cce0ff', textDecoration: 'none' }}>Painel</Link>
            <Link to="/secretaria/inventario" style={{ color: '#cce0ff', textDecoration: 'none' }}>Inventário</Link>
            <Link to="/secretaria/formularios" style={{ color: '#cce0ff', textDecoration: 'none' }}>Formulários</Link>
          </>
        )}

        {usuario?.perfil === 'HOSPEDAGEM' && (
          <Link to="/formularios" style={{ color: '#cce0ff', textDecoration: 'none' }}>Meus Formulários</Link>
        )}

        <span style={{ color: '#aac8f0', fontSize: '0.9rem' }}>{usuario?.nome}</span>
        <button
          onClick={handleSair}
          style={{ background: 'none', border: '1px solid #aac8f0', color: '#fff', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer' }}
        >
          Sair
        </button>
      </header>

      <main style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
