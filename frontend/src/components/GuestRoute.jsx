import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { homeFor } from '../lib/roles';
import { Spinner } from './ui';

export default function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;
  if (user) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
