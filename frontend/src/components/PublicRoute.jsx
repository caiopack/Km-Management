import { Navigate } from 'react-router-dom';

export default function PublicRoute({ children }) {
  const token = localStorage.getItem('token');

  // Se o token for inexistente ou vazio, mostra o conteúdo normalmente
  if (!token || token === 'null' || token === 'undefined') {
    return children;
  }

  // Se o token existe (mesmo inválido), redireciona
  return <Navigate to="/home" replace />;
}
