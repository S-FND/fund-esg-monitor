
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

  useEffect(() => {
    if (!token) {
      navigate('/');
    }
  }, [token, navigate]);

  if (!token) {
    return null;
  }

  return <>{children}</>;
}
