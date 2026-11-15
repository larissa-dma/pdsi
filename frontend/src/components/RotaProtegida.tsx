import { Navigate } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';

interface Props {
  children: React.ReactNode;
  perfil?: 'SECRETARIA' | 'HOSPEDAGEM';
}

export default function RotaProtegida({ children, perfil }: Props) {
  const { usuario, carregando } = useAuth();

  if (carregando) return <p style={{ padding: '2rem' }}>Carregando…</p>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (perfil && usuario.perfil !== perfil) return <Navigate to="/" replace />;

  return <>{children}</>;
}
