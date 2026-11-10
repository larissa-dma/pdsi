import { Navigate } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';

export default function HomeRedirect() {
  const { usuario } = useAuth();
  if (usuario?.perfil === 'SECRETARIA') return <Navigate to="/secretaria/painel" replace />;
  if (usuario?.perfil === 'HOSPEDAGEM') return <Navigate to="/formularios" replace />;
  return <Navigate to="/login" replace />;
}
