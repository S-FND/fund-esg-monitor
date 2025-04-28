
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (!session) {
      window.location.href = 'https://sustainability.fandoro.com';
    }
  }, [session]);

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
